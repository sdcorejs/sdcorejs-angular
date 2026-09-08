# `<sd-history>`

**Type**: Component
**Selector**: `sd-history`
**Import path**: `@sdcorejs/angular/components/history` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdHistoryItem`
**Standalone**: yes
**Change detection**: default

## One-line purpose
Vertical timeline that renders a list of history/audit events — each with title, optional status badge, timestamp, actor, source, and description.

## When to use
- Show audit trail / change log on a record detail page (orders, contracts, customers)
- Approval workflow timeline (created → submitted → approved → completed)
- Activity feed for an entity ("Bởi @user, lúc dd/MM/yyyy HH:mm, ghi chú: ...")
- Inside a `<sd-modal>` titled "Lịch sử thay đổi"
- Tab content of a record detail screen ("Hoạt động", "Lịch sử")

## When NOT to use
- For a list of records the user can act on → use a table / list component
- For chat/messaging → use a dedicated chat thread component
- For a chart of events over time → use `<sd-chart>` with a time axis
- For a single most-recent event → just render plain text with a `<sd-badge>`

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `items` | `SdHistoryItemType[]` | `[]` | Required for any visible content. Each item renders one timeline node. |

### `SdHistoryItemType`
```ts
interface SdHistoryItemType {
  title: string;            // Required — primary line ("Tạo phiếu", "Gửi duyệt")
  status?: {                // Optional badge to right of title
    title?: string;
    color?: Color;        // 'primary' | 'success' | 'warning' | 'error' | ...
    icon?: string;          // Material icon name
  };
  date?: string;            // ISO string — rendered with viewDateTime pipe (dd/MM/yyyy HH:mm)
  actor?: string;           // Username (rendered as "Bởi @<actor>")
  source?: string;          // Free-form source label (e.g. "Web", "API", "Mobile")
  description?: string;     // Free-form long text below the meta row
}
```

## Outputs
None — this is a pure display component.

## Content projection
None — every visible part is driven by the `items` input.

## Visual cues
- A vertical timeline: a thin vertical line on the left, with circular dots ("dots") marking each event
- Each event sits inside a card to the right of its dot, holding:
  - **Header row**: bold title + optional `<sd-badge>` (status), and right-aligned timestamp
  - **Meta row**: smaller grey text `Bởi @<actor> · <source>`
  - **Description block**: longer text wrapped below
- Items render top-to-bottom in array order — newest-first ordering is the caller's responsibility
- Empty `items` → renders an empty timeline shell (no placeholder text)

## Examples

### 1. Basic audit trail
```html
<sd-history [items]="events"></sd-history>
```
```ts
events: SdHistoryItemType[] = [
  { title: 'Tạo phiếu', date: '2025-05-01T09:30:00Z', actor: 'nghiatt15', source: 'Web' },
  { title: 'Gửi duyệt', date: '2025-05-01T10:15:00Z', actor: 'nghiatt15', source: 'Web',
    status: { title: 'Chờ duyệt', color: 'warning', icon: 'hourglass_empty' } },
  { title: 'Phê duyệt', date: '2025-05-01T14:02:00Z', actor: 'lead.user', source: 'Mobile',
    status: { title: 'Đã duyệt', color: 'success', icon: 'check' },
    description: 'Đồng ý với điều khoản đã được rà soát.' },
];
```

### 2. Inside a modal
```html
<sd-modal #m title="Lịch sử thay đổi" width="md">
  <sd-history [items]="logs"></sd-history>
</sd-modal>
```

### 3. As a tab on a detail page
```html
<sd-tab title="Lịch sử" key="history">
  <sd-history [items]="history()"></sd-history>
</sd-tab>
```

### 4. Status-only entry (no description)
```ts
{ title: 'Hủy phiếu', date: '2025-05-02T08:00:00Z', actor: 'admin',
  status: { title: 'Đã hủy', color: 'error', icon: 'close' } }
```

## Anti-patterns
- DON'T pass an unsorted `items` array — the component renders items in the order received. Sort newest- or oldest-first in your component before binding.
- DON'T render hundreds of items at once — there is no virtual scroll. Paginate or "load more" on large logs.
- DON'T use `<sd-history>` as a free-form timeline of arbitrary content — every node uses the same fixed layout (title, status, date, actor, source, description). For custom layouts, build your own.
- DON'T put HTML in `description` expecting it to render — it goes through normal interpolation, not `innerHTML`.

## Related
- `<sd-badge>` — used internally for the `status` chip
- `<sd-modal>` — common host for a "view history" dialog
- `<sd-tab>` — common host for an "Activity" tab
- `viewDateTime` pipe — formats the timestamp
