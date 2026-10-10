import { isDevMode } from '@angular/core';
import type { SdButtonColor, SdButtonType } from '@sdcorejs/angular/components/button';
import type { SdIconSet } from '@sdcorejs/angular/modules/icon';
import type {
  SdFileExplorerAction,
  SdFileExplorerActionGroup,
  SdFileExplorerActionLeaf,
  SdFileExplorerItem,
  SdFileExplorerState,
} from './file-explorer.model';
import type { SdFileExplorerSheetCommand, SdFileExplorerSheetEntry } from './file-explorer.view-model';

// Normalizes `selector.actions`, `fileCommands` and `folderCommands` for the internal action renderer.
// Not exported from the entry point: consumers only see the definition types of `file-explorer.model`.

/**
 * `type` / `color` an action area applies when a definition leaves them unset. The variant depends only on the kind
 * of the definition — a leaf (flat button) or a group (menu trigger) — never on its position, title or callback.
 */
export interface SdFileExplorerActionDefaults {
  /** Variant of a leaf without `type`. */
  readonly leafType: SdButtonType;
  /** Variant of a group trigger without `type`. */
  readonly groupType: SdButtonType;
  readonly color: SdButtonColor;
}

/** Defaults of `fileCommands` and `folderCommands`: `text` and `secondary`, flat or grouped. */
export const SD_FILE_EXPLORER_COMMAND_DEFAULTS: SdFileExplorerActionDefaults = { leafType: 'text', groupType: 'text', color: 'secondary' };

/** Button-level fields shared by leaves and group triggers, with states already evaluated for one context. */
interface SdFileExplorerResolvedButton {
  /** Declared index among its siblings; stable when other siblings are hidden (used for tracking and autoId). */
  readonly key: string;
  readonly title: string | undefined;
  readonly tooltip: string | undefined;
  readonly prefixIcon: string | undefined;
  readonly suffixIcon: string | undefined;
  readonly fontSet: SdIconSet | undefined;
  readonly color: SdButtonColor;
  readonly type: SdButtonType;
  readonly disabled: boolean;
  readonly loading: boolean;
}

export interface SdFileExplorerResolvedLeaf<T> extends SdFileExplorerResolvedButton {
  readonly kind: 'leaf';
  readonly definition: SdFileExplorerActionLeaf<T>;
}

export interface SdFileExplorerResolvedGroup<T> extends SdFileExplorerResolvedButton {
  readonly kind: 'group';
  readonly definition: SdFileExplorerActionGroup<T>;
  /** Visible menu items; never empty. */
  readonly children: readonly SdFileExplorerResolvedMenuItem<T>[];
}

/** Menu item of a group. Loading items are disabled as well: `sd-button-item` has no loading state of its own. */
export interface SdFileExplorerResolvedMenuItem<T> {
  readonly key: string;
  readonly definition: SdFileExplorerActionLeaf<T>;
  /** Projected label: the title, or the tooltip of an item without title. */
  readonly label: string;
  /** Tooltip, unless it already is the label. */
  readonly tooltip: string | undefined;
  readonly prefixIcon: string | undefined;
  readonly suffixIcon: string | undefined;
  readonly fontSet: SdIconSet | undefined;
  /** Unset keeps the neutral menu color. */
  readonly color: SdButtonColor | undefined;
  readonly disabled: boolean;
  readonly loading: boolean;
}

export type SdFileExplorerResolvedAction<T> = SdFileExplorerResolvedLeaf<T> | SdFileExplorerResolvedGroup<T>;

/** Trigger icon of a group that declares no `prefixIcon`. */
const GROUP_ICON = 'more_vert';

// why: mỗi hàng của danh sách resolve lại cùng một bộ định nghĩa — cảnh báo theo định nghĩa (hoặc theo nội dung
// với giá trị không phải object) để console chỉ nhắc một lần, không phải một lần cho mỗi tệp.
const warnedDefinitions = new WeakSet<object>();
const warnedMessages = new Set<string>();

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function evaluate<T>(state: SdFileExplorerState<T> | undefined, context: T): boolean {
  return typeof state === 'function' ? !!state(context) : !!state;
}

function warn(definition: unknown, message: string): void {
  if (!isDevMode()) return;
  if (definition !== null && typeof definition === 'object') {
    if (warnedDefinitions.has(definition)) return;
    warnedDefinitions.add(definition);
  } else {
    if (warnedMessages.has(message)) return;
    warnedMessages.add(message);
  }
  console.warn(message);
}

/**
 * Why a definition cannot be rendered, or `null` when it is a usable leaf or group. TypeScript already rejects these
 * shapes; this guards plain JavaScript and loosely typed configuration.
 */
function problem(definition: unknown, inGroup: boolean): string | null {
  if (definition === null || typeof definition !== 'object') return 'is not an action object';
  const { click, onClick, children, title, tooltip } = definition as Record<string, unknown>;
  if (children !== undefined && children !== null && !Array.isArray(children)) return '`children` must be an array';
  if (Array.isArray(children)) {
    if (inGroup) return 'is a group inside a group; groups are one level deep';
    if (typeof click === 'function' || typeof onClick === 'function')
      return 'declares both `click` and `children`; a group only opens its menu';
  } else if (typeof click !== 'function' && typeof onClick !== 'function') {
    return 'needs `click` (an action) or `children` (a group)';
  }
  if (!text(title) && !text(tooltip)) return 'needs a `title` or a `tooltip` as its accessible name';
  return null;
}

