export interface OutlineNode {
  title: string;
  bold: boolean;
  italic: boolean;
  /**
   * - The color in RGB format to use for
   * display purposes.
   */
  // color: Uint8ClampedArray;
  // dest: string | Array<any> | null;
  // url: string | null;
  // unsafeUrl: string | undefined;
  // newWindow: boolean | undefined;
  // count: number | undefined;
  destPage?: number;
  url?: string;
  items: OutlineNode[];
}
