export type PreferredDevice = 'auto' | 'cpu';

export type AppStatus = 'idle' | 'validating' | 'converting' | 'success' | 'error';

export type AppErrorKind = 'input' | 'conversion' | 'unsupported';

export interface AppError {
  kind: AppErrorKind;
  message: string;
  details?: string;
}

export interface ConversionRequest {
  fileName: string;
  buffer: ArrayBuffer;
  preferredDevice: PreferredDevice;
}

export interface ConversionResult {
  outputName: string;
  outputBuffer: ArrayBuffer;
  inputBytes: number;
  outputBytes: number;
  durationMs: number;
  deviceUsed: 'gpu' | 'cpu';
}
