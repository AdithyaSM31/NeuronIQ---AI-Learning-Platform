const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'llama-3.1-8b-instant';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Free tier: 6K TPM for 8b-instant. Keep total request under ~5500 tokens.
// ~1000 tokens prompt + ~2000 tokens input text + ~2500 tokens output = 5500
const MAX_TEXT_CHARS = 6000; // ~1500 tokens of input text

function truncateText(text, maxChars = MAX_TEXT_CHARS) {
  if (text.length <= maxChars) return text;
  const keepEach = Math.floor(maxChars / 2);
  return text.slice(0, keepEach) + '\n\n[... content trimmed ...]\n\n' + text.slice(-keepEach);
}

async function callGroq(apiKey, prompt, { maxRetries = 3, temperature = 0.7, maxTokens = 3000 } = {}) {
  let lastError = new Error('All API attempts failed');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait longer between retries to let TPM window reset (60s window)
        const waitTime = Math.min(15000 * attempt, 65000);
        console.log(`Groq API: Retry ${attempt}/${maxRetries}, waiting ${waitTime / 1000}s for rate limit reset...`);
        await new Promise(r => setTimeout(r, waitTime));
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (response.status === 429 || response.status === 413) {
        const errBody = await response.text().catch(() => '');
        lastError = new Error('Rate limited — waiting for reset and retrying...');
        console.warn(`Rate limited (${response.status}), will retry after wait...`);
        continue;
      }

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`Groq API error ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error('No response from Groq.');
      return text;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

/**
 * Describe images using the vision model (only first 2 images to save tokens)
 */
async function describeImages(apiKey, images, contextHint = '') {
  if (!images || images.length === 0) return '';

  const descriptions = [];

  for (let i = 0; i < Math.min(images.length, 2); i++) {
    const img = images[i];
    const content = [
      { type: 'text', text: `Describe this study material image concisely. List all text, diagrams, formulas, and key information visible. Be brief but complete.${contextHint ? ` Context: ${contextHint.slice(0, 200)}` : ''}` },
      { type: 'image_url', image_url: { url: img.startsWith('data:') ? img : `data:image/png;base64,${img}` } },
    ];

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: VISION_MODEL, messages: [{ role: 'user', content }], temperature: 0.3, max_tokens: 1000 }),
      });

      if (!response.ok) continue;
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) descriptions.push(`[Image ${i + 1}]: ${text}`);
    } catch (err) {
      console.warn(`Vision failed for image ${i + 1}:`, err.message);
    }

    if (i < images.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  return descriptions.length > 0 ? '\n\nVISUAL CONTENT:\n' + descriptions.join('\n\n') : '';
}

export function collectModuleImages(module) {
  const images = [];
  if (module.images?.length > 0) images.push(...module.images);
  if (module.files) {
    for (const file of module.files) {
      if (file.pages) for (const page of file.pages) { if (page.imageDataUrl) images.push(page.imageDataUrl); }
      if (file.slides) for (const slide of file.slides) { if (slide.images?.length > 0) images.push(...slide.images); }
    }
  }
  return images;
}

/**
 * Generate AI summary — concise prompt to fit free-tier TPM limits
 */
export async function generateSummary(apiKey, text, images = [], onProgress) {
  let imageContext = '';
  if (images.length > 0) {
    if (onProgress) onProgress('Analyzing images...');
    try { imageContext = await describeImages(apiKey, images, text.slice(0, 200)); }
    catch (err) { console.warn('Image analysis skipped:', err.message); }
  }

  if (onProgress) onProgress('Generating summary...');
  const content = truncateText(text + imageContext);

  const prompt = `Create a DETAILED academic summary of this study material. Include:
1. **Title & Overview** (3-4 sentences)
2. **Key Concepts** — define each concept, explain why it matters, give examples
3. **Reference Table** (markdown table: Term | Definition | Key Details)
4. **Formulas/Processes** if applicable
5. **Connections** between concepts
6. **Key Takeaways** (10+ points)
7. **Potential Exam Questions** (5 questions with brief answers)

Use markdown formatting: headers, bold, tables, bullet points. Be thorough and detailed.

MATERIAL:
${content}`;

  return callGroq(apiKey, prompt, { maxTokens: 3500 });
}

/**
 * Generate AI notes
 */
export async function generateNotes(apiKey, text, images = [], onProgress) {
  let imageContext = '';
  if (images.length > 0) {
    if (onProgress) onProgress('Analyzing images...');
    try { imageContext = await describeImages(apiKey, images, text.slice(0, 200)); }
    catch (err) { console.warn('Image analysis skipped:', err.message); }
  }

  if (onProgress) onProgress('Creating study notes...');
  const content = truncateText(text + imageContext);

  const prompt = `Create COMPREHENSIVE study notes from this material. Structure:
## Topic Overview
- Title, scope, learning objectives

## Detailed Notes
For each topic:
- **Definition** and explanation
- **How it works** step-by-step
- **Examples** with real-world applications
- 💡 **Key Insight** — most important takeaway
- ⚠️ **Watch out** — common mistakes

## Reference Tables
- Comparison tables, data tables in markdown

## Quick Review Checklist
- ✅ All key points to remember

Use headers, bold, bullet points, tables. Be detailed and exam-ready.

MATERIAL:
${content}`;

  return callGroq(apiKey, prompt, { maxTokens: 3500 });
}

/**
 * Generate flashcards as JSON
 */
export async function generateFlashcards(apiKey, text) {
  const prompt = `Create 12-18 study flashcards from this material. Return ONLY valid JSON array:
[{"front":"Question?","back":"Answer"}]

Include definitions, comparisons, and application questions.

MATERIAL:
${truncateText(text)}`;

  const response = await callGroq(apiKey, prompt, { temperature: 0.5, maxTokens: 3000 });
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try { return JSON.parse(jsonStr); }
  catch { const match = jsonStr.match(/\[[\s\S]*\]/); if (match) return JSON.parse(match[0]); throw new Error('Failed to parse flashcards'); }
}

/**
 * Generate quiz as JSON
 */
export async function generateQuiz(apiKey, text) {
  const prompt = `Create a 8-12 question multiple-choice quiz. Return ONLY valid JSON array:
[{"question":"Q?","options":["A","B","C","D"],"correctIndex":0,"explanation":"Why A is correct"}]

Test understanding, not just memorization.

MATERIAL:
${truncateText(text)}`;

  const response = await callGroq(apiKey, prompt, { temperature: 0.5, maxTokens: 3000 });
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try { return JSON.parse(jsonStr); }
  catch { const match = jsonStr.match(/\[[\s\S]*\]/); if (match) return JSON.parse(match[0]); throw new Error('Failed to parse quiz'); }
}

/**
 * Chat with context
 */
export async function chatWithContext(apiKey, documentText, question, chatHistory = []) {
  const historyStr = chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');

  const prompt = `You are an AI Tutor. Answer based on the study material. Be clear, use markdown, give examples.

CONTEXT:
${truncateText(documentText, 4000)}

${historyStr ? `HISTORY:\n${historyStr}\n` : ''}Question: ${question}`;

  return callGroq(apiKey, prompt, { temperature: 0.7, maxTokens: 2000 });
}

/**
 * Test API key
 */
export async function testApiKey(apiKey) {
  try {
    const result = await callGroq(apiKey, 'Say "Hello" in one word.', { maxRetries: 0, maxTokens: 5 });
    return !!result;
  } catch { return false; }
}
