import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SdGraphIdentityCanonicalizer,
  SdGraphSerializer,
  parseSdPersistenceEnvelope,
  stringifySdPersistenceValueEnvelope,
} from '@sdcorejs/angular/services/persistence';
import { DemoPageComponent, DemoSectionComponent } from '../../../shared/demo-page.component';

interface DemoSharedValue {
  readonly label: string;
}

interface DemoGraph {
  readonly createdAt: Date;
  readonly labels: Map<string, string>;
  readonly permissions: Set<string>;
  readonly primary: DemoSharedValue;
  readonly secondary: DemoSharedValue;
  self?: DemoGraph;
}

@Component({
  selector: 'app-persistence-demo',
  standalone: true,
  imports: [DemoPageComponent, DemoSectionComponent],
  template: `
    <demo-page
      #demoPage
      title="Persistence"
      description="Versioned graph serialization, deterministic identity and bounded envelopes used by SdCacheService and SdStorageService.">
      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-graph-round-trip') {
        <demo-section
          heading="Graph round-trip"
          [props]="[
            { name: 'serializer', value: 'SdGraphSerializer' },
            { name: 'references', value: 'shared + circular' },
          ]">
          <pre>{{ graphSummary }}</pre>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-deterministic-identity') {
        <demo-section
          heading="Deterministic identity"
          [props]="[{ name: 'canonicalizer', value: 'SdGraphIdentityCanonicalizer' }]"
          note="Property insertion order does not change the canonical persistence identity.">
          <p>Stable identity: {{ stableIdentity }}</p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-versioned-envelope') {
        <demo-section
          heading="Versioned envelope"
          [props]="[
            { name: 'identity', value: 'tenant:42' },
            { name: 'serializer', value: serializer.format },
          ]">
          <p>Envelope payload: {{ envelopeTeam }}</p>
        </demo-section>
      }

      @if (!demoPage.focusedSectionId || demoPage.focusedSectionId === 'example-invalid-input-containment') {
        <demo-section
          heading="Invalid input containment"
          [props]="[{ name: 'error', value: 'SdPersistenceError' }]"
          note="Consumers can reject malformed documents without mutating the previous cache/storage value.">
          <p>Invalid document rejected: {{ invalidDocumentRejected }}</p>
        </demo-section>
      }
    </demo-page>
  `,
  styles: `
    pre {
      margin: 0;
      padding: 12px;
      border-radius: 8px;
      background: var(--docs-code-bg, #f4f6f8);
      white-space: pre-wrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersistenceDemoComponent {
  protected readonly serializer = new SdGraphSerializer();
  readonly graphSummary: string;
  readonly stableIdentity: boolean;
  readonly envelopeTeam: string;
  readonly invalidDocumentRejected: boolean;

  constructor() {
    const shared: DemoSharedValue = { label: 'shared' };
    const source: DemoGraph = {
      createdAt: new Date('2026-07-23T00:00:00.000Z'),
      labels: new Map([['vi', 'Xin chào']]),
      permissions: new Set(['read', 'write']),
      primary: shared,
      secondary: shared,
    };
    source.self = source;
    const restored = this.serializer.parse<DemoGraph>(this.serializer.stringify(source));
    this.graphSummary = [
      `Date: ${restored.createdAt instanceof Date}`,
      `Map: ${restored.labels instanceof Map}`,
      `Set: ${restored.permissions instanceof Set}`,
      `Shared reference: ${restored.primary === restored.secondary}`,
      `Circular reference: ${restored.self === restored}`,
    ].join('\n');

    const canonicalizer = new SdGraphIdentityCanonicalizer();
    this.stableIdentity =
      canonicalizer.canonicalize({ tenant: 42, filters: { status: 'active', page: 1 } }) ===
      canonicalizer.canonicalize({ filters: { page: 1, status: 'active' }, tenant: 42 });

    const identity = 'tenant:42';
    const payload = this.serializer.stringify({ team: 'Finance' });
    const serializedEnvelope = stringifySdPersistenceValueEnvelope(identity, this.serializer.format, payload);
    const envelope = parseSdPersistenceEnvelope(serializedEnvelope, identity, this.serializer.format);
    const envelopeValue = envelope?.kind === 'value' ? this.serializer.parse<{ team: string }>(envelope.payload) : undefined;
    this.envelopeTeam = envelopeValue?.team ?? 'unavailable';

    this.invalidDocumentRejected = rejectsInvalidDocument(this.serializer);
  }
}

function rejectsInvalidDocument(serializer: SdGraphSerializer): boolean {
  try {
    serializer.parse('{"format":"unknown","version":1}');
    return false;
  } catch {
    return true;
  }
}
