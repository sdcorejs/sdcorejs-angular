import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import {
  SdLayoutMenu,
  SdLayoutMenuTrailing,
  SdLayoutRootMenu,
  getMenuStableKey,
  groupMenusBySection,
  resolveMenuTrailing,
  searchAvailableMenuLeaves,
} from '../../../services';
import { containsMenuPath, resolveActiveMenuPath } from '../../../utils';

/** One row of the V4 search results, in the order `buildSidebarV4SearchResults` returns them. */
export interface SdSidebarV4SearchResult {
  /** `getMenuStableKey(menu)` of the leaf. */
  key: string;
  menu: SdLayoutRootMenu;
  /** Ancestor titles joined with " / ", or the top-level `section` for a root leaf; empty when neither exists. */
  path: string;
}

export type SdSidebarV4MenuTreePresentation = 'hierarchy' | 'shortcuts' | 'results';
export type SdSidebarV4MenuTreeMode = 'expanded' | 'collapsed' | 'mobile';

/**
 * Accent-insensitive V4 search over `menus` (via `searchAvailableMenuLeaves`, so `comingSoon` items and everything under a
 * `comingSoon` group are left out) with the parent path of every hit. A blank query returns no rows.
 * The `results` presentation renders exactly this list, so a parent's keyboard index matches the rendered options.
 */
export function buildSidebarV4SearchResults(menus: SdLayoutMenu[], query: string): SdSidebarV4SearchResult[] {
  if (!query?.trim()) return [];
  const paths = collectParentPaths(menus);
  return searchAvailableMenuLeaves(menus, query).map(menu => ({ key: getMenuStableKey(menu), menu, path: lookupParentPath(paths, menu) }));
}

interface SdSidebarV4TreeNode {
  menu: SdLayoutMenu;
  key: string;
  title: string;
  depth: number;
  isGroup: boolean;
  isExpanded: boolean;
  isActive: boolean;
  /** Closed group that contains the active route. */
  showActiveDot: boolean;
  /** `comingSoon`: aria-disabled, never navigates, a group never expands. */
  disabled: boolean;
  trailing: SdLayoutMenuTrailing | null;
  /** Indent of a nested row container: 32px for depth 1, +16px per further level. */
  paddingLeft: number;
  /** Left offsets of the 1px branch rails, one per ancestor level. */
  branchOffsets: number[];
  markerLeft: number;
  pinnable: boolean;
  isPinned: boolean;
  /** Accessible name of the pin toggle, already i18n-resolved with the title interpolated. */
  pinLabel: string;
}

interface SdSidebarV4TreeSection {
  key: string;
  label: string | null;
  labelId: string;
  /** Unsectioned group that follows a sectioned one; spaced so it does not read as part of that section. */
  separated: boolean;
  nodes: SdSidebarV4TreeNode[];
}

interface SdSidebarV4ShortcutRow {
  menu: SdLayoutRootMenu;
  key: string;
  title: string;
  path: string;
  isActive: boolean;
  disabled: boolean;
  isPinned: boolean;
  pinLabel: string;
}

interface SdSidebarV4TextSegment {
  text: string;
  match: boolean;
}

interface SdSidebarV4ResultRow extends SdSidebarV4SearchResult {
  segments: SdSidebarV4TextSegment[];
}

interface SdSidebarV4RailItem {
  menu: SdLayoutMenu;
  key: string;
  title: string;
  isGroup: boolean;
  isActive: boolean;
  disabled: boolean;
  badge: { value: number | string; tone: 'warning' | 'error' } | null;
  liveTone: 'success' | 'warning' | 'error' | null;
  descriptionId: string;
  /**
   * Warning/error badge ("3 pending") or live status label, read out after the title; the visual mark is aria-hidden.
   * Like the README D4 mock, a neutral count is neither shown nor announced on the rail.
   */
  description: string;
}

interface SdSidebarV4RailGroup {
  key: string;
  items: SdSidebarV4RailItem[];
}

interface SdSidebarV4NodeContext {
  activeMenuPath: string | null;
  collapsedKeys: ReadonlySet<string> | null;
  pinnedKeys: ReadonlySet<string>;
  showPin: boolean;
}

