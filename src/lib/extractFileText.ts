/**
 * extractFileText.ts
 *
 * Browser-side text extraction for resume and reference files.
 * Supports: .txt, .pdf (via pdf.js CDN), .doc/.docx (via mammoth CDN)
 *
 * We load the libraries dynamically from CDN so we don't need to add
 * build dependencies — Lovable projects work well with this pattern.
 */

declare global {
  interface Window {
    pdfjsLib?: any;
    mammoth?: any;
  }
}

/** Load pdf.js from CDN (once) */
async function loadPdfJs(): Promise<any> {
  if (window.pdfjsLib) return window.pdfjsLib;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load pdf.js"));
    document.head.appendChild(script);
  });

  // Set worker source
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  return window.pdfjsLib;
}

/** Load mammoth from CDN (once) */
async function loadMammoth(): Promise<any> {
  if (window.mammoth) return window.mammoth;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load mammoth"));
    document.head.appendChild(script);
  });

  return window.mammoth;
}

/** Extract all text from a PDF file */
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n").replace(/\s{3,}/g, "  ").trim();
}

/** Extract all text from a DOCX file */
async function extractDocxText(file: File): Promise<string> {
  const mammoth = await loadMammoth();
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

/**
 * Main export — extract readable text from any supported resume file.
 * Returns the raw text string, or throws with a user-friendly message.
 */
export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    const text = await file.text();
    if (!text.trim()) throw new Error(`"${file.name}" appears to be empty.`);
    return text.trim();
  }

  if (name.endsWith(".pdf")) {
    const text = await extractPdfText(file);
    if (!text) throw new Error(`Could not extract text from "${file.name}". It may be a scanned image PDF — please copy/paste the content as a .txt file instead.`);
    return text;
  }

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    const text = await extractDocxText(file);
    if (!text) throw new Error(`Could not extract text from "${file.name}". Try saving it as a .txt or .pdf file.`);
    return text;
  }

  // Fallback: try reading as plain text
  try {
    const text = await file.text();
    if (text.trim()) return text.trim();
  } catch (_) { /* ignore */ }

  throw new Error(`Unsupported file type: "${file.name}". Please upload a .pdf, .docx, or .txt file.`);
}
