import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { SdDocumentBuilder } from './document-builder.component';

// ---------------------------------------------------------------------------
// CKEditor stub
//
// Spec này CHỈ kiểm tra vòng đời timer của component — không kiểm tra CKEditor.
// Vì vậy editor được stub tối thiểu: đủ bề mặt cho onReady() + heading.all() +
// heading.scroll() chạy, và mọi lần chạm vào editor đều đếm được.
// Template KHÔNG bao giờ được render (không gọi fixture.detectChanges()) nên
// <ckeditor> thật không bị khởi tạo trong Karma.
// ---------------------------------------------------------------------------

interface FakeEditor {
  model: {
    change: jasmine.Spy;
    markers: { get: jasmine.Spy };
    document: { getRoot: jasmine.Spy; selection: { on: jasmine.Spy }; on: jasmine.Spy };
    createRangeIn: jasmine.Spy;
  };
  editing: { mapper: { toViewElement: jasmine.Spy }; view: { domConverter: { viewToDom: jasmine.Spy } } };
  plugins: { get: jasmine.Spy };
  keystrokes: { set: jasmine.Spy };
  enableReadOnlyMode: jasmine.Spy;
  disableReadOnlyMode: jasmine.Spy;
  ui: { view: { editable: { element: HTMLElement | null } } };
  editableReads: number;
}

/** Một heading model element giả: `heading1` với 1 text node con. */
function fakeHeadingElement() {
  return {
    is: (type: string) => type === 'element',
    name: 'heading1',
    getChildren: () => [{ is: (type: string) => type === '$text', data: 'Tiêu đề mẫu' }],
  };
}

function makeFakeEditor(): FakeEditor {
  const writer = {
    removeMarker: jasmine.createSpy('writer.removeMarker'),
    createRangeOn: jasmine.createSpy('writer.createRangeOn').and.returnValue({}),
    addMarker: jasmine.createSpy('writer.addMarker'),
  };

  const editor = {
    model: {
      change: jasmine.createSpy('model.change').and.callFake((callback: (w: unknown) => void) => callback(writer)),
      markers: { get: jasmine.createSpy('markers.get').and.returnValue(undefined) },
      document: {
        getRoot: jasmine.createSpy('document.getRoot').and.returnValue({}),
        selection: { on: jasmine.createSpy('selection.on') },
        on: jasmine.createSpy('document.on'),
      },
      createRangeIn: jasmine.createSpy('createRangeIn').and.returnValue({ getItems: () => [fakeHeadingElement()] }),
    },
    editing: {
      mapper: { toViewElement: jasmine.createSpy('toViewElement').and.returnValue(null) },
      view: { domConverter: { viewToDom: jasmine.createSpy('viewToDom').and.returnValue(null) } },
    },
    // Không có plugin nào → component đi nhánh try/catch và bỏ qua, đúng như khi plugin vắng mặt.
    plugins: { get: jasmine.createSpy('plugins.get').and.returnValue(undefined) },
    keystrokes: { set: jasmine.createSpy('keystrokes.set') },
    enableReadOnlyMode: jasmine.createSpy('enableReadOnlyMode'),
    disableReadOnlyMode: jasmine.createSpy('disableReadOnlyMode'),
    editableReads: 0,
  } as unknown as FakeEditor;

  // scrollToTop() đọc ui.view.editable → getter đếm số lần callback thật sự chạy.
  Object.defineProperty(editor, 'ui', {
    get() {
      return {
        view: {
          get editable() {
            editor.editableReads++;
            return { element: null };
          },
        },
      };
    },
  });

  return editor;
}

describe('SdDocumentBuilder — timer teardown', () => {
  let fixture: ComponentFixture<SdDocumentBuilder>;
  let component: SdDocumentBuilder;
  let editor: FakeEditor;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SdDocumentBuilder] });

    fixture = TestBed.createComponent(SdDocumentBuilder);
    fixture.componentRef.setInput('option', {});
    component = fixture.componentInstance;
    component.ngOnInit();

    editor = makeFakeEditor();
    component.onReady(editor as never);
  });

  function scrollToFirstHeading(): void {
    const headings = component.heading.all();
    expect(headings.length).toBe(1);
    component.heading.scroll(headings[0].id);
  }

  // -------------------------------------------------------------------------
  // Guard: timer PHẢI chạy khi component còn sống — nếu không, spec teardown vô nghĩa
  // -------------------------------------------------------------------------

  it('clears the heading highlight marker 5s later while the component is alive', fakeAsync(() => {
    scrollToFirstHeading();
    const callsBefore = editor.model.change.calls.count();

    tick(5000);

    expect(editor.model.change.calls.count()).toBe(callsBefore + 1);
  }));

  it('runs the scrollToTop timer while the component is alive', fakeAsync(() => {
    component.scrollToTop();

    tick(100);

    expect(editor.editableReads).toBe(1);
  }));

  // -------------------------------------------------------------------------
  // Teardown: timer KHÔNG được chạm vào editor sau khi component destroy
  // -------------------------------------------------------------------------

  it('does not touch a torn-down editor when the 5s heading marker timer expires after destroy', fakeAsync(() => {
    scrollToFirstHeading();
    const callsBefore = editor.model.change.calls.count();

    fixture.destroy();
    tick(5000);

    // Timer chỉ được clear trong scroll(); không clear ở ngOnDestroy thì callback này gọi
    // model.change() trên instance CKEditor đã bị tháo.
    expect(editor.model.change.calls.count()).toBe(callsBefore);
  }));

  it('does not touch a torn-down editor when the scrollToTop timer expires after destroy', fakeAsync(() => {
    component.scrollToTop();

    fixture.destroy();
    tick(100);

    expect(editor.editableReads).toBe(0);
  }));

  it('drops the heading timer even when scroll() is called repeatedly before destroy', fakeAsync(() => {
    scrollToFirstHeading();
    scrollToFirstHeading();
    const callsBefore = editor.model.change.calls.count();

    fixture.destroy();
    tick(5000);

    expect(editor.model.change.calls.count()).toBe(callsBefore);
  }));

  it('does not throw when destroyed with no timer pending', () => {
    expect(() => fixture.destroy()).not.toThrow();
  });
});