const PIN_KEY = 'core.module.layout.menu.pin';
const UNPIN_KEY = 'core.module.layout.menu.unpin';
const BADGE_PENDING_KEY = 'core.module.layout.sidebar.badge-pending';
const RESULT_COUNT_KEY = 'core.module.layout.sidebar.result-count';
const NO_MATCH_KEY = 'core.module.layout.sidebar.no-match';
const ITEM_RADIUS_VARIABLE = '--sd-sidebar-v4-item-radius';

// Mock: panel ở left 58px / top -6px so với ô rail 48px → lệch 10px từ mép phải của nút.
const FLYOUT_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 10, offsetY: -6 },
  { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom', offsetX: 10, offsetY: 6 },
];

let nextTreeId = 0;

/**
 * Private menu tree of sidebar V4 (D-014, D-023): imported only by `sd-sidebar-v4` and `sd-sidebar-mobile-v4`, never exported
 * from a public index. Navigation is the parent's job — the tree only emits.
 *
 * Inputs
 * - `menus`: what to render. `hierarchy`: the full tree; `shortcuts`: the pinned or recent menus; `results`: the full tree
 *   searched with `query` (the rendered options are exactly `results()` / `buildSidebarV4SearchResults(menus, query)`).
 * - `pathSource`: full tree used for parent paths and the active route when `menus` is a subset (shortcuts); defaults to `menus`.
 * - `activePath`: current route path; the most exact matching menu is active (`resolveActiveMenuPath`).
 * - `presentation`: `hierarchy` (sections, groups, branch rails) | `shortcuts` (flat "title · path" rows) | `results` (search).
 * - `mode`: `expanded` | `collapsed` (72px rail; hierarchy only) | `mobile` (hierarchy with 44px fallbacks, pin always shown).
 *   Row sizes come from `--sd-sidebar-v4-item-height`, `--sd-sidebar-v4-child-height` and `--sd-sidebar-v4-item-radius`
 *   set by the parent (fallbacks 36px / 32px / 999px, or 44px in mobile mode).
 * - `collapsedGroupKeys` (two-way): stable keys of closed groups — same keys and semantics as the V3 tree.
 * - `pinnedKeys`, `showPin`: pin toggles on leaf rows (hierarchy) and the unpin toggle on shortcut rows.
 * - `collapsedGroup`: rail group click opens a flyout (`flyout`) or emits `expandGroup` (`expand`). The flyout closes on
 *   navigation, Escape or a click outside it (that click still reaches its target, e.g. another rail item).
 * - `query`, `focusedIndex`: search text and the keyboard-selected option of the `results` presentation.
 *
 * Outputs: `navigate` (root/leaf rows, never `comingSoon`), `togglePinned`, `expandGroup`.
 * The host is not a landmark; the parent wraps the tree in its `<nav>`. It always holds a polite live region that announces
 * the result count (or the no-match message) while the `results` presentation has a query — keep the same tree instance
 * mounted while switching presentations so the change is announced.
 * The collapsed rail shows (and announces) only warning/error badges and live status dots; neutral counts stay off the rail.
 */
@Component({
  selector: 'sd-sidebar-v4-menu-tree',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, NgTemplateOutlet, SdIcon, SdTranslatePipe],
  templateUrl: './sidebar-v4-menu-tree.component.html',
  styleUrl: './sidebar-v4-menu-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-sidebar-v4-menu-tree',
    '[class.sd-sidebar-v4-menu-tree--mobile]': 'mode() === "mobile"',
    '[class.sd-sidebar-v4-menu-tree--collapsed]': 'isRail()',
  },
})
export class SdSidebarV4MenuTree {
  readonly #i18n = inject(I18nService);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #document = inject(DOCUMENT);
  readonly #id = `sd-sidebar-v4-menu-tree-${nextTreeId++}`;
  readonly #flyoutKey = signal<string | null>(null);
  #flyoutTrigger: HTMLElement | null = null;

