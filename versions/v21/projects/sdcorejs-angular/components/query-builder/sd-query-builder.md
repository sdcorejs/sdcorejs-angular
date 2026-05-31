�# `<sd-query-builder>`

**Type**: Component
**Selector**: `sd-query-builder`
**Import path**: `@sdcorejs/angular/components/query-builder` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdQueryBuilder`
**Standalone**: yes
**Change detection**: default (no `OnPush`)

## One-line purpose
Visual filter / rule builder � lets the user compose nested AND/OR groups of `field operator value` conditions through a tree UI, suitable for advanced search, dynamic queries, or saved-filter editors.

## When to use
- "Tìm kiếm nâng cao" panel where users build their own filter logic
- Saved-filter / saved-view editors (rules persisted to backend)
- Audience / segment builders, alert-rule editors, eligibility expressions
- Any UI where a flat search bar isn't enough and the user needs grouped boolean logic
- As an embedded section inside a larger form (it does not provide its own header/title)

## When NOT to use
- For simple keyword search �  use `<sd-input>` with a search icon
- For single-field dropdown filtering �  use `<sd-select>` directly
- When the rule schema is fixed (e.g. only one field with operator) �  a hard-coded form is easier to maintain
- When you need server-side validated query syntax (SQL, KQL) �  this component models a tree, not text; pair with a serializer

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `group` | `QueryGroup` | (sample data: AND group with 3 demo rules incl. a nested OR group) | The root rule tree. Mutated in place by user actions � supply a fresh object per session if you don't want demo defaults. |

### Type shape
```ts
interface QueryRule {
  field: string;
  operator: string;
  value: any;
}
interface QueryGroup {
  condition: 'AND' | 'OR';
  rules: (QueryRule | QueryGroup)[];
  isOpen?: boolean; // internal: dropdown open state
}
```

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `groupChange` | `EventEmitter<QueryGroup>` | Declared on the class but currently NOT emitted by user actions (the component mutates `group` in place). Bind two-way only if you also re-trigger change detection externally. |

## Content projection
None. Field / operator / value editors are hard-coded:
- `field` �  plain text input with placeholder "Select Field"
- `operator` �  native `<select>` with options `Equal` and `Not Equal` (only)
- `value` �  plain text input with placeholder "Value"

## Visual cues (helps agent map screenshots �  component)
- A bordered container (`qb-container`) holding nested `qb-group` cards
- Each group has:
  - Header row (`qb-header`) with a left "AND / OR" pill toggle (`qb-condition-switch`) � the active side is highlighted
  - Right-side action area (`qb-actions`) with a circular "+" button (`btn-add`) that opens a small dropdown menu of two items: "+ Add Group" and "+ Add Condition"
  - On non-root groups, an additional "�S"" remove button to delete the whole subtree
- Body (`qb-body`, `qb-list`) is a vertical stack of `qb-treenode` rows:
  - Rule nodes (`qb-rule-card`, class `is-rule`) render as a horizontal form row: field input �  vertical divider �  operator `<select>` �  divider �  value input �  "�S"" remove button (only the field input is visible until the user types a field name; operator/value appear afterwards)
  - Group nodes (class `is-group`) render as another nested `qb-group` card, indented to indicate hierarchy
- Tree-style indentation of nested groups (CSS in scss handles indent guides)
- Document-level click closes any open "+" dropdown (via `@HostListener('document:click')`)

## Examples

### 1. Empty builder for a "Tìm kiếm nâng cao" panel
```html
<sd-query-builder [group]="filterGroup"></sd-query-builder>
```
```ts
filterGroup: QueryGroup = { condition: 'AND', rules: [] };
```

### 2. Pre-loaded saved filter
```html
<sd-query-builder [group]="savedFilter"></sd-query-builder>
<sd-button title="Áp dụng" type="fill" color="primary" (click)="applyFilter(savedFilter)"></sd-button>
```
```ts
savedFilter: QueryGroup = {
  condition: 'AND',
  rules: [
    { field: 'employeeId', operator: 'Equal', value: '1' },
    { field: 'title', operator: 'Equal', value: 'Sales Manager' }
  ]
};
```

### 3. Inside a side-drawer with apply / reset footer
```html
<sd-side-drawer #drawer title="B�" lọc nâng cao" width="640px">
  <sd-query-builder [group]="filterGroup"></sd-query-builder>
  <div sdFooter class="d-flex gap-8 justify-content-end">
    <sd-button title="Đặt lại" type="outline" (click)="filterGroup = { condition: 'AND', rules: [] }"></sd-button>
    <sd-button title="Áp dụng" type="fill" color="primary" (click)="apply(); drawer.close()"></sd-button>
  </div>
</sd-side-drawer>
```

### 4. Serializing the tree to a backend payload
```ts
serialize(group: QueryGroup): any {
  return {
    op: group.condition.toLowerCase(),
    items: group.rules.map(r =>
      'rules' in r ? this.serialize(r) : { field: r.field, op: r.operator, value: r.value }
    )
  };
}
```

## Anti-patterns
- �R Two-way binding `[(group)]="..."` and expecting `groupChange` events � mutations happen in place; the event is not emitted by the current implementation
- �R Sharing one `group` object across multiple builder instances � they will mutate each other
- �R Relying on the demo defaults � always pass an empty or pre-populated `group` so users don't see "Employee ID / Sales Manager" placeholders
- �R Customizing the field / operator dropdowns � they are hard-coded; if you need dynamic field metadata, extend or fork the component
- �R Using inside `OnPush` ancestors without explicit `markForCheck()` � the component itself uses default change detection, but the parent may need a nudge after mutating `group`

## Related
- `<sd-input>` / `<sd-select>` � used inside the rule cards (here as plain native elements; replace if you fork)
- `<sd-side-drawer>` � common host for the builder
- `<sd-table>` � typical consumer that applies the serialized filter

