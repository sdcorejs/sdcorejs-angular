import { SdEditorImageAttributes } from '@sdcorejs/angular/components/editor-engine';
import { SdEditorUploadManager } from './upload-manager';
import { SdEditorImageConfig } from './models';
import { SdEditorUploadFileDetail } from './configurations';
import { I18nService } from '@sdcorejs/angular/i18n';

const png = (name = 'image.png') =>
  new File(
    [
      Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jbp4AAAAASUVORK5CYII='), char =>
        char.charCodeAt(0)
      ),
    ],
    name,
    { type: 'image/png' }
  );
const result = (index = 0): SdEditorUploadFileDetail => ({
  cdn: '/cdn/image-' + index + '.png',
  idOrKey: 'image-' + index,
  name: 'Uploaded ' + index,
});
const flush = async () => {
  for (let index = 0; index < 8; index++) await Promise.resolve();
};
function imagePort() {
  const sources = new Set<string>();
  const inserted: SdEditorImageAttributes[] = [];
  const port = {
    sources,
    inserted,
    activeImageSources: () => new Set(sources),
    insertImage: jasmine.createSpy('insertImage').and.callFake((attributes: SdEditorImageAttributes) => {
      inserted.push(attributes);
      sources.add(attributes.src);
    }),
    replaceImage: jasmine.createSpy('replaceImage').and.callFake((source: string, attributes: SdEditorImageAttributes) => {
      if (!sources.delete(source)) return false;
      sources.add(attributes.src);
      return true;
    }),
  };
  return port;
}

