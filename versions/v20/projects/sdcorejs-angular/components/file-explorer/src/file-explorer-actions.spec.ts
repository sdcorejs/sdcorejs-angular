import type { SdFileExplorerCommand, SdFileExplorerItem, SdFileExplorerSelectionAction } from './file-explorer.model';
import {
  SD_FILE_EXPLORER_COMMAND_DEFAULTS,
  sdFileExplorerActionBlocked,
  sdFileExplorerActionsBusy,
  sdFileExplorerResolveActions,
  sdFileExplorerSheetEntries,
  type SdFileExplorerResolvedAction,
} from './file-explorer-actions';

const item = (id: string): SdFileExplorerItem => ({ id, parentId: null, name: `${id}.pdf`, kind: 'file' });
const noop = () => undefined;
const COMMAND = { leafType: 'text', groupType: 'text', color: 'secondary' } as const;

/** `kind:key:label` for each entry; groups list their menu labels. */
function outline<T>(entries: readonly SdFileExplorerResolvedAction<T>[]): string[] {
  return entries.map(entry =>
    entry.kind === 'leaf'
      ? `leaf:${entry.key}:${entry.title ?? entry.tooltip}`
      : `group:${entry.key}:${entry.children.map(child => child.label).join('|')}`
  );
}

describe('file-explorer actions', () => {
  describe('typing', () => {
    it('allows leaves and one level of groups, and rejects nested groups or a parent that also clicks', () => {
      const leaf = { title: 'Download', click: noop };
      const commands: SdFileExplorerCommand[] = [
        leaf,
        { tooltip: 'More', children: [leaf] },
        // @ts-expect-error a group child must be a leaf: groups are one level deep
        { tooltip: 'More', children: [{ title: 'Nested', children: [leaf] }] },
        // @ts-expect-error a group only opens its menu, it cannot click as well
        { tooltip: 'More', click: noop, children: [leaf] },
        // @ts-expect-error without click or children a definition is neither a leaf nor a group
        { title: 'Nothing' },
      ];
      expect(commands.length).toBe(5);
    });

    it('types the click context: the selection snapshot for selector actions, one item for commands', () => {
      const move: SdFileExplorerSelectionAction = { title: 'Move', click: items => items.map(entry => entry.id) };
      const rename: SdFileExplorerCommand = { title: 'Rename', click: target => target.name };
      // @ts-expect-error selector actions receive the selected items, not one item
      const wrongSelection: SdFileExplorerSelectionAction = { title: 'Move', click: (target: SdFileExplorerItem) => target.name };
      // @ts-expect-error commands receive the item of their row, not an array
      const wrongCommand: SdFileExplorerCommand = { title: 'Rename', click: (items: SdFileExplorerItem[]) => items.length };
      expect([move, rename, wrongSelection, wrongCommand].length).toBe(4);
    });
  });

  describe('sdFileExplorerResolveActions', () => {
    it('keeps the declared order of mixed flat and grouped siblings and never folds them into an overflow menu', () => {
      const actions: SdFileExplorerCommand[] = [
        { title: 'A', click: noop },
        { title: 'Tools', children: [{ title: 'B', click: noop }] },
        { title: 'C', click: noop },
        { title: 'D', click: noop },
        { title: 'E', click: noop },
        {
          tooltip: 'More',
          children: [
            { title: 'F', click: noop },
            { title: 'G', click: noop },
          ],
        },
        { title: 'H', click: noop },
      ];
      expect(outline(sdFileExplorerResolveActions(actions, item('a'), COMMAND))).toEqual([
        'leaf:0:A',
        'group:1:B',
        'leaf:2:C',
        'leaf:3:D',
        'leaf:4:E',
        'group:5:F|G',
        'leaf:6:H',
      ]);
    });

    it('defaults a group trigger to more_vert, even next to a suffix icon, and keeps every consumer override', () => {
      const children = [{ title: 'Rename', click: noop }];
      const [plain, styled, suffixed] = sdFileExplorerResolveActions<SdFileExplorerItem>(
        [
          { tooltip: 'More', children },
          {
            title: 'Tools',
            tooltip: 'Tools for this file',
            prefixIcon: 'folder',
            suffixIcon: 'expand_more',
            fontSet: 'material-icons-outlined',
            color: 'primary',
            type: 'outline',
            children,
          },
          { tooltip: 'More', suffixIcon: 'arrow_drop_down', children },
        ],
        item('a'),
        COMMAND
      );
      expect(plain).toEqual(
        jasmine.objectContaining({ kind: 'group', prefixIcon: 'more_vert', tooltip: 'More', type: 'text', color: 'secondary' })
      );
      expect(styled).toEqual(
        jasmine.objectContaining({
          title: 'Tools',
          tooltip: 'Tools for this file',
          prefixIcon: 'folder',
          suffixIcon: 'expand_more',
          fontSet: 'material-icons-outlined',
          color: 'primary',
          type: 'outline',
        })
      );
      expect(suffixed).toEqual(jasmine.objectContaining({ prefixIcon: 'more_vert', suffixIcon: 'arrow_drop_down' }));
    });

    it('defaults the variant by kind — leaves and group triggers apart — fills only unset type and color, and keeps menu items neutral', () => {
      const [tools, copy, move, remove, archive] = sdFileExplorerResolveActions<readonly SdFileExplorerItem[]>(
        [
          {
            title: 'Tools',
            children: [
              { title: 'Share', click: noop },
              { title: 'Erase', color: 'error', click: noop },
            ],
          },
          { tooltip: 'Copy names', prefixIcon: 'content_copy', click: noop },
          { title: 'Move', click: noop },
          { title: 'Delete', type: 'fill', color: 'error', click: noop },
          { title: 'Archive', type: 'outline', color: 'warning', children: [{ title: 'Archive now', click: noop }] },
        ],
        [item('a')],
        { leafType: 'light', groupType: 'text', color: 'primary' }
      );
      // A group declared first and an icon-only leaf: the kind decides, not the position or the title.
      expect(tools).toEqual(jasmine.objectContaining({ kind: 'group', type: 'text', color: 'primary' }));
      expect(copy).toEqual(jasmine.objectContaining({ kind: 'leaf', type: 'light', color: 'primary' }));
      expect(move).toEqual(jasmine.objectContaining({ kind: 'leaf', type: 'light', color: 'primary', prefixIcon: undefined }));
      expect(remove).toEqual(jasmine.objectContaining({ kind: 'leaf', type: 'fill', color: 'error' }));
      expect(archive).toEqual(jasmine.objectContaining({ kind: 'group', type: 'outline', color: 'warning' }));
      expect(tools.kind === 'group' && tools.children.map(child => child.color)).toEqual([undefined, 'error']);
    });

    it('evaluates hidden, disabled and loading with the exact context, statically or per call', () => {
      const target = item('report');
      const hidden = jasmine.createSpy('hidden').and.returnValue(false);
      const disabled = jasmine.createSpy('disabled').and.returnValue(true);
      const loading = jasmine.createSpy('loading').and.returnValue(true);
      const resolved = sdFileExplorerResolveActions<SdFileExplorerItem>(
        [
          { title: 'Shown', hidden, disabled, loading, click: noop },
          { title: 'Gone', hidden: true, click: noop },
          { title: 'Gone too', hidden: entry => entry.id === 'report', click: noop },
          { title: 'Static', disabled: true, loading: false, click: noop },
        ],
        target,
        COMMAND
      );
      expect(outline(resolved)).toEqual(['leaf:0:Shown', 'leaf:3:Static']);
      expect(resolved[0]).toEqual(jasmine.objectContaining({ disabled: true, loading: true }));
      expect(resolved[1]).toEqual(jasmine.objectContaining({ disabled: true, loading: false }));
      for (const spy of [hidden, disabled, loading]) expect(spy.calls.mostRecent().args[0]).toBe(target);
    });

    it('drops groups whose children are all hidden or missing, but keeps a group whose children are all disabled', () => {
      const resolved = sdFileExplorerResolveActions<SdFileExplorerItem>(
        [
          { title: 'Empty', children: [] },
          { title: 'All hidden', children: [{ title: 'X', hidden: true, click: noop }] },
          { title: 'Locked', children: [{ title: 'Delete', disabled: true, click: noop }] },
          { title: 'Hidden parent', hidden: true, children: [{ title: 'Y', click: noop }] },
        ],
        item('a'),
        COMMAND
      );
      expect(outline(resolved)).toEqual(['group:2:Delete']);
      expect(resolved[0].kind === 'group' && resolved[0].children[0].disabled).toBeTrue();
    });

    it('turns a loading menu item into a disabled item that still reports loading', () => {
      const [group] = sdFileExplorerResolveActions<SdFileExplorerItem>(
        [
          {
            title: 'More',
            children: [
              { title: 'Delete', loading: entry => entry.id === 'a', click: noop },
              { title: 'Share', click: noop },
            ],
          },
        ],
        item('a'),
        COMMAND
      );
      expect(group.kind === 'group' && group.children.map(child => [child.label, child.disabled, child.loading])).toEqual([
        ['Delete', true, true],
        ['Share', false, false],
      ]);
    });

    it('labels menu items with their title, falling back to the tooltip without repeating it as a tooltip', () => {
      const [group] = sdFileExplorerResolveActions<SdFileExplorerItem>(
        [
          {
            title: 'More',
            children: [
              { tooltip: 'Copy link', prefixIcon: 'link', click: noop },
              { title: 'Rename', tooltip: 'Rename the file', click: noop },
            ],
          },
        ],
        item('a'),
        COMMAND
      );
      expect(group.kind === 'group' && group.children.map(child => [child.label, child.tooltip])).toEqual([
        ['Copy link', undefined],
        ['Rename', 'Rename the file'],
      ]);
    });

    it('ignores definitions it cannot render, warning once per definition in dev mode', () => {
      const warn = spyOn(console, 'warn');
      const leaf = { title: 'Rename', click: noop };
      const actions = [
        { prefixIcon: 'download', click: noop },
        { title: 'Tools', children: [{ title: 'Nested', children: [leaf] }, leaf, { prefixIcon: 'x', click: noop }] },
        { title: 'Both', click: noop, children: [leaf] },
        { title: 'Nothing' },
        { title: '   ', tooltip: '', click: noop },
        'download',
        null,
        { title: 'Kept', click: noop },
      ] as unknown as SdFileExplorerCommand[];

      expect(outline(sdFileExplorerResolveActions(actions, item('a'), COMMAND, 'fileCommands'))).toEqual(['group:1:Rename', 'leaf:7:Kept']);
      // Unnamed leaf, nested group, unnamed child, click + children, neither, blank name, a string and null.
      expect(warn).toHaveBeenCalledTimes(8);
      expect(warn.calls.allArgs().every(([message]) => String(message).startsWith('[sd-file-explorer] fileCommands'))).toBeTrue();

      sdFileExplorerResolveActions(actions, item('b'), COMMAND, 'fileCommands');
      expect(warn).toHaveBeenCalledTimes(8);
    });

    it('returns nothing for a missing collection', () => {
      expect(sdFileExplorerResolveActions(undefined, item('a'), COMMAND)).toEqual([]);
      expect(sdFileExplorerResolveActions(null, item('a'), COMMAND)).toEqual([]);
    });
  });

  describe('sdFileExplorerActionBlocked', () => {
    it('re-evaluates hidden, disabled and loading against the current context on every call', () => {
      let busy = false;
      const target = item('a');
      const action: SdFileExplorerCommand = { title: 'Delete', loading: () => busy, click: noop };
      expect(sdFileExplorerActionBlocked(action, target)).toBeFalse();
      busy = true;
      expect(sdFileExplorerActionBlocked(action, target)).toBeTrue();
      expect(sdFileExplorerActionBlocked({ title: 'Hidden', hidden: entry => entry.id === 'a', click: noop }, target)).toBeTrue();
      expect(sdFileExplorerActionBlocked({ title: 'Off', disabled: true, click: noop }, target)).toBeTrue();
    });
  });

  describe('sdFileExplorerSheetEntries', () => {
    const resolve = (actions: SdFileExplorerCommand[]) =>
      sdFileExplorerResolveActions(actions, item('a'), SD_FILE_EXPLORER_COMMAND_DEFAULTS, 'fileCommands');

    it('turns resolved commands into labelled drawer entries in the same order, keeping only declared colors and icons', () => {
      const copy: SdFileExplorerCommand = { tooltip: 'Copy link', prefixIcon: 'link', type: 'outline', color: 'success', click: noop };
      const rename = {
        title: 'Rename',
        prefixIcon: 'edit',
        suffixIcon: 'chevron_right',
        fontSet: 'material-icons-outlined' as const,
        click: noop,
      };
      const remove = { title: 'Delete', tooltip: 'Delete for good', color: 'error' as const, click: noop };
      const more: SdFileExplorerCommand = {
        tooltip: 'More',
        prefixIcon: 'share',
        fontSet: 'material-icons-outlined',
        color: 'primary',
        children: [rename, remove, { title: 'Ghost', hidden: true, click: noop }],
      };
      const entries = sdFileExplorerSheetEntries(resolve([copy, { title: 'Gone', hidden: true, click: noop }, more]));

      expect(entries.map(entry => `${entry.kind}:${entry.key}:${entry.label}`)).toEqual(['leaf:0:Copy link', 'group:2:More']);
      const [leaf, group] = entries;
      // The drawer has no button variants: `type` is gone, the declared color stays for the icons.
      expect(leaf).toEqual(
        jasmine.objectContaining({ prefixIcon: 'link', color: 'success', disabled: false, loading: false, definition: copy })
      );
      expect(Object.keys(leaf)).not.toContain('type');
      if (group.kind !== 'group') throw new Error('expected a group');
      // A section heading is text only: neither the group's declared icon (it would repeat a child's) nor the desktop
      // more_vert face, and no color of its own. The desktop trigger keeps them: the definition is untouched.
      for (const key of ['prefixIcon', 'suffixIcon', 'fontSet', 'color']) expect(Object.keys(group)).withContext(key).not.toContain(key);
      expect(group.definition).toBe(more);
      expect(more.prefixIcon).toBe('share');
      expect(group.children.map(child => `${child.key}:${child.label}`)).toEqual(['0:Rename', '1:Delete']);
      expect(group.children[0]).toEqual(
        jasmine.objectContaining({ prefixIcon: 'edit', suffixIcon: 'chevron_right', fontSet: 'material-icons-outlined', color: undefined })
      );
      expect(group.children[1]).toEqual(jasmine.objectContaining({ color: 'error', definition: remove }));
    });

    it('disables loading entries and every child of a disabled or loading group', () => {
      const entries = sdFileExplorerSheetEntries(
        resolve([
          { title: 'Sync', loading: true, click: noop },
          { title: 'Locked', disabled: true, children: [{ title: 'Lock', click: noop }] },
          { title: 'Busy', loading: true, children: [{ title: 'Share', click: noop }] },
          {
            title: 'Tools',
            children: [
              { title: 'Zip', loading: true, click: noop },
              { title: 'Copy', click: noop },
            ],
          },
        ])
      );
      const states = entries.map(entry =>
        entry.kind === 'leaf'
          ? `${entry.label}:${entry.disabled}:${entry.loading}`
          : `${entry.label}[${entry.children.map(child => `${child.label}:${child.disabled}:${child.loading}`).join(',')}]`
      );
      expect(states).toEqual([
        'Sync:true:true',
        'Locked[Lock:true:false]',
        'Busy[Share:true:false]',
        'Tools[Zip:true:true,Copy:false:false]',
      ]);
    });

    it('renames entries by declared index when keys are given', () => {
      const entries = sdFileExplorerSheetEntries(
        resolve([
          { title: 'Share', click: noop },
          { title: 'Download', click: noop },
        ]),
        ['share', 'download']
      );
      expect(entries.map(entry => entry.key)).toEqual(['share', 'download']);
    });
  });

  describe('sdFileExplorerActionsBusy', () => {
    it('reports a loading entry or a loading menu item, which the compact trigger shows', () => {
      const busy = (actions: SdFileExplorerCommand[]) =>
        sdFileExplorerActionsBusy(sdFileExplorerResolveActions(actions, item('a'), SD_FILE_EXPLORER_COMMAND_DEFAULTS));
      expect(busy([{ title: 'A', click: noop }])).toBeFalse();
      expect(busy([{ title: 'A', loading: true, click: noop }])).toBeTrue();
      expect(busy([{ title: 'Tools', children: [{ title: 'Zip', loading: true, click: noop }] }])).toBeTrue();
      expect(busy([{ title: 'Hidden', hidden: true, loading: true, click: noop }])).toBeFalse();
      expect(busy([])).toBeFalse();
    });
  });
});
