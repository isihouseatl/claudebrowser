# claudebrowser

A CLI tool and MCP server that connects Claude Code to Chrome via the Chrome DevTools Protocol (CDP). Gives Claude Code full browser control as 21 native MCP tools — no Playwright, no bundled browser, no hacks.

```
Claude Code  →  MCP (stdio)  →  claudebrowser serve  →  CDP WebSocket  →  Your Chrome
```

## Install

```bash
brew tap isihouseatl/claudebrowser
brew install claudebrowser
claudebrowser init
```

`init` detects Chrome, lets you pick a profile, and writes `~/.claudebrowser/config.json`.

## Setup

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "browser": {
      "command": "claudebrowser",
      "args": ["serve"]
    }
  }
}
```

Restart Claude Code. `browser_*` tools are now available in every session. Claude Code starts `claudebrowser serve` automatically — it launches Chrome if it isn't running.

## How it works

claudebrowser connects to your own Chrome installation via `--remote-debugging-port`. This means:

- **Real sessions.** Claude drives the browser you're already logged into — GitHub, Notion, your SaaS tools, everything.
- **Zero download weight.** No bundled Chromium. The Homebrew install is ~12MB.
- **Full CDP access.** DOM, network, screenshots, JS execution, accessibility tree — everything Chrome exposes.

## Tools

### Navigation
| Tool | What it does |
|------|-------------|
| `browser_navigate` | Go to a URL, wait for load |
| `browser_tabs` | List all open tabs |
| `browser_new_tab` | Open a new tab |
| `browser_close_tab` | Close a tab by id |
| `browser_switch_tab` | Switch active tab |
| `browser_back` | Go back in history |
| `browser_reload` | Reload current page |

### Perception
| Tool | What it does |
|------|-------------|
| `browser_screenshot` | PNG screenshot (viewport or full page) |
| `browser_accessibility_tree` | ARIA tree as indented text |
| `browser_dom` | Outer HTML of element or `<body>` |
| `browser_network_requests` | Recent XHR/fetch calls with status |

### Interaction
| Tool | What it does |
|------|-------------|
| `browser_click` | Click at x,y coordinates |
| `browser_click_selector` | Click element by CSS selector |
| `browser_type` | Type text at current focus |
| `browser_press_key` | Press a key (Enter, Tab, Escape…) |
| `browser_scroll` | Scroll up/down/left/right |
| `browser_select_option` | Select a `<select>` option by value |
| `browser_wait_for` | Wait for a CSS selector to appear |

### Execution
| Tool | What it does |
|------|-------------|
| `browser_evaluate` | Run JavaScript, return the result |
| `browser_set_value` | Set input value — React/Vue safe via native setter |

### System
| Tool | What it does |
|------|-------------|
| `browser_status` | Check Chrome connection and active tab |

## Commands

```bash
claudebrowser init     # One-time setup wizard
claudebrowser serve    # Start MCP server (Claude Code runs this automatically)
claudebrowser status   # Check if Chrome debug port is open
```

## Config

`~/.claudebrowser/config.json`:

```json
{
  "chromePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "debugPort": 9222,
  "profilePath": "/Users/you/.claudebrowser/chrome-profile",
  "navigationTimeoutMs": 10000,
  "reconnectAttempts": 15,
  "reconnectIntervalMs": 2000
}
```

Run `claudebrowser init` to regenerate. Set `profilePath` to an existing Chrome profile path to reuse your logged-in sessions.

## Requirements

- macOS (arm64 or x64)
- Google Chrome installed at the default path
- Claude Code

## License

MIT
