import { NativeService } from "./NativeService.base";

export class TauriNativeService extends NativeService {
  private readonly listeners = [] as (() => void)[];
  private store: any = undefined;

  override async openFileOrUrl(
    path: string,
    openWith?: string | undefined
  ): Promise<void> {
    const tauri = await import("@tauri-apps/api");
    return tauri.shell.open(path, openWith);
  }

  override async startEventListener(): Promise<void> {
    const tauri = await import("@tauri-apps/api");
    await tauri.event.listen(
      tauri.event.TauriEvent.WINDOW_CLOSE_REQUESTED,
      async () => {
        this.listeners.forEach(async (cb) => await cb());
      }
    );
  }

  override onWindowClosing(cb: () => void): void {
    this.listeners.push(cb);
  }

  override async openFileDialog(): Promise<string[]> {
    const tauri = await import("@tauri-apps/api");

    return tauri.dialog.open({ multiple: true }) as Promise<string[]>;
  }

  override async openFolderDialog(): Promise<string> {
    const tauri = await import("@tauri-apps/api");

    return tauri.dialog.open({ directory: true }) as Promise<string>;
  }

  override async readBinary(path: string): Promise<Uint8Array | null> {
    const tauri = await import("@tauri-apps/api");

    return tauri.invoke("read_binary", { path });
  }

  // HACK: I have no idea why but this doesn't block the ui
  override async readBinaryLimited(path: string): Promise<Uint8Array | null> {
    const tauri = await import("@tauri-apps/api");

    const exists = await tauri.fs.exists(path, {
      dir: tauri.fs.BaseDirectory.AppData,
    });
    if (!exists) return Promise.resolve(null);

    return tauri.fs.readBinaryFile(path, {
      dir: tauri.fs.BaseDirectory.AppData,
    });
  }
}
