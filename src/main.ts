import './style.css';

import { normalizeAppError } from './core/errors';
import { formatBytes, formatDuration, MAX_FILE_SIZE_BYTES } from './core/file-utils';
import { ConversionWorkerClient } from './core/conversion/worker-client';
import { PlyInputAdapter } from './core/input-adapters/ply-input-adapter';
import { validateInputFile } from './core/validation';
import type { AppError, AppStatus, ConversionResult } from './core/types';

type ViewResult = ConversionResult & { downloadUrl: string };

type ViewState = {
  status: AppStatus;
  file: File | null;
  error: AppError | null;
  result: ViewResult | null;
  dragging: boolean;
};

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Application root was not found.');
}

const workerSupported = typeof Worker !== 'undefined';
const gpuCompressionAvailable = typeof OffscreenCanvas !== 'undefined' && 'gpu' in navigator;

app.innerHTML = `
  <main class="shell">
    <section class="panel hero">
      <p class="eyebrow">Local Browser Converter</p>
      <h1>PLY to SOG</h1>
      <p class="lede">PLY をドロップして、その場で bundled <code>.sog</code> を生成します。ファイルは外へ送信しません。</p>
      <div class="badges">
        <span class="badge">${gpuCompressionAvailable ? 'GPU auto' : 'CPU fallback'}</span>
        <span class="badge">Single file</span>
        <span class="badge">No backend</span>
      </div>
    </section>

    <section class="panel workflow">
      <div class="dropzone" data-dropzone>
        <p class="dropzone-title">PLY ファイルをここへ</p>
        <p class="dropzone-copy">ドラッグ&ドロップ、またはファイル選択</p>
        <button class="button primary" type="button" data-pick-button>ファイルを選ぶ</button>
        <input class="hidden-input" type="file" accept=".ply" data-file-input />
      </div>

      <div class="actions">
        <button class="button accent" type="button" data-convert-button>変換を開始</button>
        <p class="support-note" data-support-note></p>
      </div>

      <dl class="stats">
        <div class="stat">
          <dt>Status</dt>
          <dd data-status-value>Idle</dd>
        </div>
        <div class="stat">
          <dt>Input</dt>
          <dd data-input-value>-</dd>
        </div>
        <div class="stat">
          <dt>Output</dt>
          <dd data-output-value>-</dd>
        </div>
        <div class="stat">
          <dt>Time</dt>
          <dd data-duration-value>-</dd>
        </div>
      </dl>
    </section>

    <section class="panel detail">
      <div class="detail-block">
        <h2>Selected File</h2>
        <p class="file-name" data-file-name>未選択</p>
        <p class="file-meta" data-file-meta>PLY のみ対応。最大 ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB。</p>
      </div>

      <div class="detail-block">
        <h2>Result</h2>
        <p class="result-copy" data-result-copy>変換後にここへ結果を表示します。</p>
        <a class="button download hidden" data-download-link download>Download .sog</a>
      </div>

      <div class="detail-block error hidden" data-error-panel>
        <h2>Error</h2>
        <p class="error-message" data-error-message></p>
        <p class="error-detail" data-error-detail></p>
      </div>
    </section>
  </main>
`;

const dropzone = app.querySelector<HTMLElement>('[data-dropzone]')!;
const pickButton = app.querySelector<HTMLButtonElement>('[data-pick-button]')!;
const fileInput = app.querySelector<HTMLInputElement>('[data-file-input]')!;
const convertButton = app.querySelector<HTMLButtonElement>('[data-convert-button]')!;
const supportNote = app.querySelector<HTMLParagraphElement>('[data-support-note]')!;
const statusValue = app.querySelector<HTMLElement>('[data-status-value]')!;
const inputValue = app.querySelector<HTMLElement>('[data-input-value]')!;
const outputValue = app.querySelector<HTMLElement>('[data-output-value]')!;
const durationValue = app.querySelector<HTMLElement>('[data-duration-value]')!;
const fileNameValue = app.querySelector<HTMLElement>('[data-file-name]')!;
const fileMetaValue = app.querySelector<HTMLElement>('[data-file-meta]')!;
const resultCopy = app.querySelector<HTMLElement>('[data-result-copy]')!;
const downloadLink = app.querySelector<HTMLAnchorElement>('[data-download-link]')!;
const errorPanel = app.querySelector<HTMLElement>('[data-error-panel]')!;
const errorMessage = app.querySelector<HTMLElement>('[data-error-message]')!;
const errorDetail = app.querySelector<HTMLElement>('[data-error-detail]')!;

