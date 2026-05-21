# `<sd-avatar>`

**Type**: Component
**Selector**: `sd-avatar`
**Import path**: `@sdcorejs/angular/components/avatar` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdAvatar`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
Circular user avatar â€” auto-displays a profile image when `src` is a URL, otherwise generates colorful initials from the name (deterministic per name).

## When to use
- Display a user's photo in a profile card, comment, or row
- Show the current user in the app header / nav
- Member chips in lists (employees, assignees, mentions)
- Notifications and activity feed entries
- Anywhere a user identity needs a quick visual

## When NOT to use
- For non-user entities (organizations, files) â€” use a generic icon or `<sd-badge>`
- For images that need rectangular cropping â€” use a plain `<img>` with custom styling
- For a status indicator only â€” use `<sd-badge type="round">`
- When you need a square avatar â€” this component is always circular

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `src` | `string \| undefined \| null` | (required) | The data string. Treated as an image URL if it starts with `http`, `https`, `data:image`, or `/`; otherwise treated as a name â†’ initials + deterministic color. Empty/null â†’ `?` on a neutral grey. |
| `size` | `number` | `32` | Width/height in pixels. Font size of initials is `size / 2.5`. |

## Outputs
None. (Image-load failure is handled internally â€” falls back to initials of the literal text.)

## Content projection (slots)
None.

## Visual cues
- Always a perfect circle of `size`Ã—`size` px.
- **Image mode** (URL detected): renders `<img>`; background `transparent`.
- **Initials mode** (free text): renders 1 or 2 uppercase initials (first letter of first word + first letter of last word).
- **Fallback** (empty/null `src`): `?` on `#bdc3c7` (neutral grey).
- **Background color** (initials mode): deterministic â€” same name always gets the same color from a fixed 19-color palette (greens, blues, purples, oranges, reds, greys). Hashed by char codes.
- **Image-load error**: silently switches to initials of the literal `src` string (so a broken `https://...` URL becomes letters `H`/`H` etc.).

## Examples

### 1. From a user record (with photo URL)
```html
<sd-avatar [src]="user().avatarUrl" [size]="40"></sd-avatar>
```

### 2. Initials from a Vietnamese name
```html
<!-- "Nguyá»…n VÄƒn An" â†’ "NA" on a deterministic color -->
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

### 4. Larger avatar on a profile header
```html
<sd-avatar [src]="profile.avatarUrl || profile.fullName" [size]="96"></sd-avatar>
```

## Anti-patterns
- Hardcoding a fallback URL â€” pass the user's name as `src` and let the component generate initials
- Wrapping the avatar in a `[ngStyle]` to force square corners â€” this component is intentionally always round
- Using it for non-people (orgs, files, projects) â€” initials/colors are tuned for human names
- Providing a non-string object/`number` to `src` â€” types only allow `string | null | undefined`
- Adding click handlers expecting a built-in click output â€” wrap in a parent `<button>` or `<a>` if interactive

## Related
- `<sd-badge>` â€” for status indicators (e.g. online/offline dot beside the avatar)
- `<sd-button>` â€” to make an avatar clickable, wrap or pair as needed
- `<sd-tag>` â€” for non-user labels

