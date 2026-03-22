import type { AppError, AppErrorKind } from './types';

type DomainErrorOptions = {
  cause?: unknown;
  details?: string;
};

abstract class DomainError extends Error {
  readonly kind: AppErrorKind;
  readonly details?: string;

  protected constructor(kind: AppErrorKind, message: string, options: DomainErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.kind = kind;
    this.details = options.details;
    this.name = new.target.name;
  }
}

export class InputValidationError extends DomainError {
  constructor(message: string, options: DomainErrorOptions = {}) {
    super('input', message, options);
  }
}

export class BrowserSupportError extends DomainError {
  constructor(message: string, options: DomainErrorOptions = {}) {
    super('unsupported', message, options);
  }
}

export class ConversionError extends DomainError {
  constructor(message: string, options: DomainErrorOptions = {}) {
    super('conversion', message, options);
  }
}

const UNSUPPORTED_PATTERN = /webgpu|gpu|offscreencanvas|graphics device|worker|not supported|unsupported|browser/i;

function extractDetails(error: unknown): string | undefined {
  if (error instanceof DomainError) {
    return error.details;
  }

  if (error instanceof Error && error.cause instanceof Error) {
    return error.cause.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return undefined;
}

export function normalizeAppError(error: unknown): AppError {
  if (error instanceof DomainError) {
    return {
      kind: error.kind,
      message: error.message,
      details: error.details ?? extractDetails(error.cause),
    };
  }

  if (error instanceof Error) {
    const kind: AppErrorKind = UNSUPPORTED_PATTERN.test(error.message) ? 'unsupported' : 'conversion';

    return {
      kind,
      message: kind === 'unsupported' ? 'このブラウザでは必要な機能を利用できません。' : '変換処理に失敗しました。',
      details: error.message,
    };
  }

  return {
    kind: 'conversion',
    message: '変換処理に失敗しました。',
    details: typeof error === 'string' ? error : undefined,
  };
}
