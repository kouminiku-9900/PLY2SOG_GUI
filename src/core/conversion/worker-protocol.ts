import type { AppError, ConversionRequest, ConversionResult } from '../types';

export type WorkerRequestMessage = {
  type: 'convert';
  id: string;
  payload: ConversionRequest;
};

export type WorkerResponseMessage =
  | {
      type: 'success';
      id: string;
      payload: ConversionResult;
    }
  | {
      type: 'error';
      id: string;
      payload: AppError;
    };
