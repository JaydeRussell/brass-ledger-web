// A minimal, hand-written Node.js loader hook that lets `node --test` (see
// package.json's "test" script) import this project's .tsx component
// files directly.
//
// Why this exists: Node's built-in TypeScript support (the thing that
// already lets plain .ts test files like app/lib/scoreColor.test.ts import
// app/lib/scoreColor.ts with no build step) only *strips* type syntax — it
// has no JSX transform, and doesn't even recognize the .tsx extension
// (`node --test` fails with ERR_UNKNOWN_FILE_EXTENSION on any .tsx import).
// Installing a real toolchain (tsx, @testing-library/react, jsdom, babel's
// preset-typescript/preset-react, ts-node, ...) isn't possible in the
// sandboxed environments this project is developed through — no route to
// the npm registry from either available shell (see CLAUDE.md). What *is*
// already present, as a transitive dependency of this project's existing
// tooling (eslint-config-next's stack), is a matched set of @babel/parser,
// @babel/traverse, @babel/generator, and @babel/types — but not the actual
// preset-typescript/preset-react *plugins* that would normally do this
// work. So this loader implements the two transforms by hand, using only
// those four packages:
//
// 1. Strip TypeScript-only syntax (type aliases/interfaces, type-only
//    imports/exports, type annotations, `as`/non-null-assertion casts,
//    call/function type arguments) down to the exact set of constructs
//    actually used in this codebase — this is not a general-purpose
//    TypeScript compiler, just enough to compile this project's own
//    source.
// 2. Transform JSX into `React.createElement(...)` calls (the "classic"
//    runtime — chosen over the "automatic" runtime some files rely on
//    implicitly, since it needs no extra runtime import resolution logic
//    here) via a standard post-order (`exit`) visitor, injecting
//    `import React from "react"` into any file that doesn't already have
//    a default import of it.
//
// The result is plain, valid JavaScript (still containing no TypeScript
// syntax), executed via Node's normal ESM pipeline — so this loader owns
// the *entire* compile step for .tsx files itself rather than trying to
// hand back to Node's own stripper afterwards.
//
// If jsdom + @testing-library/react ever become installable (e.g. running
// `npm install` directly on a machine with real npm registry access,
// outside these sandboxed shells), this loader can be deleted in favor of
// that toolchain's own Vite/Jest transform — the component tests
// themselves (in app/lib/testUtils.ts and each component's .test.ts file)
// were written to make that swap low-friction.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as t from "@babel/types";

// @babel/traverse and @babel/generator are CommonJS packages; under
// Node's ESM loader their default export sometimes lands on `.default`
// and sometimes is the module.exports value itself depending on how the
// CJS/ESM interop shakes out for a given Node/loader version — handle
// both rather than guessing.
const traverse = traverseModule.default ?? traverseModule;
const generate = (generateModule.default ?? generateModule).default ?? (generateModule.default ?? generateModule);

function isTSTypeNode(node) {
  return typeof node?.type === "string" && node.type.startsWith("TS");
}

/** Strips this project's actual TypeScript usage down to plain JS, in
 * place, on an already-parsed AST. See the file-level comment above for
 * exactly what this does and does not handle. */
function stripTypeScript(ast) {
  traverse(ast, {
    enter(path) {
      const node = path.node;
      if (isTSTypeNode(node.typeAnnotation)) node.typeAnnotation = null;
      if (isTSTypeNode(node.returnType)) node.returnType = null;
      if (node.typeParameters !== undefined) node.typeParameters = null;
      if (node.typeArguments !== undefined) node.typeArguments = null;
      if (node.type === "Identifier" && node.optional) node.optional = false;
    },
    TSAsExpression(path) {
      path.replaceWith(path.node.expression);
    },
    TSSatisfiesExpression(path) {
      path.replaceWith(path.node.expression);
    },
    TSNonNullExpression(path) {
      path.replaceWith(path.node.expression);
    },
    TSTypeAliasDeclaration(path) {
      if (!path.parentPath.isExportNamedDeclaration()) path.remove();
    },
    TSInterfaceDeclaration(path) {
      if (!path.parentPath.isExportNamedDeclaration()) path.remove();
    },
    ImportDeclaration(path) {
      if (path.node.importKind === "type") {
        path.remove();
        return;
      }
      const kept = path.node.specifiers.filter((s) => s.importKind !== "type");
      if (kept.length !== path.node.specifiers.length) {
        if (kept.length === 0) path.remove();
        else path.node.specifiers = kept;
      }
    },
    ExportNamedDeclaration(path) {
      const decl = path.node.declaration;
      if (decl && (decl.type === "TSTypeAliasDeclaration" || decl.type === "TSInterfaceDeclaration")) {
        path.remove();
        return;
      }
      if (path.node.exportKind === "type") {
        path.remove();
        return;
      }
      if (path.node.specifiers) {
        const kept = path.node.specifiers.filter((s) => s.exportKind !== "type");
        if (kept.length !== path.node.specifiers.length) {
          if (kept.length === 0 && !path.node.declaration) path.remove();
          else path.node.specifiers = kept;
        }
      }
    },
  });
}

