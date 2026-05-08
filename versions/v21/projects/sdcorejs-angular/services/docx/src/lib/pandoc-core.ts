/* Pandoc WASM core logic — adapted from pandoc-wasm/src/core.js
 *
 * This file is a local copy of the environment-agnostic pandoc core.
 * It imports @bjorn3/browser_wasi_shim directly, avoiding the pandoc-wasm
 * package entry points which use top-level await (incompatible with
 * Angular's esbuild/Vite build pipeline).
 *
 * Source: https://github.com/pandoc/pandoc-wasm (GPL-2.0-or-later)
 */

// @ts-nocheck
import {
  ConsoleStdout,
  File,
  OpenFile,
  PreopenDirectory,
  WASI,
} from '@bjorn3/browser_wasi_shim';

export interface PandocConvertResult {
  stdout: string;
  stderr: string;
  warnings: any[];
  files: Record<string, any>;
  mediaFiles: Record<string, any>;
}

export interface PandocInstance {
  convert(
    options: Record<string, any>,
    stdin: string | null,
    files: Record<string, Blob | string>
  ): Promise<PandocConvertResult>;
}

export function createPandocInstance(wasmBinary: ArrayBuffer): Promise<PandocInstance> {
  const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
  const env: string[] = [];
  const fileSystem = new Map();
  const fds = [
    new OpenFile(new File(new Uint8Array(), { readonly: true })),
    ConsoleStdout.lineBuffered((msg: string) => console.log(`[WASI stdout] ${msg}`)),
    ConsoleStdout.lineBuffered((msg: string) => console.warn(`[WASI stderr] ${msg}`)),
    new PreopenDirectory('/', fileSystem),
  ];
  const options = { debug: false };
  const wasi = new WASI(args, env, fds, options);

  return WebAssembly.instantiate(wasmBinary, {
    wasi_snapshot_preview1: wasi.wasiImport,
  }).then(({ instance }: any) => {
    wasi.initialize(instance);
    instance.exports.__wasm_call_ctors();

    function memory_data_view() {
      return new DataView(instance.exports.memory.buffer);
    }

    const argc_ptr = instance.exports.malloc(4);
    memory_data_view().setUint32(argc_ptr, args.length, true);
    const argv = instance.exports.malloc(4 * (args.length + 1));
    for (let i = 0; i < args.length; ++i) {
      const arg = instance.exports.malloc(args[i].length + 1);
      new TextEncoder().encodeInto(
        args[i],
        new Uint8Array(instance.exports.memory.buffer, arg, args[i].length)
      );
      memory_data_view().setUint8(arg + args[i].length, 0);
      memory_data_view().setUint32(argv + 4 * i, arg, true);
    }
    memory_data_view().setUint32(argv + 4 * args.length, 0, true);
    const argv_ptr = instance.exports.malloc(4);
    memory_data_view().setUint32(argv_ptr, argv, true);

    instance.exports.hs_init_with_rtsopts(argc_ptr, argv_ptr);

    async function addFile(filename: string, data: Blob | string, readonly: boolean) {
      let uint8Array: Uint8Array;
      if (typeof data === 'string') {
        uint8Array = new TextEncoder().encode(data);
      } else {
        const buffer = await data.arrayBuffer();
        uint8Array = new Uint8Array(buffer);
      }
      const file = new File(uint8Array, { readonly });
      fileSystem.set(filename, file);
    }

    async function convert(
      options: Record<string, any>,
      stdin: string | null,
      files: Record<string, Blob | string>
    ): Promise<PandocConvertResult> {
      const opts_str = JSON.stringify(options);
      const encoded = new TextEncoder().encode(opts_str);
      const opts_ptr = instance.exports.malloc(encoded.length);
      new TextEncoder().encodeInto(
        opts_str,
        new Uint8Array(instance.exports.memory.buffer, opts_ptr, encoded.length)
      );

      files = { ...files };

      fileSystem.clear();
      const in_file = new File(new Uint8Array(), { readonly: true });
      const out_file = new File(new Uint8Array(), { readonly: false });
      const err_file = new File(new Uint8Array(), { readonly: false });
      const warnings_file = new File(new Uint8Array(), { readonly: false });
      fileSystem.set('stdin', in_file);
      fileSystem.set('stdout', out_file);
      fileSystem.set('stderr', err_file);
      fileSystem.set('warnings', warnings_file);

      const knownFiles = new Set(['stdin', 'stdout', 'stderr', 'warnings']);

      for (const filename in files) {
        await addFile(filename, files[filename], true);
        knownFiles.add(filename);
      }

      const outputFileName = options['output-file'] || null;
      const extractMediaPath = options['extract-media'] || null;

      if (outputFileName) {
        await addFile(outputFileName, new Blob(), false);
        knownFiles.add(outputFileName);
      }

      if (extractMediaPath) {
        await addFile(extractMediaPath, new Blob(), false);
        if (extractMediaPath.endsWith('.zip')) {
          knownFiles.add(extractMediaPath);
        }
      }

      if (stdin) {
        in_file.data = new TextEncoder().encode(stdin);
      }

      instance.exports.convert(opts_ptr, encoded.length);

      if (options['output-file']) {
        const outputFile = fileSystem.get(options['output-file']);
        if (outputFile && outputFile.data && outputFile.data.length > 0) {
          files[options['output-file']] = new Blob([outputFile.data]);
        }
      }

      if (options['extract-media']) {
        const mediaFile = fileSystem.get(options['extract-media']);
        if (mediaFile && mediaFile.data && mediaFile.data.length > 0) {
          files[options['extract-media']] = new Blob([mediaFile.data], { type: 'application/zip' });
        }
      }

      const mediaFiles: Record<string, Blob> = {};
      for (const [name, fileData] of fileSystem.entries()) {
        if (!knownFiles.has(name) && fileData && fileData.data && fileData.data.length > 0) {
          const blob = new Blob([fileData.data]);
          files[name] = blob;
          if (name !== outputFileName && name !== extractMediaPath) {
            mediaFiles[name] = blob;
          }
        }
      }

      const rawWarnings = new TextDecoder('utf-8', { fatal: true }).decode(warnings_file.data);
      let warnings: any[] = [];
      if (rawWarnings) {
        try {
          warnings = JSON.parse(rawWarnings);
        } catch (e) {
          console.warn('Failed to parse warnings:', e);
        }
      }

      return {
        stdout: new TextDecoder('utf-8', { fatal: true }).decode(out_file.data),
        stderr: new TextDecoder('utf-8', { fatal: true }).decode(err_file.data),
        warnings,
        files,
        mediaFiles,
      };
    }

    return { convert } as PandocInstance;
  });
}
