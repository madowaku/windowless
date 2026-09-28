export const ACTIVE_WINDOW_KEY = 'windowlessActiveWindowId';

export type BreakWindowApi = {
  create(url: string): Promise<{ id?: number } | undefined>;
  get(id: number): Promise<unknown>;
  focus(id: number): Promise<unknown>;
  getStoredId(): Promise<unknown>;
  setStoredId(id: number): Promise<void>;
  clearStoredId(): Promise<void>;
  getUrl(): string;
};

export function createBreakWindowController(api: BreakWindowApi) {
  let opening: Promise<void> | undefined;

  return {
    open(): Promise<void> {
      if (opening) return opening;

      opening = (async () => {
        const storedId = await api.getStoredId().catch(() => undefined);
        if (typeof storedId === 'number' && Number.isInteger(storedId)) {
          try {
            await api.get(storedId);
            await api.focus(storedId);
            return;
          } catch {
            await api.clearStoredId().catch(() => undefined);
          }
        }

        const created = await api.create(api.getUrl());
        if (typeof created?.id === 'number') {
          await api.setStoredId(created.id).catch(() => undefined);
        }
      })().finally(() => {
        opening = undefined;
      });

      return opening;
    },

    async onWindowRemoved(windowId: number): Promise<void> {
      const storedId = await api.getStoredId().catch(() => undefined);
      if (storedId === windowId) await api.clearStoredId().catch(() => undefined);
    },
  };
}
