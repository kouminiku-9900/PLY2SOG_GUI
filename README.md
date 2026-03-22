# PLY2SOG GUI

Local browser app for converting `.ply` Gaussian splat files into bundled `.sog`.

## Features

- Single-page local web UI
- Drag and drop or file picker input
- Browser-only processing
- Web Worker based conversion
- GPU auto mode with CPU fallback
- Bundled `.sog` download

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run test
npm run build
```

## Notes

- Input files are processed locally in the browser.
- Runtime dependency notices are summarized in `THIRD_PARTY_NOTICES.md`.