const adapter = new PlyInputAdapter();
const workerClient = new ConversionWorkerClient();

const state: ViewState = {
  status: 'idle',
  file: null,
  error: null,
  result: null,
  dragging: false,
};

function clearResult(): void {
  if (state.result) {
    URL.revokeObjectURL(state.result.downloadUrl);
  }

  state.result = null;
}

function setError(error: unknown): void {
  state.error = normalizeAppError(error);
  state.status = 'error';
}

function getStatusLabel(status: AppStatus): string {
  switch (status) {
    case 'idle':
      return 'Idle';
    case 'validating':
      return 'Validating';
    case 'converting':
      return 'Converting';
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
  }
}

function render(): void {
  dropzone.classList.toggle('dragging', state.dragging);
  convertButton.disabled = !state.file || state.status === 'converting' || !workerSupported;

  statusValue.textContent = getStatusLabel(state.status);
  inputValue.textContent = state.file ? formatBytes(state.file.size) : '-';
  outputValue.textContent = state.result ? formatBytes(state.result.outputBytes) : '-';
  durationValue.textContent = state.result ? formatDuration(state.result.durationMs) : '-';

  fileNameValue.textContent = state.file?.name ?? '未選択';
  fileMetaValue.textContent = state.file
    ? `${formatBytes(state.file.size)} / ${gpuCompressionAvailable ? 'GPU auto, CPU fallback available' : 'CPU fallback mode'}`
    : `PLY のみ対応。最大 ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB。`;

  supportNote.textContent = workerSupported
    ? gpuCompressionAvailable
      ? 'WebGPU が利用できる場合は GPU 圧縮を試し、失敗時は CPU に切り替えます。'
      : 'WebGPU が見つからないため、CPU モードで変換します。'
    : 'このブラウザでは Worker を使えないため、変換を開始できません。';

  if (state.result) {
    resultCopy.textContent = `${state.result.outputName} を生成しました。device=${state.result.deviceUsed}`;
    downloadLink.href = state.result.downloadUrl;
    downloadLink.download = state.result.outputName;
    downloadLink.classList.remove('hidden');
  } else {
    resultCopy.textContent =
      state.status === 'converting' ? 'Worker で変換しています。完了まで少し待ってください。' : '変換後にここへ結果を表示します。';
    downloadLink.classList.add('hidden');
    downloadLink.removeAttribute('href');
  }

  if (state.error) {
    errorPanel.classList.remove('hidden');
    errorMessage.textContent = state.error.message;
    errorDetail.textContent = state.error.details ?? '';
  } else {
    errorPanel.classList.add('hidden');
    errorMessage.textContent = '';
    errorDetail.textContent = '';
  }
}

function updateFile(file: File): void {
  clearResult();
  state.file = file;
  state.error = null;
  state.status = 'idle';
  render();
}

async function handleConvert(): Promise<void> {
  if (!state.file || !workerSupported) {
    return;
  }

  clearResult();
  state.error = null;
  state.status = 'validating';
  render();

  try {
    validateInputFile(state.file, adapter);
    const buffer = await adapter.load(state.file);
    state.status = 'converting';
    render();

    const result = await workerClient.convert({
      fileName: state.file.name,
      buffer,
      preferredDevice: 'auto',
    });

    const blob = new Blob([result.outputBuffer], { type: 'application/octet-stream' });
    const downloadUrl = URL.createObjectURL(blob);

    state.result = {
      ...result,
      downloadUrl,
    };
    state.status = 'success';
  } catch (error) {
    setError(error);
  }

  render();
}

function pickFirstFile(fileList: FileList | null): File | null {
  const file = fileList?.item(0);
  return file ?? null;
}

pickButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = pickFirstFile(fileInput.files);

  if (!file) {
    return;
  }

  updateFile(file);
});

convertButton.addEventListener('click', () => {
  void handleConvert();
});

dropzone.addEventListener('dragenter', (event) => {
  event.preventDefault();
  state.dragging = true;
  render();
});

dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  state.dragging = true;
  render();
});

dropzone.addEventListener('dragleave', (event) => {
  event.preventDefault();

  if (event.currentTarget === event.target) {
    state.dragging = false;
    render();
  }
});

dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  state.dragging = false;
  const file = pickFirstFile(event.dataTransfer?.files ?? null);

  if (file) {
    updateFile(file);
  } else {
    render();
  }
});

window.addEventListener('beforeunload', () => {
  clearResult();
  workerClient.dispose();
});

render();