  /** Menus to render; see the class description for what each presentation expects. */
  menus = input<SdLayoutMenu[]>([]);
  /** Full menu tree for parent paths and the active route when `menus` is a subset; empty means `menus`. */
  pathSource = input<SdLayoutMenu[]>([]);
  /** Current route path without query or fragment. */
  activePath = input('');
  presentation = input<SdSidebarV4MenuTreePresentation>('hierarchy');
  mode = input<SdSidebarV4MenuTreeMode>('expanded');
  /** Stable keys of closed groups (default: every group open), shared two-way with the parent. */
  collapsedGroupKeys = model<string[]>([]);
  pinnedKeys = input<string[]>([]);
  showPin = input(true);
  /** What a group click does on the collapsed rail. */
  collapsedGroup = input<'flyout' | 'expand'>('flyout');
  /** Search text of the `results` presentation. */
  query = input('');
  /** Index in `results()` of the keyboard-selected option; -1 for none. */
  focusedIndex = input(-1);

  /** A root or leaf row was activated (never a `comingSoon` item). */
  navigate = output<SdLayoutRootMenu>();
  togglePinned = output<SdLayoutMenu>();
  /** A rail group was clicked with `collapsedGroup: 'expand'`; the parent expands the sidebar and opens that group. */
  expandGroup = output<SdLayoutMenu>();

  /** Id of the results listbox, for the parent's `aria-controls`. */
  readonly resultsId = `${this.#id}-results`;
  protected readonly resultCountId = `${this.#id}-result-count`;
  protected readonly flyoutPositions = FLYOUT_POSITIONS;
  protected readonly flyoutKey = this.#flyoutKey.asReadonly();
  protected readonly flyoutRadius = signal<string | null>(null);

  readonly #treeSource = computed(() => (this.pathSource().length ? this.pathSource() : this.menus()));
  readonly #activeMenuPath = computed(() => resolveActiveMenuPath(this.#treeSource(), this.activePath()));
  protected readonly isRail = computed(() => this.presentation() === 'hierarchy' && this.mode() === 'collapsed');

  /** Rows of the `results` presentation, in render order. */
  readonly results = computed(() => buildSidebarV4SearchResults(this.menus(), this.query()));

  protected readonly sections = computed<SdSidebarV4TreeSection[]>(() => {
    const context = this.#nodeContext(new Set(this.collapsedGroupKeys()));
    return groupMenusBySection(this.menus()).map((group, index) => ({
      key: group.section === null ? `unsectioned-${index}` : `section-${group.section}`,
      label: group.section,
      labelId: `${this.#id}-section-${index}`,
      separated: group.section === null && index > 0,
      nodes: this.#collectNodes(group.menus, 0, [], context, []),
    }));
  });

