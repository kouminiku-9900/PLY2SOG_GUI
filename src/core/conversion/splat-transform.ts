import {
  MemoryFileSystem,
  MemoryReadFileSystem,
  getInputFormat,
  getOutputFormat,
  readFile,
  writeFile,
  type Options,
} from '@playcanvas/splat-transform';

export interface SplatTransformDeps {
  MemoryReadFileSystem: typeof MemoryReadFileSystem;
  MemoryFileSystem: typeof MemoryFileSystem;
  getInputFormat: typeof getInputFormat;
  getOutputFormat: typeof getOutputFormat;
  readFile: typeof readFile;
  writeFile: typeof writeFile;
}

const DEFAULT_OPTIONS: Options = {
  iterations: 10,
  lodSelect: [],
  unbundled: false,
  lodChunkCount: 512,
  lodChunkExtent: 16,
};

export const splatTransformDeps: SplatTransformDeps = {
  MemoryReadFileSystem,
  MemoryFileSystem,
  getInputFormat,
  getOutputFormat,
  readFile,
  writeFile,
};

export function createDefaultOptions(): Options {
  return {
    ...DEFAULT_OPTIONS,
    lodSelect: [...DEFAULT_OPTIONS.lodSelect],
  };
}
