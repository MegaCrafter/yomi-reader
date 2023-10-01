import { OutlineNode } from "./OutlineNode";

export interface BookModel {
  name: string;
  path: string;
  fingerprint: string;
  numPages: number;
  author: string;
  labels: string[];
  outline?: OutlineNode[];
}
