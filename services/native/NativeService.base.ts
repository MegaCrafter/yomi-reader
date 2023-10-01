export abstract class NativeService {
  abstract openFileOrUrl(path: string, openWith?: string): Promise<void>;
  abstract startEventListener(): Promise<void>;
  abstract onWindowClosing(cb: () => void): void;
  abstract openFileDialog(): Promise<string[]>;
  abstract openFolderDialog(): Promise<string>;
  abstract readBinary(path: string): Promise<Uint8Array | null>;
  abstract readBinaryLimited(path: string): Promise<Uint8Array | null>;
}
