import { MODES } from '../constants';

export default function ModeSelector({ activeMode, onModeChange }) {
  return (
    <div className="card-kid">
      <h2 className="text-lg font-extrabold text-slate-700 mb-3 flex items-center gap-2">
        <span>📚</span> Modo de aprendizaje
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeChange(mode.id)}
            className={`btn-kid flex flex-col items-center gap-1 py-4 text-white shadow-md ${
              activeMode === mode.id
                ? `bg-gradient-to-br ${mode.color} ring-4 ring-white ring-offset-2 scale-105`
                : `bg-gradient-to-br ${mode.color} opacity-80 hover:opacity-100`
            }`}
          >
            <span className="text-2xl">{mode.emoji}</span>
            <span className="text-xs font-bold">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
