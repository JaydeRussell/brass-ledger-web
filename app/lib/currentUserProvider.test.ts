import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const { CurrentUserProvider, useCurrentUser } = await import("./auth.ts");

type InitialUser = Parameters<typeof CurrentUserProvider>[0]["initialUser"];

/** Renders the provider with a probe child that reports the context. */
function renderWithInitialUser(initialUser: InitialUser) {
  function Probe() {
    const { user, checked } = useCurrentUser();
    return React.createElement("div", {
      "data-checked": String(checked),
      "data-user": String(user?.id ?? "none"),
    });
  }
  // Children go as the third argument (the lint rule this project
  // follows), which leaves the props object short of the `children` the
  // component's type requires — hence the cast. Passing them as a prop
  // instead satisfies the type and trips the rule; this way round keeps
  // the component's own type honest.
  return renderToStaticMarkup(
    React.createElement(
      CurrentUserProvider,
      { initialUser } as React.ComponentProps<typeof CurrentUserProvider>,
      React.createElement(Probe)
    )
  );
}

// Effects never run under renderToStaticMarkup, so these cover the
// seeding half of the behaviour — what the very first render knows —
// and not the effect that skips the client lookup. See this file's
// companion note in serverAuth.test.ts.

test("a server-resolved user is available on the first render", async () => {
  const html = renderWithInitialUser({
    id: 7,
    email: "a@b.com",
    name: "A B",
    avatarUrl: "",
    bcpUserId: "",
    role: "user",
    status: "approved",
  } as NonNullable<InitialUser>);

  assert.match(html, /data-user="7"/, "the signed-in user should be known before hydration");
  assert.match(html, /data-checked="true"/, "the server already answered — nothing is pending");
});

test("a server-confirmed signed-out visitor is already checked", async () => {
  const html = renderWithInitialUser(null);

  assert.match(html, /data-user="none"/);
  assert.match(
    html,
    /data-checked="true"/,
    "null means the server confirmed signed out; leaving checked=false would make every gated " +
      "page render a spinner it never needed"
  );
});

test("an unresolved lookup leaves the check pending for the client", async () => {
  const html = renderWithInitialUser(undefined);

  assert.match(
    html,
    /data-checked="false"/,
    "undefined means the server couldn't tell — the client has to ask, so the check is genuinely " +
      "still outstanding"
  );
});
