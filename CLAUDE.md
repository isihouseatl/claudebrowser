# claudebrowser — Claude Code Instructions

## What It Is

claudebrowser is an MCP server that gives Claude Code direct browser control via Chrome DevTools Protocol (CDP). It connects to a single shared Chrome instance running with `--remote-debugging-port`. Multiple Claude Code terminals can connect simultaneously — each gets its own session, and tabs are tracked per session to prevent agents from stepping on each other.

---

## Before You Start Any Session

Always run `browser_auth_check` first. It navigates to Instagram, Meta Ads, and TikTok Ads and reports login status for each. If any platform shows `loggedIn: false`, tell the user before proceeding — do not attempt automation on a logged-out session.

Also run `browser_status` to confirm the CDP connection is live and see which tab is currently active.

---

## Tab Management (Critical)

Multiple Claude terminals share one Chrome instance. Navigating away from a tab you did not open breaks whoever was using it.

**Always follow this sequence:**

1. `browser_tabs` — list tabs owned by this session. Pass `all: true` to see every open Chrome tab.
2. `browser_sessions` — see all active Claude terminals and which tabs they own.
3. `browser_new_tab` — open your own tab. Returns `{ id: "..." }`. Save the id.
4. `browser_switch_tab id=<id>` — switch CDP focus to your tab before navigating.
5. Do your work in your tab only.
6. `browser_close_tab id=<id>` — close by the id you saved. Never guess.

**Rules:**
- Never call `browser_navigate` while another session's tab is active — use `browser_switch_tab` first.
- Never call `browser_close_tab` on an id you did not open.
- If `browser_tabs` shows no tabs owned by this session, open one before doing anything.
- `browser_tabs` (no args) only shows tabs this session owns. Use `all: true` to see the full Chrome tab list.

---

## Navigation Patterns

**Standard navigation:**
```
browser_navigate url="https://example.com"
browser_wait_for_network_idle          # wait for SPA to settle
```

**SPA route changes** (URL changes without a full page load):
```
browser_click_selector selector="[href='/dashboard']"
browser_wait_for_url pattern="/dashboard"   # waits until URL contains pattern
browser_wait_for_network_idle
```

**Waiting for a specific element before interacting:**
```
browser_wait_for selector=".submit-button"
browser_click_selector selector=".submit-button"
```

**After any navigation, take a screenshot to verify you landed where expected.**

---

## Interaction Patterns

**Clicking:**
- Prefer `browser_click_selector` with a CSS selector over `browser_click` with coordinates. Selectors survive layout changes; coordinates do not.
- Use `browser_click` (coordinates) only when no stable selector exists.
- Use `browser_find_text text="Save"` to locate elements and get their x,y when you do not know the selector.
- Scroll before clicking off-screen elements: `browser_scroll direction="down" amount=300`, then re-check position.

**Typing into fields:**
```
browser_clear_input selector="#email"    # select-all + backspace
browser_click_selector selector="#email"
browser_type text="user@example.com"
```
For React/Vue controlled inputs where `browser_type` does not trigger state updates, use `browser_set_value selector="#email" value="user@example.com"` — it fires native input/change events.

**Dropdowns (`<select>`):**
```
browser_select_option selector="select[name='country']" value="US"
```

**Hovering** (reveals tooltips, dropdown menus that appear on hover):
```
browser_hover_selector selector=".menu-item"
```
Prefer `browser_hover_selector` over `browser_hover` (coordinates) for the same reason as clicks.

**Dialogs:**
```
browser_handle_dialog accept=true              # click OK
browser_handle_dialog accept=false             # click Cancel
browser_handle_dialog accept=true prompt_text="my input"  # for prompt dialogs
```

**File uploads:**
```
browser_file_upload selector="input[type='file']" file_paths=["/absolute/path/to/file.jpg"]
```

---

## Debugging

When something fails or behaves unexpectedly:

1. `browser_screenshot` — see the current page state.
2. `browser_console_messages` — check for JS errors. Filter by type: `error`, `warn`, `log`.
3. `browser_network_requests filter="api/submit"` — check if the API call fired and what it returned.
4. `browser_accessibility_tree` — useful when selectors are not finding elements (checks ARIA roles and labels).
5. `browser_dom selector=".form-container"` — inspect raw HTML of a specific element.
6. `browser_is_visible selector=".modal"` — verify an element is actually rendered and visible before interacting with it.

**Take a screenshot after every major step.** Do not assume an action succeeded without visual confirmation.

---

## Auth Expiry

If any navigation redirects to a login page mid-session:

1. Tell the user which platform session has expired.
2. Ask them to log back in.
3. Call `browser_wait_for_auth platform="Instagram"` (or "Meta Ads" / "TikTok Ads"). It polls for up to 2 minutes.
4. Once it returns `{ loggedIn: true }`, resume the task.

Do not attempt to automate the login flow. Wait for the user.

---

## What NOT To Do

- **Never navigate away from a tab you did not open.** Check `browser_sessions` if unsure who owns the current active tab.
- **Never close a tab you did not open.** Only close the id returned by your own `browser_new_tab` call.
- **Do not use `browser_evaluate` for things a dedicated tool already handles** — clicking, typing, scrolling, getting text, setting values. `browser_evaluate` is for custom logic that has no tool equivalent.
- **Do not skip `browser_auth_check` at session start.** A logged-out browser wastes tool calls and can corrupt partially-filled forms.
- **Do not assume navigation is complete** after `browser_navigate` returns on SPA pages. Always follow with `browser_wait_for_network_idle` or `browser_wait_for_url`.
- **Do not use coordinate-based clicks as a first choice.** Coordinates break when the page reflows. Use selectors or `browser_find_text`.
