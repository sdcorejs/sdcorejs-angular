# Sidebar V3 design decisions

Owner: sdcorejs-angular / core-ui-layout. Track: design. Source revision: f65ba0fab2d5c14721d11c4f8a2dc68763c8b278.
Requirement: user request 2026-09-10, Sidebar V3 improvement using recent V1 and root-menu icons only. Status: implementation direction under direct user authorization; no separate approved spec/plan or approval hash is claimed.

- Extend existing shared tree with an opt-in presentation, preserving other sidebar defaults.
- Keep SdInput for search; only alter its local container and compact typography.
- Reuse V1 tokens and outlined glyphs; root menu icon images remain supported.
- Preserve independent pin controls; they are actions rather than deeper menu icons.
- Use live Showcase for visual verification and Karma/Chrome for geometry and behavior regression.
