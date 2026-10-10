import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SdFileExplorer } from './file-explorer.component';
import type { SdFileExplorerCommand, SdFileExplorerConfig, SdFileExplorerItem, SdFileExplorerOpenEvent } from './file-explorer.model';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdFileExplorer],
  template: '<div style="width:1100px;height:720px"><sd-file-explorer [option]="option()" (open)="opened.push($event)" /></div>',
})
class CapabilityHost {
  readonly item: SdFileExplorerItem<{ owner: string }> = { id: 'a', parentId: null, name: 'A.png', kind: 'file', data: { owner: 'Ada' } };
  readonly list = jasmine.createSpy('list').and.returnValue([this.item]);
  readonly oldShare = jasmine.createSpy('oldShare').and.returnValue('https://old.example');
  readonly share = jasmine.createSpy('share').and.returnValue('https://canonical.example');
  readonly preview = jasmine.createSpy('preview').and.returnValue('https://preview.example/a.png');
  readonly allowed = signal(false);
  readonly option = signal<SdFileExplorerConfig<{ owner: string }>>({
    list: this.list,
    share: this.oldShare,
    capabilities: {
      share: { onShare: this.share, shareable: () => this.allowed() },
      preview: { onPreview: this.preview, previewable: false },
    },
  });
  readonly opened: SdFileExplorerOpenEvent<{ owner: string }>[] = [];
  readonly explorer = viewChild.required(SdFileExplorer<{ owner: string }>);
}
describe('Explorer grouped capability integration', () => {
  async function setup() {
    TestBed.configureTestingModule({ imports: [CapabilityHost], providers: [provideNoopAnimations()] });
    const fixture = TestBed.createComponent(CapabilityHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
  }
  it('keeps denied share visible/disabled and dispatches only the canonical callback when eligible', async () => {
    const { fixture, host, root } = await setup();
    const button = root.querySelector<HTMLButtonElement>('.row-share button')!;
    expect(button.disabled).toBeTrue();
    expect(root.querySelector('.row-share')?.getAttribute('aria-description')).toBeTruthy();
    host.allowed.set(true);
    fixture.detectChanges();
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.share).toHaveBeenCalledTimes(1);
    expect(host.oldShare).not.toHaveBeenCalled();
    expect(host.share.calls.mostRecent().args[0].item).toBe(host.item);
    fixture.destroy();
  });
  it('denied preview opens the fallback exactly once and preserves the original DTO item', async () => {
    const { fixture, host, root } = await setup();
    root.querySelector<HTMLElement>('.row:not(.row--head)')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.preview).not.toHaveBeenCalled();
    expect(host.opened.length).toBe(1);
    expect(host.opened[0].item).toBe(host.item);
    expect(host.opened[0].item.data?.owner).toBe('Ada');
    fixture.destroy();
  });
  it('an unrelated config change with the same list callback retains the cache', async () => {
    const { fixture, host } = await setup();
    host.option.update(option => ({ ...option, title: 'Updated' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.list).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('aborts an open preview when its provider changes and ignores the stale response', async () => {
    const { fixture, host, root } = await setup();
    let resolve!: (url: string) => void;
    host.preview.and.returnValue(new Promise<string>(done => (resolve = done)));
    host.option.update(option => ({ ...option, capabilities: { ...option.capabilities, preview: { onPreview: host.preview } } }));
    fixture.detectChanges();
    root.querySelector<HTMLElement>('.row:not(.row--head)')!.click();
    fixture.detectChanges();
    const signal = host.preview.calls.mostRecent().args[0].signal as AbortSignal;
    const replacement = jasmine.createSpy('replacement').and.returnValue('https://new.example/a.png');
    host.option.update(option => ({ ...option, capabilities: { ...option.capabilities, preview: { onPreview: replacement } } }));
    fixture.detectChanges();
    expect(signal.aborted).toBeTrue();
    resolve('https://old.example/a.png');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(replacement).toHaveBeenCalledTimes(1);
    expect(host.opened.length).toBe(1);
    fixture.destroy();
  });
  it('mixed JavaScript action aliases call canonical onClick once without cloning the definition', async () => {
    const { fixture, host, root } = await setup();
    const onClick = jasmine.createSpy('onClick');
    const click = jasmine.createSpy('click');
    const definition = { title: 'Inspect', onClick, click } as unknown as SdFileExplorerCommand<{ owner: string }>;
    host.option.update(option => ({ ...option, fileCommands: [definition] }));
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('.commands sd-button button')!.click();
    expect(onClick).toHaveBeenCalledOnceWith(host.item);
    expect(click).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
