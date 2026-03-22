import { normalizeAppError } from '../errors';
import type { ConversionRequest, ConversionResult } from '../types';
import type { WorkerRequestMessage, WorkerResponseMessage } from './worker-protocol';

type PendingJob = {
  resolve: (result: ConversionResult) => void;
  reject: (error: unknown) => void;
};

export class ConversionWorkerClient {
  private worker: Worker | null = null;

  private readonly pending = new Map<string, PendingJob>();

  private nextId = 0;

  async convert(request: ConversionRequest): Promise<ConversionResult> {
    const worker = this.getWorker();
    const jobId = `job-${this.nextId++}`;

    return new Promise<ConversionResult>((resolve, reject) => {
      this.pending.set(jobId, { resolve, reject });

      const message: WorkerRequestMessage = {
        type: 'convert',
        id: jobId,
        payload: request,
      };

      worker.postMessage(message, [request.buffer]);
    });
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;

    for (const [, job] of this.pending) {
      job.reject(normalizeAppError(new Error('Worker terminated.')));
    }

    this.pending.clear();
  }

  private getWorker(): Worker {
    if (this.worker) {
      return this.worker;
    }

    this.worker = new Worker(new URL('../../workers/conversion.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleWorkerError);

    return this.worker;
  }

  private readonly handleMessage = (event: MessageEvent<WorkerResponseMessage>): void => {
    const pending = this.pending.get(event.data.id);

    if (!pending) {
      return;
    }

    this.pending.delete(event.data.id);

    if (event.data.type === 'success') {
      pending.resolve(event.data.payload);
      return;
    }

    pending.reject(event.data.payload);
  };

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    const normalized = normalizeAppError(new Error(event.message || 'Worker execution failed.'));

    for (const [, job] of this.pending) {
      job.reject(normalized);
    }

    this.pending.clear();
  };
}
