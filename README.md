# WINDOWLESS / GABOR BREAK v0.1.1
視力リフレッシュ

A short visual break for desktop work. The local Chrome extension runs a quiet pseudo window, a slow gaze drift, and three procedurally rendered Gabor direction questions. It is a visual break and perception challenge, not a medical tool.

## Requirements

- Windows 11 and Google Chrome
- Node.js current LTS
- pnpm

## Develop

```sh
pnpm install
pnpm dev
```

WXT opens Chrome with the development extension. For a production build, run `pnpm build`; the unpacked MV3 extension is written to `.output/chrome-mv3`. In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select that directory.

Click the toolbar extension icon to open WINDOWLESS. The global shortcut is `Ctrl+Shift+8`; change it at `chrome://extensions/shortcuts`.

## Checks

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Data and permissions

The extension requests only the `storage` permission. It saves `sessionCount`, `contrastLevel`, `totalCorrect`, `totalQuestions`, and `lastPlayedAt` to Chrome local extension storage. Stimulus angles are generated for each session and are not retained. There are no host permissions, external services, analytics, or network requests.

Contrast difficulty starts at level 3, ranges from 1 to 8, increases by one after 3/3, stays the same after 2/3, and decreases by one after 0/3 or 1/3. It is labeled **Contrast Lv.** throughout.

Press Escape to close a session at any time. A completed result closes automatically after about three seconds.
