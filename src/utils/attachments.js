import { logger } from '../lib/logger';

// Chat attachments → GPT-4o vision (images) + PDF text extraction.
// Images become OpenAI `image_url` content parts; PDFs are extracted to text
// client-side (pdfjs, lazy-loaded) and fed as context. Video is not supported
// by the chat model and is rejected.

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;    // 5 MB / image
const MAX_PDF_BYTES   = 12 * 1024 * 1024;   // 12 MB / PDF
const MAX_PDF_CHARS   = 40_000;             // cap extracted text per PDF
export const MAX_ATTACHMENTS = 4;

export const ATTACH_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,application/pdf';

export const isImage = (file) => /^image\//.test(file.type);
export const isPdf   = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

const readAsDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('could not read file'));
  r.readAsDataURL(file);
});

const readAsArrayBuffer = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('could not read file'));
  r.readAsArrayBuffer(file);
});

/** Extract text from a PDF File using pdfjs (lazy-loaded so it never bloats the main bundle). */
export const extractPdfText = async (file) => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const data = await readAsArrayBuffer(file);
  const doc  = await pdfjs.getDocument({ data }).promise;
  let text = '';
  for (let p = 1; p <= doc.numPages && text.length < MAX_PDF_CHARS; p++) {
    const page    = await doc.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((i) => i.str).join(' ') + '\n';
  }
  return text.slice(0, MAX_PDF_CHARS).trim();
};

/**
 * Process picked files into chat-ready parts.
 * @returns {{ imageParts: Array, pdfTexts: Array<{name,text}>, notes: string[], errors: string[] }}
 *   imageParts — OpenAI `image_url` content parts (data URLs)
 *   pdfTexts   — extracted PDF text to fold into the prompt
 *   notes      — short labels for the persisted message (no base64)
 */
export const processAttachments = async (files) => {
  const imageParts = [];
  const pdfTexts   = [];
  const notes      = [];
  const errors     = [];

  for (const file of files) {
    try {
      if (isImage(file)) {
        if (file.size > MAX_IMAGE_BYTES) { errors.push(`${file.name}: image over 5 MB`); continue; }
        const url = await readAsDataURL(file);
        imageParts.push({ type: 'image_url', image_url: { url } });
        notes.push(`🖼️ ${file.name}`);
      } else if (isPdf(file)) {
        if (file.size > MAX_PDF_BYTES) { errors.push(`${file.name}: PDF over 12 MB`); continue; }
        const text = await extractPdfText(file);
        if (!text) { errors.push(`${file.name}: no extractable text (scanned PDF?)`); continue; }
        pdfTexts.push({ name: file.name, text });
        notes.push(`📄 ${file.name}`);
      } else {
        errors.push(`${file.name}: unsupported (images + PDF only)`);
      }
    } catch (err) {
      logger.error('attachment.process.failed', { name: file.name, err: err?.message });
      errors.push(`${file.name}: ${err?.message || 'failed to process'}`);
    }
  }
  return { imageParts, pdfTexts, notes, errors };
};