function resolveMenu<T>(group: SdFileExplorerActionGroup<T>, context: T, path: string): SdFileExplorerResolvedMenuItem<T>[] {
  const items: SdFileExplorerResolvedMenuItem<T>[] = [];
  group.children.forEach((child, index) => {
    const reason = problem(child, true);
    if (reason) {
      warn(child, `[sd-file-explorer] ${path}.children[${index}] ignored: ${reason}.`);
      return;
    }
    if (evaluate(child.hidden, context)) return;
    const title = text(child.title);
    const tooltip = text(child.tooltip);
    const loading = evaluate(child.loading, context);
    items.push({
      key: String(index),
      definition: child,
      label: (title ?? tooltip) as string,
      tooltip: title ? tooltip : undefined,
      prefixIcon: child.prefixIcon ?? undefined,
      suffixIcon: child.suffixIcon ?? undefined,
      fontSet: child.fontSet ?? undefined,
      color: child.color ?? undefined,
      disabled: evaluate(child.disabled, context) || loading,
      loading,
    });
  });
  return items;
}

/**
 * Visible actions of one collection for one context (the selected files, or one item), in declared order.
 *
 * Hidden entries, groups without a visible child and definitions that cannot be rendered are left out; nothing is
 * regrouped or moved into an overflow menu. `source` names the collection in dev-mode warnings.
 */
export function sdFileExplorerResolveActions<T>(
  actions: readonly SdFileExplorerAction<T>[] | null | undefined,
  context: T,
  defaults: SdFileExplorerActionDefaults,
  source = 'actions'
): SdFileExplorerResolvedAction<T>[] {
  if (!Array.isArray(actions)) return [];
  const resolved: SdFileExplorerResolvedAction<T>[] = [];
  actions.forEach((definition: SdFileExplorerAction<T>, index) => {
    const path = `${source}[${index}]`;
    const reason = problem(definition, false);
    if (reason) {
      warn(definition, `[sd-file-explorer] ${path} ignored: ${reason}.`);
      return;
    }
    if (evaluate(definition.hidden, context)) return;
    const isGroup = Array.isArray(definition.children);
    const button: SdFileExplorerResolvedButton = {
      key: String(index),
      title: text(definition.title),
      tooltip: text(definition.tooltip),
      prefixIcon: definition.prefixIcon ?? undefined,
      suffixIcon: definition.suffixIcon ?? undefined,
      fontSet: definition.fontSet ?? undefined,
      color: definition.color ?? defaults.color,
      type: definition.type ?? (isGroup ? defaults.groupType : defaults.leafType),
      disabled: evaluate(definition.disabled, context),
      loading: evaluate(definition.loading, context),
    };
    if (!isGroup) {
      resolved.push({ ...button, kind: 'leaf', definition: definition as SdFileExplorerActionLeaf<T> });
      return;
    }
    const group = definition as SdFileExplorerActionGroup<T>;
    const children = resolveMenu(group, context, path);
    if (children.length) {
      resolved.push({ ...button, kind: 'group', definition: group, prefixIcon: group.prefixIcon ?? GROUP_ICON, children });
    }
  });
  return resolved;
}

/** `true` when the action must not run now: hidden, disabled or loading for `context`, evaluated at call time. */
export function sdFileExplorerActionBlocked<T>(action: SdFileExplorerAction<T>, context: T): boolean {
  return evaluate(action.hidden, context) || evaluate(action.disabled, context) || evaluate(action.loading, context);
}

/** `true` while an entry, or an item of one of its groups, is loading: the compact trigger of the item shows it. */
export function sdFileExplorerActionsBusy<T>(resolved: readonly SdFileExplorerResolvedAction<T>[]): boolean {
  return resolved.some(entry => entry.loading || (entry.kind === 'group' && entry.children.some(child => child.loading)));
}

/**
 * Entries of the compact command drawer, from the commands resolved for its item: same order, filtering and states as
 * the desktop buttons, shown as menu-like entries. The drawer has no button variants, so `type` is dropped; a color is
 * kept only when declared, for the icons. A group becomes a section with a text-only heading — its icon and color stay
 * on the desktop trigger — whose children are disabled while the group itself is disabled or loading. `keys` renames
 * entries by declared index (the row shortcuts: `share`, `download`).
 */
export function sdFileExplorerSheetEntries<T>(
  resolved: readonly SdFileExplorerResolvedAction<SdFileExplorerItem<T>>[],
  keys?: readonly string[]
): SdFileExplorerSheetEntry<T>[] {
  return resolved.map(entry => {
    const key = keys?.[Number(entry.key)] ?? entry.key;
    if (entry.kind === 'leaf') {
      return {
        kind: 'leaf',
        key,
        label: (entry.title ?? entry.tooltip) as string,
        prefixIcon: entry.prefixIcon,
        suffixIcon: entry.suffixIcon,
        fontSet: entry.fontSet,
        color: entry.definition.color ?? undefined,
        disabled: entry.disabled || entry.loading,
        loading: entry.loading,
        definition: entry.definition,
      };
    }
    const blocked = entry.disabled || entry.loading;
    const children = entry.children.map(
      (child): SdFileExplorerSheetCommand<T> => ({
        kind: 'leaf',
        key: child.key,
        label: child.label,
        prefixIcon: child.prefixIcon,
        suffixIcon: child.suffixIcon,
        fontSet: child.fontSet,
        color: child.color,
        disabled: child.disabled || blocked,
        loading: child.loading,
        definition: child.definition,
      })
    );
    return {
      kind: 'group',
      key,
      label: (entry.title ?? entry.tooltip) as string,
      disabled: entry.disabled,
      loading: entry.loading,
      definition: entry.definition,
      children,
    };
  });
}
