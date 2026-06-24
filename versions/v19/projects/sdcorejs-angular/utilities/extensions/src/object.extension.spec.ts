import { ObjectUtilities } from './object.extension';

describe('ObjectUtilities', () => {
  describe('isPlainObject', () => {
    it('returns true for plain objects', () => {
      expect(ObjectUtilities.isPlainObject({})).toBe(true);
      expect(ObjectUtilities.isPlainObject({ a: 1 })).toBe(true);
      expect(ObjectUtilities.isPlainObject(Object.create(null))).toBe(true);
    });

    it('returns false for non-plain values', () => {
      expect(ObjectUtilities.isPlainObject(null)).toBe(false);
      expect(ObjectUtilities.isPlainObject([])).toBe(false);
      expect(ObjectUtilities.isPlainObject(new Date())).toBe(false);
      expect(ObjectUtilities.isPlainObject('x')).toBe(false);
    });
  });

  describe('clone', () => {
    it('deep clones plain objects and arrays without mutating source', () => {
      const source = { a: 1, nested: { b: [1, 2] } };
      const cloned = ObjectUtilities.clone(source);

      cloned.nested.b.push(3);
      expect(source.nested.b).toEqual([1, 2]);
    });
  });

  describe('merge', () => {
    it('lets override replace primitives and arrays', () => {
      const merged = ObjectUtilities.merge(
        {
          documentType: 'cell',
          type: 'desktop',
          width: '800px',
          recent: ['from-default'],
        },
        {
          documentType: 'word',
          width: '100%',
          recent: ['from-instance'],
        }
      ) as {
        documentType: string;
        type: string;
        width: string;
        recent: string[];
      };

      expect(merged.documentType).toBe('word');
      expect(merged.type).toBe('desktop');
      expect(merged.width).toBe('100%');
      expect(merged.recent).toEqual(['from-instance']);
    });

    it('deep merges plain object branches', () => {
      const merged = ObjectUtilities.merge(
        {
          document: {
            permissions: {
              comment: true,
              modifyContentControl: true,
            },
          },
          editorConfig: {
            customization: {
              comments: false,
              compactHeader: true,
            },
          },
        },
        {
          document: {
            key: 'instance-key',
            permissions: {
              download: false,
            },
          },
          editorConfig: {
            customization: {
              compactHeader: false,
            },
          },
        }
      ) as unknown as {
        document: { key: string; permissions: Record<string, boolean> };
        editorConfig: { customization: Record<string, boolean> };
      };

      expect(merged.document.key).toBe('instance-key');
      expect(merged.document.permissions).toEqual({
        comment: true,
        modifyContentControl: true,
        download: false,
      });
      expect(merged.editorConfig.customization).toEqual({
        comments: false,
        compactHeader: false,
      });
    });

    it('keeps default branch when override value is undefined', () => {
      const merged = ObjectUtilities.merge({ a: 1, nested: { b: 2 } }, { nested: undefined }) as {
        a: number;
        nested: { b: number };
      };

      expect(merged).toEqual({ a: 1, nested: { b: 2 } });
    });

    it('merges nested callback maps', () => {
      const onAppReady = jasmine.createSpy('onAppReady');
      const onDocumentReady = jasmine.createSpy('onDocumentReady');

      const merged = ObjectUtilities.merge({ events: { onAppReady } }, { events: { onDocumentReady } }) as unknown as {
        events: Record<string, jasmine.Spy>;
      };

      expect(merged.events).toEqual(jasmine.objectContaining({ onAppReady, onDocumentReady }));
    });

    it('does not mutate either source', () => {
      const defaultConfig: { document: { permissions: Record<string, boolean> } } = {
        document: {
          permissions: {
            comment: true,
          },
        },
      };
      const instanceConfig: { document: { permissions: Record<string, boolean> } } = {
        document: {
          permissions: {
            download: false,
          },
        },
      };

      const merged = ObjectUtilities.merge(defaultConfig, instanceConfig) as {
        document: { permissions: Record<string, boolean> };
      };
      merged.document.permissions['comment'] = false;

      expect(defaultConfig.document.permissions['comment']).toBe(true);
      expect(instanceConfig.document.permissions['download']).toBe(false);
    });
  });

  describe('deepMerge', () => {
    it('merges multiple sources left to right', () => {
      const merged = ObjectUtilities.deepMerge(
        { a: 1, nested: { x: 1, y: 1 } },
        { b: 2, nested: { y: 2 } } as Record<string, unknown>,
        { nested: { z: 3 } } as Record<string, unknown>
      ) as { a: number; b: number; nested: Record<string, number> };

      expect(merged).toEqual({
        a: 1,
        b: 2,
        nested: { x: 1, y: 2, z: 3 },
      });
    });
  });
});
