export const MODES = [
  { id: 'matematicas', label: 'Matemáticas', emoji: '🔢', color: 'from-blue-400 to-indigo-500' },
  { id: 'ciencias', label: 'Ciencias', emoji: '🔬', color: 'from-green-400 to-emerald-500' },
  { id: 'ingles', label: 'Inglés', emoji: '🌍', color: 'from-cyan-400 to-teal-500' },
  { id: 'lectura', label: 'Lectura', emoji: '📖', color: 'from-amber-400 to-orange-500' },
  { id: 'cuentos', label: 'Cuentos', emoji: '📚', color: 'from-purple-400 to-violet-500' },
  { id: 'adivinanzas', label: 'Adivinanzas', emoji: '🧩', color: 'from-pink-400 to-rose-500' },
  { id: 'tareas', label: 'Ayuda con tareas', emoji: '✏️', color: 'from-yellow-400 to-amber-500' },
];

export const GRADES = [
  { id: 'preescolar', label: 'Preescolar (4-5 años)' },
  { id: '1', label: '1° Primaria' },
  { id: '2', label: '2° Primaria' },
  { id: '3', label: '3° Primaria' },
  { id: '4', label: '4° Primaria' },
  { id: '5', label: '5° Primaria' },
  { id: '6', label: '6° Primaria' },
  { id: 'secundaria-1', label: '1° Secundaria' },
  { id: 'secundaria-2', label: '2° Secundaria' },
  { id: 'secundaria-3', label: '3° Secundaria' },
];

export const DEFAULT_ROBOT = {
  name: 'RoboTutor',
  avatarMode: 'preset',
  customAvatar: null,
  bodyColor: '#63B3ED',
  eyeType: 'round',
  mouthType: 'smile',
  antennas: true,
  expression: 'happy',
};

/** Colores para el lienzo de dibujo del asistente */
export const DRAW_COLORS = [
  '#2D3748', '#63B3ED', '#68D391', '#F6AD55', '#FC8181',
  '#B794F4', '#F687B3', '#FFD700', '#718096', '#FFFFFF',
];

export const DRAW_BRUSH_SIZES = [
  { id: 'thin', label: 'Fino', size: 4 },
  { id: 'medium', label: 'Medio', size: 8 },
  { id: 'thick', label: 'Grueso', size: 14 },
];

export const DEFAULT_ADULT_SETTINGS = {
  grade: '3',
  allowedTopics: ['matematicas', 'ciencias', 'ingles', 'lectura', 'cuentos', 'adivinanzas', 'tareas'],
  blockedTopics: [],
  strictMode: false,
  pin: '1234',
};

export const ROBOT_COLORS = [
  '#63B3ED', '#68D391', '#F6AD55', '#FC8181',
  '#B794F4', '#4FD1C5', '#F687B3', '#A0AEC0',
];

export const EYE_TYPES = [
  { id: 'round', label: 'Redondos' },
  { id: 'happy', label: 'Felices' },
  { id: 'curious', label: 'Curiosos' },
  { id: 'star', label: 'Estrella' },
];

export const MOUTH_TYPES = [
  { id: 'smile', label: 'Sonrisa' },
  { id: 'open', label: 'Abierta' },
  { id: 'o', label: 'Sorpresa' },
  { id: 'line', label: 'Pensando' },
];

export const EXPRESSIONS = [
  { id: 'happy', label: '😊 Feliz' },
  { id: 'curious', label: '🤔 Curioso' },
  { id: 'thinking', label: '💭 Pensando' },
  { id: 'surprised', label: '😲 Sorprendido' },
];
