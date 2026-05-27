const VALID_MODES = [
  'matematicas',
  'ciencias',
  'ingles',
  'lectura',
  'cuentos',
  'adivinanzas',
  'tareas',
];

const VALID_GRADES = [
  'preescolar',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  'secundaria-1',
  'secundaria-2',
  'secundaria-3',
];

/**
 * Valida el cuerpo de la petición POST /api/chat
 */
export function validateChatRequest(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Cuerpo de petición inválido'] };
  }

  const { message, mode, grade, history, settings, studentId } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    errors.push('El mensaje es requerido');
  }

  if (mode && !VALID_MODES.includes(mode)) {
    errors.push(`Modo inválido. Usa: ${VALID_MODES.join(', ')}`);
  }

  if (grade && !VALID_GRADES.includes(grade)) {
    errors.push(`Grado inválido. Usa: ${VALID_GRADES.join(', ')}`);
  }

  if (history !== undefined) {
    if (!Array.isArray(history)) {
      errors.push('El historial debe ser un arreglo');
    } else if (history.length > 20) {
      errors.push('El historial no puede tener más de 20 mensajes');
    }
  }

  if (settings !== undefined && typeof settings !== 'object') {
    errors.push('settings debe ser un objeto');
  }

  if (studentId !== undefined) {
    if (typeof studentId !== 'string' || studentId.trim().length === 0) {
      errors.push('studentId debe ser texto');
    } else if (studentId.trim().length > 64) {
      errors.push('studentId no puede exceder 64 caracteres');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      message: String(message || '').trim(),
      mode: mode || 'general',
      grade: grade || '3',
      history: Array.isArray(history) ? history : [],
      settings: settings || {},
      studentId: String(studentId || '').trim().slice(0, 64) || undefined,
    },
  };
}

export { VALID_MODES, VALID_GRADES };
