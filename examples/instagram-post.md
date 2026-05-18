# Instagram Post Runbook

How to post an image to Instagram using claudebrowser tools.
This runbook assumes Chrome is running with the debug profile active.

---

## Step 1: Check Connection and Auth

Always verify the CDP connection and session status before starting.

```
browser_status
```

Expected: `connected: true` with an `activeTab`. If `connected: false`, run
`claudebrowser init` in a terminal before proceeding.

Next, check that Instagram is logged in. The auth check navigates briefly to
instagram.com and confirms the final URL does not contain `accounts/login`.

```
browser_auth_check
```

Expected result for Instagram: `{ "name": "Instagram", "loggedIn": true }`.

If `loggedIn: false`, call `browser_wait_for_auth` with `platform: "Instagram"`
and ask the user to log in manually in the Chrome window. Then re-run
`browser_auth_check` to confirm before continuing.

---

## Step 2: List Open Tabs and Open a New One

Note all currently open tabs so you can restore them and avoid closing
something that belongs to another session.

```
browser_tabs { "all": true }
```

Record the tab IDs and URLs. Now open a fresh tab.

```
browser_new_tab { "url": "about:blank" }
```

The response contains `{ "id": "<tab-id>" }`. Save this ID — you will use it
to close the tab at the end.

Note: `browser_new_tab` can occasionally produce two blank tabs internally
(MCP navigation artifact). If you need to verify which tab is yours, call
`browser_tabs` again and identify the newly added entry.

---

## Step 3: Navigate to Instagram

```
browser_navigate { "url": "https://www.instagram.com/" }
```

Wait for the page to finish loading.

```
browser_wait_for_network_idle { "idle_ms": 1000, "timeout_ms": 15000 }
```

Take a screenshot to confirm the feed has loaded (not a login redirect).

```
browser_screenshot
```

If the screenshot shows a login screen, stop and use `browser_wait_for_auth`
with `platform: "Instagram"`.

---

## Step 4: Click the Create (+) Button

Instagram's create button is in the left sidebar. Use `browser_find_text` to
locate it by label, then click its coordinates.

```
browser_find_text { "text": "Create" }
```

This returns an array of matches with `x` and `y` positions. Click the one in
the sidebar (typically x near 80, y varies).

```
browser_click { "x": 80, "y": 540 }
```

Alternatively, try the CSS selector approach if the icon has a reliable label:

```
browser_click_selector { "selector": "[aria-label='New post']" }
```

Wait for the creation menu to appear.

```
browser_wait_for { "selector": "[role='dialog'], [role='menu']", "timeout_ms": 5000 }
```

---

## Step 5: Select "Post"

In the menu that appears, find and click the "Post" option.

```
browser_find_text { "text": "Post" }
```

Click the returned coordinates.

```
browser_click { "x": <x from find_text>, "y": <y from find_text> }
```

---

## Step 6: Upload the Image File

The post dialog opens with a file selection area. The underlying file input
may be hidden. Trigger it with `browser_file_upload` using a selector that
targets the hidden input.

```
browser_file_upload {
  "selector": "input[type='file']",
  "file_paths": ["/absolute/path/to/your-image.jpg"]
}
```

The path must be absolute. For square images (1:1), no padding is needed.
For portrait or landscape images, convert to square first by adding background
padding so the long dimension becomes both dimensions. This ensures the grid
thumbnail is not cropped.

Wait for the image preview to appear.

```
browser_wait_for { "selector": "img[style*='object-fit']", "timeout_ms": 10000 }
```

Take a screenshot to confirm the image has loaded in the crop view.

```
browser_screenshot
```

---

## Step 7: Handle the Crop Step

Instagram shows a crop/resize step first. Click "Next" to proceed without
changing the crop (assuming the image is already 1:1).

```
browser_find_text { "text": "Next" }
browser_click { "x": <x>, "y": <y> }
```

If a filter/effects step appears, click "Next" again.

```
browser_find_text { "text": "Next" }
browser_click { "x": <x>, "y": <y> }
```

---

## Step 8: Type the Caption

The caption textarea becomes active on the final step. Click it to focus.

```
browser_find_text { "text": "Write a caption" }
browser_click { "x": <x>, "y": <y> }
```

Type the caption one line at a time. Use `browser_press_key` with `Enter` for
line breaks. Do NOT use `browser_evaluate` with `execCommand('insertText')` —
this does not produce real line breaks in the Instagram textarea.

```
browser_type { "text": "First line of caption" }
browser_press_key { "key": "Enter" }
browser_type { "text": "Second line of caption" }
browser_press_key { "key": "Enter" }
browser_press_key { "key": "Enter" }
browser_type { "text": "#YourHashtag #AnotherTag" }
```

Take a screenshot to verify the caption looks correct before sharing.

```
browser_screenshot
```

---

## Step 9: Click Share

```
browser_find_text { "text": "Share" }
browser_click { "x": <x>, "y": <y> }
```

Wait for the confirmation that the post was published. Instagram typically
shows a "Your post has been shared" message or navigates back to the feed.

```
browser_wait_for_network_idle { "idle_ms": 2000, "timeout_ms": 30000 }
browser_screenshot
```

---

## Step 10: Close the Tab

Close the tab you opened using its ID from Step 2.

```
browser_close_tab { "id": "<your-tab-id>" }
```

Verify the original tabs are still intact.

```
browser_tabs { "all": true }
```

---

## Common Failure Modes

**File upload selector not found.** Instagram renders the file input only
after the dialog opens. If `browser_file_upload` fails, take a screenshot
first to confirm the dialog is actually open, then retry.

**"Next" button not clickable.** If `browser_find_text { "text": "Next" }`
returns no results, the button may not yet be rendered. Wait 1-2 seconds and
try `browser_accessibility_tree` to see the current dialog structure.

**Caption line breaks not working.** Never use `browser_evaluate` with
clipboard or execCommand approaches. Use `browser_type` + `browser_press_key`
with `Enter` only.

**Auth expired mid-flow.** If the page redirects to login during the upload
or caption step, the session cookie has expired. Use `browser_wait_for_auth`
with `platform: "Instagram"` and ask the user to re-authenticate.
