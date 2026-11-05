# `<sd-avatar-group>`

**Type**: Component
**Selector**: `sd-avatar-group`
**Import path**: `@sdcorejs/angular/components/avatar` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdAvatarGroup`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
A row of overlapping `sd-avatar`s that shows at most `max` people and folds the rest into a "+N" button; the button
opens a list of the hidden people.

## When to use
- Assignees, participants, followers or reviewers of one record
- A compact "who is here" summary in a header or card

## When NOT to use
- A single person → `<sd-avatar>`
- A list where every name must be readable → a list of `sd-avatar` + name rows

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `items` | `SdAvatarGroupItem[]` | `[]` | `{ src, name?, status?, statusLabel?, statusPulse? }` — the inputs of `sd-avatar`. `name` is the tooltip and accessible name when `src` is an image URL. |
| `max` | `number` | `4` | Avatars shown. When exactly one person is left over, that person is shown too instead of a "+1" button. |
| `size` | `number` | `32` | Passed to every avatar. |
| `ariaLabel` | `string \| null \| undefined` | i18n `core.component.avatar.group-label` ("{n} người") | Name of the group for screen readers. |

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `moreClick` | `EventEmitter<SdAvatarGroupItem[]>` | Emits the hidden people when "+N" is clicked. When it is listened to, the default popover does not open, so the consumer can open its own screen. |

## Types
```ts
interface SdAvatarGroupItem {
  src: string | null | undefined;
  name?: string | null;
  status?: Color | null;
  statusLabel?: string | null;
  statusPulse?: boolean;
}
```

## Layout
- Each avatar overlaps the previous one by `round(size × 0.15)` (5px at 32), small enough not to cover the initials behind it.
- Each avatar has a `0 0 0 2px` ring (3px from size 64) in `--sd-avatar-status-ring`.
- The left avatar is on top (z-index falls to the right), so the status dot in the lower-right corner is never covered by the next avatar.
- **"+N"** is a `<button>` the size of an avatar, at the bottom of the stack: `--sd-surface-muted` background, `--sd-text-secondary` text, weight 600, `size / 2.5` font. Hover darkens the background one step (8% `--sd-text`); while the list is open it shows the focus ring.
- **Popover**: 280px wide, panel radius and border, `--sd-shadow-md`, 6px padding.
  - Title "{N} người khác" (12px, weight 500, `--sd-text-secondary`).
  - One 44px row per hidden person: a 28px avatar with its status dot, the name (13px/18px, ellipsis) and the status label (12px, `--sd-text-secondary`; empty without a status).
  - Scrolls past 320px.
- **Tooltip** on each avatar: "{name} · {statusLabel}" (through the `tooltip` input of `sd-avatar`).

## Accessibility
- The host is `role="group"` with `aria-label` (`ariaLabel`, or "{n} người").
- Each avatar is named by `sd-avatar` ("Lê Lan Anh, Đang hoạt động").
- "+N" has `aria-label` "Xem thêm {N} người" and `aria-expanded`.
- The popover is `role="dialog"` named by its title; focus moves to the first row on open and stays inside the popover (Tab cycles the rows). Esc or a click outside closes it; Esc returns focus to "+N". The avatars in the rows are `aria-hidden` — the name and status are written next to them.

## i18n
`core.component.avatar.group-label`, `core.component.avatar.more-label`, `core.component.avatar.more-title` (all with `{count}`), in the five built-in catalogs.

## Examples
```html
<sd-avatar-group [items]="members" [max]="4" [size]="32" ariaLabel="Người phụ trách"></sd-avatar-group>

<!-- members: SdAvatarGroupItem[] -->
<!-- { src: 'Lê Lan Anh', status: 'success', statusLabel: 'Đang hoạt động' } -->

<!-- Open your own screen instead of the popover -->
<sd-avatar-group [items]="members" (moreClick)="openMembers($event)"></sd-avatar-group>
```

## Related
- `<sd-avatar>` — one avatar; its `status`, `statusLabel`, `statusPulse` and `name` are the item fields
