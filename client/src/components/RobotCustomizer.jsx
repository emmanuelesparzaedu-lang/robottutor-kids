import { useState } from 'react';
import { ROBOT_COLORS, EYE_TYPES, MOUTH_TYPES, EXPRESSIONS } from '../constants';
import RobotDrawingPad from './RobotDrawingPad';

export default function RobotCustomizer({ robot, onChange }) {
  const [tab, setTab] = useState(robot.avatarMode === 'draw' ? 'draw' : 'preset');
  const avatarMode = robot.avatarMode || 'preset';

  const update = (key, value) => onChange({ ...robot, [key]: value });

  const switchToPreset = () => {
    setTab('preset');
    onChange({ ...robot, avatarMode: 'preset' });
  };

  const switchToDraw = () => {
    setTab('draw');
    onChange({ ...robot, avatarMode: 'draw' });
  };

  const handleDrawingSave = (dataUrl) => {
    onChange({
      ...robot,
      avatarMode: 'draw',
      customAvatar: dataUrl,
    });
    setTab('draw');
  };

  return (
    <aside className="card-kid space-y-4">
      <h2 className="text-lg font-extrabold text-slate-700 flex items-center gap-2">
        <span>🎨</span> Personaliza tu robot
      </h2>

      <label className="block">
        <span className="text-sm font-semibold text-slate-600">Nombre del asistente</span>
        <input
          type="text"
          className="input-kid mt-1"
          maxLength={20}
          value={robot.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="RoboTutor"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={switchToPreset}
          className={`btn-secondary text-xs ${tab === 'preset' ? 'border-sky-400 bg-sky-50' : ''}`}
        >
          🤖 Robot listo
        </button>
        <button
          type="button"
          onClick={switchToDraw}
          className={`btn-secondary text-xs ${tab === 'draw' ? 'border-sky-400 bg-sky-50' : ''}`}
        >
          ✏️ Dibujar
        </button>
      </div>

      {tab === 'draw' ? (
        <RobotDrawingPad
          initialImage={robot.customAvatar}
          onSave={handleDrawingSave}
          onCancel={avatarMode === 'draw' && robot.customAvatar ? switchToPreset : null}
        />
      ) : (
        <>
          <div>
            <span className="text-sm font-semibold text-slate-600">Color del robot</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {ROBOT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => update('bodyColor', color)}
                  className={`w-9 h-9 rounded-full border-3 transition-transform hover:scale-110 ${
                    robot.bodyColor === color ? 'ring-4 ring-sky-400 ring-offset-2 scale-110' : 'border-white'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-600">Tipo de ojos</span>
            <select
              className="input-kid mt-1"
              value={robot.eyeType}
              onChange={(e) => update('eyeType', e.target.value)}
            >
              {EYE_TYPES.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-600">Tipo de boca</span>
            <select
              className="input-kid mt-1"
              value={robot.mouthType}
              onChange={(e) => update('mouthType', e.target.value)}
            >
              {MOUTH_TYPES.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={robot.antennas}
              onChange={(e) => update('antennas', e.target.checked)}
              className="w-5 h-5 rounded accent-sky-500"
            />
            <span className="text-sm font-semibold text-slate-600">Antenas</span>
          </label>

          <div>
            <span className="text-sm font-semibold text-slate-600">Expresión</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {EXPRESSIONS.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => update('expression', exp.id)}
                  className={`btn-secondary text-left ${
                    robot.expression === exp.id ? 'border-sky-400 bg-sky-50' : ''
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={switchToDraw} className="btn-primary w-full text-sm">
            ✏️ Crear mi propio dibujo
          </button>
        </>
      )}

      {tab === 'draw' && avatarMode === 'draw' && robot.customAvatar && (
        <p className="text-xs text-green-600 font-semibold text-center">
          ✓ Tu dibujo está guardado en este dispositivo
        </p>
      )}
    </aside>
  );
}
