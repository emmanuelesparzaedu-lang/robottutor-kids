export default function AssistantNameEditor({ name, onNameChange }) {
  return (
    <div className="w-full max-w-xs mx-auto mt-3 p-4 bg-gradient-to-r from-sky-50 to-mint-soft rounded-2xl border-2 border-sky-200 shadow-sm">
      <label className="block text-center">
        <span className="text-sm font-bold text-sky-700 flex items-center justify-center gap-1">
          ✏️ ¿Cómo se llama tu asistente?
        </span>
        <input
          type="text"
          className="input-kid mt-2 text-center text-lg font-extrabold text-slate-700"
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, 20))}
          placeholder="Escribe un nombre..."
          maxLength={20}
          aria-label="Nombre del asistente"
        />
        <p className="text-xs text-slate-500 mt-1">El robot te hablará con este nombre</p>
      </label>
    </div>
  );
}