/** JSX's own whitespace-collapsing rule for a literal text child — the
 * same behavior every JSX compiler implements, reproduced here so plain
 * multi-line JSX text reads the same as it would under a real toolchain. */
function cleanJSXText(value) {
  const lines = value.split(/\r\n|\n|\r/);
  let lastNonEmptyLine = 0;
  lines.forEach((line, i) => {
    if (/[^ \t]/.test(line)) lastNonEmptyLine = i;
  });
  let str = "";
  lines.forEach((line, i) => {
    const isFirstLine = i === 0;
    const isLastLine = i === lines.length - 1;
    const isLastNonEmptyLine = i === lastNonEmptyLine;
    let trimmed = line.replace(/\t/g, " ");
    if (!isFirstLine) trimmed = trimmed.replace(/^ +/, "");
    if (!isLastLine) trimmed = trimmed.replace(/ +$/, "");
    if (trimmed) {
      if (!isLastNonEmptyLine) trimmed += " ";
      str += trimmed;
    }
  });
  return str;
}

function jsxNameToExpression(nameNode) {
  if (nameNode.type === "JSXIdentifier") {
    const isHostTag = /^[a-z]/.test(nameNode.name);
    return isHostTag ? t.stringLiteral(nameNode.name) : t.identifier(nameNode.name);
  }
  if (nameNode.type === "JSXMemberExpression") {
    return t.memberExpression(
      jsxNameToExpression(nameNode.object),
      t.identifier(nameNode.property.name)
    );
  }
  // JSXNamespacedName (e.g. `<svg:rect>`) — not used anywhere in this
  // project; fall back to a plain identifier of its full name so an
  // unexpected occurrence fails loudly (unresolvable reference) rather
  // than silently doing the wrong thing.
  return t.identifier(`${nameNode.namespace.name}_${nameNode.name.name}`);
}

function jsxAttrNameToKey(nameNode) {
  const name = nameNode.type === "JSXNamespacedName" ? `${nameNode.namespace.name}:${nameNode.name}` : nameNode.name;
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? t.identifier(name) : t.stringLiteral(name);
}

function buildPropsObject(openingElement) {
  const props = [];
  for (const attr of openingElement.attributes) {
    if (attr.type === "JSXSpreadAttribute") {
      props.push(t.spreadElement(attr.argument));
      continue;
    }
    const key = jsxAttrNameToKey(attr.name);
    let value;
    if (attr.value == null) {
      value = t.booleanLiteral(true);
    } else if (attr.value.type === "StringLiteral") {
      value = attr.value;
    } else if (attr.value.type === "JSXExpressionContainer") {
      value = attr.value.expression;
    } else {
      // JSXElement/JSXFragment used directly as an attribute value — not
      // used in this project's own components.
      value = attr.value;
    }
    props.push(t.objectProperty(key, value, key.type === "StringLiteral"));
  }
  return props.length > 0 ? t.objectExpression(props) : t.nullLiteral();
}

