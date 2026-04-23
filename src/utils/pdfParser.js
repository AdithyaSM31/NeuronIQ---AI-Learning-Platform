import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extract text AND render page images from a PDF file
 * @param {File} file - The PDF file to parse
 * @returns {Promise<{pages: Array<{pageNum: number, text: string, imageDataUrl: string}>, fullText: string}>}
 */
export async function parsePDF(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    if (onProgress) onProgress(i, pdf.numPages);
    
    const page = await pdf.getPage(i);

    // Extract text
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');

    // Render page to canvas as image
    let imageDataUrl = null;
    try {
      const scale = 1.5; // Good balance of quality vs size
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      // Convert to JPEG for smaller size (0.7 quality)
      imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      // Clean up
      canvas.width = 0;
      canvas.height = 0;
    } catch (err) {
      console.warn(`Failed to render page ${i} as image:`, err);
    }

    pages.push({
      pageNum: i,
      text: text.trim(),
      imageDataUrl,
    });
  }

  const fullText = pages
    .map(p => `--- Page ${p.pageNum} ---\n${p.text}`)
    .join('\n\n');

  return { pages, fullText };
}
