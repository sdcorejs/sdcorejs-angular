# `<sd-avatar>`

**Type**: Component
**Selector**: `sd-avatar`
**Import path**: `@sdcorejs/angular/components/avatar` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdAvatar`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Circular user avatar — auto-displays a profile image when `src` is a URL, otherwise generates colorful initials from the name (deterministic per name). Optionally shows a status dot (online, away…) on its lower-right edge.

## When to use
- Display a user's photo in a profile card, comment, or row
- Show the current user in the app header / nav
- Member chips in lists (employees, assignees, mentions)
- Notifications and activity feed entries
- Anywhere a user identity needs a quick visual

## When NOT to use
- For non-user entities (organizations, files) — use a generic icon or `<sd-badge>`
- For images that need rectangular cropping — use a plain `<img>` with custom styling
- For a status indicator only — use `<sd-badge type="round">`
- When you need a square avatar — this component is always circular

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `src` | `string \| undefined \| null` | (required) | The data string. Treated as an image URL if it starts with `http`, `https`, `data:image`, or `/`; otherwise treated as a name → initials + deterministic color. Empty/null → `?` on a neutral grey. |
| `size` | `number` | `32` | Width/height in pixels. Font size of initials is `size / 2.5`. |
| `name` | `string \| null \| undefined` | — | The person's name. It is the accessible name and, for an image avatar, the tooltip. When the image fails to load, the initials and colour come from `name` (without it: from the URL text, as before). With a name in `src`, `src` is used. |
| `status` | `Color \| null \| undefined` | `null` | Colour of the status dot. No value, no dot. |
| `statusLabel` | `string \| null \| undefined` | — | Text of the status, e.g. "Đang hoạt động": the dot's tooltip, appended to the accessible name. **Required with `status`** — a dev-mode `console.warn` says when it is missing, because the colour alone means nothing to a screen reader (and success can mean "online" or "approved"). |
| `tooltip` | `string | null | undefined` | — | Tooltip of the avatar; replaces the default one (the `name` of an image avatar). `sd-avatar-group` sets "{name} · {statusLabel}". |
| `statusPulse` | `boolean` | `false` | `booleanAttribute`. A pulsing ring around the dot (the `pulse` of `sd-badge`), still under `prefers-reduced-motion`. |

## Outputs
None. (Image-load failure is handled internally — falls back to initials of the literal text.)

## Content projection (slots)
None.

## Visual cues
- Always a perfect circle of `size`×`size` px.
- **Image mode** (URL detected): renders `<img>`; background `transparent`.
- **Initials mode** (free text): renders 1 or 2 uppercase initials (first letter of first word + first letter of last word).
- **Fallback** (empty/null `src`): `?` on `#bdc3c7` (neutral grey).
- **Background color** (initials mode): deterministic — same name always gets the same color from a fixed 19-color palette (greens, blues, purples, oranges, reds, greys). Hashed by char codes.
- **Image-load error**: switches to initials — of `name` when it is set, otherwise of the literal `src` string (so a broken `https://...` URL without a name becomes letters `H`/`H` etc.).
- **Host**: `display: inline-flex; position: relative; vertical-align: middle` (it used to be the default inline box), so the dot can sit on the edge and image and initials avatars line up in text.
- **Status dot**: an `<sd-badge type="dot">` beside the circle (the circle clips its content), with the colour of `status`, `statusLabel` as its title and `statusPulse` as its pulse. Diameter `clamp(8px, size × 0.25, 20px)`; a ring of 2px (3px from size 64) in `--sd-avatar-status-ring`; placed at `right = bottom = size × 0.146 − (dot + 2 × ring) / 2`, so its centre is on the circle edge at 45°.

  | size | dot | ring |
  | --- | --- | --- |
  | 24 | 8 | 2 |
  | 32 | 8 | 2 |
  | 40 | 10 | 2 |
  | 64 | 16 | 3 |
  | 96 | 20 | 3 |

- **`--sd-avatar-status-ring`**: component token, `var(--sd-surface)` in light and dark. Set it where the avatar sits on another background (a dark header, a selected row).

## Accessibility
- The host is `role="img"` with `aria-label` = the name, plus ", {statusLabel}" when there is a status (e.g. "Lê Lan Anh, Đang hoạt động"). The name is `name`, or `src` when `src` is a name.
- Without a name and without a status the avatar is decorative: no role, no label.
- The inner `<img>` has `alt=""` (it used to be `alt="avatar"`), so the name is not read twice.
- The dot never takes focus. Next to a visible name, also show the status as text where there is room.

## Examples

### 1. From a user record (with photo URL)
```html
<sd-avatar [src]="user().avatarUrl" [size]="40"></sd-avatar>
```

### 2. Initials from a Vietnamese name
```html
<!-- "Nguyễn Văn An" → "NA" on a deterministic color -->
<sd-avatar [src]="employee.fullName" [size]="32"></sd-avatar>
```

### 3. Avatar in a comment thread
```html
<div class="comment">
  <sd-avatar [src]="comment.author.avatar || comment.author.name" [size]="28"></sd-avatar>
  <div class="comment-body">
    <strong>{{ comment.author.name }}</strong>
    <p>{{ comment.text }}</p>
  </div>
</div>
```

### 4. With a status
```html
<sd-avatar src="Lê Lan Anh" [size]="40" status="success" statusLabel="Đang hoạt động"></sd-avatar>
<sd-avatar [src]="user.photoUrl" [name]="user.fullName" status="success" statusLabel="Đang gọi" statusPulse></sd-avatar>
```

### 5. Larger avatar on a profile header
```html
<sd-avatar [src]="profile.avatarUrl || profile.fullName" [size]="96"></sd-avatar>
```

## Anti-patterns
- Hardcoding a fallback URL — pass the user's name as `src` and let the component generate initials
- Wrapping the avatar in a `[ngStyle]` to force square corners — this component is intentionally always round
- Using it for non-people (orgs, files, projects) — initials/colors are tuned for human names
- Providing a non-string object/`number` to `src` — types only allow `string | null | undefined`
- Adding click handlers expecting a built-in click output — wrap in a parent `<button>` or `<a>` if interactive

## Related
- `<sd-avatar-group>` — overlapping avatars with a "+N" list (`sd-avatar-group.md`)
- `<sd-badge>` — the status dot is an `sd-badge type="dot"`; use a badge directly for statuses that are not about a person
- `<sd-button>` — to make an avatar clickable, wrap or pair as needed
- `<sd-tag>` — for non-user labels

Avatar chữ dùng nền light và chữ đậm cùng tông (font-weight 600), giữ nguyên ánh xạ màu theo tên và cách lấy initials. Avatar ảnh, size và fallback khi lỗi ảnh giữ nguyên.
