import type { InputAdapter } from './input-adapter';

export class PlyInputAdapter implements InputAdapter {
  accepts(file: File): boolean {
    return /\.ply$/i.test(file.name);
  }

  load(file: File): Promise<ArrayBuffer> {
    return file.arrayBuffer();
  }
}
