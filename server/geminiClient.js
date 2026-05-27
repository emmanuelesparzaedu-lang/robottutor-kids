import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const SYSTEM_PROMPT = `Eres RoboTutor Kids, un asistente educativo seguro para niños. Responde con lenguaje simple, amable, positivo y adecuado a la edad del alumno. No des información peligrosa, sexual, violenta, de drogas, armas, autolesiones ni pidas datos personales. Si el niño pregunta algo sensible, dile que hable con un adulto de confianza. Explica paso a paso cuando sea educativo. Usa frases cortas y tono amigable.

IMPORTANTE: Responde SIEMPRE en JSON válido con esta estructura exacta (sin markdown, sin bloques de código):
{
  "safe": true,
  "category": "educational | story | game | blocked | general",
  "emotion": "happy | thinking | curious | surprised | neutral",
  "message": "respuesta para el niño",
  "suggestedFollowUp": "pregunta sugerida segura"
}`;

const MODE_HINTS = {
  matematicas: 'Modo Matemáticas: ayuda con sumas, restas, multiplicaciones, divisiones y problemas paso a paso.',
  ciencias: 'Modo Ciencias: explica conceptos naturales de forma simple y con ejemplos.',
  ingles: 'Modo Inglés: enseña palabras y frases básicas en inglés con pronunciación simple.',
  lectura: 'Modo Lectura: ayuda con comprensión lectora y vocabulario.',
  cuentos: 'Modo Cuentos: inventa cuentos cortos, positivos y apropiados para niños.',
  adivinanzas: 'Modo Adivinanzas: propón adivinanzas divertidas y educativas.',
  tareas: 'Modo Ayuda con tareas: guía al niño sin dar respuestas directas, usa el método socrático.',
};

const GRADE_AGES = {
  preescolar: '4-5 años',
  '1': '6-7 años',
  '2': '7-8 años',
  '3': '8-9 años',
  '4': '9-10 años',
  '5': '10-11 años',
  '6': '11-12 años',
  'secundaria-1': '12-13 años',
  'secundaria-2': '13-14 años',
  'secundaria-3': '14-15 años',
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

let client = null;
const REQUEST_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 18000);
const MAX_RETRIES = Number(process.env.GEMINI_MAX_RETRIES || 2);
const RETRY_BASE_MS = Number(process.env.GEMINI_RETRY_BASE_MS || 600);

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en .env');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function buildContextPrompt({ mode, grade, settings }) {
  const ageHint = GRADE_AGES[grade] || '8-9 años';
  const modeHint = MODE_HINTS[mode] || '';
  const allowedTopics = settings.allowedTopics?.length
    ? `Temas permitidos: ${settings.allowedTopics.join(', ')}.`
    : '';
  const strict = settings.strictMode
    ? 'Modo estricto activado: evita cualquier contenido que pueda asustar o confundir a niños pequeños.'
    : '';

  return [modeHint, `El alumno tiene aproximadamente ${ageHint}.`, allowedTopics, strict]
    .filter(Boolean)
    .join(' ');
}

function parseJsonResponse(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      safe: true,
      category: 'general',
      emotion: 'happy',
      message: cleaned.slice(0, 800),
      suggestedFollowUp: '¿Tienes otra pregunta?',
    };
  }
}

/**
 * Envía mensaje a Gemini y devuelve respuesta parseada.
 */
export async function chatWithGemini({ message, mode, grade, history, settings }) {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const contextPrompt = buildContextPrompt({ mode, grade, settings });

  const contents = [];

  for (const item of history.slice(-10)) {
    if (item.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: item.content }] });
    } else if (item.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: item.content }] });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: `[Contexto: ${contextPrompt}]\n\nPregunta del alumno: ${message}` }],
  });

  const payload = {
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      safetySettings: SAFETY_SETTINGS,
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  let response;
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      response = await ai.models.generateContent({
        ...payload,
        signal: controller.signal,
      });
      clearTimeout(timer);
      break;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const status = Number(err?.status || err?.code || 0);
      const retriable = status === 429 || status >= 500 || err?.name === 'AbortError';
      if (!retriable || attempt >= MAX_RETRIES) {
        throw err;
      }
      const backoffMs = RETRY_BASE_MS * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  if (!response) {
    throw lastError || new Error('Gemini no respondió');
  }

  const text = response.text;
  if (!text) {
    throw new Error('Gemini no devolvió texto');
  }

  return parseJsonResponse(text);
}
