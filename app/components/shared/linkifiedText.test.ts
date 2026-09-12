import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderStatic } from "../../lib/testUtils.ts";
import LinkifiedText from "./linkifiedText.tsx";

test("renders plain text with no links unchanged", () => {
  const html = renderStatic(React.createElement(LinkifiedText, { text: "Just a plain description." }));
  assert.match(html, />Just a plain description\.</);
  assert.ok(!html.includes("<a "));
});

test("turns a markdown-style link into a real anchor", () => {
  const html = renderStatic(
    React.createElement(LinkifiedText, {
      text: "See the [Player Pack here.](https://example.com/pack.pdf) for details.",
    })
  );
  assert.match(html, /<a href="https:\/\/example\.com\/pack\.pdf"[^>]*>Player Pack here\.<\/a>/);
  assert.match(html, /See the/);
  assert.match(html, /for details\./);
});

test("handles multiple links in the same text", () => {
  const html = renderStatic(
    React.createElement(LinkifiedText, {
      text: "[Rules](https://a.example) and [Portal](https://b.example)",
    })
  );
  assert.match(html, /href="https:\/\/a\.example"/);
  assert.match(html, /href="https:\/\/b\.example"/);
});

test("ignores a non-http(s) scheme rather than linking it", () => {
  const html = renderStatic(
    React.createElement(LinkifiedText, { text: "[Click me](javascript:alert(1))" })
  );
  assert.ok(!html.includes("<a "));
  assert.match(html, /\[Click me\]\(javascript:alert\(1\)\)/);
});
