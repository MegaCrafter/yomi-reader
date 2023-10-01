export interface TidyTextSpan {
  textContent: string;
  fontFamily: string;
  fontSize: number;
  transform: number;
  left: number;
  top: number;
  eol: boolean;
  dir: "ttb" | "ltr" | "rtl";
}
