import { InputValidationError } from './errors';
import { MAX_FILE_SIZE_BYTES } from './file-utils';
import type { InputAdapter } from './input-adapters/input-adapter';

export function validateInputFile(file: File, adapter: InputAdapter): void {
  if (!adapter.accepts(file)) {
    throw new InputValidationError('PLY ファイルのみ対応しています。');
  }

  if (file.size === 0) {
    throw new InputValidationError('空のファイルは変換できません。');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new InputValidationError(`ファイルサイズは ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB 以下にしてください。`);
  }
}
