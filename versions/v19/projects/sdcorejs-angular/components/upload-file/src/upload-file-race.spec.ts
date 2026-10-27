import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdNotifyService } from '@sdcorejs/angular/services';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { SD_UPLOAD_FILE_CONFIGURATION, SdUploadFileDetail } from './configurations';
import { UploadFileService } from './services';
import { SdUploadFile } from './upload-file.component';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const detail = (idOrKey: string): SdUploadFileDetail => ({ idOrKey, cdn: IMAGE, name: idOrKey + '.png' });
const makeFile = (name = 'B.png') => new File(['synthetic image'], name, { type: 'image/png', lastModified: 1 });

describe('SdUploadFile asynchronous model consistency', () => {
  let fixture: ComponentFixture<SdUploadFile>;
  let component: SdUploadFile;
  let cache: UploadFileService;
  let requests: { keys: (string | number)[]; response: ReturnType<typeof deferred<SdUploadFileDetail[]>> }[];
  let details: jasmine.Spy;
  let upload: jasmine.Spy;
  let notify: jasmine.Spy;
  let changed: jasmine.Spy;
  let readers: FileReader[];
  let configuredUpload: jasmine.Spy;

  beforeEach(() => {
    configuredUpload = jasmine.createSpy('configured upload').and.resolveTo(['configured-id']);
    TestBed.configureTestingModule({
      imports: [SdUploadFile, NoopAnimationsModule],
      providers: [
        {
          provide: SD_UPLOAD_FILE_CONFIGURATION,
          useValue: [{ key: 'configured', upload: configuredUpload, details: () => Promise.resolve([]) }],
        },
      ],
    });
    fixture = TestBed.createComponent(SdUploadFile);
    component = fixture.componentInstance;
    cache = TestBed.inject(UploadFileService);
    requests = [];
    readers = [];
    details = jasmine.createSpy('details').and.callFake((keys: (string | number)[]) => {
      const response = deferred<SdUploadFileDetail[]>();
      requests.push({ keys: [...keys], response });
      return response.promise;
    });
    upload = jasmine.createSpy('upload').and.resolveTo(['B']);
    notify = spyOn(TestBed.inject(SdNotifyService), 'error');
    changed = jasmine.createSpy('filesChanged');
    component.filesChanged.subscribe(changed);
    fixture.componentRef.setInput('details', details);
    fixture.componentRef.setInput('upload', upload);
    fixture.componentRef.setInput('type', 'image');
    // why: điều khiển FileReader riêng để test không phụ thuộc timing I/O của browser.
    spyOn(FileReader.prototype, 'readAsDataURL').and.callFake(function (this: FileReader) {
      readers.push(this);
    });
  });

  function render() {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }

  function setModel(keys: (string | number)[]) {
    component.model.set(keys);
    render();
  }

  function answer(index: number, keys: string[]) {
    requests[index].response.resolve(keys.map(detail));
    render();
  }

  function previewKeys() {
    return component.previewFiles().map(file => file.idOrKey ?? file.file?.name);
  }

  function addFile(file = makeFile()) {
    const hash = cache.add(file)!;
    setModel([...component.model(), hash]);
    return { hash, file };
  }

  for (const pendingDetails of [false, true]) {
    it(
      'uploads the same file in two controls after shared cache eviction, pending details: ' + pendingDetails,
      fakeAsync(() => {
        const secondFixture = TestBed.createComponent(SdUploadFile);
        const second = secondFixture.componentInstance;
        const secondUpload = jasmine.createSpy('second upload').and.resolveTo(['second-id']);
        secondFixture.componentRef.setInput('upload', secondUpload);
        secondFixture.componentRef.setInput('details', details);
        const firstFile = makeFile('shared.png');
        const secondFile = makeFile('shared.png');
        const hash = cache.add(firstFile)!;
        setModel([hash]);
        expect(cache.add(secondFile)).toBe(hash);
        second.model.set(pendingDetails ? ['server-id', hash] : [hash]);
        secondFixture.detectChanges();
        flushMicrotasks();
        expect(second.previewFiles().length).toBe(pendingDetails ? 0 : 1);

        component.upload();
        flushMicrotasks();
        expect(cache.get(hash)).toBeNull();
        second.upload();
        flushMicrotasks();

        expect(upload).toHaveBeenCalledOnceWith([firstFile], undefined);
        expect(secondUpload).toHaveBeenCalledOnceWith([secondFile], undefined);
        expect(second.model()).toEqual(pendingDetails ? ['server-id', 'second-id'] : ['second-id']);
        secondFixture.destroy();
      })
    );
  }

  it('retains each picked file before the model effect runs in either control', fakeAsync(() => {
    render();
    const secondFixture = TestBed.createComponent(SdUploadFile);
    const second = secondFixture.componentInstance;
    const secondUpload = jasmine.createSpy('second upload').and.resolveTo(['second-id']);
    secondFixture.componentRef.setInput('upload', secondUpload);
    secondFixture.detectChanges();
    flushMicrotasks();
    const file = makeFile('shared.png');
    spyOn(BrowserUtilities, 'upload').and.resolveTo(file);
    component.onUpload();
    second.onUpload();
    flushMicrotasks();
    expect(component.model()).toEqual(second.model());
    expect(second.model().length).toBe(1);
    expect(second.previewFiles()).toEqual([]);

    component.upload();
    flushMicrotasks();
    second.upload();
    flushMicrotasks();
    expect(secondUpload).toHaveBeenCalledOnceWith([file], undefined);
    expect(second.model()).toEqual(['second-id']);
    secondFixture.destroy();
  }));

  it('retains its local file for retry after another control evicts the shared key', fakeAsync(() => {
    const { hash, file } = addFile();
    cache.remove(hash);
    const error = new Error('retryable upload');
    upload.and.rejectWith(error);
    let failure: unknown;
    component.upload().catch(reason => (failure = reason));
    flushMicrotasks();
    expect(failure).toBe(error);
    expect(component.model()).toEqual([hash]);
    expect(cache.get(hash)).toBeNull();
    upload.and.resolveTo(['retried-id']);
    component.upload();
    flushMicrotasks();
    expect(upload.calls.allArgs()).toEqual([
      [[file], undefined],
      [[file], undefined],
    ]);
    expect(component.model()).toEqual(['retried-id']);
  }));

  it('retains earlier picked files while a later file is still validating', fakeAsync(() => {
    const { hash, file } = addFile(makeFile('shared.png'));
    const extra = makeFile('extra.png');
    const images: HTMLImageElement[] = [];
    spyOn(window, 'Image').and.callFake(function () {
      const img = { width: 1, height: 1, onload: null, src: '' } as unknown as HTMLImageElement;
      images.push(img);
      return img;
    });
    spyOn(URL, 'createObjectURL').and.returnValue('blob:synthetic-validation');
    spyOn(BrowserUtilities, 'upload').and.resolveTo([file, extra]);
    const secondFixture = TestBed.createComponent(SdUploadFile);
    const second = secondFixture.componentInstance;
    const secondUpload = jasmine.createSpy('second upload').and.resolveTo(['shared-id', 'extra-id']);
    secondFixture.componentRef.setInput('type', 'image');
    secondFixture.componentRef.setInput('imageValidator', () => null);
    secondFixture.componentRef.setInput('upload', secondUpload);
    secondFixture.componentRef.setInput('details', details);
    second.model.set(['existing-server']);
    secondFixture.detectChanges();
    flushMicrotasks();
    second.onUpload();
    flushMicrotasks();
    images[0].onload!.call(images[0], new Event('load'));
    flushMicrotasks();
    expect(images.length).toBe(2);
    expect(second.model()).toEqual(['existing-server']);
    // why: effect giữa hai lần validate không được làm mất File chưa commit vào model.
    secondFixture.componentRef.setInput('args', { revision: 2 });
    secondFixture.detectChanges();
    expect(details.calls.count()).toBe(2);
    expect(details.calls.mostRecent().args).toEqual([['existing-server'], { revision: 2 }]);
    component.upload();
    flushMicrotasks();
    expect(cache.get(hash)).toBeNull();
    images[1].onload!.call(images[1], new Event('load'));
    flushMicrotasks();
    second.upload();
    flushMicrotasks();
    expect(secondUpload).toHaveBeenCalledOnceWith([file, extra], { revision: 2 });
    expect(second.model()).toEqual(['existing-server', 'shared-id', 'extra-id']);
    secondFixture.destroy();
  }));

  for (const cleared of [[], null, 'invalid']) {
    it(
      'releases local ownership after observing cleared model: ' + JSON.stringify(cleared),
      fakeAsync(() => {
        const { hash } = addFile();
        cache.remove(hash);
        component.model.set(cleared as unknown as string[]);
        render();
        setModel([hash]);
        expect(requests[0].keys).toEqual([hash]);
        component.upload();
        flushMicrotasks();
        expect(upload).not.toHaveBeenCalled();
      })
    );
  }

  it('releases successful local ownership before the next model effect', fakeAsync(() => {
    const { hash } = addFile();
    component.upload();
    flushMicrotasks();
    expect(component.model()).toEqual(['B']);
    expect(cache.get(hash)).toBeNull();
    setModel([hash]);
    expect(requests[0].keys).toEqual([hash]);
    component.upload();
    flushMicrotasks();
    expect(upload).toHaveBeenCalledTimes(1);
  }));

  for (const oldLast of [true, false]) {
    it(
      'keeps the uploaded image when an old mixed refresh resolves ' + (oldLast ? 'last' : 'first'),
      fakeAsync(() => {
        setModel(['A']);
        answer(0, ['A']);
        const { hash, file } = addFile();
        answer(1, ['A']);
        expect(previewKeys()).toEqual(['A', file.name]);

        // Reorder starts another mixed refresh while the local file is already previewed.
        component.onDrop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<string[]>);
        render();
        expect(requests[2].keys).toEqual(['A']);
        component.upload();
        render();
        expect(upload).toHaveBeenCalledOnceWith([file], undefined);
        expect(cache.isHashedKey(hash)).toBeFalse();
        expect(component.model()).toEqual(['B', 'A']);
        expect(requests[3].keys).toEqual(['B', 'A']);

        if (oldLast) {
          answer(3, ['A', 'B']);
          const latest = component.previewFiles();
          const eventCount = changed.calls.count();
          answer(2, ['A']);
          expect(component.previewFiles()).toBe(latest);
          expect(changed.calls.count()).toBe(eventCount);
        } else {
          const eventCount = changed.calls.count();
          answer(2, ['A']);
          expect(changed.calls.count()).toBe(eventCount);
          answer(3, ['A', 'B']);
        }
        expect(component.model()).toEqual(['B', 'A']);
        expect(previewKeys()).toEqual(['B', 'A']);
        expect(changed.calls.mostRecent().args[0]).toEqual(['B', 'A']);
        expect(fixture.nativeElement.querySelectorAll('.c-area.c-view').length).toBe(2);
      })
    );
  }

  it('ignores an initial server request that resolves after a successful upload refresh', fakeAsync(() => {
    setModel(['A']);
    addFile();
    answer(1, ['A']);
    component.upload();
    render();
    answer(2, ['A', 'B']);
    answer(0, ['A']);
    expect(component.model()).toEqual(['A', 'B']);
    expect(previewKeys()).toEqual(['A', 'B']);
  }));

  it('uploads a picked file before its mixed preview has finished loading', fakeAsync(() => {
    setModel(['A']);
    answer(0, ['A']);
    const file = makeFile();
    spyOn(BrowserUtilities, 'upload').and.resolveTo(file);
    component.onUpload();
    render();
    const hash = component.model()[1] as string;
    expect(cache.get(hash)).toBe(file);
    expect(previewKeys()).toEqual(['A']);
    expect(requests[1].keys).toEqual(['A']);

    component.upload();
    render();
    expect(upload).toHaveBeenCalledOnceWith([file], undefined);
    expect(component.model()).toEqual(['A', 'B']);
    expect(cache.isHashedKey(hash)).toBeFalse();
    expect(requests[2].keys).toEqual(['A', 'B']);
    answer(2, ['A', 'B']);
    answer(1, ['A']);
    expect(previewKeys()).toEqual(['A', 'B']);
  }));

  it('retains the local file snapshot when its cache entry disappears during details loading', fakeAsync(() => {
    setModel(['A']);
    const { hash, file } = addFile();
    cache.remove(hash);
    answer(1, ['A']);
    expect(previewKeys()).toEqual(['A', file.name]);
    expect(component.previewFiles()[1]?.file).toBe(file);
    answer(0, ['A']);
    expect(previewKeys()).toEqual(['A', file.name]);
  }));

  it('does not restore files after the model is cleared', fakeAsync(() => {
    setModel(['A']);
    setModel([]);
    const eventCount = changed.calls.count();
    answer(0, ['A']);
    expect(component.model()).toEqual([]);
    expect(component.previewFiles()).toEqual([]);
    expect(changed.calls.count()).toBe(eventCount);
  }));

  it('ignores a response when the model changed before the next effect run', fakeAsync(() => {
    setModel(['A']);
    component.model.set(['B']);
    requests[0].response.resolve([detail('A')]);
    flushMicrotasks();
    expect(component.previewFiles()).toEqual([]);
    expect(changed).not.toHaveBeenCalled();
    render();
    answer(1, ['B']);
    expect(previewKeys()).toEqual(['B']);
  }));

  it('does not update state, emit, or start FileReader after destruction', fakeAsync(() => {
    setModel(['A']);
    addFile();
    const before = component.previewFiles();
    const emit = spyOn(component.filesChanged, 'emit');
    const warn = spyOn(console, 'warn');
    fixture.destroy();
    requests[1].response.resolve([detail('A')]);
    requests[0].response.resolve([detail('A')]);
    flushMicrotasks();
    expect(component.previewFiles()).toBe(before);
    expect(emit).not.toHaveBeenCalled();
    expect(readers).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  }));

  it('preserves server IDs and URLs when metadata is still pending or unavailable', fakeAsync(() => {
    const model = ['missing-id', 'https://example.invalid/image.png', 17];
    setModel(model);
    component.upload();
    flushMicrotasks();
    expect(upload).not.toHaveBeenCalled();
    expect(component.model()).toBe(model);
  }));

  it('keeps pending files when no upload handler is configured', fakeAsync(() => {
    fixture.componentRef.setInput('upload', undefined);
    const { hash, file } = addFile();
    component.upload();
    flushMicrotasks();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(component.model()).toEqual([hash]);
    expect(cache.get(hash)).toBe(file);
  }));

  it('ignores a superseded request for the same model after args change', fakeAsync(() => {
    fixture.componentRef.setInput('args', { scope: 'first' });
    setModel(['A']);
    fixture.componentRef.setInput('args', { scope: 'second' });
    render();
    expect(details.calls.argsFor(0)[1]).toEqual({ scope: 'first' });
    expect(details.calls.argsFor(1)[1]).toEqual({ scope: 'second' });
    requests[1].response.resolve([{ ...detail('A'), name: 'new-name.png' }]);
    render();
    const latest = component.previewFiles();
    const eventCount = changed.calls.count();
    answer(0, ['A']);
    expect(component.previewFiles()).toBe(latest);
    expect(component.previewFiles()[0].fileName).toBe('new-name.png');
    expect(changed.calls.count()).toBe(eventCount);
  }));

  it('ignores a stale rejection instead of erasing the newer preview', fakeAsync(() => {
    const error = new Error('old request failed');
    const logged = spyOn(console, 'error');
    setModel(['A']);
    setModel(['B']);
    answer(1, ['B']);
    const latest = component.previewFiles();
    const eventCount = changed.calls.count();
    requests[0].response.reject(error);
    render();
    expect(logged).toHaveBeenCalledWith(error);
    expect(component.previewFiles()).toBe(latest);
    expect(changed.calls.count()).toBe(eventCount);
  }));

  for (const synchronous of [false, true]) {
    it(
      'retains local previews when details ' + (synchronous ? 'throws synchronously' : 'rejects'),
      fakeAsync(() => {
        const error = new Error('metadata unavailable');
        const logged = spyOn(console, 'error');
        if (synchronous)
          details.and.callFake(() => {
            throw error;
          });
        const file = makeFile();
        const hash = cache.add(file)!;
        setModel(['A', hash]);
        if (!synchronous) {
          requests[0].response.reject(error);
          render();
        }
        expect(logged).toHaveBeenCalledWith(error);
        expect(previewKeys()).toEqual([file.name]);
        expect(component.previewFiles()[0].file).toBe(file);
        expect(component.model()).toEqual(['A', hash]);
        component.upload();
        render();
        expect(upload).toHaveBeenCalledOnceWith([file], undefined);
        expect(component.model()).toEqual(['A', 'B']);
      })
    );
  }

  for (const value of [null, undefined, 'invalid-model']) {
    it(
      'clears preview and ignores old results for model ' + String(value),
      fakeAsync(() => {
        setModel(['A']);
        component.model.set(value as unknown as string[]);
        render();
        answer(0, ['A']);
        expect(component.previewFiles()).toEqual([]);
        expect(component.model()).toBe(value as unknown as string[]);
        component.upload();
        flushMicrotasks();
        expect(upload).not.toHaveBeenCalled();
        expect(component.model()).toBe(value as unknown as string[]);
      })
    );
  }

  it('renders a local FileReader result without another model or filesChanged event', fakeAsync(() => {
    const { file } = addFile();
    expect(details).not.toHaveBeenCalled();
    expect(readers.length).toBe(1);
    const model = component.model();
    const eventCount = changed.calls.count();
    const reader = readers[0];
    reader.onload!.call(reader, { target: { result: IMAGE } } as ProgressEvent<FileReader>);
    render();
    expect(component.previewFiles()[0].file).toBe(file);
    expect(component.previewFiles()[0].previewSrc).toBe(IMAGE);
    expect(fixture.nativeElement.querySelector('img.c-img').getAttribute('src')).toBe(IMAGE);
    expect(component.model()).toBe(model);
    expect(changed.calls.count()).toBe(eventCount);
  }));

  for (const destroy of [false, true]) {
    it(
      'aborts pending FileReaders and ignores a queued load callback on ' + (destroy ? 'destroy' : 'supersession'),
      fakeAsync(() => {
        addFile();
        const reader = readers[0];
        const onload = reader.onload!;
        Object.defineProperty(reader, 'readyState', { configurable: true, value: FileReader.LOADING });
        const abort = spyOn(reader, 'abort');
        if (destroy) fixture.destroy();
        else setModel([]);
        const latest = component.previewFiles();
        const eventCount = changed.calls.count();
        expect(abort).toHaveBeenCalledTimes(1);
        expect(reader.onload).toBeNull();
        onload.call(reader, { target: { result: IMAGE } } as ProgressEvent<FileReader>);
        flushMicrotasks();
        expect(component.previewFiles()).toBe(latest);
        expect(changed.calls.count()).toBe(eventCount);
      })
    );
  }

  it('does not abort a completed FileReader when the model is replaced', fakeAsync(() => {
    addFile();
    const reader = readers[0];
    Object.defineProperty(reader, 'readyState', { configurable: true, value: FileReader.DONE });
    const abort = spyOn(reader, 'abort');
    setModel([]);
    expect(reader.onload).toBeNull();
    expect(abort).not.toHaveBeenCalled();
  }));

  it('does not apply a queued FileReader result before the next model effect', fakeAsync(() => {
    addFile();
    const before = component.previewFiles();
    component.model.set([]);
    readers[0].onload!.call(readers[0], { target: { result: IMAGE } } as ProgressEvent<FileReader>);
    expect(component.previewFiles()).toBe(before);
    expect(before[0].previewSrc).toBeNull();
    render();
    expect(component.previewFiles()).toEqual([]);
  }));

  for (const destroy of [false, true]) {
    it(
      'does not start readers when filesChanged synchronously ' + (destroy ? 'destroys the component' : 'changes the model'),
      fakeAsync(() => {
        component.filesChanged.subscribe(files => {
          if (files.length) {
            if (destroy) fixture.destroy();
            else component.model.set([]);
          }
        });
        const file = makeFile();
        component.model.set([cache.add(file)!]);
        fixture.detectChanges();
        flushMicrotasks();
        expect(readers).toEqual([]);
        if (!destroy) {
          render();
          expect(component.previewFiles()).toEqual([]);
        }
      })
    );
  }

  it('shares one pending upload across concurrent calls and does not re-upload a completed batch', fakeAsync(() => {
    const response = deferred<string[]>();
    upload.and.returnValue(response.promise);
    const { file } = addFile();
    const first = component.upload();
    const second = component.upload();
    expect(second).toBe(first);
    expect(upload).toHaveBeenCalledOnceWith([file], undefined);
    const settled = jasmine.createSpy('settled');
    first.then(settled);
    response.resolve(['B']);
    render();
    expect(settled).toHaveBeenCalledTimes(1);
    expect(component.model()).toEqual(['B']);
    component.upload();
    flushMicrotasks();
    expect(upload).toHaveBeenCalledTimes(1);
  }));

  for (const synchronous of [false, true]) {
    it(
      'propagates an upload ' + (synchronous ? 'throw' : 'rejection') + ' and allows retry without losing files',
      fakeAsync(() => {
        const error = new Error('upload failed');
        const response = deferred<string[]>();
        if (synchronous)
          upload.and.callFake(() => {
            throw error;
          });
        else upload.and.returnValue(response.promise);
        const { hash, file } = addFile();
        const model = component.model();
        const failure = jasmine.createSpy('failure');
        component.upload().catch(failure);
        if (!synchronous) response.reject(error);
        flushMicrotasks();
        expect(failure).toHaveBeenCalledOnceWith(error);
        expect(component.model()).toBe(model);
        expect(cache.get(hash)).toBe(file);
        expect(notify).not.toHaveBeenCalled();
        upload.and.resolveTo(['B']);
        component.upload();
        render();
        expect(upload).toHaveBeenCalledTimes(2);
        expect(component.model()).toEqual(['B']);
        expect(cache.get(hash)).toBeNull();
      })
    );
  }

  const invalidResults: { name: string; value: unknown }[] = [
    { name: 'null', value: null },
    { name: 'undefined', value: undefined },
    { name: 'non-array', value: 'B' },
    { name: 'too few IDs', value: [] },
    { name: 'too many IDs', value: ['B', 'C'] },
    { name: 'empty ID', value: [''] },
    { name: 'non-string ID', value: [17] },
    { name: 'sparse result', value: new Array(1) },
  ];
  for (const { name, value } of invalidResults) {
    it(
      'rejects ' + name + ' from upload without clearing the model or cache',
      fakeAsync(() => {
        upload.and.resolveTo(value);
        const { hash, file } = addFile();
        const model = component.model();
        const failure = jasmine.createSpy('failure');
        component.upload().catch(failure);
        flushMicrotasks();
        expect(failure).toHaveBeenCalledOnceWith(jasmine.any(Error));
        expect(failure.calls.mostRecent().args[0].message).toContain('one non-empty string ID per file');
        expect(component.model()).toBe(model);
        expect(cache.get(hash)).toBe(file);
      })
    );
  }

  it('maps IDs by local key while preserving removals, reordering and new files during upload', fakeAsync(() => {
    const response = deferred<string[]>();
    upload.and.returnValue(response.promise);
    setModel(['A']);
    const { hash } = addFile();
    const finished = jasmine.createSpy('finished');
    component.upload().then(finished);
    const fileC = makeFile('C.png');
    const hashC = cache.add(fileC)!;
    setModel([hashC, 'A']); // B removed, C added, order changed before upload completes.
    response.resolve(['B']);
    render();
    expect(finished).toHaveBeenCalledTimes(1);
    expect(component.model()).toEqual([hashC, 'A']);
    expect(cache.get(hash)).toBeNull();
    expect(cache.get(hashC)).toBe(fileC);
    expect(upload).toHaveBeenCalledTimes(1);
    upload.and.resolveTo(['C']);
    component.upload();
    render();
    expect(upload.calls.mostRecent().args[0]).toEqual([fileC]);
    expect(component.model()).toEqual(['C', 'A']);
    expect(cache.get(hashC)).toBeNull();
  }));

  it('preserves a clear while upload is pending instead of resurrecting uploaded files', fakeAsync(() => {
    const response = deferred<string[]>();
    upload.and.returnValue(response.promise);
    const { hash } = addFile();
    component.upload();
    setModel([]);
    response.resolve(['B']);
    render();
    expect(component.model()).toEqual([]);
    expect(component.previewFiles()).toEqual([]);
    expect(cache.get(hash)).toBeNull();
  }));

  it('preserves a non-array model replacement during upload', fakeAsync(() => {
    const response = deferred<string[]>();
    upload.and.returnValue(response.promise);
    const { hash } = addFile();
    component.upload();
    component.model.set(null as unknown as string[]);
    render();
    response.resolve(['B']);
    render();
    expect(component.model()).toBeNull();
    expect(component.previewFiles()).toEqual([]);
    expect(cache.get(hash)).toBeNull();
  }));

  it('preserves mixed model order and uploads each duplicate local key only once', fakeAsync(() => {
    const fileB = makeFile();
    const fileC = makeFile('C.png');
    const hashB = cache.add(fileB)!;
    const hashC = cache.add(fileC)!;
    const url = 'https://example.invalid/keep.png';
    const args = { scope: 'synthetic' };
    const original = ['missing', hashB, 17, hashC, hashB, url];
    fixture.componentRef.setInput('args', args);
    upload.and.resolveTo(['B', 'C']);
    setModel(original);
    component.upload();
    render();
    expect(upload).toHaveBeenCalledOnceWith([fileB, fileC], args);
    expect(component.model()).toEqual(['missing', 'B', 17, 'C', 'B', url]);
    expect(original).toEqual(['missing', hashB, 17, hashC, hashB, url]);
    expect(cache.get(hashB)).toBeNull();
    expect(cache.get(hashC)).toBeNull();
  }));

  it('uses the selected configuration upload handler and passes args', fakeAsync(() => {
    fixture.componentRef.setInput('upload', undefined);
    fixture.componentRef.setInput('key', 'configured');
    const args = { scope: 'configured' };
    fixture.componentRef.setInput('args', args);
    const { file } = addFile();
    component.upload();
    render();
    expect(configuredUpload).toHaveBeenCalledOnceWith([file], args);
    expect(upload).not.toHaveBeenCalled();
    expect(component.model()).toEqual(['configured-id']);
  }));

  it('prefers the upload input over the selected configuration', fakeAsync(() => {
    fixture.componentRef.setInput('key', 'configured');
    const { file } = addFile();
    component.upload();
    render();
    expect(upload).toHaveBeenCalledOnceWith([file], undefined);
    expect(configuredUpload).not.toHaveBeenCalled();
  }));

  it('retains local files for an unknown configuration key', fakeAsync(() => {
    fixture.componentRef.setInput('upload', undefined);
    fixture.componentRef.setInput('key', 'missing-config');
    const { hash, file } = addFile();
    component.upload();
    flushMicrotasks();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.calls.mostRecent().args[0]).toContain('missing-config');
    expect(component.model()).toEqual([hash]);
    expect(cache.get(hash)).toBe(file);
  }));

  it('does not require a details handler to upload local files beside server IDs', fakeAsync(() => {
    fixture.componentRef.setInput('details', undefined);
    const file = makeFile();
    const hash = cache.add(file)!;
    setModel(['A', hash]);
    expect(previewKeys()).toEqual([file.name]);
    component.upload();
    render();
    expect(upload).toHaveBeenCalledOnceWith([file], undefined);
    expect(component.model()).toEqual(['A', 'B']);
    expect(details).not.toHaveBeenCalled();
  }));

  it('keeps document and TIFF snapshots distinct from images while metadata is pending', fakeAsync(() => {
    fixture.componentRef.setInput('type', 'file');
    const files = [
      new File(['document'], 'report.pdf', { type: 'application/pdf', lastModified: 1 }),
      new File(['tiff'], 'scan.tiff', { type: 'image/tiff', lastModified: 1 }),
      new File(['image'], 'photo.JPG', { type: 'application/octet-stream', lastModified: 1 }),
    ];
    const hashes = files.map(file => cache.add(file)!);
    setModel(['A', ...hashes]);
    hashes.forEach(hash => cache.remove(hash));
    answer(0, ['A']);
    expect(
      component
        .previewFiles()
        .slice(1)
        .map(item => item.file)
    ).toEqual(files);
    expect(component.previewFiles().map(item => item.isPreviewImage)).toEqual([true, false, false, true]);
    expect(fixture.nativeElement.querySelectorAll('.c-document-container').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.c-area.c-view').length).toBe(2);
  }));

  it('uses metadata extension, name, and CDN fallbacks without changing model order', fakeAsync(() => {
    fixture.componentRef.setInput('type', 'file');
    setModel(['document', 'by-name', 'by-cdn']);
    requests[0].response.resolve([
      { idOrKey: 'by-cdn', name: 'no-extension', cdn: IMAGE + '#thumb.png?width=1' },
      { idOrKey: 'by-name', name: 'image.JPG', cdn: IMAGE },
      { idOrKey: 'document', name: 'override.png', extension: 'pdf', cdn: IMAGE },
    ]);
    render();
    expect(previewKeys()).toEqual(['document', 'by-name', 'by-cdn']);
    expect(component.previewFiles().map(item => item.extension)).toEqual(['pdf', 'JPG', 'png']);
    expect(component.previewFiles().map(item => item.isPreviewImage)).toEqual([false, true, true]);
    expect(changed.calls.mostRecent().args[0]).toEqual(['document', 'by-name', 'by-cdn']);
  }));

  it('cleans a successful pending upload after destruction without updating the model or emitting', fakeAsync(() => {
    const response = deferred<string[]>();
    upload.and.returnValue(response.promise);
    const { hash } = addFile();
    const model = component.model();
    const modelChanged = jasmine.createSpy('modelChanged');
    component.model.subscribe(modelChanged);
    const finished = jasmine.createSpy('finished');
    component.upload().then(finished);
    fixture.destroy();
    const warn = spyOn(console, 'warn');
    response.resolve(['B']);
    flushMicrotasks();
    expect(finished).toHaveBeenCalledTimes(1);
    expect(component.model()).toBe(model);
    expect(modelChanged).not.toHaveBeenCalled();
    expect(cache.get(hash)).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    component.upload();
    flushMicrotasks();
    expect(upload).toHaveBeenCalledTimes(1);
  }));
});
