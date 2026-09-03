import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { provideSdApiContract } from '../api-contract.configuration';
import { SD_API_CONTRACT_SAMPLE_ENVIRONMENT } from '../api-contract.samples';
import type { SdApiContractStructuralNode } from '../api-contract.schema';
import { SdApiContractNodeDrawer, type SdApiContractNodeCommit } from './api-contract-node-drawer.component';

/** Typed window onto the protected surface — the specs drive behaviour, not private state. */
interface DrawerInternals {
  draftName(): string;
  current(): SdApiContractStructuralNode | null;
  dirty(): boolean;
  canSave(): boolean;
  nameError(): string | null;
  discardPrompt(): boolean;
  title(): string;
  setName(value: unknown): void;
  applyCurrent(node: SdApiContractStructuralNode): void;
  save(): void;
  requestCancel(): void;
  confirmDiscard(): void;
  guardClose(): boolean;
  currentName(): string;
  breadcrumb(): readonly string[];
  children(): readonly { key: string; node: SdApiContractStructuralNode }[];
  siblingNames(): readonly string[];
  enter(key: string): void;
  backTo(depth: number): void;
  addChild(): void;
  removeChild(key: string): void;
}

describe('SdApiContractNodeDrawer', () => {
  let fixture: ComponentFixture<SdApiContractNodeDrawer>;
  let component: SdApiContractNodeDrawer;
  let internals: DrawerInternals;
  let commits: SdApiContractNodeCommit[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdApiContractNodeDrawer, NoopAnimationsModule],
      providers: [provideSdApiContract(SD_API_CONTRACT_SAMPLE_ENVIRONMENT)],
    }).compileComponents();

    fixture = TestBed.createComponent(SdApiContractNodeDrawer);
    component = fixture.componentInstance;
    internals = component as unknown as DrawerInternals;
    commits = [];
    component.nodeCommit.subscribe(commit => commits.push(commit));
    fixture.componentRef.setInput('autoId', 'acb-drawer');
    fixture.detectChanges();
  });

  function openForEdit(name: string, node: SdApiContractStructuralNode, siblings: readonly string[] = []): void {
    component.openForEdit(name, node, siblings);
    fixture.detectChanges();
  }

  function openForAdd(siblings: readonly string[] = []): void {
    component.openForAdd(siblings);
    fixture.detectChanges();
  }

  describe('opening', () => {
    it('opens for add with a blank node and commits nothing yet', () => {
      openForAdd();

      expect(internals.draftName()).toBe('');
      expect(internals.current()).not.toBeNull();
      expect(commits.length).toBe(0);
    });

    it('opens for edit seeded with the current name and node', () => {
      openForEdit('keyword', { type: 'string', source: '${input.keyword}', label: 'Từ khoá' });

      expect(internals.draftName()).toBe('keyword');
      expect(internals.current()?.source).toBe('${input.keyword}');
      expect(internals.current()?.label).toBe('Từ khoá');
      expect(commits.length).toBe(0);
    });

    it('edits a deep copy, so touching the draft never reaches the node it was seeded from', () => {
      // why: đây là lý do tồn tại của drawer. Nếu draft trỏ vào chính object của cha thì "Huỷ" không
      // huỷ được gì, và cây ngoài drawer đổi theo từng ký tự.
      const seed: SdApiContractStructuralNode = { type: 'string', label: 'Từ khoá' };
      openForEdit('keyword', seed);

      internals.applyCurrent({ type: 'string', label: 'ĐỔI RỒI' });

      expect(seed.label).toBe('Từ khoá');
      expect(internals.current()?.label).toBe('ĐỔI RỒI');
    });

    it('titles itself by whether it is adding or editing', () => {
      openForAdd();
      const addTitle = internals.title();

      openForEdit('keyword', { type: 'string' });

      expect(internals.title()).not.toBe(addTitle);
    });
  });

  describe('chốt sổ', () => {
    it('emits exactly one commit carrying the staged name and node', () => {
      openForEdit('keyword', { type: 'string' });
      internals.setName('searchTerm');
      internals.applyCurrent({ type: 'string', source: '${input.keyword}' });

      internals.save();

      expect(commits.length).toBe(1);
      expect(commits[0].name).toBe('searchTerm');
      expect(commits[0].node.source).toBe('${input.keyword}');
    });

    it('emits nothing while the draft is only being edited', () => {
      openForEdit('keyword', { type: 'string' });

      internals.setName('a');
      internals.setName('ab');
      internals.applyCurrent({ type: 'number' });

      expect(commits.length).toBe(0);
    });

    it('tracks dirty against the seed, not against emptiness', () => {
      openForEdit('keyword', { type: 'string', label: 'Từ khoá' });
      expect(internals.dirty()).toBeFalse();

      internals.setName('searchTerm');
      expect(internals.dirty()).toBeTrue();

      internals.setName('keyword');
      expect(internals.dirty()).toBeFalse();
    });
  });

  describe('đóng khi còn thay đổi chưa lưu', () => {
    it('lets a clean drawer close straight away', () => {
      openForEdit('keyword', { type: 'string' });

      expect(internals.guardClose()).toBeTrue();
      expect(internals.discardPrompt()).toBeFalse();
    });

    it('blocks the close and asks instead, leaving nothing committed', () => {
      openForEdit('keyword', { type: 'string' });
      internals.setName('searchTerm');

      expect(internals.guardClose()).toBeFalse();
      expect(internals.discardPrompt()).toBeTrue();
      expect(commits.length).toBe(0);
    });

    it('discards without committing when the prompt is confirmed', () => {
      openForEdit('keyword', { type: 'string' });
      internals.setName('searchTerm');
      internals.requestCancel();

      internals.confirmDiscard();

      expect(commits.length).toBe(0);
    });

    it('does not ask on the way out of a successful save', () => {
      // why: Save là chủ ý rõ ràng — hỏi lại "bỏ thay đổi?" ngay sau khi vừa bấm Lưu là vô nghĩa.
      openForEdit('keyword', { type: 'string' });
      internals.setName('searchTerm');

      internals.save();

      expect(internals.discardPrompt()).toBeFalse();
      expect(commits.length).toBe(1);
    });
  });

  describe('cổng chặn Save', () => {
    it('blocks an empty name and says why', () => {
      openForAdd();

      expect(internals.canSave()).toBeFalse();
      expect(internals.nameError()).not.toBeNull();

      internals.save();
      expect(commits.length).toBe(0);
    });

    it('blocks a name that collides with a sibling', () => {
      openForAdd(['keyword', 'page']);
      internals.setName('page');

      expect(internals.canSave()).toBeFalse();
      expect(internals.nameError()).not.toBeNull();

      internals.save();
      expect(commits.length).toBe(0);
    });

    it('does not call the node its own duplicate when editing it in place', () => {
      // why: sửa `keyword` mà vẫn để tên `keyword` thì nó trùng với CHÍNH NÓ trong danh sách sibling.
      openForEdit('keyword', { type: 'string' }, ['keyword', 'page']);

      expect(internals.nameError()).toBeNull();
      expect(internals.canSave()).toBeTrue();
    });

    it('allows a name that only collides after trimming nothing else', () => {
      openForAdd(['keyword']);
      internals.setName('keyword2');

      expect(internals.canSave()).toBeTrue();
    });

    it('lets a contract-level problem through, because diagnostics own that', () => {
      // why: `${input.khongTonTai}` là lỗi của CONTRACT, không phải của node. Chặn Save ở đây sẽ cấm
      // khai báo tạm khi input schema chưa dựng xong.
      openForEdit('keyword', { type: 'string' });
      internals.applyCurrent({ type: 'string', source: '${input.khongTonTai}' });

      expect(internals.canSave()).toBeTrue();

      internals.save();
      expect(commits.length).toBe(1);
      expect(commits[0].node.source).toBe('${input.khongTonTai}');
    });
  });
  describe('drill-down bên trong cùng một drawer', () => {
    /** Một object hai cấp, đủ để phân biệt "cùng drawer" với "drawer thứ hai". */
    function nested(): SdApiContractStructuralNode {
      return {
        type: 'object',
        properties: {
          mau: { type: 'string' },
          kichCo: {
            type: 'object',
            properties: { rong: { type: 'number' }, cao: { type: 'number' } },
          },
        },
      };
    }

    it('lists the children of an object instead of hiding them', () => {
      openForEdit('boLoc', nested());

      expect(internals.children().map(child => child.key)).toEqual(['mau', 'kichCo']);
    });

    it('drills into a child inside the SAME drawer, never a second one', () => {
      // why: drawer lồng drawer là thứ spec loại bỏ thẳng — hai lớp backdrop và hai footer Lưu là hai
      // nguồn sự thật cho cùng một draft.
      openForEdit('boLoc', nested());

      internals.enter('kichCo');
      fixture.detectChanges();

      expect(internals.currentName()).toBe('kichCo');
      expect(internals.children().map(child => child.key)).toEqual(['rong', 'cao']);
      expect((fixture.nativeElement as HTMLElement).querySelectorAll('sd-side-drawer').length).toBe(1);
    });

    it('builds a breadcrumb from the root down to where the author is', () => {
      openForEdit('boLoc', nested());
      expect(internals.breadcrumb()).toEqual(['boLoc']);

      internals.enter('kichCo');
      expect(internals.breadcrumb()).toEqual(['boLoc', 'kichCo']);
    });

    it('walks back up through the breadcrumb', () => {
      openForEdit('boLoc', nested());
      internals.enter('kichCo');

      internals.backTo(0);

      expect(internals.currentName()).toBe('boLoc');
      expect(internals.children().map(child => child.key)).toEqual(['mau', 'kichCo']);
    });

    it('commits the WHOLE subtree from one Save at the outermost level', () => {
      // why: một lần chốt sổ, không phải chốt từng cấp. Sửa sâu ba cấp rồi Lưu một lần là đúng ý
      // "chốt sổ"; commit từng cấp sẽ phát nhiều modelChange cho một hành động của người dùng.
      openForEdit('boLoc', nested());
      internals.enter('kichCo');
      internals.enter('rong');
      internals.applyCurrent({ type: 'number', label: 'Chiều rộng' });
      internals.backTo(0);

      internals.save();

      expect(commits.length).toBe(1);
      const committed = commits[0].node.properties?.['kichCo']?.properties?.['rong'];
      expect(committed?.label).toBe('Chiều rộng');
      expect(commits[0].name).toBe('boLoc');
    });

    it('renames a nested child through the name field, keeping the author where they are', () => {
      openForEdit('boLoc', nested());
      internals.enter('mau');

      internals.setName('mauSac');
      fixture.detectChanges();

      expect(internals.currentName()).toBe('mauSac');
      internals.save();
      expect(Object.keys(commits[0].node.properties ?? {})).toEqual(['mauSac', 'kichCo']);
    });

    it('reads siblings from the level the author is on, not from the root', () => {
      openForEdit('boLoc', nested(), ['boLoc', 'sapXep']);
      expect(internals.siblingNames()).toEqual(['boLoc', 'sapXep']);

      internals.enter('kichCo');
      expect(internals.siblingNames()).toEqual(['mau', 'kichCo']);
    });

    it('blocks a nested rename that collides with a sibling on that level', () => {
      openForEdit('boLoc', nested());
      internals.enter('mau');

      internals.setName('kichCo');

      expect(internals.canSave()).toBeFalse();
      expect(internals.nameError()).not.toBeNull();
    });

    it('adds a child to an object, because a flat outer list cannot reach nested fields', () => {
      // why: danh sách ngoài drawer chỉ hiện con TRỰC TIẾP của layer. Không có nút thêm ở đây thì
      // object lồng nhau vĩnh viễn không thêm được trường — tính năng vỡ, không phải thiếu tiện nghi.
      openForEdit('boLoc', { type: 'object', properties: {} });

      internals.addChild();

      expect(internals.children().length).toBe(1);
      expect(commits.length).toBe(0);
    });

    it('removes a child from an object', () => {
      openForEdit('boLoc', nested());

      internals.removeChild('mau');

      expect(internals.children().map(child => child.key)).toEqual(['kichCo']);
      expect(commits.length).toBe(0);
    });

    it('counts a nested edit as dirty, so closing still guards it', () => {
      openForEdit('boLoc', nested());
      internals.enter('mau');
      internals.applyCurrent({ type: 'string', label: 'Màu' });

      expect(internals.dirty()).toBeTrue();
      expect(internals.guardClose()).toBeFalse();
    });

    it('resets the path when the drawer is re-seeded', () => {
      openForEdit('boLoc', nested());
      internals.enter('kichCo');

      openForEdit('khac', { type: 'string' });

      expect(internals.breadcrumb()).toEqual(['khac']);
      expect(internals.currentName()).toBe('khac');
    });
  });
});
