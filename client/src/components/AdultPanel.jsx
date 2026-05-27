import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { GRADES, MODES } from '../constants';
import { getApiBase, setApiBase, isCloudMode, getCloudApiUrl } from '../utils/apiBase';

export default function AdultPanel({
  settings,
  onSettingsChange,
  history,
  onClose,
}) {
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [newBlockedTopic, setNewBlockedTopic] = useState('');
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    setServerUrl(getApiBase() || 'http://192.168.1.100:3001');
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput === settings.pin) {
      setUnlocked(true);
      setPinInput('');
    } else {
      alert('PIN incorrecto');
    }
  };

  const toggleTopic = (topicId) => {
    const allowed = settings.allowedTopics || [];
    const next = allowed.includes(topicId)
      ? allowed.filter((t) => t !== topicId)
      : [...allowed, topicId];
    onSettingsChange({ ...settings, allowedTopics: next });
  };

  const addBlockedTopic = () => {
    const topic = newBlockedTopic.trim().toLowerCase();
    if (!topic) return;
    const blocked = settings.blockedTopics || [];
    if (!blocked.includes(topic)) {
      onSettingsChange({ ...settings, blockedTopics: [...blocked, topic] });
    }
    setNewBlockedTopic('');
  };

  const removeBlockedTopic = (topic) => {
    onSettingsChange({
      ...settings,
      blockedTopics: (settings.blockedTopics || []).filter((t) => t !== topic),
    });
  };

  if (!unlocked) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <form onSubmit={handleUnlock} className="card-kid max-w-sm w-full space-y-4">
          <h2 className="text-xl font-extrabold text-slate-700">Panel para adultos</h2>
          <p className="text-sm text-slate-500">Ingresa el PIN para configurar la seguridad del alumno.</p>
          <input
            type="password"
            className="input-kid"
            placeholder="PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            maxLength={8}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">Entrar</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card-kid max-w-lg w-full space-y-5 my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-slate-700">⚙️ Configuración para adultos</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        {Capacitor.isNativePlatform() && isCloudMode() && (
          <div className="p-3 bg-green-50 rounded-2xl border border-green-200">
            <p className="text-sm font-bold text-green-800">☁️ Conectado a la nube</p>
            <p className="text-xs text-green-700 mt-1 break-all">{getApiBase()}</p>
            <p className="text-xs text-green-600 mt-1">No necesitas laptop encendida. Solo internet.</p>
          </div>
        )}

        {Capacitor.isNativePlatform() && !isCloudMode() && (
          <div>
            <span className="text-sm font-semibold text-slate-600">Servidor (IP del PC con la app)</span>
            <p className="text-xs text-slate-500 mb-1">
              Ej: http://192.168.1.50:3001 — PC y tablet en la misma WiFi
            </p>
            <input
              type="url"
              className="input-kid"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.100:3001"
            />
            <button
              type="button"
              className="btn-secondary w-full mt-2 text-sm"
              onClick={() => {
                setApiBase(serverUrl);
                alert('IP del servidor guardada.');
              }}
            >
              Guardar IP del servidor
            </button>
            {getCloudApiUrl() && (
              <button
                type="button"
                className="btn-primary w-full mt-2 text-sm"
                onClick={() => {
                  setApiBase(getCloudApiUrl());
                  setServerUrl(getCloudApiUrl());
                  alert('Restaurado a servidor en la nube.');
                }}
              >
                Usar servidor en la nube
              </button>
            )}
          </div>
        )}

        <label className="block">
          <span className="text-sm font-semibold text-slate-600">Grado / edad del alumno</span>
          <select
            className="input-kid mt-1"
            value={settings.grade}
            onChange={(e) => onSettingsChange({ ...settings, grade: e.target.value })}
          >
            {GRADES.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-sm font-semibold text-slate-600">Temas permitidos</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {MODES.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings.allowedTopics || []).includes(m.id)}
                  onChange={() => toggleTopic(m.id)}
                  className="accent-sky-500"
                />
                {m.emoji} {m.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-semibold text-slate-600">Bloquear palabras o temas</span>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              className="input-kid flex-1"
              placeholder="Ej: fantasmas, peleas..."
              value={newBlockedTopic}
              onChange={(e) => setNewBlockedTopic(e.target.value)}
            />
            <button type="button" onClick={addBlockedTopic} className="btn-secondary">+</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(settings.blockedTopics || []).map((topic) => (
              <span
                key={topic}
                className="bg-red-50 text-red-700 text-xs px-3 py-1 rounded-full flex items-center gap-1"
              >
                {topic}
                <button type="button" onClick={() => removeBlockedTopic(topic)} className="font-bold">×</button>
              </span>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 rounded-2xl border border-amber-200">
          <input
            type="checkbox"
            checked={settings.strictMode}
            onChange={(e) => onSettingsChange({ ...settings, strictMode: e.target.checked })}
            className="w-5 h-5 accent-amber-500"
          />
          <div>
            <span className="font-bold text-amber-800">Modo estricto</span>
            <p className="text-xs text-amber-700">Para niños pequeños: bloquea más temas sensibles.</p>
          </div>
        </label>

        <div>
          <span className="text-sm font-semibold text-slate-600">Historial local ({history.length} mensajes)</span>
          <div className="mt-2 max-h-32 overflow-y-auto chat-scroll bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
            {history.length === 0 ? (
              <p>Sin historial guardado.</p>
            ) : (
              history.slice(-15).map((h, i) => (
                <p key={i}>
                  <strong>{h.role === 'user' ? 'Alumno' : 'Robot'}:</strong> {h.content.slice(0, 80)}
                  {h.content.length > 80 ? '…' : ''}
                </p>
              ))
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400">
          PIN por defecto: 1234 — cámbialo en localStorage (robottutor-adult-settings).
        </p>

        <button type="button" onClick={onClose} className="btn-primary w-full">Guardar y cerrar</button>
      </div>
    </div>
  );
}