  protected readonly shortcuts = computed<SdSidebarV4ShortcutRow[]>(() => {
    const paths = collectParentPaths(this.#treeSource());
    const activeMenuPath = this.#activeMenuPath();
    const pinnedKeys = new Set(this.pinnedKeys());
    return this.menus()
      .filter((menu): menu is SdLayoutRootMenu => !!menu && 'path' in menu && typeof menu.path === 'string' && !!menu.path)
      .map(menu => {
        const key = getMenuStableKey(menu);
        const title = menu.title ?? menu.tooltipTitle ?? '';
        const isPinned = pinnedKeys.has(key);
        return {
          menu,
          key,
          title,
          path: lookupParentPath(paths, menu),
          isActive: menu.path === activeMenuPath,
          disabled: menu.comingSoon === true,
          isPinned,
          pinLabel: this.#i18n.t(isPinned ? UNPIN_KEY : PIN_KEY, { title }),
        };
      });
  });

  protected readonly resultRows = computed<SdSidebarV4ResultRow[]>(() => {
    const query = this.query();
    return this.results().map(result => ({ ...result, segments: highlightSegments(result.menu.title ?? '', query) }));
  });

  /** Text of the always-mounted polite live region: the result count, or the no-match message, while searching. */
  protected readonly liveMessage = computed(() => {
    const query = this.query().trim();
    if (this.presentation() !== 'results' || !query) return '';
    const count = this.results().length;
    return count ? this.#i18n.t(RESULT_COUNT_KEY, { count }) : this.#i18n.t(NO_MATCH_KEY, { query });
  });

  protected readonly railGroups = computed<SdSidebarV4RailGroup[]>(() => {
    const activeMenuPath = this.#activeMenuPath();
    return groupMenusBySection(this.menus()).map((group, groupIndex) => ({
      key: group.section === null ? `unsectioned-${groupIndex}` : `section-${group.section}`,
      items: group.menus
        .map((menu, index) => this.#toRailItem(menu, activeMenuPath, `${this.#id}-rail-${groupIndex}-${index}`))
        .filter((item): item is SdSidebarV4RailItem => !!item),
    }));
  });

  protected readonly flyoutNodes = computed<SdSidebarV4TreeNode[]>(() => {
    const key = this.#flyoutKey();
    if (!key) return [];
    const item = this.railGroups()
      .flatMap(group => group.items)
      .find(candidate => candidate.key === key);
    if (!item || !('children' in item.menu)) return [];
    // why: flyout luôn bày hết các cấp (bỏ qua collapsedGroupKeys); nhóm lồng thành heading thụt lề.
    return this.#collectNodes(item.menu.children ?? [], 0, [item.menu.title ?? key], this.#nodeContext(null), []);
  });

  constructor() {
    // why: đổi mode/presentation (vd mở rộng rail) hoặc route đổi từ nơi khác khi flyout đang mở thì đóng hẳn, tránh overlay
    // mồ côi; không trả focus vì người dùng không chủ động đóng.
    effect(() => {
      this.mode();
      this.presentation();
      this.collapsedGroup();
      this.activePath();
      untracked(() => this.closeFlyout(false));
    });

    // why: menus đổi làm group đang mở biến mất (hoặc thành comingSoon) thì bỏ key/trigger cũ thay vì giữ state treo.
    effect(() => {
      const key = this.#flyoutKey();
      if (!key) return;
      const present = this.railGroups().some(group => group.items.some(item => item.key === key && item.isGroup && !item.disabled));
      if (!present) untracked(() => this.closeFlyout(false));
    });
  }

  /** Id of the result option at `index`, for the parent's `aria-activedescendant`. */
  resultOptionId(index: number): string {
    return `${this.#id}-result-${index}`;
  }

  /** Closes the collapsed-rail flyout; focus returns to its group button unless `restoreFocus` is false. */
  closeFlyout(restoreFocus = true): void {
    if (!this.#flyoutKey()) return;
    const trigger = this.#flyoutTrigger;
    this.#flyoutKey.set(null);
    this.#flyoutTrigger = null;
    if (restoreFocus) trigger?.focus();
  }

  protected onNavigate(menu: SdLayoutMenu): void {
    if (menu.comingSoon === true || !('path' in menu)) return;
    this.navigate.emit(menu);
  }

  protected onToggleGroup(node: SdSidebarV4TreeNode): void {
    if (node.disabled) return;
    this.collapsedGroupKeys.update(keys => (keys.includes(node.key) ? keys.filter(key => key !== node.key) : [...keys, node.key]));
  }

  protected onTogglePinned(event: MouseEvent, menu: SdLayoutMenu): void {
    event.stopPropagation();
    this.togglePinned.emit(menu);
  }

  protected onRailGroup(item: SdSidebarV4RailItem, trigger: HTMLElement): void {
    if (item.disabled) return;
    if (this.collapsedGroup() === 'expand') {
      this.expandGroup.emit(item.menu);
      return;
    }
    if (this.#flyoutKey() === item.key) {
      this.closeFlyout();
      return;
    }
    this.#flyoutTrigger = trigger;
    this.flyoutRadius.set(this.#readItemRadius());
    this.#flyoutKey.set(item.key);
  }

  protected onFlyoutNavigate(node: SdSidebarV4TreeNode): void {
    if (node.disabled || !('path' in node.menu)) return;
    this.navigate.emit(node.menu);
    this.closeFlyout();
  }

  protected onFlyoutAttach(overlay: CdkConnectedOverlay): void {
    // why: không dùng cdkTrapFocusAutoCapture — nó nhớ phần tử được focus lúc mở (nút group) và focus lại phần tử đó khi
    // panel bị huỷ, giành focus của chỗ người dùng vừa click (vd ô input). Tự đưa focus vào panel tại đây; closeFlyout là
    // nơi duy nhất trả focus. (attach) phát sau khi portal đã render panel nên làm được đồng bộ.
    const panel = overlay.overlayRef?.overlayElement.querySelector<HTMLElement>('[data-v4-flyout]');
    if (!panel) return;
    (panel.querySelector<HTMLElement>('button') ?? panel).focus({ preventScroll: true });
  }

  protected onFlyoutKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    // why: Esc chỉ đóng flyout — không tới handler Esc của lớp ngoài (xoá search, đóng drawer mobile).
    event.stopPropagation();
    this.closeFlyout();
  }

  protected onFlyoutOutsideClick(): void {
    // why: không dùng backdrop nên click vẫn tới đích (vd mở group rail khác); CDK đã loại click lên chính nút group.
    // Chỉ trả focus về nút group khi click không trao focus cho phần tử khác (vd ô input trong trang).
    const active = this.#document.activeElement;
    const focusIsFree = !active || active === this.#document.body || !!active.closest('[data-v4-flyout]');
    this.closeFlyout(focusIsFree);
  }

  protected onFlyoutDetach(key: string): void {
    // why: CDK tự detach (vd scroll strategy) thì đồng bộ lại state; không trả focus vì không do người dùng đóng.
    if (this.#flyoutKey() !== key) return;
    this.#flyoutKey.set(null);
    this.#flyoutTrigger = null;
  }

  #nodeContext(collapsedKeys: ReadonlySet<string> | null): SdSidebarV4NodeContext {
    return { activeMenuPath: this.#activeMenuPath(), collapsedKeys, pinnedKeys: new Set(this.pinnedKeys()), showPin: this.showPin() };
  }

  #collectNodes(
    menus: SdLayoutMenu[],
    depth: number,
    ancestors: string[],
    context: SdSidebarV4NodeContext,
    nodes: SdSidebarV4TreeNode[]
  ): SdSidebarV4TreeNode[] {
    for (const menu of menus ?? []) {
      if (!menu || typeof menu !== 'object') continue;
      const key = getMenuStableKey(menu, ancestors);
      if (!key) continue;
      const children = 'children' in menu && Array.isArray(menu.children) ? menu.children : [];
      const isGroup = children.length > 0;
      const path = 'path' in menu && typeof menu.path === 'string' ? menu.path : '';
      const disabled = menu.comingSoon === true;
      const title = menu.title ?? menu.tooltipTitle ?? '';
      const isExpanded = isGroup && !disabled && !context.collapsedKeys?.has(key);
      const holdsActive = isGroup && !!context.activeMenuPath && containsMenuPath(menu, context.activeMenuPath);
      const pinnable = context.showPin && !isGroup && !disabled && !!path;
      const isPinned = context.pinnedKeys.has(key);
      nodes.push({
        menu,
        key,
        title,
        depth,
        isGroup,
        isExpanded,
        isActive: !isGroup && !!path && path === context.activeMenuPath,
        showActiveDot: holdsActive && !isExpanded,
        disabled,
        trailing: resolveMenuTrailing(menu),
        paddingLeft: depth ? 32 + (depth - 1) * 16 : 0,
        branchOffsets: Array.from({ length: depth }, (_, index) => 21 + index * 16),
        markerLeft: 20 + Math.max(depth - 1, 0) * 16,
        pinnable,
        isPinned,
        pinLabel: pinnable ? this.#i18n.t(isPinned ? UNPIN_KEY : PIN_KEY, { title }) : '',
      });
      if (isExpanded) this.#collectNodes(children, depth + 1, [...ancestors, menu.title ?? key], context, nodes);
    }
    return nodes;
  }

  #toRailItem(menu: SdLayoutMenu, activeMenuPath: string | null, descriptionId: string): SdSidebarV4RailItem | null {
    if (!menu || typeof menu !== 'object') return null;
    const key = getMenuStableKey(menu);
    if (!key) return null;
    const isGroup = 'children' in menu && Array.isArray(menu.children) && menu.children.length > 0;
    const trailing = resolveMenuTrailing(menu);
    const badge = trailing?.kind === 'badge' ? { value: trailing.value, tone: trailing.tone } : null;
    const liveTone = trailing?.kind === 'status' && trailing.live ? trailing.tone : null;
    const description = badge
      ? this.#i18n.t(BADGE_PENDING_KEY, { count: badge.value })
      : trailing?.kind === 'status' && trailing.live
        ? trailing.label
        : '';
    return {
      menu,
      key,
      title: menu.tooltipTitle || menu.title || '',
      isGroup,
      isActive: !!activeMenuPath && containsMenuPath(menu, activeMenuPath),
      disabled: menu.comingSoon === true,
      badge,
      liveTone,
      descriptionId,
      description,
    };
  }

  #readItemRadius(): string | null {
    // why: flyout nằm trong overlay container của CDK, ngoài host — không thừa kế được biến radius parent khai trên host.
    const view = this.#document.defaultView;
    if (!view) return null;
    return view.getComputedStyle(this.#host.nativeElement).getPropertyValue(ITEM_RADIUS_VARIABLE).trim() || null;
  }
}

/** Parent path of every menu in the tree, keyed by object and by stable key (so equal menus from another array still resolve). */
function collectParentPaths(menus: SdLayoutMenu[]): Map<SdLayoutMenu | string, string> {
  const paths = new Map<SdLayoutMenu | string, string>();
  const visit = (items: SdLayoutMenu[], titles: string[], section: string): void => {
    for (const menu of items) {
      if (!menu || typeof menu !== 'object') continue;
      const path = titles.length ? titles.join(' / ') : section;
      if (!paths.has(menu)) paths.set(menu, path);
      const key = getMenuStableKey(menu);
      if (key && !paths.has(key)) paths.set(key, path);
      if ('children' in menu && Array.isArray(menu.children)) {
        const title = (menu.title ?? menu.tooltipTitle ?? '').trim();
        visit(menu.children, title ? [...titles, title] : titles, section);
      }
    }
  };
  for (const menu of menus ?? []) {
    if (!menu || typeof menu !== 'object') continue;
    visit([menu], [], typeof menu.section === 'string' ? menu.section.trim() : '');
  }
  return paths;
}

function lookupParentPath(paths: Map<SdLayoutMenu | string, string>, menu: SdLayoutMenu): string {
  return paths.get(menu) ?? paths.get(getMenuStableKey(menu)) ?? '';
}

// Cùng bộ ký tự mà StringUtilities.changeAliasLowerCase thay bằng khoảng trắng.
const PUNCTUATION = /[!@%^*()+=<>?/,.:;'"&#[\]~$_`\-{}|\\]/;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const D_STROKE = /\u0111/g;
const WHITESPACE = /\s/;

function foldCharacter(character: string): string {
  if (PUNCTUATION.test(character)) return ' ';
  return character.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '').replace(D_STROKE, 'd');
}

/** Folds like `aliasIncludes` (no case, no accents, punctuation as one space) and maps every folded character to its source index. */
function foldText(text: string): { folded: string; sources: number[] } {
  let folded = '';
  const sources: number[] = [];
  for (let index = 0; index < text.length; index++) {
    for (const character of foldCharacter(text[index])) {
      const isSpace = WHITESPACE.test(character);
      if (isSpace && (!folded || folded.endsWith(' '))) continue;
      folded += isSpace ? ' ' : character;
      sources.push(index);
    }
  }
  return { folded, sources };
}

/**
 * Splits `text` around the first accent-insensitive occurrence of `query`. The result is rendered through text
 * interpolation only, so neither the title nor the query can inject markup.
 */
function highlightSegments(text: string, query: string): SdSidebarV4TextSegment[] {
  const needle = foldText(query ?? '').folded.trim();
  if (!needle) return [{ text, match: false }];
  const { folded, sources } = foldText(text);
  const at = folded.indexOf(needle);
  if (at < 0) return [{ text, match: false }];
  const start = sources[at];
  let end = sources[at + needle.length - 1] + 1;
  // why: dấu tổ hợp (chuỗi NFD) đứng sau ký tự khớp cuối thuộc về ký tự đó — giữ trong phần highlight.
  while (end < text.length && !foldCharacter(text[end])) end++;
  return [
    { text: text.slice(0, start), match: false },
    { text: text.slice(start, end), match: true },
    { text: text.slice(end), match: false },
  ].filter(segment => !!segment.text);
}
