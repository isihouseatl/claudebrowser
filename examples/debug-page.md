# Page Debugging Runbook

When something on a page is not working as expected, use this sequence to
diagnose the problem systematically. Start broad (screenshot, console, network)
and then narrow to the specific element or interaction that is failing.

---

## Step 1: Take a Screenshot to See Current State

Before doing anything else, capture what is actually on screen. Do not assume
the page is in a known state.

```
browser_screenshot
```

Common things to look for:
- Is the page loaded or still showing a spinner?
- Has the URL changed unexpectedly (redirected to login, error page)?
- Is a modal or dialog blocking the element you need to interact with?
- Is an error banner or toast visible?

If the page is partially loaded, wait for the network to settle and try again.

```
browser_wait_for_network_idle { "idle_ms": 1500, "timeout_ms": 20000 }
browser_screenshot
```

---

## Step 2: Check the Browser Console for JS Errors

JavaScript errors in the console are often the root cause when UI interactions
fail silently (clicks that do nothing, forms that do not submit, values that
do not persist).

```
browser_console_messages
```

This returns all collected console output since the monitor started. To filter
to errors only:

```
browser_console_messages { "type": "error" }
```

And warnings only:

```
browser_console_messages { "type": "warn" }
```

What to look for:
- `Uncaught TypeError` — a null reference or wrong type, often a React state
  issue or a DOM element that was not found before the script ran.
- `Failed to fetch` / `NetworkError` — an API call failed. Cross-reference
  with Step 3.
- `Cannot read properties of undefined` — similar to TypeError. The element
  or data the script expected is not present.
- `Content Security Policy` violations — the page blocked an injected script
  or external resource.

---

## Step 3: Check Network Requests for Failed API Calls

Identify whether any backend calls failed. This explains empty data tables,
forms that silently fail to save, or features that appear broken.

```
browser_network_requests
```

This returns all monitored requests. To filter to a specific domain or path:

```
browser_network_requests { "filter": "api" }
```

```
browser_network_requests { "filter": "graph.facebook.com" }
```

```
browser_network_requests { "filter": "/v1/events" }
```

Scan the `status` field in each result:
- `200` — success
- `400` — bad request (often a malformed payload or missing required field)
- `401` / `403` — authentication or permission failure (session may be expired)
- `404` — endpoint not found (wrong URL or the resource was deleted)
- `429` — rate limited (too many requests in a short window)
- `500` / `502` / `503` — server-side error (not a client issue)

For failed requests, check the URL and method to identify which feature is
broken. Then cross-reference with the console output from Step 2.

---

## Step 4: Inspect the Element's HTML

When a specific element is not behaving correctly (a button that appears but
does not respond, an input that resets, a toggle that is stuck), read its raw
HTML to understand its structure and state.

```
browser_dom { "selector": "button[aria-label='Publish']" }
```

```
browser_dom { "selector": "form#campaign-settings" }
```

```
browser_dom { "selector": "[data-testid='budget-input']" }
```

If you do not have a reliable selector, get the full body and scan it:

```
browser_dom
```

Note: `browser_dom` returns `outerHTML`. For large pages, this output will be
very long. Use a specific selector whenever possible.

What to look for in the HTML:
- `disabled` attribute on a button — the UI is intentionally blocking action.
- `aria-hidden="true"` on an element you need to click — it is visually hidden.
- `style="display:none"` or `style="visibility:hidden"` — same issue.
- A React `data-` prop indicating a loading or error state (e.g.
  `data-state="loading"`, `data-error="true"`).
- A `<form>` that posts to an unexpected `action` URL.

---

## Step 5: Read Specific Attribute Values

When `browser_dom` gives you too much HTML to parse, target the exact
attribute you need.

Check if a button is disabled:

```
browser_get_attribute { "selector": "button[aria-label='Save']", "attribute": "disabled" }
```

Read the current value of an input:

```
browser_get_attribute { "selector": "input[name='budget']", "attribute": "value" }
```

Read a data attribute used by the framework:

