import { TestBed } from '@angular/core/testing';
import { UploadFileService } from './upload-file.service';

// Helper to create a minimal File stub
function makeFile(name: string, content = 'data'): File {
  return new File([content], name, { type: 'text/plain' });
}

describe('UploadFileService', () => {
  let service: UploadFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UploadFileService],
    });
    service = TestBed.inject(UploadFileService);
  });

  // -------------------------------------------------------------------------
  // add
  // -------------------------------------------------------------------------
  describe('add', () => {
    it('returns a non-null string key after adding a file', () => {
      const file = makeFile('report.pdf');
      const key = service.add(file);
      expect(key).toBeTruthy();
      expect(typeof key).toBe('string');
    });

    it('returns the same key for the same file object added twice', () => {
      const file = makeFile('same.pdf');
      const key1 = service.add(file);
      const key2 = service.add(file);
      expect(key1).toBe(key2);
    });

    it('returns different keys for files with different names', () => {
      const file1 = makeFile('a.pdf');
      const file2 = makeFile('b.pdf');
      const key1 = service.add(file1);
      const key2 = service.add(file2);
      expect(key1).not.toBe(key2);
    });

    it('returns null when null is passed', () => {
      const key = service.add(null as any);
      expect(key).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // isHashedKey
  // -------------------------------------------------------------------------
  describe('isHashedKey', () => {
    it('returns false for an empty string', () => {
      expect(service.isHashedKey('')).toBeFalse();
    });

    it('returns false for a key that was never added', () => {
      expect(service.isHashedKey('nonexistent-key')).toBeFalse();
    });

    it('returns true after a file has been added', () => {
      const file = makeFile('invoice.pdf');
      const key = service.add(file)!;
      expect(service.isHashedKey(key)).toBeTrue();
    });

    it('returns false after the file has been removed', () => {
      const file = makeFile('remove-me.pdf');
      const key = service.add(file)!;
      service.remove(key);
      expect(service.isHashedKey(key)).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('returns null for a key that does not exist', () => {
      expect(service.get('ghost-key')).toBeNull();
    });

    it('returns the original File for a valid key', () => {
      const file = makeFile('receipt.pdf');
      const key = service.add(file)!;
      expect(service.get(key)).toBe(file);
    });

    it('returns null after the file is removed', () => {
      const file = makeFile('temp.pdf');
      const key = service.add(file)!;
      service.remove(key);
      expect(service.get(key)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------
  describe('remove', () => {
    it('removes a file using its string key', () => {
      const file = makeFile('doc.pdf');
      const key = service.add(file)!;
      service.remove(key);
      expect(service.get(key)).toBeNull();
    });

    it('removes a file using the File object directly', () => {
      const file = makeFile('photo.jpg');
      const key = service.add(file)!;
      service.remove(file);
      expect(service.get(key)).toBeNull();
    });

    it('does nothing when given a key that does not exist', () => {
      expect(() => service.remove('nonexistent')).not.toThrow();
    });

    it('does nothing when given null or empty', () => {
      expect(() => service.remove(null as any)).not.toThrow();
      expect(() => service.remove('' as any)).not.toThrow();
    });

    it('does not affect other files when one is removed by key', () => {
      const file1 = makeFile('keep.pdf');
      const file2 = makeFile('delete.pdf');
      const key1 = service.add(file1)!;
      const key2 = service.add(file2)!;

      service.remove(key2);

      expect(service.get(key1)).toBe(file1);
      expect(service.get(key2)).toBeNull();
    });

    it('does not affect other files when one is removed by File reference', () => {
      const file1 = makeFile('keep2.pdf');
      const file2 = makeFile('delete2.pdf');
      const key1 = service.add(file1)!;
      service.add(file2);

      service.remove(file2);

      expect(service.get(key1)).toBe(file1);
    });

    it('removing the same file twice does not throw', () => {
      const file = makeFile('double-remove.pdf');
      const key = service.add(file)!;
      service.remove(key);
      expect(() => service.remove(key)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Round-trip behaviour
  // -------------------------------------------------------------------------
  describe('round-trip', () => {
    it('can add, retrieve, and remove multiple files', () => {
      const files = ['a.pdf', 'b.pdf', 'c.pdf'].map(name => makeFile(name));
      const keys = files.map(f => service.add(f)!);

      keys.forEach((key, i) => expect(service.get(key)).toBe(files[i]));

      service.remove(keys[1]);
      expect(service.get(keys[0])).toBe(files[0]);
      expect(service.get(keys[1])).toBeNull();
      expect(service.get(keys[2])).toBe(files[2]);
    });
  });
});
