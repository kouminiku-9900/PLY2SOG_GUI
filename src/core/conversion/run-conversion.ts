import type { DataTable } from '@playcanvas/splat-transform';
import type { GraphicsDevice } from 'playcanvas';

import { BrowserSupportError, ConversionError } from '../errors';
import { buildOutputName } from '../file-utils';
import type { ConversionRequest, ConversionResult } from '../types';
import { createDefaultOptions, splatTransformDeps, type SplatTransformDeps } from './splat-transform';

export type GraphicsDeviceFactory = () => Promise<GraphicsDevice>;

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer.slice(0));
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return new Uint8Array(view).buffer;
}

function getPrimaryTable(tables: DataTable[]): DataTable {
  const table = tables[0];

  if (!table) {
    throw new ConversionError('PLY の読み込み結果が空でした。');
  }

  return table;
}

async function writeBundle(
  dataTable: DataTable,
  outputName: string,
  deps: SplatTransformDeps,
  createGpuDevice?: GraphicsDeviceFactory,
): Promise<{ outputBuffer: ArrayBuffer; outputBytes: number; deviceUsed: 'gpu' | 'cpu' }> {
  const options = createDefaultOptions();
  const outputFs = new deps.MemoryFileSystem();
  let graphicsDevice: GraphicsDevice | null = null;
  let usedGpu = false;

  const createDevice = createGpuDevice
    ? async () => {
        usedGpu = true;
        graphicsDevice ??= await createGpuDevice();
        return graphicsDevice;
      }
    : undefined;

  try {
    await deps.writeFile(
      {
        filename: outputName,
        outputFormat: deps.getOutputFormat(outputName, options),
        dataTable,
        options,
        createDevice,
      },
      outputFs,
    );
  } catch (error) {
    if (error instanceof BrowserSupportError) {
      throw error;
    }

    throw new ConversionError('SOG の生成に失敗しました。', { cause: error });
  } finally {
    if (graphicsDevice) {
      (graphicsDevice as GraphicsDevice & { destroy?: () => void }).destroy?.();
    }
  }

  const output = outputFs.results.get(outputName);

  if (!output) {
    throw new ConversionError('変換結果を取得できませんでした。');
  }

  return {
    outputBuffer: toArrayBuffer(output),
    outputBytes: output.byteLength,
    deviceUsed: usedGpu ? 'gpu' : 'cpu',
  };
}

export async function convertPlyToSog(
  request: ConversionRequest,
  deps: SplatTransformDeps = splatTransformDeps,
  createGpuDevice?: GraphicsDeviceFactory,
): Promise<ConversionResult> {
  const startedAt = performance.now();
  const inputFs = new deps.MemoryReadFileSystem();
  inputFs.set(request.fileName, toUint8Array(request.buffer));

  let dataTable: DataTable;

  try {
    const tables = await deps.readFile({
      filename: request.fileName,
      inputFormat: deps.getInputFormat(request.fileName),
      options: createDefaultOptions(),
      params: [],
      fileSystem: inputFs,
    });

    dataTable = getPrimaryTable(tables);
  } catch (error) {
    if (error instanceof ConversionError) {
      throw error;
    }

    throw new ConversionError('PLY の読み込みに失敗しました。', { cause: error });
  }

  const outputName = buildOutputName(request.fileName);

  if (request.preferredDevice === 'cpu' || !createGpuDevice) {
    const output = await writeBundle(dataTable, outputName, deps);

    return {
      outputName,
      outputBuffer: output.outputBuffer,
      inputBytes: request.buffer.byteLength,
      outputBytes: output.outputBytes,
      durationMs: performance.now() - startedAt,
      deviceUsed: output.deviceUsed,
    };
  }

  try {
    const output = await writeBundle(dataTable, outputName, deps, createGpuDevice);

    return {
      outputName,
      outputBuffer: output.outputBuffer,
      inputBytes: request.buffer.byteLength,
      outputBytes: output.outputBytes,
      durationMs: performance.now() - startedAt,
      deviceUsed: output.deviceUsed,
    };
  } catch (error) {
    if (!(error instanceof BrowserSupportError)) {
      throw error;
    }
  }

  const cpuOutput = await writeBundle(dataTable, outputName, deps);

  return {
    outputName,
    outputBuffer: cpuOutput.outputBuffer,
    inputBytes: request.buffer.byteLength,
    outputBytes: cpuOutput.outputBytes,
    durationMs: performance.now() - startedAt,
    deviceUsed: cpuOutput.deviceUsed,
  };
}
