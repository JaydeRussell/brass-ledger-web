import React from "react";

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

type LinkifiedTextProps = {
  text: string;
  className?: string;
};

/**
 * BCP's event description field sometimes contains real markdown-style
 * links (e.g. "[Player Pack here.](https://...)") — exactly the links a
 * player most wants (rules pack, player portal) — that otherwise render
 * as raw literal text, brackets and all. Parses just that one `[text](url)`
 * pattern into a real anchor, restricted to http(s) targets; not a full
 * markdown renderer, since nothing else in this field needs one.
 */
export default function LinkifiedText({ text, className }: LinkifiedTextProps) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  // A fresh RegExp per call (rather than reusing the module-level one
  // and resetting its lastIndex) — a shared stateful regex would break
  // under concurrent/re-entrant renders.
  for (const match of text.matchAll(new RegExp(MARKDOWN_LINK))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <a
        key={`link-${key++}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-brass-500"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));

  return <p className={className}>{nodes}</p>;
}
