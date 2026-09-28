import { browser } from 'wxt/browser';
import { ACTIVE_WINDOW_KEY, createBreakWindowController } from '../lib/openBreakWindow';

export default defineBackground(() => {
  const controller = createBreakWindowController({
    create: (url) => browser.windows.create({
      url,
      type: 'popup',
      width: 960,
      height: 640,
      focused: true,
    }),
    get: (id) => browser.windows.get(id),
    focus: (id) => browser.windows.update(id, { focused: true }),
    getStoredId: async () => (await browser.storage.session.get(ACTIVE_WINDOW_KEY))[ACTIVE_WINDOW_KEY],
    setStoredId: async (id) => browser.storage.session.set({ [ACTIVE_WINDOW_KEY]: id }),
    clearStoredId: async () => browser.storage.session.remove(ACTIVE_WINDOW_KEY),
    getUrl: () => browser.runtime.getURL('/break.html'),
  });

  browser.action.onClicked.addListener(() => {
    void controller.open().catch(() => undefined);
  });
  browser.commands.onCommand.addListener((command) => {
    if (command === 'open-windowless') void controller.open().catch(() => undefined);
  });
  browser.windows.onRemoved.addListener((windowId) => {
    void controller.onWindowRemoved(windowId);
  });
});
