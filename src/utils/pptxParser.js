import JSZip from 'jszip';

/**
 * Extract text AND images from a PPTX file  
 * PPTX files are ZIP archives containing XML slide files and media
 * @param {File} file - The PPTX file to parse
 * @returns {Promise<{slides: Array<{slideNum: number, text: string, images: string[]}>, fullText: string, allImages: string[]}>}
 */
export async function parsePPTX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slides = [];

  // ---- Extract all media images from ppt/media/ folder ----
  const allImages = [];
  const mediaFiles = Object.keys(zip.files).filter(name =>
    /^ppt\/media\//.test(name) && /\.(png|jpg|jpeg|gif|bmp|svg|tiff|webp|emf|wmf)$/i.test(name)
  );

  const mediaMap = {};
  for (const mediaPath of mediaFiles) {
    try {
      const ext = mediaPath.split('.').pop().toLowerCase();
      let mimeType = 'image/png';
      if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'svg') mimeType = 'image/svg+xml';
      else if (ext === 'webp') mimeType = 'image/webp';
      else if (ext === 'bmp') mimeType = 'image/bmp';
      // Skip EMF/WMF as browsers can't display them
      else if (['emf', 'wmf'].includes(ext)) continue;

      const base64 = await zip.files[mediaPath].async('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const fileName = mediaPath.split('/').pop();
      mediaMap[fileName] = dataUrl;
      allImages.push(dataUrl);
    } catch (err) {
      console.warn(`Failed to extract image ${mediaPath}:`, err);
    }
  }

  // ---- Extract slide relationship files to map images to slides ----
  const slideRelMaps = {};
  const relFiles = Object.keys(zip.files).filter(name =>
    /^ppt\/slides\/_rels\/slide\d+\.xml\.rels$/.test(name)
  );

  for (const relFile of relFiles) {
    const slideNum = parseInt(relFile.match(/slide(\d+)/)[1]);
    try {
      const relXml = await zip.files[relFile].async('string');
      const imageRefs = [];
      const relRegex = /Target="([^"]*(?:media\/[^"]+))"/g;
      let match;
      while ((match = relRegex.exec(relXml)) !== null) {
        const target = match[1];
        const fileName = target.split('/').pop();
        if (mediaMap[fileName]) {
          imageRefs.push(mediaMap[fileName]);
        }
      }
      slideRelMaps[slideNum] = imageRefs;
    } catch (err) {
      console.warn(`Failed to parse rels for slide ${slideNum}:`, err);
    }
  }

  // ---- Find and parse all slide XML files ----
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)[1]);
      const numB = parseInt(b.match(/slide(\d+)/)[1]);
      return numA - numB;
    });

  for (const slideFile of slideFiles) {
    const slideNum = parseInt(slideFile.match(/slide(\d+)/)[1]);
    const xmlContent = await zip.files[slideFile].async('string');
    const text = extractTextFromXML(xmlContent);
    const images = slideRelMaps[slideNum] || [];

    slides.push({
      slideNum,
      text: text.trim(),
      images,
    });
  }

  const fullText = slides
    .map(s => `--- Slide ${s.slideNum} ---\n${s.text}`)
    .join('\n\n');

  return { slides, fullText, allImages };
}

/**
 * Extract text content from PowerPoint XML
 * Text in PPTX XML is stored in <a:t> tags
 */
function extractTextFromXML(xml) {
  const textParts = [];

  const paragraphs = xml.split(/<\/a:p>/);

  for (const paragraph of paragraphs) {
    const texts = [];
    const regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
    let match;
    while ((match = regex.exec(paragraph)) !== null) {
      const decoded = decodeXMLEntities(match[1]);
      if (decoded.trim()) {
        texts.push(decoded);
      }
    }
    if (texts.length > 0) {
      textParts.push(texts.join(' '));
    }
  }

  return textParts.join('\n');
}

/**
 * Decode basic XML entities
 */
function decodeXMLEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
}
