/**
 * Modo autónomo: Gemini directo desde el dispositivo (solo internet, sin servidor propio).
 * La clave se incluye al compilar la APK — uso educativo / prototipo.
 */
import {
  validateInput,
  validateOutput,
  BLOCKED_RESPONSE,
  SAFE_FALLBACK,
} from '../safety/childSafety.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';

const SYSTEM_PROMPT = `Eres RoboTutor Kids, un asistente educativo seguro para niños. Responde con lenguaje simple, amable, positivo y adecuado a la edad del alumno. No des información peligrosa, sexual, violenta, de drogas, armas, autolesiones ni pidas datos personales. Si el niño pregunta algo sensible, dile que hable con un adulto de confianza. Explica paso a paso cuando sea educativo. Usa frases cortas y tono amigable.

IMPORTANTE: Responde SIEMPRE en JSON válido con esta estructura exacta (sin markdown):
{"safe":true,"category":"educational","emotion":"happy","message":"respuesta","suggestedFollowUp":"pregunta"}`;

const MODE_HINTS = {
  matematicas: 'Modo Matemáticas.',
  ciencias: 'Modo Ciencias.',
  ingles: 'Modo Inglés.',
  lectura: 'Modo Lectura.',
  cuentos: 'Modo Cuentos.',
  adivinanzas: 'Modo Adivinanzas.',
  tareas: 'Modo Ayuda con tareas.',
};

const GRADE_AGES = {
  preescolar: '4-5 años', '1': '6-7 años', '2': '7-8 años', '3': '8-9 años',
  '4': '9-10 años', '5': '10-11 años', '6': '11-12 años',
  'secundaria-1': '12-13 años', 'secundaria-2': '13-14 años', 'secundaria-3': '14-15 años',
};

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function serviceMessage(message, followUp = '¿Quieres intentar con otra pregunta?') {
  return {
    safe: true,
    category: 'general',
    emotion: 'thinking',
    message,
    suggestedFollowUp: followUp,
  };
}

function parseJsonResponse(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
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

export function isStandaloneMode() {
  return import.meta.env.VITE_STANDALONE_MODE === 'true' && Boolean(API_KEY);
}

async function requestGemini(url, payload) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) return { ok: true, data: await res.json() };

    const text = await res.text();
    console.error(`Gemini error ${res.status}`, text);

    // Reintentos cortos para picos temporales.
    if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
      await sleep(600 * attempt);
      continue;
    }

    if (res.status === 429) {
      return {
        ok: false,
        userMessage: serviceMessage(
          'El servicio está muy ocupado en este momento. Espera un minuto y volvemos a intentar.',
          '¿Quieres practicar una adivinanza mientras tanto?',
        ),
      };
    }
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        userMessage: serviceMessage(
          'La configuración de la app necesita revisión por un adulto. Por favor, avisa para actualizar la clave.',
          '¿Quieres que te cuente un mini cuento mientras lo revisan?',
        ),
      };
    }

    return {
      ok: false,
      userMessage: serviceMessage(
        'Hubo un problema temporal de conexión. Intenta de nuevo en unos segundos.',
      ),
    };
  }

  return { ok: false, userMessage: { ...SAFE_FALLBACK } };
}

export async function sendStandaloneChat({ message, mode, grade, history, settings }) {
  if (!API_KEY) {
    throw new Error('APK no configurada con API key');
  }

  const safetyOptions = {
    strictMode: Boolean(settings?.strictMode),
    blockedTopics: settings?.blockedTopics || [],
  };

  const allowedTopics = settings?.allowedTopics || [];
  if (allowedTopics.length > 0 && mode !== 'general' && !allowedTopics.includes(mode)) {
    return {
      safe: true,
      category: 'general',
      emotion: 'thinking',
      message: 'Este tema no está disponible ahora. Elige otro modo de aprendizaje.',
      suggestedFollowUp: '¿Quieres probar matemáticas o un cuento?',
    };
  }

  const inputCheck = validateInput(message, safetyOptions);
  if (inputCheck.blocked) return { ...BLOCKED_RESPONSE };

  const ageHint = GRADE_AGES[grade] || '8-9 años';
  const contextPrompt = [
    MODE_HINTS[mode] || '',
    `El alumno tiene aproximadamente ${ageHint}.`,
    settings?.strictMode ? 'Modo estricto activado.' : '',
  ].filter(Boolean).join(' ');

  const contents = [];
  for (const item of (history || []).slice(-10)) {
    if (item.role === 'user') contents.push({ role: 'user', parts: [{ text: item.content }] });
    else if (item.role === 'assistant') contents.push({ role: 'model', parts: [{ text: item.content }] });
  }
  contents.push({
    role: 'user',
    parts: [{ text: `[Contexto: ${contextPrompt}]\n\nPregunta del alumno: ${message}` }],
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 512,
    },
    safetySettings: SAFETY_SETTINGS,
  };

  const result = await requestGemini(url, payload);
  if (!result.ok) return result.userMessage;
  const data = result.data;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { ...SAFE_FALLBACK };

  const parsed = parseJsonResponse(text);
  const outputCheck = validateOutput(parsed, safetyOptions);
  if (!outputCheck.valid) return { ...SAFE_FALLBACK };
  if (outputCheck.sanitized.category === 'blocked' || outputCheck.sanitized.safe === false) {
    return { ...BLOCKED_RESPONSE };
  }
  return outputCheck.sanitized;
}