describe('SdEditorUploadManager snapshot and URL contracts', () => {
  let manager: SdEditorUploadManager;
  let port: ReturnType<typeof imagePort>;
  let config: SdEditorImageConfig;
  let warning: jasmine.Spy;
  beforeEach(() => {
    spyOn(URL, 'createObjectURL').and.callThrough();
    spyOn(URL, 'revokeObjectURL').and.callThrough();
    port = imagePort();
    warning = jasmine.createSpy('warning');
    config = { uploadFn: async files => files.map((_, index) => result(index)) };
    manager = new SdEditorUploadManager(port, () => config, warning, { t: (key: string) => key } as I18nService);
  });
  afterEach(() => manager.destroy());
  it('validates a decoded image and defers callback until upload()', async () => {
    const callback = jasmine.createSpy('upload').and.callFake(config.uploadFn!);
    config.uploadFn = callback;
    const file = png();
    await manager.selectFiles([file]);
    expect(callback).not.toHaveBeenCalled();
    expect(port.inserted.length).toBe(1);
    const temporary = port.inserted[0].src;
    expect(temporary.startsWith('blob:')).toBeTrue();
    expect(port.inserted[0].alt).toBe(file.name);
    expect(port.inserted[0].loading).toBe('lazy');
    await manager.upload();
    expect(callback).toHaveBeenCalledOnceWith([file]);
    expect(port.replaceImage).toHaveBeenCalledOnceWith(temporary, {
      src: '/cdn/image-0.png',
      id: 'image-0',
      alt: 'Uploaded 0',
      loading: 'lazy',
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(temporary);
  });
  it('always rejects signature mismatches even if no validation options were supplied', async () => {
    await manager.selectFiles([new File(['not an image'], 'fake.png', { type: 'image/png' })]);
    expect(port.insertImage).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('core.component.editor.image.invalid-format');
  });
  it('rejects a valid signature with an undecodable payload and revokes decode URL', async () => {
    await manager.selectFiles([new File([new Uint8Array([0xff, 0xd8, 0xff])], 'broken.jpg')]);
    expect(port.insertImage).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
  it('enforces count limit atomically before any files are decoded or inserted', async () => {
    config.maxImagesPerSelection = 1;
    await manager.selectFiles([png('a.png'), png('b.png')]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(port.insertImage).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('core.component.editor.image.max-per-selection');
  });
  it('enforces dimension and size limits, retaining no invalid files', async () => {
    config.validation = { minWidth: 2 };
    await manager.selectFiles([png()]);
    expect(port.insertImage).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('core.component.editor.image.min-width');
    config.validation = { maxSizeMB: 0 };
    await manager.selectFiles([png()]);
    expect(port.insertImage).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('core.component.editor.image.size-exceeded');
  });
  it('uses eager loading and original filename fallback while preserving callback metadata as text', async () => {
    config.lazyLoad = false;
    config.uploadFn = async () => [{ cdn: '/safe.png', idOrKey: 'key' }];
    const file = png('original.png');
    await manager.selectFiles([file]);
    const src = port.inserted[0].src;
    await manager.upload();
    expect(port.replaceImage).toHaveBeenCalledOnceWith(src, { src: '/safe.png', id: 'key', alt: 'original.png', loading: 'eager' });
  });
  it('bounds callback batch size and concurrent requests', async () => {
    const resolvers: (() => void)[] = [];
    let active = 0;
    let maximum = 0;
    const sizes: number[] = [];
    config.batchSize = 2;
    config.maxConcurrentUploads = 2;
    config.uploadFn = files => {
      active++;
      maximum = Math.max(maximum, active);
      sizes.push(files.length);
      return new Promise(resolve =>
        resolvers.push(() => {
          active--;
          resolve(files.map((_, index) => result(sizes.length * 10 + index)));
        })
      );
    };
    await manager.selectFiles(Array.from({ length: 5 }, (_, index) => png(index + '.png')));
    const uploading = manager.upload();
    expect(sizes).toEqual([2, 2]);
    resolvers[0]();
    await flush();
    expect(sizes).toEqual([2, 2, 1]);
    resolvers[1]();
    resolvers[2]();
    await uploading;
    expect(maximum).toBe(2);
    expect(port.replaceImage).toHaveBeenCalledTimes(5);
  });
  it('clamps nonpositive/fractional batch and concurrency options safely', async () => {
    config.batchSize = 0.5;
    config.maxConcurrentUploads = -2;
    const sizes: number[] = [];
    config.uploadFn = async files => {
      sizes.push(files.length);
      return files.map((_, index) => result(index));
    };
    await manager.selectFiles([png('one.png'), png('two.png')]);
    await manager.upload();
    expect(sizes).toEqual([1, 1]);
  });
  it('rejects callback cardinality without replacing any image and retains files for retry', async () => {
    config.uploadFn = async () => [];
    await manager.selectFiles([png()]);
    const src = port.inserted[0].src;
    await expectAsync(manager.upload()).toBeRejectedWithError('Upload failed for 1 image(s)');
    expect(port.replaceImage).not.toHaveBeenCalled();
    expect(port.sources.has(src)).toBeTrue();
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(src);
    config.uploadFn = async () => [result()];
    await manager.upload();
    expect(port.replaceImage).toHaveBeenCalledTimes(1);
  });
  it('rejects unsafe URLs and invalid metadata before applying a batch', async () => {
    await manager.selectFiles([png('one.png'), png('two.png')]);
    config.uploadFn = async () => [result(), { cdn: 'javascript:alert(1)', idOrKey: 'bad' }];
    await expectAsync(manager.upload()).toBeRejectedWithError('Upload failed for 2 image(s)');
    expect(port.replaceImage).not.toHaveBeenCalled();
    config.uploadFn = async () => [result(), { cdn: '/safe.png', idOrKey: 123 } as never];
    await expectAsync(manager.upload()).toBeRejectedWithError('Upload failed for 2 image(s)');
    expect(port.replaceImage).not.toHaveBeenCalled();
  });
  it('retains failed files and successfully retries the same File identities', async () => {
    const file = png();
    const callback = jasmine.createSpy('upload').and.rejectWith(new Error('server failure'));
    config.uploadFn = callback;
    await manager.selectFiles([file]);
    await expectAsync(manager.upload()).toBeRejectedWithError('Upload failed for 1 image(s)');
    expect(callback).toHaveBeenCalledWith([file]);
    callback.and.resolveTo([result()]);
    await manager.upload();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(port.replaceImage).toHaveBeenCalledTimes(1);
  });
  it('retains an active temporary image and its File when replacement returns false, then retries (R2 RED)', async () => {
    const file = png();
    const callback = jasmine.createSpy('upload').and.resolveTo([result()]);
    config.uploadFn = callback;
    await manager.selectFiles([file]);
    const src = port.inserted[0].src;
    port.replaceImage.and.returnValue(false);
    await expectAsync(manager.upload()).toBeRejectedWithError('Upload failed for 1 image(s)');
    expect(port.sources.has(src)).toBeTrue();
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(src);
    port.replaceImage.and.callFake((source: string, attributes: SdEditorImageAttributes) => {
      port.sources.delete(source);
      port.sources.add(attributes.src);
      return true;
    });
    await manager.upload();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.calls.argsFor(1)[0]).toEqual([file]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(src);
    expect(port.sources.has('/cdn/image-0.png')).toBeTrue();
  });
  it('releases a failed replacement only when source removal is verified (R2 RED)', async () => {
    await manager.selectFiles([png()]);
    const src = port.inserted[0].src;
    port.replaceImage.and.callFake(() => {
      port.sources.delete(src);
      return false;
    });
    await manager.upload();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(src);
    expect(port.sources.has(src)).toBeFalse();
  });
  it('prunes removed images and never submits their files', async () => {
    const callback = jasmine.createSpy('upload').and.resolveTo([result()]);
    config.uploadFn = callback;
    await manager.selectFiles([png()]);
    const src = port.inserted[0].src;
    port.sources.delete(src);
    await manager.upload();
    expect(callback).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(src);
  });
  it('ignores a callback result if the source image was removed during await', async () => {
    let resolve!: (value: SdEditorUploadFileDetail[]) => void;
    config.uploadFn = () =>
      new Promise(done => {
        resolve = done;
      });
    await manager.selectFiles([png()]);
    const src = port.inserted[0].src;
    const uploading = manager.upload();
    port.sources.delete(src);
    resolve([result()]);
    await uploading;
    expect(port.replaceImage).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(src);
  });
  it('ignores old-generation callback results after external source replacement', async () => {
    let resolve!: (value: SdEditorUploadFileDetail[]) => void;
    config.uploadFn = () =>
      new Promise(done => {
        resolve = done;
      });
    await manager.selectFiles([png()]);
    const src = port.inserted[0].src;
    const uploading = manager.upload();
    manager.invalidateSource();
    port.sources.clear();
    resolve([result()]);
    await uploading;
    expect(port.replaceImage).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(src);
  });
  it('ignores callbacks after disable generation while retaining still-present files for retry', async () => {
    let resolve!: (value: SdEditorUploadFileDetail[]) => void;
    config.uploadFn = () =>
      new Promise(done => {
        resolve = done;
      });
    await manager.selectFiles([png()]);
    const src = port.inserted[0].src;
    const uploading = manager.upload();
    manager.invalidateWork();
    resolve([result()]);
    await uploading;
    expect(port.replaceImage).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(src);
    config.uploadFn = async () => [result()];
    await manager.upload();
    expect(port.replaceImage).toHaveBeenCalledTimes(1);
  });
  it('keeps files added during a deferred snapshot for the next upload', async () => {
    let resolve!: (value: SdEditorUploadFileDetail[]) => void;
    const callback = jasmine.createSpy('upload').and.callFake(
      () =>
        new Promise(done => {
          resolve = done;
        })
    );
    config.uploadFn = callback;
    await manager.selectFiles([png('first.png')]);
    const first = manager.upload();
    await manager.selectFiles([png('later.png')]);
    resolve([result()]);
    await first;
    expect(port.replaceImage).toHaveBeenCalledTimes(1);
    callback.and.resolveTo([result(1)]);
    await manager.upload();
    expect(port.replaceImage).toHaveBeenCalledTimes(2);
    expect(callback.calls.argsFor(1)[0][0].name).toBe('later.png');
  });
  it('immediate mode batches queued files and reports a localized failure while retaining retry', async () => {
    let notify!: () => void;
    const called = new Promise<void>(resolve => {
      notify = resolve;
    });
    config.uploadMode = 'immediate';
    config.batchSize = 2;
    config.uploadFn = async () => {
      notify();
      throw new Error('request failed');
    };
    await manager.selectFiles([png('one.png'), png('two.png')]);
    await called;
    await flush();
    expect(warning).toHaveBeenCalledWith('core.component.editor.image.upload-failed');
    expect(port.replaceImage).not.toHaveBeenCalled();
    config.uploadFn = async files => files.map((_, index) => result(index));
    await manager.upload();
    expect(port.replaceImage).toHaveBeenCalledTimes(2);
  });
  it('destroys local decode and pending URLs, ignores running callbacks and is idempotent', async () => {
    let resolve!: (value: SdEditorUploadFileDetail[]) => void;
    config.uploadFn = () =>
      new Promise(done => {
        resolve = done;
      });
    await manager.selectFiles([png()]);
    const src = port.inserted[0].src;
    const uploading = manager.upload();
    manager.destroy();
    manager.destroy();
    resolve([result()]);
    await uploading;
    expect(port.replaceImage).not.toHaveBeenCalled();
    expect((URL.revokeObjectURL as jasmine.Spy).calls.allArgs().filter(args => args[0] === src).length).toBe(1);
    await manager.selectFiles([png()]);
    expect(port.insertImage).toHaveBeenCalledTimes(1);
  });
  it('does not insert when destruction occurs while image validation is pending', async () => {
    const selecting = manager.selectFiles([png()]);
    manager.destroy();
    await selecting;
    expect(port.insertImage).not.toHaveBeenCalled();
  });
  it('rejects an upload callback that returns the temporary blob URL (regression RED)', async () => {
    await manager.selectFiles([png()]);
    const temporary = port.inserted[0].src;
    config.uploadFn = async () => [{ cdn: temporary, idOrKey: 'temporary' }];
    await expectAsync(manager.upload()).toBeRejectedWithError('Upload failed for 1 image(s)');
    expect(port.replaceImage).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(temporary);
  });
  it('queues a fresh-generation deferred upload behind an old callback (regression RED)', async () => {
    let resolveOld!: (value: SdEditorUploadFileDetail[]) => void;
    const callback = jasmine.createSpy('upload').and.callFake(
      () =>
        new Promise(done => {
          resolveOld = done;
        })
    );
    config.uploadFn = callback;
    await manager.selectFiles([png('old.png')]);
    const old = manager.upload();
    manager.invalidateSource();
    port.sources.clear();
    await manager.selectFiles([png('new.png')]);
    callback.and.resolveTo([result(2)]);
    const fresh = manager.upload();
    resolveOld([result(1)]);
    await old;
    await fresh;
    expect(callback).toHaveBeenCalledTimes(2);
    expect(port.replaceImage).toHaveBeenCalledTimes(1);
    expect(port.sources.has('/cdn/image-2.png')).toBeTrue();
  });
});
