// pdfjs-dist (dùng nội bộ bởi pdf-parse) tham chiếu DOMMatrix — một API trình duyệt, không
// có sẵn trong Node.js — gây "ReferenceError: DOMMatrix is not defined" khi chạy trên server
// (tái hiện được trên Vercel, mục bug 18/09). Polyfill tối thiểu trước khi import pdf-parse;
// chỉ cần đủ để pdfjs-dist load được, không cần render canvas thật vì ta chỉ trích xuất text.
import DOMMatrixPolyfill from "dommatrix";
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = DOMMatrixPolyfill;
}

import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
