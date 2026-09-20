import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use the bundled pdf.js engine from pdf-parse
const PDFJS = require('pdf-parse/lib/pdf.js/v2.0.550/build/pdf.js');
PDFJS.disableWorker = true;

/**
 * Extract raw text from uploaded PDF buffer using pdf-parse's engine.
 * Rejects non-text or empty/scanned PDFs without OCR.
 */
export async function extractTextFromPdf(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error('Provided PDF buffer is empty.');
  }

  let loadingTask = null;
  let doc = null;

  try {
    const b = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const cleanUint8 = new Uint8Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    loadingTask = PDFJS.getDocument({ data: cleanUint8 });
    doc = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });
      const pageStr = content.items.map((item) => item.str).join(' ');
      fullText += (fullText ? '\n\n' : '') + pageStr;
    }

    const trimmed = fullText.trim();
    if (!trimmed || trimmed.length < 10) {
      throw new Error(
        'Document is not text-extractable. Scanned or image-only PDFs without an embedded text layer are not supported (OCR disabled per compliance policy).'
      );
    }

    return {
      raw_text: trimmed,
      num_pages: doc.numPages,
    };
  } catch (err) {
    if (err.message.includes('not text-extractable')) {
      throw err;
    }
    throw new Error(`Failed to parse PDF document: ${err.message}`);
  } finally {
    try {
      if (doc) doc.cleanup();
      if (loadingTask) loadingTask.destroy();
    } catch (_) {}
  }
}
