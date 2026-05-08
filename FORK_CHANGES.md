# Fork Changes: mturley/acp-ui

This document tracks all changes made in this fork relative to the upstream [formulahendry/acp-ui](https://github.com/formulahendry/acp-ui). These changes enable embedding ACP UI inside [acp-web-relay](https://github.com/mturley/acp-web-relay) as an iframe.

## URL Parameter Support

**File:** `src/App.vue` (in `onMounted()`, after store initialization)

Added support for three URL parameters that allow the host page to control ACP UI's behavior:

### `?hideSidebar=true`

Permanently hides the sidebar and all toggle buttons (hamburger menu, collapsed chevron). When set, there is no way for the user to re-open the sidebar from within ACP UI. This is used by acp-web-relay because the relay provides its own session picker sidebar — showing ACP UI's sidebar would be redundant.

**Implementation:** A new `sidebarHidden` ref is set to `true`, `showSidebar` is set to `false`, and the mobile hamburger button and desktop collapsed-toggle button are wrapped with `v-show="!sidebarHidden"`.

### `?agent=<name>`

Auto-selects an agent by name from the configured agents list. The host page pre-populates ACP UI's agent configuration in `localStorage` (key `acp-ui:agents`) before loading the iframe, then passes the agent name via this parameter so ACP UI selects it automatically without user interaction.

**Implementation:** After `configStore.loadConfig()`, if the parameter value matches a name in `configStore.agentNames`, it is assigned to `selectedAgent.value`.

### `?session=<id>`

Auto-resumes a saved session by its `sessionId`. The host page pre-populates ACP UI's session storage in `localStorage` (key `acp-ui:sessions.json`, format `{ sessions: [...] }`) before loading the iframe, then passes the session ID so ACP UI loads it immediately.

**Implementation:** After `sessionStore.initStore()`, searches `sessionStore.savedSessions` for a session with a matching `sessionId` and calls `handleResumeSession(saved)` if found.

## Why These Changes Exist

acp-web-relay is a transparent ACP relay proxy that serves a web UI for monitoring and controlling AI agent sessions. It uses ACP UI as the chat interface (rendered in an iframe) and provides its own session picker sidebar. The relay needs to:

1. **Hide ACP UI's sidebar** because the relay has its own session management UI
2. **Pre-configure the agent** so ACP UI connects to the relay's WebSocket endpoint without user setup
3. **Auto-load sessions** so clicking a session in the relay's picker immediately opens it in ACP UI

Without these URL parameters, the user would need to manually configure the agent and select a session every time they click a session in the relay's picker.

## Azure Application Insights Removal

**Files:** `src/lib/telemetry.ts`, `src/App.vue`, `src/stores/session.ts`, `package.json`

Removed Azure Application Insights telemetry tracking. The upstream project sends analytics to Microsoft's `applicationinsights.azure.com` endpoint, which causes CORS errors when ACP UI is served from a different origin (as it is in acp-web-relay's iframe). Since we don't use this telemetry, the entire SDK was removed:

- `telemetry.ts` — replaced with no-op stub functions (preserving the export API so any other imports don't break)
- `App.vue` — removed `initTelemetry` import and initialization call
- `session.ts` — removed all `trackEvent`/`trackError` calls
- `package.json` — removed `@microsoft/applicationinsights-web` dependency

## External Permission Resolution

**File:** `src/lib/acp-bridge.ts`

When ACP UI is embedded in acp-web-relay, permission requests from the agent are shown in both the editor and the web UI. If the editor approves the permission, the relay broadcasts the response to web clients. This change detects that broadcast response and dismisses the permission dialog automatically, so the user doesn't see a stale prompt after another client already approved it.

## Permission Dialog Dark Mode Fix

**File:** `src/components/PermissionDialog.vue`

Added dark mode styles for the permission dialog. The dialog used CSS variables (`--bg-dialog`, `--bg-footer`, `--bg-button`) that were never defined in App.vue's dark mode block, so the fallback values were always light (`#fff`, `#fafafa`). Meanwhile, `--text-primary` was correctly overridden to `#e0e0e0` in dark mode, resulting in light text on a white background — making the dialog unreadable.

**Fix:** Added a `@media (prefers-color-scheme: dark)` block with explicit dark background colors for `.permission-dialog`, `.dialog-header`, `.dialog-content`, `.tool-title`, `.dialog-actions`, and `.cancel-btn`, matching the palette used elsewhere in App.vue's dark mode.

## Files Modified

| File | Change |
|------|--------|
| `src/App.vue` | Added `sidebarHidden` ref, URL parameter parsing in `onMounted()`, conditional `v-show` on sidebar toggle buttons; removed telemetry init |
| `src/components/PermissionDialog.vue` | Added dark mode styles to fix unreadable light-on-light text |
| `src/lib/acp-bridge.ts` | Dismiss permission dialog when another client's approval response is received |
| `src/lib/telemetry.ts` | Replaced Azure Application Insights with no-op stubs |
| `src/stores/session.ts` | Removed telemetry tracking calls |
| `package.json` | Removed `@microsoft/applicationinsights-web` dependency |
| `README.md` | Added fork notice at the top |
