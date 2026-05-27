import { useState, useCallback, useRef, useEffect } from 'react';

export function useTextToSpeech({ lang = 'es-ES', rate = 0.92, pitch = 1.05 } = {}) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text, assistantName = 'RoboTutor') => {
      if (!isSupported || !isEnabled || !text?.trim()) return;

      stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang.startsWith('es') && /female|mujer|paula|helena|lucia/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith('es')) ||
        voices[0];
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, isEnabled, lang, rate, pitch, stop],
  );

  useEffect(() => {
    if (isSupported && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }, [isSupported]);

  return {
    isSupported,
    isEnabled,
    setIsEnabled,
    isSpeaking,
    speak,
    stop,
    toggleEnabled: () => setIsEnabled((v) => !v),
  };
}
