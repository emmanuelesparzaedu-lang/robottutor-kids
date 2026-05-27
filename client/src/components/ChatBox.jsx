import { useRef, useEffect } from 'react';

export default function ChatBox({
  messages,
  input,
  onInputChange,
  onSend,
  onClear,
  isLoading,
  suggestedFollowUp,
  onUseSuggestion,
  isListening,
  isSpeechSupported,
  onToggleMic,
  voiceEnabled,
  onToggleVoice,
  isVoiceSpeaking,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
  };

  return (
    <div className="card-kid flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-extrabold text-slate-700 flex items-center gap-2">
          <span>💬</span> Chat educativo
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggleVoice}
            className={`btn-secondary text-xs py-2 px-3 ${voiceEnabled ? 'border-sky-400 bg-sky-50' : ''}`}
            title="Activar/desactivar voz del robot"
          >
            {voiceEnabled ? '🔊 Voz ON' : '🔇 Voz OFF'}
          </button>
          <button type="button" onClick={onClear} className="btn-secondary text-xs py-2 px-3">
            🗑️ Borrar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll space-y-3 mb-4 pr-1 min-h-[220px] max-h-[320px]">
        {messages.length === 0 && (
          <p className="text-slate-500 text-center py-8 text-sm">
            ¡Hola! Escribe o usa el micrófono 🎤 para preguntar a tu robot.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-br-md'
                  : 'bg-mint-soft text-slate-700 border border-mint-light rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-mint-soft px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
              <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggestedFollowUp && !isLoading && (
        <button
          type="button"
          onClick={() => onUseSuggestion(suggestedFollowUp)}
          className="mb-3 text-left text-xs text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-2 rounded-xl border border-sky-200 transition-colors"
        >
          💡 {suggestedFollowUp}
        </button>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        {isSpeechSupported && (
          <button
            type="button"
            onClick={onToggleMic}
            disabled={isLoading}
            className={`btn-kid shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gradient-to-br from-purple-400 to-pink-500 text-white'
            }`}
            aria-label={isListening ? 'Detener micrófono' : 'Hablar por micrófono'}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
        )}
        <input
          type="text"
          className="input-kid flex-1"
          placeholder={isListening ? 'Escuchando...' : 'Escribe o habla tu pregunta...'}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          maxLength={500}
          disabled={isLoading}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={isLoading || !input.trim()}>
          {isLoading ? '...' : 'Enviar'}
        </button>
      </form>

      {isVoiceSpeaking && (
        <p className="text-xs text-sky-600 mt-2 text-center animate-pulse">🔊 El robot está hablando...</p>
      )}
    </div>
  );
}