function jsxChildrenToArgs(children) {
  const args = [];
  for (const child of children) {
    if (child.type === "JSXText") {
      const cleaned = cleanJSXText(child.value);
      if (cleaned) args.push(t.stringLiteral(cleaned));
    } else if (child.type === "JSXExpressionContainer") {
      if (child.expression.type !== "JSXEmptyExpression") args.push(child.expression);
    } else if (child.type === "JSXSpreadChild") {
      args.push(t.spreadElement(child.expression));
    } else {
      // Already-transformed JSXElement/JSXFragment (traverse below visits
      // children before their parent) will actually arrive here as
      // whatever expression they were replaced with, not as a raw
      // JSXElement — this branch is just a defensive fallback.
      args.push(child);
    }
  }
  return args;
}

function transformJSX(ast) {
  traverse(ast, {
    JSXElement: {
      exit(path) {
        const { openingElement, children } = path.node;
        const callee = t.memberExpression(t.identifier("React"), t.identifier("createElement"));
        const args = [jsxNameToExpression(openingElement.name), buildPropsObject(openingElement), ...jsxChildrenToArgs(children)];
        path.replaceWith(t.callExpression(callee, args));
      },
    },
    JSXFragment: {
      exit(path) {
        const callee = t.memberExpression(t.identifier("React"), t.identifier("createElement"));
        const fragment = t.memberExpression(t.identifier("React"), t.identifier("Fragment"));
        const args = [fragment, t.nullLiteral(), ...jsxChildrenToArgs(path.node.children)];
        path.replaceWith(t.callExpression(callee, args));
      },
    },
  });
}

function ensureReactImported(ast) {
  const hasDefaultReactImport = ast.program.body.some(
    (n) =>
      n.type === "ImportDeclaration" &&
      n.source.value === "react" &&
      n.specifiers.some((s) => s.type === "ImportDefaultSpecifier" && s.local.name === "React")
  );
  if (!hasDefaultReactImport) {
    ast.program.body.unshift(
      t.importDeclaration([t.importDefaultSpecifier(t.identifier("React"))], t.stringLiteral("react"))
    );
  }
}

function compileTsx(source, filename) {
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
    sourceFilename: filename,
  });
  stripTypeScript(ast);
  transformJSX(ast);
  ensureReactImported(ast);
  return generate(ast, { filename, sourceMaps: false }).code;
}

// Two separate resolution gaps this project's test files run into under
// plain Node ESM (neither shows up in the real app, which never runs
// through plain `node` — Next's own bundler resolves both cases fine):
//
// 1. This project's own source (like Next/TypeScript projects generally)
//    imports sibling modules without a file extension
//    (`from "../../lib/bcp"`) — resolvable by a bundler's module
//    resolution, but not by plain Node ESM, which requires one.
// 2. Next.js's own package "exports" map, for at least the
//    "next/navigation" subpath, resolves under plain Node ESM to a URL
//    with no extension at all (confirmed via `import.meta.resolve` — it
//    returns `.../node_modules/next/navigation`, not `navigation.js`,
//    even though only the .js file exists on disk); Node's CJS
//    `require.resolve` gets this right, so it looks like a gap in how
//    Next's export map or Node's own resolver handles that subpath
//    outside of Next's own bundler, not something introduced here.
//
// Both end up in the same place: a failed resolution whose reported URL
// is missing the extension the file actually has on disk. Rather than
// treating them as separate cases, retry the *failed URL* (not just the
// original specifier, so this also covers case 2's bare, non-relative
// specifier) with each extension this project's own source and Next's
// own package both actually use, in the order a bundler would prefer.
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    const isNotFound = err?.code === "ERR_MODULE_NOT_FOUND" || err?.code === "ERR_UNSUPPORTED_DIR_IMPORT";
    if (!isNotFound) throw err;
    const failedUrl = typeof err.url === "string" ? err.url : null;
    const base = failedUrl ?? (specifier.startsWith(".") && context.parentURL ? new URL(specifier, context.parentURL).href : null);
    if (!base) throw err;
    for (const ext of [".tsx", ".ts", ".jsx", ".js", ".mjs"]) {
      const candidate = base + ext;
      if (existsSync(fileURLToPath(candidate))) {
        return next(candidate, context);
      }
    }
    throw err;
  }
}

export async function load(url, context, next) {
  if (!url.endsWith(".tsx")) return next(url, context);
  const source = await readFile(fileURLToPath(url), "utf8");
  const code = compileTsx(source, fileURLToPath(url));
  return { format: "module", source: code, shortCircuit: true };
}
