/// <reference lib="webworker" />

import { WebPCodec } from '@playcanvas/splat-transform';
import webpWasmUrl from '@playcanvas/splat-transform/lib/webp.wasm?url';
import { createGraphicsDevice } from 'playcanvas';

import { BrowserSupportError, normalizeAppError } from '../core/errors';
import { convertPlyToSog } from '../core/conversion/run-conversion';
import type { WorkerRequestMessage, WorkerResponseMessage } from '../core/conversion/worker-protocol';

if (!('window' in globalThis)) {
  Reflect.set(globalThis as object, 'window', globalThis);
}

WebPCodec.wasmUrl = webpWasmUrl;

async function createWorkerGraphicsDevice() {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new BrowserSupportError('OffscreenCanvas が利用できないため、GPU 圧縮を開始できません。');
  }

  if (!('gpu' in navigator)) {
    throw new BrowserSupportError('WebGPU が利用できないため、CPU モードへ切り替えます。');
  }

  try {
    return await createGraphicsDevice(new OffscreenCanvas(1, 1) as unknown as HTMLCanvasElement, {
      deviceTypes: ['webgpu'],
      antialias: false,
      depth: false,
      stencil: false,
    });
  } catch (error) {
    throw new BrowserSupportError('WebGPU デバイスを初期化できませんでした。', { cause: error });
  }
}

self.addEventListener('message', async (event: MessageEvent<WorkerRequestMessage>) => {
  if (event.data.type !== 'convert') {
    return;
  }

  try {
    const result = await convertPlyToSog(event.data.payload, undefined, createWorkerGraphicsDevice);
    const response: WorkerResponseMessage = {
      type: 'success',
      id: event.data.id,
      payload: result,
    };

    self.postMessage(response, [result.outputBuffer]);
  } catch (error) {
    const response: WorkerResponseMessage = {
      type: 'error',
      id: event.data.id,
      payload: normalizeAppError(error),
    };

    self.postMessage(response);
  }
});
