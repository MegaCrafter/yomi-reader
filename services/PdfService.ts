import { PageViewport, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import * as pkg from "pdfjs-dist";
const { GlobalWorkerOptions, getDocument, Util } = pkg;
import { Annotation } from "~/types/Annotation";
import { BookModel } from "~/types/BookModel";
import { TidyTextSpan } from "~/types/TidyTextSpan";
import { OutlineNode } from "../types/OutlineNode";

export class PdfService {
  private pdfMap = new Map<string, PDFDocumentProxy>();
  private bookMap = new Map<string, BookModel>();

  async loadPDF(file: Uint8Array | ArrayBuffer, path: string) {
    GlobalWorkerOptions.workerSrc = "lib/pdf.worker.js";

    const pdf = await getDocument({ data: file }).promise;
    const metadata = (await pdf.getMetadata()).metadata;
    const filename = path.split("/").pop();

    const labels = await pdf.getPageLabels();

    const outline = await this.tidyOutline(pdf);

    this.pdfMap.set(pdf.fingerprints[0], pdf);

    const book = {
      name: metadata?.get("dc:title") || filename,
      path,
      fingerprint: pdf.fingerprints[0],
      author: metadata?.get("dc:creator")?.join(", ") || "",
      numPages: pdf.numPages,
      outline: outline ?? undefined,
      labels:
        labels ??
        [...Array(pdf.numPages).keys()].map((num) => (num + 1).toString()),
    } satisfies BookModel;

    this.bookMap.set(path, book);

    return book;
  }

  getLoadedBook(path: string) {
    return this.bookMap.get(path);
  }

  async getPageDimensions(
    fingerprint: string,
    pagenum: number,
    options?: { width?: number; height?: number }
  ): Promise<{ width: number; height: number } | null> {
    const pdf = this.pdfMap.get(fingerprint);
    if (!pdf) {
      console.error(
        `${fingerprint} | Tried to get dimensions but the pdf was not loaded!`
      );
      return null;
    }

    const page = await pdf.getPage(pagenum);

    const viewport = page.getViewport({
      scale: 1,
    });

    let width = viewport.width;
    let height = viewport.height;

    let scale = 1;
    if (options?.width) {
      scale = options?.width ? options.width / viewport.width : 1;
    } else if (options?.height) {
      scale = options?.height ? options.height / viewport.height : 1;
    }

    if (options?.height) {
      width *= scale;
      height *= scale;
    }

    return { width: Math.floor(width), height: Math.floor(height) };
  }

  // Width will be used if both width and height are given
  async renderPDFPage(
    fingerprint: string,
    pagenum: number,
    canvas: HTMLCanvasElement,
    options?: {
      width?: number;
      height?: number;
    }
  ) {
    const pdf = this.pdfMap.get(fingerprint);
    if (!pdf) {
      console.error(
        `${fingerprint} | Tried to render but the pdf was not loaded!`
      );
      return null;
    }

    const page = await pdf.getPage(pagenum);

    // For calculating the wanted scale factor based on initial width or height
    const viewportTest = page.getViewport({
      scale: 1,
    });

    let scale = 1;
    if (options?.width) {
      scale = options?.width ? options.width / viewportTest.width : 1;
    } else if (options?.height) {
      scale = options?.height ? options.height / viewportTest.height : 1;
    }

    const viewport = page.getViewport({
      scale,
      dontFlip: false,
    });

    const ctx = canvas.getContext("2d")!;
    const text = await this.tidyTextContent(page, viewport, ctx);
    const annotations = await this.tidyAnnotations(pdf, page, scale);

    // this.modifyContextFunctions(ctx, viewportTest, {
    //   background: () => "#333338",
    //   foreground: () => "#eee",
    //   imageFilter: () => "invert()",
    // });

    await page.render({
      canvasContext: ctx,
      viewport,
    });

    return { text, annotations };
  }

  async cleanupPDF(fingerprint: string, path: string) {
    const pdf = this.pdfMap.get(fingerprint);
    if (!pdf) return;

    this.pdfMap.delete(fingerprint);
    this.bookMap.delete(path);

    await pdf.cleanup();
  }

  private async tidyOutline(pdf: PDFDocumentProxy) {
    const outline = await pdf.getOutline();
    if (!outline) return null;

    const tidy = async (element: any) => {
      const tidyEl = {} as OutlineNode;
      if (Array.isArray(element.dest)) {
        tidyEl.destPage = await pdf.getPageIndex(element.dest[0]);
      }

      if (typeof element.dest === "string" || element.dest instanceof String) {
        const dest = await pdf.getDestination(element.dest);
        tidyEl.destPage = await pdf.getPageIndex(dest![0]);
      }

      tidyEl.url = element.url;
      tidyEl.title = element.title;
      tidyEl.bold = element.bold;
      tidyEl.italic = element.italic;
      tidyEl.items = await Promise.all(element.items.map(tidy));

      return tidyEl;
    };

    return Promise.all(outline.map(tidy));
  }

  // https://gist.github.com/hubgit/600ec0c224481e910d2a0f883a7b98e3
  private async tidyTextContent(
    page: PDFPageProxy,
    viewport: PageViewport,
    ctx: CanvasRenderingContext2D
  ) {
    const content = await page.getTextContent();
    if (!content) return null;

    return (content.items as any[]).map((item) => {
      const tx = Util.transform(
        Util.transform(viewport.transform, item.transform),
        [1, 0, 0, -1, 0, 0]
      );

      const style = content.styles[item.fontName];

      const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

      if (style.ascent) {
        tx[5] -= fontSize * style.ascent;
      } else if (style.descent) {
        tx[5] -= fontSize * (1 + style.descent);
      } else {
        tx[5] -= fontSize / 2;
      }

      if (item.width > 0) {
        ctx.font = tx[0] + "px " + style.fontFamily;

        const textWidth = ctx.measureText(item.str).width;

        if (textWidth > 0) {
          //tx[0] *= (textItem.width * viewport.scale) / width;
          tx[0] = (item.width * viewport.scale) / textWidth;
        }
      }

      return {
        textContent: item.str,
        fontFamily: style.fontFamily,
        fontSize,
        transform: tx[0],
        left: tx[4], // as percentage
        top: tx[5],
        eol: item.hasEOL,
        dir: item.dir as "ttb" | "ltr" | "rtl",
      } satisfies TidyTextSpan;
    });
  }

  private async tidyAnnotations(
    pdf: PDFDocumentProxy,
    page: PDFPageProxy,
    scale: number
  ) {
    const annotations = await page.getAnnotations();
    if (!annotations) return null;

    return Promise.all(
      annotations.map(async (annot) => {
        const tidy = {} as Annotation;
        if (Array.isArray(annot.dest)) {
          tidy.destPage = await pdf.getPageIndex(annot.dest[0]);
        }

        if (typeof annot.dest === "string" || annot.dest instanceof String) {
          const dest = await pdf.getDestination(annot.dest);
          tidy.destPage = await pdf.getPageIndex(dest![0]);
        }

        if (annot.url) {
          tidy.url = annot.url;
        }

        tidy.rect = (annot.rect as Array<number>).map((num) => num * scale);

        return tidy;
      })
    );
  }

  private modifyContextFunctions(
    ctx: CanvasRenderingContext2D,
    viewport: PageViewport,
    options?: {
      background?: (
        currentFill: string | CanvasGradient | CanvasPattern
      ) => string;
      foreground?: (
        currentFill: string | CanvasGradient | CanvasPattern
      ) => string;
      imageFilter?: (currentFilter: string) => string;
    }
  ) {
    this.modifyContextFunctionsInner(ctx, viewport, (ctxp, funcname) => {
      if (funcname === "fillRect" && options?.background) {
        ctxp.fillStyle = options.background(ctxp.fillStyle);
      }
      if (funcname === "fillText" && options?.foreground) {
        ctxp.fillStyle = options.foreground(ctxp.fillStyle);
      }
      if (funcname === "drawImage" && options?.imageFilter) {
        ctxp.filter = options.imageFilter(ctxp.filter);
      }
    });
  }

  // Idea inspired from https://github.com/shivaprsd/doq
  private modifyContextFunctionsInner(
    ctx: CanvasRenderingContext2D,
    viewport: PageViewport,
    beforeDraw?: (
      ctx: CanvasRenderingContext2D,
      funcname:
        | "fill"
        | "stroke"
        | "fillRect"
        | "strokeRect"
        | "fillText"
        | "strokeText"
        | "drawImage"
    ) => void
  ) {
    const ctxp = ctx as any;
    const editFunc = (name: string) => {
      ctxp["orig" + name] = ctxp[name];
      ctxp[name] = (...params: any) => {
        ctxp.save();
        beforeDraw?.(ctx, name as any);
        ctxp["orig" + name](...params);
        ctxp.restore();
      };
    };

    // TODO: Use fillText transform to have dynamic text coloring maybe?

    ["fill", "stroke"].forEach((f) => {
      ["", "Rect", "Text"].forEach((e) => {
        editFunc(f + e);
      });
    });

    ctxp["origdrawImage"] = ctxp["drawImage"];
    editFunc("drawImage");

    // Making backgrounds as image and stuff
    // const name = "fillRect";
    // ctxp["orig" + name] = ctxp[name];
    // ctxp[name] = (...params: any) => {
    //   const prevFillStyle = ctxp["fillStyle"];
    //   const prevFilter = ctxp["filter"];
    //   beforeDraw?.(ctx, name as any);
    //   const img = new Image();
    //   img.src = "/wallpaper.png";
    //   img.onload = () => {
    //     ctxp.scale(1, -1);
    //     ctxp["origdrawImage"](img, -200, -viewport.height);
    //     ctxp.scale(1, -1);
    //   };
    //   ctxp["fillStyle"] = prevFillStyle;
    //   ctxp["filter"] = prevFilter;
    // };
  }
}
