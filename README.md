# PLY2SOG GUI

`.ply` の Gaussian Splat ファイルを、ブラウザ上で bundled `.sog` に変換するローカル GUI アプリです。

サーバーへアップロードせず、単一ページで完結します。

## What It Does

- `.ply` をドラッグ&ドロップ、またはファイル選択で投入
- ブラウザ内で `PLY -> SOG` を変換
- 生成した bundled `.sog` をそのままダウンロード
- 変換中も UI を止めないよう Web Worker で処理
- WebGPU が使える場合は GPU を試行し、失敗時は CPU にフォールバック

## Scope

- 初版は `.ply` 入力のみ対応
- 出力は bundled `.sog` のみ
- 複数ファイル同時変換、3D プレビュー、サーバー保存は未対応

## Requirements

- Node.js 24 系で確認
- 最新の Chromium 系ブラウザ推奨
  - Chrome / Edge を想定
  - WebGPU が使えない環境でも CPU フォールバックで動作

## Local Development

```bash
npm install
npm run dev
```

Vite の開発サーバーが立ち上がったら、表示された URL をブラウザで開いて使えます。

## Scripts

```bash
npm run dev
npm run test
npm run build
npm run preview
```

## Validation

このリポジトリでは以下を通しています。

- `npm run test`
- `npm run build`

## Notes

- 入力ファイルはローカルのブラウザ内で処理されます。
- 変換結果の権利は元の `.ply` アセットのライセンスに従います。
- 依存ライセンスの整理は `THIRD_PARTY_NOTICES.md` を参照してください。
