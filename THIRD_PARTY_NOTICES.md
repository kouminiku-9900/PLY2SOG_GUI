# Third-Party Notices

This project is currently a private application (`package.json` has `"private": true`).
This file records the runtime dependency licenses reviewed for the browser build as of 2026-03-22.

## Reviewed Runtime Dependencies

### `@playcanvas/splat-transform` 1.9.2
- License: MIT
- Local package metadata: `node_modules/@playcanvas/splat-transform/package.json`
- Local license text: `node_modules/@playcanvas/splat-transform/LICENSE`
- Upstream: <https://github.com/playcanvas/splat-transform>
- Notes:
  - Commercial use, modification, and redistribution are permitted.
  - Preserve the copyright and license notice in redistributions.

### `playcanvas` 2.17.2
- License: MIT
- Local package metadata: `node_modules/playcanvas/package.json`
- Local license text: `node_modules/playcanvas/LICENSE`
- Upstream: <https://github.com/playcanvas/engine>
- Notes:
  - Commercial use, modification, and redistribution are permitted.
  - Preserve the copyright and license notice in redistributions.

### `meshoptimizer` 1.0.1
- License: MIT
- Local package metadata: `node_modules/meshoptimizer/package.json`
- Local license text: `node_modules/meshoptimizer/LICENSE.md`
- Upstream: <https://github.com/zeux/meshoptimizer>
- Notes:
  - Commercial use, modification, and redistribution are permitted.
  - Preserve the copyright and license notice in redistributions.

### `webgpu` 0.3.10
- License: BSD-3-Clause style license
- Local package metadata: `node_modules/webgpu/package.json`
- Local license text: `node_modules/webgpu/LICENSE.md`
- Upstream: <https://github.com/dawn-gpu/node-webgpu>
- Notes:
  - Commercial use, modification, and redistribution are permitted.
  - Preserve the copyright notice, license conditions, and disclaimer.
  - Do not use the project or contributor names to endorse derived products without permission.

## Assessment

- No copyleft license was identified in the reviewed runtime dependency set used by this app.
- For normal commercial/internal distribution of this browser app, the main compliance action is to ship the relevant third-party license notices.
- This review is limited to the runtime dependency chain actually used by the app build. Dev tooling is not included here because it is not redistributed with the built app.

## Operational / Legal Notes

- You must have the right to use and convert the input `.ply` files. The app does not grant any rights over third-party 3D assets.
- Generated `.sog` output is still derived from the source asset. Redistribution rights depend on the license/contract for the source asset.
- The app processes files locally in the browser and does not upload them by design, which reduces privacy/compliance exposure compared with a server-side converter.
- This document is an engineering compliance note, not legal advice. If you plan external commercial distribution, legal review should confirm your final notice packaging and asset rights flow.
