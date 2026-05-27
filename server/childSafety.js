/**
 * Capa de seguridad infantil — validación ANTES y DESPUÉS de Gemini.
 */

const BLOCKED_RESPONSE = {
  safe: false,
  category: 'blocked',
  emotion: 'thinking',
  message:
    'Ese tema es importante. Por seguridad, háblalo con tu maestro, mamá, papá o un adulto de confianza.',
  suggestedFollowUp: '¿Quieres que practiquemos matemáticas o leamos un cuento?',
};

const SAFE_FALLBACK = {
  safe: true,
  category: 'general',
  emotion: 'happy',
  message:
    '¡Ups! Tuve un pequeño problema. ¿Podemos intentar con otra pregunta sobre algo que estés aprendiendo en la escuela?',
  suggestedFollowUp: '¿Quieres que te ayude con una tarea o un juego de adivinanzas?',
};

/** Palabras y patrones sensibles (español e inglés) */
const DANGEROUS_PATTERNS = [
  /\b(suicid|suicidio|matarme|morirme|autolesion|autolesi[oó]n|cortarme|hacerme daño)\b/i,
  /\b(sexo|sexual|porno|pornograf|desnud|nude|xxx|er[oó]tic)\b/i,
  /\b(droga|coca[ií]na|marihuana|hero[ií]na|fentanilo|mdma|lsd|narc[oó]tic)\b/i,
  /\b(arma|pistola|rifle|escopeta|bomba|explosiv|disparar|matar|asesinar|violencia)\b/i,
  /\b(direcci[oó]n|domicilio|tel[eé]fono|contraseña|password|correo|email|instagram|tiktok|whatsapp|facebook)\b/i,
  /\b(donde vives|dónde vives|como te llamas de verdad|cuántos años tienes en casa|nombre completo)\b/i,
  /\b(odio|racist|nazi|terrorist|secuestr|abuso sexual|pedofil)\b/i,
  /\b(c[oó]mo hacer una bomba|fabricar droga|hackear|ban|robar banco)\b/i,
];

const PERSONAL_DATA_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  /\b(calle|avenida|colonia|código postal|cp)\s+\w+/i,
];

const MAX_CHILD_MESSAGE_LENGTH = 500;
const MAX_RESPONSE_LENGTH = 1200;

/**
 * Valida el mensaje del niño ANTES de enviarlo a Gemini.
 * @returns {{ blocked: boolean, reason?: string }}
 */
export function validateInput(message, options = {}) {
  const { strictMode = false, blockedTopics = [] } = options;

  if (!message || typeof message !== 'string') {
    return { blocked: true, reason: 'empty' };
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { blocked: true, reason: 'empty' };
  }

  if (trimmed.length > MAX_CHILD_MESSAGE_LENGTH) {
    return { blocked: true, reason: 'too_long' };
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { blocked: true, reason: 'dangerous_content' };
    }
  }

  for (const pattern of PERSONAL_DATA_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { blocked: true, reason: 'personal_data' };
    }
  }

  if (strictMode) {
    const strictExtra = [
      /\b(ghost|fantasma|demonio|diablo|satan|horror|sangre|muerte)\b/i,
      /\b(pelea|golpear|insultar|maldici[oó]n)\b/i,
    ];
    for (const pattern of strictExtra) {
      if (pattern.test(trimmed)) {
        return { blocked: true, reason: 'strict_mode' };
      }
    }
  }

  for (const topic of blockedTopics) {
    if (topic && trimmed.toLowerCase().includes(topic.toLowerCase())) {
      return { blocked: true, reason: 'blocked_topic' };
    }
  }

  return { blocked: false };
}

/**
 * Valida la respuesta de Gemini DESPUÉS de recibirla.
 * @returns {{ valid: boolean, sanitized?: object }}
 */
export function validateOutput(parsed, options = {}) {
  const { strictMode = false } = options;

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false };
  }

  const message = String(parsed.message || '').trim();
  if (!message) {
    return { valid: false };
  }

  if (message.length > MAX_RESPONSE_LENGTH) {
    parsed.message = message.slice(0, MAX_RESPONSE_LENGTH) + '…';
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(message)) {
      return { valid: false };
    }
  }

  if (strictMode) {
    const strictOutput = [/\b(maldici[oó]n|idiota|est[uú]pid|tonto)\b/i];
    for (const pattern of strictOutput) {
      if (pattern.test(message)) {
        return { valid: false };
      }
    }
  }

  const allowedCategories = ['educational', 'story', 'game', 'blocked', 'general'];
  const allowedEmotions = ['happy', 'thinking', 'curious', 'surprised', 'neutral'];

  return {
    valid: true,
    sanitized: {
      safe: parsed.safe !== false,
      category: allowedCategories.includes(parsed.category) ? parsed.category : 'general',
      emotion: allowedEmotions.includes(parsed.emotion) ? parsed.emotion : 'happy',
      message: parsed.message,
      suggestedFollowUp: String(parsed.suggestedFollowUp || '').slice(0, 200) || undefined,
    },
  };
}

export function getBlockedResponse() {
  return { ...BLOCKED_RESPONSE };
}

export function getSafeFallback() {
  return { ...SAFE_FALLBACK };
}
