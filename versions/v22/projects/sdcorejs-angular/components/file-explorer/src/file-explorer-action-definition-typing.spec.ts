import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdFileExplorerActions } from './components/actions.component';
import type { SdFileExplorerActionGroupDefinition, SdFileExplorerActionLeafDefinition, SdFileExplorerItem } from './file-explorer.model';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'test-explorer-definition-signature',
  template: '',
})
class DefinitionSignatureHarness extends SdFileExplorerActions<SdFileExplorerItem> {
  // This compile contract uses the same definitions as the actual action template; no casts weaken the signature.
  dispatchDefinition(
    action: SdFileExplorerActionLeafDefinition<SdFileExplorerItem>,
    group?: SdFileExplorerActionGroupDefinition<SdFileExplorerItem>
  ): void {
    this.run(action, group);
  }
}

describe('Explorer actual action-component definition typing', () => {
  it('dispatches canonical flat/group definitions and the preserved legacy callable leaf contract', () => {
    TestBed.configureTestingModule({ imports: [DefinitionSignatureHarness] });
    const fixture = TestBed.createComponent(DefinitionSignatureHarness);
    const item: SdFileExplorerItem = { id: 'a', kind: 'file', parentId: null, name: 'A.pdf' };
    const canonical = jasmine.createSpy('canonical'),
      grouped = jasmine.createSpy('grouped'),
      legacy = jasmine.createSpy('legacy');
    const flat: SdFileExplorerActionLeafDefinition<SdFileExplorerItem> = { title: 'Canonical', onClick: canonical };
    const child: SdFileExplorerActionLeafDefinition<SdFileExplorerItem> = { title: 'Grouped', onClick: grouped };
    const old: SdFileExplorerActionLeafDefinition<SdFileExplorerItem> = { title: 'Legacy', click: legacy };
    const group: SdFileExplorerActionGroupDefinition<SdFileExplorerItem> = { title: 'Tools', children: [child] };
    fixture.componentRef.setInput('actions', [flat, group, old]);
    fixture.componentRef.setInput('context', item);
    fixture.detectChanges();
    fixture.componentInstance.dispatchDefinition(flat);
    fixture.componentInstance.dispatchDefinition(child, group);
    fixture.componentInstance.dispatchDefinition(old);
    expect(canonical).toHaveBeenCalledOnceWith(item);
    expect(grouped).toHaveBeenCalledOnceWith(item);
    expect(legacy).toHaveBeenCalledOnceWith(item);
    fixture.destroy();
  });
});
