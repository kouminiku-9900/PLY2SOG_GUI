export interface InputAdapter {
  accepts(file: File): boolean;
  load(file: File): Promise<ArrayBuffer>;
}
