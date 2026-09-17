// pdfjs-dist (dùng nội bộ bởi pdf-parse) tham chiếu DOMMatrix — một API trình duyệt, không
// có sẵn trong Node.js — gây "ReferenceError: DOMMatrix is not defined" khi chạy trên server
// (tái hiện được trên Vercel, mục bug 18/09). Polyfill tối thiểu trước khi import pdf-parse;
// chỉ cần đủ để pdfjs-dist load được, không cần render canvas thật vì ta chỉ trích xuất text.
//
// QUAN TRỌNG: import "pdf-parse" phải là DYNAMIC import bên trong hàm — nếu để static import
// ở top-level, JS hoist toàn bộ import declaration lên trước mọi statement thường (kể cả
// statement gán polyfill phía trên), khiến pdf-parse (và pdfjs-dist bên trong) load VÀ CRASH
// trước khi polyfill kịp chạy. Dynamic import() chỉ chạy tại thời điểm gọi, sau khi polyfill
// đã gán xong (đã tái hiện lỗi này thật trên Vercel — polyfill tưởng đã fix nhưng vẫn crash
// y hệt vì lỗi thứ tự load này, mục bug 18/09).
import DOMMatrixPolyfill from "dommatrix";
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = DOMMatrixPolyfill;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
