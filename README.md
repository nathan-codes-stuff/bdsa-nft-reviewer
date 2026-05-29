# BDSA NFT Reviewer

Standalone React app for reviewing YOLOv5-detected neurofibrillary tangles (NFTs) on Alzheimer's brain whole-slide images stored in a Digital Slide Archive (DSA) instance.

This app is a thin, opinionated UI on top of [`bdsa-react-components`](https://github.com/Gutman-Lab/bdsa-react-components). It does **not** run inference. Detections must already exist as DSA annotations on the slide item (created by the upstream [`yolo-braak-stage`](https://github.com/Gutman-Lab/yolo-braak-stage) pipeline).

## Why this exists

The component library is currently only browseable via Storybook, and the main workflow components (`SlideViewer`, `AnnotationEditor`) have no stories. This app wires those components into one screen with a sane workflow:

1. Log in to a DSA server.
2. Browse to a slide item.
3. Review YOLO-detected NFT bounding boxes side-by-side with the slide.
4. Accept / reject / refine with hotkeys.
5. Save back to DSA.

Two modes:
- **Pathologist** — clean review UI with hotkeys.
- **ML Researcher** — switch between model annotation documents, see per-ROI stats, export CSV.

## Research-grade UI guardrails

This app is used for Alzheimer's research. Several invariants are enforced in the UI:

- Save state is always visible (`dirty` / `saved` / `error`); no silent auto-save.
- The DSA annotation document ID and model identifier are stamped on screen at all times.
- The confidence threshold value is displayed exactly as configured, no rounding.
- Accepting / rejecting a detection writes a new element with the reviewer's verdict; the original ML element is preserved for audit.
- Cache vs live fetch is indicated.
- API errors are surfaced verbatim, never swallowed.

## Setup

This app depends on [`bdsa-react-components`](https://github.com/Gutman-Lab/bdsa-react-components) via a relative `file:` path because the library is not yet published to npm and `github:` installs ship an empty `dist/` (the library's `package.json#files` field excludes source). The setup script handles cloning + building the sibling library automatically.

```bash
git clone https://github.com/<your-fork>/bdsa-nft-reviewer.git
cd bdsa-nft-reviewer
npm run setup     # clones + builds bdsa-react-components as a sibling, then installs this app
npm run dev
```

Open http://localhost:5173, enter a DSA server URL plus credentials, log in, and pick a slide.

### Directory layout after setup

```
parent-dir/
  bdsa-react-components/   <-- cloned by setup, built once
  bdsa-nft-reviewer/       <-- this repo
```

### Re-installing later

`npm run setup` is idempotent. It will:
- Skip the clone if the sibling repo already exists.
- Skip the lib build if `dist/` already exists.
- Always run `npm install` in this app.

To force a fresh library build: `rm -rf ../bdsa-react-components/dist && npm run setup`.

## Status

v0.1 — scaffold. Not yet wired end-to-end. Verification checklist lives in `C:\Users\jeffn\.claude\plans\okay-so-i-am-unified-tower.md`.
