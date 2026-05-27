import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { validateChatRequest } from './validators.js';
import {
  validateInput,
  validateOutput,
  getBlockedResponse,
  getSafeFallback,
  getServiceBusyLearningFallback,
} from './childSafety.js';
import { chatWithGemini } from './geminiClient.js';

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const RATE_LIMIT_PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 25);
const RATE_LIMIT_WINDOW_MS = 60_000;
const CHAT_CACHE_TTL_MS = Number(process.env.CHAT_CACHE_TTL_MS || 180_000);
const CHAT_CACHE_MAX_ITEMS = Number(process.env.CHAT_CACHE_MAX_ITEMS || 500);
const MAX_QUEUE_WAIT_MS = Number(process.env.MAX_QUEUE_WAIT_MS || 20_000);
const MAX_CONCURRENT_GEMINI = Number(process.env.MAX_CONCURRENT_GEMINI || 8);

const rateLimitState = new Map();
const chatCache = new Map();
let activeGeminiRequests = 0;
const waitQueue = [];

app.set('trust proxy', 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
        /^capacitor:\/\//,
        /^https:\/\/localhost$/,
        /^https:\/\/.*\.onrender\.com$/,
        /^https:\/\/.*\.railway\.app$/,
        /^https:\/\/.*\.fly\.dev$/,
      ];
      if (process.env.ALLOWED_ORIGIN) {
        allowed.push(new RegExp(`^${process.env.ALLOWED_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
      }
      if (allowed.some((re) => re.test(origin))) return callback(null, true);
      if (!IS_PRODUCTION) return callback(null, true);
      callback(null, true);
    },
  }),
);
app.use(express.json({ limit: '32kb' }));

function nowMs() {
  return Date.now();
}

function buildRequesterId(req, studentId) {
  const fromHeader = req.headers['x-student-id'];
  const sid = String(studentId || fromHeader || '').trim();
  if (sid) return `student:${sid}`;
  return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
}

function checkRateLimit(requesterId) {
  const now = nowMs();
  const entry = rateLimitState.get(requesterId);
  if (!entry || now > entry.resetAt) {
    rateLimitState.set(requesterId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_PER_MIN - 1 };
  }

  if (entry.count >= RATE_LIMIT_PER_MIN) {
    return {
      allowed: false,
      retryAfterMs: Math.max(500, entry.resetAt - now),
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: Math.max(0, RATE_LIMIT_PER_MIN - entry.count) };
}

function cleanupRateLimitMap() {
  const now = nowMs();
  for (const [key, value] of rateLimitState.entries()) {
    if (now > value.resetAt + RATE_LIMIT_WINDOW_MS) {
      rateLimitState.delete(key);
    }
  }
}

function buildCacheKey({ message, mode, grade, settings }) {
  return JSON.stringify({
    m: String(message).toLowerCase().trim(),
    mode,
    grade,
    strict: Boolean(settings?.strictMode),
    blocked: Array.isArray(settings?.blockedTopics) ? [...settings.blockedTopics].sort() : [],
    allowed: Array.isArray(settings?.allowedTopics) ? [...settings.allowedTopics].sort() : [],
  });
}

function getCacheValue(key) {
  const found = chatCache.get(key);
  if (!found) return null;
  if (nowMs() > found.expiresAt) {
    chatCache.delete(key);
    return null;
  }
  return found.value;
}

function setCacheValue(key, value) {
  if (chatCache.size >= CHAT_CACHE_MAX_ITEMS) {
    const oldestKey = chatCache.keys().next().value;
    if (oldestKey) chatCache.delete(oldestKey);
  }
  chatCache.set(key, { value, expiresAt: nowMs() + CHAT_CACHE_TTL_MS });
}

async function acquireGeminiSlot() {
  if (activeGeminiRequests < MAX_CONCURRENT_GEMINI) {
    activeGeminiRequests += 1;
    return;
  }

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const idx = waitQueue.findIndex((entry) => entry.resolve === resolve);
      if (idx >= 0) waitQueue.splice(idx, 1);
      reject(new Error('queue_timeout'));
    }, MAX_QUEUE_WAIT_MS);

    waitQueue.push({
      resolve: () => {
        clearTimeout(timeout);
        activeGeminiRequests += 1;
        resolve();
      },
    });
  });
}

function releaseGeminiSlot() {
  activeGeminiRequests = Math.max(0, activeGeminiRequests - 1);
  const next = waitQueue.shift();
  if (next) next.resolve();
}

app.get('/', (_req, res) => {
  res.json({
    service: 'RoboTutor Kids API',
    health: '/api/health',
    chat: 'POST /api/chat',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'RoboTutor Kids API',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    environment: IS_PRODUCTION ? 'production' : 'development',
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    cleanupRateLimitMap();
    const validation = validateChatRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join('. ') });
    }

    const { message, mode, grade, history, settings, studentId } = validation.data;
    const requesterId = buildRequesterId(req, studentId);
    const rateLimit = checkRateLimit(requesterId);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(Math.ceil(rateLimit.retryAfterMs / 1000)));
      return res.status(429).json({
        safe: true,
        category: 'general',
        emotion: 'thinking',
        message: 'Hay muchas preguntas seguidas. Esperemos unos segundos para seguir aprendiendo.',
        suggestedFollowUp: '¿Quieres repasar lo último mientras esperamos?',
      });
    }

    const safetyOptions = {
      strictMode: Boolean(settings.strictMode),
      blockedTopics: Array.isArray(settings.blockedTopics) ? settings.blockedTopics : [],
    };

    const allowedTopics = Array.isArray(settings.allowedTopics) ? settings.allowedTopics : [];
    if (allowedTopics.length > 0 && mode !== 'general' && !allowedTopics.includes(mode)) {
      return res.json({
        safe: true,
        category: 'general',
        emotion: 'thinking',
        message: 'Este tema no está disponible ahora. Pide ayuda a un adulto o elige otro modo de aprendizaje.',
        suggestedFollowUp: '¿Quieres probar con matemáticas o un cuento?',
      });
    }

    // Seguridad ANTES de Gemini
    const inputCheck = validateInput(message, safetyOptions);
    if (inputCheck.blocked) {
      return res.json(getBlockedResponse());
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Servidor no configurado. Agrega GEMINI_API_KEY en server/.env',
      });
    }

    const cacheKey = buildCacheKey({ message, mode, grade, settings });
    const cached = getCacheValue(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    try {
      await acquireGeminiSlot();
    } catch {
      return res.json({
        ...getServiceBusyLearningFallback({ mode, message }),
        suggestedFollowUp:
          'Estamos recibiendo muchas consultas. Seguimos aprendiendo mientras se libera el servicio.',
      });
    }

    let geminiResponse;
    try {
      geminiResponse = await chatWithGemini({
        message,
        mode,
        grade,
        history,
        settings,
      });
    } catch (err) {
      const errCode = Number(err?.status || err?.code || 0);
      const isOverloaded = errCode === 429;
      console.error('[Gemini error]', errCode, err.message);
      if (isOverloaded) {
        return res.json({
          ...getServiceBusyLearningFallback({ mode, message }),
          suggestedFollowUp:
            'El servicio está ocupado por muchas consultas. Te dejo práctica y en breve volvemos a intentar.',
        });
      }
      return res.json(getSafeFallback());
    } finally {
      releaseGeminiSlot();
    }

    // Seguridad DESPUÉS de Gemini
    const outputCheck = validateOutput(geminiResponse, safetyOptions);
    if (!outputCheck.valid) {
      return res.json(getSafeFallback());
    }

    if (outputCheck.sanitized.category === 'blocked' || outputCheck.sanitized.safe === false) {
      return res.json(getBlockedResponse());
    }

    setCacheValue(cacheKey, outputCheck.sanitized);
    return res.json(outputCheck.sanitized);
  } catch (err) {
    console.error('[Server error]', err);
    return res.status(500).json(getSafeFallback());
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 RoboTutor Kids API → http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY no configurada. Copia server/.env.example a server/.env');
  }
});