```
browser_get_attribute { "selector": "[data-testid='status-badge']", "attribute": "data-state" }
```

Check if a checkbox is checked:

```
browser_get_attribute { "selector": "input[type='checkbox'][name='active']", "attribute": "checked" }
```

Read the `href` of a link to verify it points to the right destination:

```
browser_get_attribute { "selector": "a.cta-button", "attribute": "href" }
```

---

## Step 6: Check Element Visibility

Before clicking an element, verify it is actually visible in the viewport.
An element can be in the DOM but not rendered (zero size, hidden, off-screen).

```
browser_is_visible { "selector": "[aria-label='Publish']" }
```

Returns `{ "visible": true }` or `{ "visible": false }`.

If `visible: false`, the element exists in the DOM but is not rendered. Common
causes:
- It is inside a collapsed section or closed accordion.
- It is behind a modal with `pointer-events: none` on the parent.
- The component has not finished mounting.

Try scrolling to bring it into view:

```
browser_scroll { "direction": "down", "amount": 400 }
browser_is_visible { "selector": "[aria-label='Publish']" }
```

---

## Step 7: Run Diagnostic JavaScript

Use `browser_evaluate` to inspect runtime state that is not visible in the
static DOM. This is the most powerful debugging tool — use it for anything
that cannot be read from HTML alone.

Check the current URL (useful when SPA navigation is happening):

```
browser_evaluate { "script": "window.location.href" }
```

Check whether a React root is mounted:

```
browser_evaluate { "script": "!!document.getElementById('root')?._reactFiber || !!document.getElementById('root')?.__reactFiber" }
```

Count all visible buttons on the page:

```
browser_evaluate { "script": "Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null).length" }
```

Read localStorage for session or state data:

```
browser_evaluate { "script": "JSON.stringify(Object.keys(localStorage))" }
```

```
browser_evaluate { "script": "localStorage.getItem('auth_token')" }
```

Check if the target element exists and what its bounding box is:

```
browser_evaluate {
  "script": "const el = document.querySelector('[data-testid=\"budget-input\"]'); el ? JSON.stringify(el.getBoundingClientRect()) : 'not found'"
}
```

Read all text from a specific container to understand what the page is showing:

```
browser_evaluate { "script": "document.querySelector('[role=\"main\"]')?.innerText?.slice(0, 500)" }
```

Check for shadow DOM (common in web components — Posh.vip, TikTok Ads use these):

```
browser_evaluate { "script": "!!document.querySelector('budget-field')?.shadowRoot" }
```

If a shadow root is present, standard CSS selectors will not reach inside it.
Use `evaluate` to query within the shadow root directly:

```
browser_evaluate {
  "script": "document.querySelector('budget-field')?.shadowRoot?.querySelector('input')?.value"
}
```

---

## Common Failure Modes

**`browser_click_selector` has no effect.** The selector matched but the click
did not register because the element is covered by an overlay (modal backdrop,
cookie banner, sticky header). Use `browser_screenshot` to check, then dismiss
the overlay first with `browser_click_selector` or `browser_press_key` with
`Escape`.

**Value set via `browser_type` resets immediately.** The field is controlled
by React or Vue and rejects synthetic input events. Use `browser_set_value`
instead, which triggers the native setter and dispatches the correct input
and change events.

**Form submits but data does not persist.** Check `browser_network_requests`
for the save/submit API call. A missing or failed POST/PUT means the data was
never sent, even if the UI showed a success state.

**Page works in the browser but breaks when automated.** Some pages detect
headless or automated environments and disable features. Check
`browser_console_messages { "type": "error" }` for any bot-detection messages.
Use `browser_evaluate { "script": "navigator.webdriver" }` — if this returns
`true`, the browser is reporting itself as automated.

**`browser_wait_for` times out but element exists.** The selector may be
correct but the element is outside the viewport or inside a shadow DOM. Use
`browser_evaluate` with `document.querySelector` to confirm the element exists
at the DOM level before relying on visibility-based waits.
