# Meta Ads Manager Status Check Runbook

How to use claudebrowser tools to check campaign status in Meta Ads Manager.
This runbook reads the current state of all campaigns without making changes.

---

## Step 1: Check Connection

```
browser_status
```

Expected: `{ "connected": true, "activeTab": { ... } }`.

If `connected: false`, Chrome is not running with the debug port open. Run
`claudebrowser init` in a terminal before proceeding.

---

## Step 2: Check Meta Ads Auth

The auth check navigates to `adsmanager.facebook.com` and verifies the final
URL does not contain `loginpage`. If the session is expired, the browser will
redirect to a Facebook login page.

```
browser_auth_check
```

Look for the Meta Ads entry in the results:

```json
{ "name": "Meta Ads", "loggedIn": true }
```

If `loggedIn: false`, call:

```
browser_wait_for_auth { "platform": "Meta Ads", "timeout_ms": 120000 }
```

Then ask the user to log in to `adsmanager.facebook.com` in the Chrome window.
The tool polls every 3 seconds until the URL no longer contains `loginpage`.

---

## Step 3: List Open Tabs, Open a New One

Note all open tabs so you do not accidentally disturb another session.

```
browser_tabs { "all": true }
```

Open a fresh tab and record its ID.

```
browser_new_tab { "url": "about:blank" }
```

The response contains `{ "id": "<tab-id>" }`. Save this ID for cleanup.

---

## Step 4: Navigate to Ads Manager

```
browser_navigate { "url": "https://adsmanager.facebook.com/adsmanager/manage/campaigns" }
```

Meta Ads Manager is a React SPA. Wait for the initial network burst to settle
before trying to interact with the page.

```
browser_wait_for_network_idle { "idle_ms": 2000, "timeout_ms": 30000 }
```

Take a screenshot to confirm the campaigns table has loaded.

```
browser_screenshot
```

If the screenshot shows a loading spinner, wait a bit longer:

```
browser_wait_for_network_idle { "idle_ms": 3000, "timeout_ms": 45000 }
browser_screenshot
```

---

## Step 5: Confirm the Campaigns Table Is Visible

Check that the table rows are rendered. Meta Ads uses a complex table
structure — look for the "Campaigns" tab or column headers as a signal.

```
browser_find_text { "text": "Campaign name" }
```

If this returns no results, the table has not rendered yet. Try waiting for
the specific element:

```
browser_wait_for { "selector": "[data-visualcompletion='ignore-dynamic']", "timeout_ms": 15000 }
```

As a fallback, use the accessibility tree to understand what is currently
rendered on the page without relying on specific selectors.

```
browser_accessibility_tree
```

This returns a structured view of all interactive and labeled elements. Scan
it for campaign names, status toggles, budget fields, and result counts.

---

## Step 6: Read Campaign Names and Status

Use `browser_find_text` to locate specific campaigns by name if you know them.

```
browser_find_text { "text": "IsiHouse | Traffic | 2026-05-29" }
```

The response includes `x` and `y` coordinates of each match. Multiple results
mean the text appears in more than one place (e.g., a row label and a breadcrumb).

To read the status indicator next to a campaign, use `browser_get_text` with
a selector that targets the status cell. The exact selector depends on the
current DOM — inspect it first with `browser_dom`.

```
browser_dom { "selector": "[data-testid='campaign-row']:first-child" }
```

This returns the outer HTML of the first campaign row, which reveals the
class names and structure needed for targeted queries.

---

## Step 7: Take a Full-Page Screenshot

Capture the complete state of the campaigns table for reference.

```
browser_screenshot { "full_page": true }
```

If there are more campaigns below the fold, scroll down first.

```
browser_scroll { "direction": "down", "amount": 500 }
browser_screenshot
```

---

## Step 8: Check Network for Any API Errors

This is useful if the campaigns table appears empty or partially loaded.
Check whether the Ads Manager API calls completed successfully.

```
browser_network_requests { "filter": "graph.facebook.com" }
```

Look for any requests with `4xx` or `5xx` status codes in the response. A
`400` or `403` on a `graph.facebook.com` endpoint typically means the session
token has expired or the ad account does not have the expected permissions.

```
browser_network_requests { "filter": "adsmanager" }
```

Review the status codes. Successful data loads appear as `200` responses to
`/api/` or `/graphql` endpoints.

---

## Step 9: Close the Tab

Close the tab using the ID saved in Step 3.

```
browser_close_tab { "id": "<your-tab-id>" }
```

Confirm the original tabs are undisturbed.

```
browser_tabs { "all": true }
```

---

## Common Failure Modes

**Empty table after loading.** Meta Ads sometimes loads the shell UI before
data arrives. Use `browser_wait_for_network_idle` with `idle_ms: 3000` and
take another screenshot. If still empty, check `browser_network_requests`
filtered on `graph.facebook.com` for API errors.

**Redirected to login mid-session.** Facebook sessions expire. If a screenshot
shows the Facebook login form, use `browser_wait_for_auth` with
`platform: "Meta Ads"` and re-authenticate.

**Wrong ad account showing.** Meta Ads Manager stores the last selected ad
account in the URL. If the URL contains a different account ID than expected,
navigate directly to the correct account:

```
browser_navigate { "url": "https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=<ACCOUNT_ID>" }
```

**Accessibility tree is too large.** For complex pages, `browser_accessibility_tree`
output can be very long. Use `browser_dom` with a specific selector to narrow
scope, or use `browser_find_text` to jump directly to the element of interest.
