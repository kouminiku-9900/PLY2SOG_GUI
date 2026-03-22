import { describe, expect, it } from 'vitest';

import { InputValidationError } from './errors';
import { PlyInputAdapter } from './input-adapters/ply-input-adapter';
import { validateInputFile } from './validation';

describe('validateInputFile', () => {
  const adapter = new PlyInputAdapter();

  it('accepts a non-empty ply file', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'scene.ply');

    expect(() => validateInputFile(file, adapter)).not.toThrow();
  });

  it('rejects non-ply files', () => {
    const file = new File([new Uint8Array([1])], 'scene.usdz');

    expect(() => validateInputFile(file, adapter)).toThrow(InputValidationError);
  });

  it('rejects empty files', () => {
    const file = new File([], 'scene.ply');

    expect(() => validateInputFile(file, adapter)).toThrow(InputValidationError);
  });
});
