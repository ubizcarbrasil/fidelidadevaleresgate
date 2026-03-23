

## Plan: Build MCP Dashboard as a standalone page

### What
A single new page (`/mcp-dashboard`) with three panels: server sidebar, tool cards grid, and a slide-in execution panel. All data is hardcoded mock JSON. No auth, no dark mode toggle, no routing beyond this page.

### Files

**1. `src/pages/McpDashboardPage.tsx`** — The entire dashboard in one file (~400 lines)

Contains:
- **Mock data**: 3 servers (e.g., "Supabase MCP", "GitHub MCP", "Notion MCP") with 3-5 tools each, each tool having realistic `inputSchema` (JSON Schema with string/number/boolean/optional fields)
- **Left sidebar (240px fixed)**: Server list with colored status dots (green=connected, gray=disconnected). Click selects server.
- **Main area**: Grid of tool cards for selected server. Each card: tool name, description, "Run" button. Subtle border, hover lift.
- **Right panel (380px, slide-in)**: Dynamic form from `inputSchema` — text inputs for strings, number inputs, switches for booleans, optional fields labeled. "Execute" button → loading spinner → mock JSON response in styled monospace block with syntax coloring (keys blue, strings green, numbers orange).
- **Dark-slate theme**: inline/utility classes — `bg-[#0f172a]` background, `bg-[#1e293b]` cards, white text. Self-contained, doesn't affect rest of app.
- Selecting a different server resets main area and closes right panel.

**2. `src/App.tsx`** — Add lazy route

```tsx
const McpDashboardPage = lazy(() => import("@/pages/McpDashboardPage"));
// Add route: <Route path="/mcp-dashboard" element={<McpDashboardPage />} />
```

No other files modified. No new dependencies — uses existing shadcn components (Button, Input, Switch, ScrollArea, Card, Badge, Label).

### Design details
- Panel transition: CSS `transition-transform` for the right panel slide-in
- JSON syntax highlighting: simple regex-based span coloring, no library needed
- Responsive: on mobile, sidebar collapses to icon-only; right panel overlays full width

