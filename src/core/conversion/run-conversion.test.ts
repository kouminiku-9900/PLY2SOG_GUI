import { describe, expect, it, vi } from 'vitest';

import { BrowserSupportError, ConversionError } from '../errors';
import type { ConversionRequest } from '../types';
import { convertPlyToSog } from './run-conversion';
import type { SplatTransformDeps } from './splat-transform';

class FakeMemoryReadFileSystem {
  private readonly buffers = new Map<string, Uint8Array>();

  set(name: string, data: Uint8Array): void {
    this.buffers.set(name, data);
  }

  get(name: string): Uint8Array | undefined {
    return this.buffers.get(name);
  }
}

class FakeMemoryFileSystem {
  readonly results = new Map<string, Uint8Array>();
}

function createRequest(): ConversionRequest {
  return {
    fileName: 'model.ply',
    buffer: new Uint8Array([1, 2, 3, 4]).buffer,
    preferredDevice: 'auto',
  };
}

function createDeps(writeImpl?: (options: { createDevice?: () => Promise<unknown> }, fs: FakeMemoryFileSystem) => Promise<void>): SplatTransformDeps {
  return {
    MemoryReadFileSystem: FakeMemoryReadFileSystem as unknown as SplatTransformDeps['MemoryReadFileSystem'],
    MemoryFileSystem: FakeMemoryFileSystem as unknown as SplatTransformDeps['MemoryFileSystem'],
    getInputFormat: vi.fn(() => 'ply') as unknown as SplatTransformDeps['getInputFormat'],
    getOutputFormat: vi.fn(() => 'sog-bundle') as unknown as SplatTransformDeps['getOutputFormat'],
    readFile: vi.fn(async () => [{ mock: 'table' }] as never[]) as unknown as SplatTransformDeps['readFile'],
    writeFile: vi.fn(async (options, fs) => {
      if (writeImpl) {
        await writeImpl(
          options as unknown as { createDevice?: () => Promise<unknown> },
          fs as unknown as FakeMemoryFileSystem,
        );
        return;
      }

      (fs as unknown as FakeMemoryFileSystem).results.set(options.filename, new Uint8Array([9, 9, 9]));
    }) as unknown as SplatTransformDeps['writeFile'],
  };
}

describe('convertPlyToSog', () => {
  it('generates a .sog output name', async () => {
    const result = await convertPlyToSog(createRequest(), createDeps());

    expect(result.outputName).toBe('model.sog');
    expect(result.outputBytes).toBe(3);
  });

  it('falls back to cpu when gpu device creation fails', async () => {
    const deps = createDeps(async (options, fs) => {
      if (options.createDevice) {
        await options.createDevice();
      }

      fs.results.set('model.sog', new Uint8Array([7, 7]));
    });

    const createGpuDevice = vi.fn(async () => {
      throw new BrowserSupportError('WebGPU unavailable');
    });

    const result = await convertPlyToSog(createRequest(), deps, createGpuDevice);

    expect(createGpuDevice).toHaveBeenCalledTimes(1);
    expect(result.deviceUsed).toBe('cpu');
    expect(result.outputBytes).toBe(2);
  });

  it('surfaces write failures as conversion errors', async () => {
    const deps = createDeps(async () => {
      throw new Error('writer exploded');
    });

    await expect(convertPlyToSog(createRequest(), deps)).rejects.toBeInstanceOf(ConversionError);
  });
});
