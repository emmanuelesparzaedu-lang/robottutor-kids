import { useCallback, useEffect, useRef, useState } from 'react';
import { DRAW_BRUSH_SIZES, DRAW_COLORS } from '../constants';

const CANVAS_SIZE = 280;

function getPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export default function RobotDrawingPad({ initialImage, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const historyRef = useRef([]);

  const [color, setColor] = useState('#2D3748');
  const [brushId, setBrushId] = useState('medium');
  const [tool, setTool] = useState('pen');
  const [ready, setReady] = useState(false);

  const brushSize = DRAW_BRUSH_SIZES.find((b) => b.id === brushId)?.size ?? 8;

  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      historyRef.current.push(canvas.toDataURL('image/png'));
      if (historyRef.current.length > 12) historyRef.current.shift();
    } catch {
      /* canvas vacío */
    }
  }, []);

  const paintBackground = useCallback((ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(12, 12, CANVAS_SIZE - 24, CANVAS_SIZE - 24);
    ctx.setLineDash([]);
  }, []);

  const loadImage = useCallback(
    (dataUrl) => {
      const canvas = canvasRef.current;
      if (!canvas || !dataUrl) return;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        paintBackground(ctx);
        const scale = Math.min(
          (CANVAS_SIZE - 24) / img.width,
          (CANVAS_SIZE - 24) / img.height,
        );
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (CANVAS_SIZE - w) / 2, (CANVAS_SIZE - h) / 2, w, h);
        setReady(true);
      };
      img.src = dataUrl;
    },
    [paintBackground],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    paintBackground(ctx);
    if (initialImage) loadImage(initialImage);
    else setReady(true);
  }, [initialImage, loadImage, paintBackground]);

  const stroke = useCallback(
    (x, y, start) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = tool === 'eraser' ? brushSize * 2.2 : brushSize;
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

      if (start) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        lastPointRef.current = { x, y };
      } else {
        const last = lastPointRef.current;
        if (last) {
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        lastPointRef.current = { x, y };
      }
    },
    [brushSize, color, tool],
  );

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (e.pointerType === 'touch') e.currentTarget.setPointerCapture(e.pointerId);
    snapshot();
    drawingRef.current = true;
    const { x, y } = getPoint(canvasRef.current, e.clientX, e.clientY);
    stroke(x, y, true);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPoint(canvasRef.current, e.clientX, e.clientY);
    stroke(x, y, false);
  };

  const endStroke = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (e.pointerType === 'touch') {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ya liberado */
      }
    }
  };

  const clearCanvas = () => {
    snapshot();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    paintBackground(ctx);
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    loadImage(prev);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png', 0.9));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Dibuja tu asistente con el dedo o el lápiz. Toca dentro del cuadro punteado.
      </p>

      <div className="relative mx-auto w-full max-w-[300px] rounded-3xl border-4 border-sky-200 bg-white p-2 shadow-inner touch-none select-none">
        <canvas
          ref={canvasRef}
          className="w-full aspect-square rounded-2xl cursor-crosshair bg-white"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
          aria-label="Lienzo para dibujar tu robot"
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 text-sm text-slate-500">
            Cargando…
          </div>
        )}
      </div>

      <div>
        <span className="text-sm font-semibold text-slate-600">Colores</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {DRAW_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                setTool('pen');
              }}
              className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c && tool === 'pen' ? 'ring-4 ring-sky-400 ring-offset-2 scale-110' : 'border-white'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DRAW_BRUSH_SIZES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBrushId(b.id)}
            className={`btn-secondary flex-1 min-w-[4.5rem] text-xs ${
              brushId === b.id && tool === 'pen' ? 'border-sky-400 bg-sky-50' : ''
            }`}
          >
            {b.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTool('eraser')}
          className={`btn-secondary flex-1 min-w-[4.5rem] text-xs ${
            tool === 'eraser' ? 'border-amber-400 bg-amber-50' : ''
          }`}
        >
          🧽 Borrar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={undo} className="btn-secondary text-xs flex-1">
          ↩ Deshacer
        </button>
        <button type="button" onClick={clearCanvas} className="btn-secondary text-xs flex-1">
          🗑️ Limpiar
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button type="button" onClick={handleSave} className="btn-primary w-full">
          ✓ Usar este dibujo
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary w-full text-sm">
            Volver al robot listo
          </button>
        )}
      </div>
    </div>
  );
}
