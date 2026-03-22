import { describe, expect, it } from 'vitest';

import { BrowserSupportError, ConversionError, InputValidationError, normalizeAppError } from './errors';

describe('normalizeAppError', () => {
  it('preserves input errors', () => {
    const normalized = normalizeAppError(new InputValidationError('PLY only'));

    expect(normalized.kind).toBe('input');
    expect(normalized.message).toBe('PLY only');
  });

  it('preserves unsupported errors', () => {
    const normalized = normalizeAppError(new BrowserSupportError('WebGPU unavailable'));

    expect(normalized.kind).toBe('unsupported');
    expect(normalized.message).toBe('WebGPU unavailable');
  });

  it('preserves conversion errors', () => {
    const normalized = normalizeAppError(new ConversionError('SOG failed'));

    expect(normalized.kind).toBe('conversion');
    expect(normalized.message).toBe('SOG failed');
  });

  it('maps unknown webgpu failures to unsupported', () => {
    const normalized = normalizeAppError(new Error('Unable to retrieve GPU device'));

    expect(normalized.kind).toBe('unsupported');
    expect(normalized.details).toMatch(/gpu/i);
  });
});
