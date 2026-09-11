# Sidebar V3 — clear menu hierarchy

Owner: sdcorejs-angular / core-ui-layout. Track: design. Source revision: f65ba0fab2d5c14721d11c4f8a2dc68763c8b278.
Requirement: user request 2026-09-10, Sidebar V3 improvement using recent V1 and root-menu icons only. Status: implementation direction under direct user authorization; no separate approved spec/plan or approval hash is claimed.

## Visual direction
Use the existing V1 palette and density: white surface, subtle neutral divider, 13px menu text, muted 20px outlined icons, 7px corners, quiet primary tint for the current route. Keep V3's unified drawer (304px expanded / 72px collapsed) and full account footer.

Only original top-level menu entries have navigation icons, including supplied image icons. Nested groups and leaves are text-only. Search results, pinned and recent lists are flattened shortcuts and show no menu icons. Pin/search/collapse/account action icons remain functional controls. This shortcut treatment is an implementation assumption to keep the user's root-only rule consistent after flattening.

The signature is the V1 branch rail: a 1px neutral line at every ancestor depth, with a 3px primary marker beside the selected leaf. Root rows are 40px high; nested routes at least 34px, with 16px depth increments. Text wraps naturally. Pointer-coarse rows are at least 44px. Pin buttons overlay reserved trailing space and become visible on keyboard focus, intentional hover or touch.

## Confirmed component and state map
- SdSidebarV3 owns collapse/search signals and binds the existing router/navigation-state service. Keep inputs, menu models, storage keys, event handling, injection scope and cleanup.
- SdLayoutMenuTreeComponent already owns flattened nodes, active route and pin hover. Add opt-in presentation (default / hierarchy / shortcuts); derive root icon visibility, indentation and branch offsets in its computed view model. Defaults preserve V2/mobile consumers.
- SdLayoutSearchFieldComponent keeps SdInput, composition/value forwarding and the existing autoId. Add an opt-in compact surface; default soft pill remains available to other layouts.
- SdLayoutUserMenuComponent is reused unchanged. V3 owns footer containment and divider.
- No new routes, services, fonts, icon packs, dependencies or business data. Canonical v19 then repository sync to v20/v21/v22.

## Interaction and state coverage
Expanded root/group/leaf, selected route, hover, keyboard focus and pin state; accent-insensitive search and no results; pinned/recent shortcuts; collapsed rail and restoration of query; long-label wrapping and scrollable navigation with a reachable account footer. Responsive service continues selecting the existing mobile layout; V3 is the desktop variant.

## Reference and critique before implementation
The supplied Console screenshot is the current-state reference, not an instruction document. Recent V1 source supplies hierarchy/search styling. Its personal account data is not copied into repository artifacts. The editable wireframe uses generic demo account data.

Risk: removing child icons alone leaves undifferentiated rows. Address it with weight, depth and continuous branch rails. Avoid excessively pale labels or a heavy active background. Preserve 16px spacing at deep levels and allow wrapping rather than ellipsis. Verify real rendering and interaction after implementation; the wireframe alone is not rendering evidence.
