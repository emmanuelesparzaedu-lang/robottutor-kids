import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { DEFAULT_ROBOT, DEFAULT_ADULT_SETTINGS } from './constants';
import { sendChatMessage } from './api/chatClient';
import { isCloudMode, isStandaloneMode } from './utils/apiBase';
import RobotFace from './components/RobotFace';
import RobotCustomizer from './components/RobotCustomizer';
import AssistantNameEditor from './components/AssistantNameEditor';
import ChatBox from './components/ChatBox';
import ModeSelector from './components/ModeSelector';
import AdultPanel from './components/AdultPanel';

export default function App() {
  const defaultStudentId = `stu-${Math.random().toString(36).slice(2, 10)}`;
  const [robot, setRobot] = useLocalStorage('robottutor-robot', DEFAULT_ROBOT);
  const [adultSettings, setAdultSettings] = useLocalStorage(
    'robottutor-adult-settings',
    DEFAULT_ADULT_SETTINGS,
  );
  const [chatHistory, setChatHistory] = useLocalStorage('robottutor-chat-history', []);
  const [studentId] = useLocalStorage('robottutor-student-id', defaultStudentId);

  const [activeMode, setActiveMode] = useState('matematicas');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [robotEmotion, setRobotEmotion] = useState(robot.expression);
  const [isRobotAnimating, setIsRobotAnimating] = useState(false);
  const [suggestedFollowUp, setSuggestedFollowUp] = useState('');
  const [showAdultPanel, setShowAdultPanel] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(true);

  const tts = useTextToSpeech({ lang: 'es-ES' });

  const handleSpeechResult = useCallback((transcript) => {
    if (transcript) setInput(transcript);
  }, []);

  const speech = useSpeechRecognition({
    lang: 'es-ES',
    onResult: handleSpeechResult,
    onError: (err) => {
      if (err === 'not-allowed') {
        alert('Permite el micrófono en la configuración del dispositivo.');
      }
    },
  });

  const updateRobotName = (name) => {
    setRobot({ ...robot, name: name || 'RoboTutor' });
  };

  const persistHistory = useCallback(
    (newMessages) => {
      const flat = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
        ts: Date.now(),
      }));
      setChatHistory(flat.slice(-50));
    },
    [setChatHistory],
  );

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);
    setIsRobotAnimating(true);
    setSuggestedFollowUp('');
    setRobotEmotion('thinking');
    tts.stop();

    const apiHistory = nextMessages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const data = await sendChatMessage({
        studentId,
        message: text,
        mode: activeMode,
        grade: adultSettings.grade,
        history: apiHistory.slice(0, -1),
        settings: {
          strictMode: adultSettings.strictMode,
          blockedTopics: adultSettings.blockedTopics || [],
          allowedTopics: adultSettings.allowedTopics || [],
        },
      });

      const assistantMsg = {
        role: 'assistant',
        content: data.message || 'No pude responder. Intenta otra pregunta.',
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      persistHistory(finalMessages);

      setRobotEmotion(data.emotion || 'happy');
      setSuggestedFollowUp(data.suggestedFollowUp || '');

      if (data.category === 'blocked' || data.safe === false) {
        setRobotEmotion('thinking');
      }

      const reply = data.message || assistantMsg.content;
      tts.speak(reply, robot.name);
    } catch (err) {
      console.error(err);
      const msg = Capacitor.isNativePlatform()
        ? isCloudMode()
          ? '¡Ups! No pude conectar a internet o al servidor. Revisa tu WiFi e intenta de nuevo.'
          : '¡Ups! No pude conectar al servidor. Pide a un adulto que configure la IP en Panel Adultos.'
        : '¡Ups! No pude conectar. ¿Preguntas otra cosa sobre la escuela?';
      const fallback = { role: 'assistant', content: msg };
      const finalMessages = [...nextMessages, fallback];
      setMessages(finalMessages);
      setRobotEmotion('surprised');
      tts.speak(msg, robot.name);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsRobotAnimating(false), 800);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestedFollowUp('');
    setRobotEmotion(robot.expression);
    setChatHistory([]);
    tts.stop();
  };

  const isSpeaking = isRobotAnimating || tts.isSpeaking;

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur border-b border-sky-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                RoboTutor Kids
              </h1>
              <p className="text-xs text-slate-500">
                {robot.name} · Tu asistente educativo
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCustomizer((v) => !v)}
              className="btn-secondary text-xs hidden sm:inline-flex"
            >
              {showCustomizer ? 'Ocultar' : 'Personalizar'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdultPanel(true)}
              className="btn-secondary text-xs"
            >
              👨‍🏫 Adultos
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-4 card-kid flex flex-col items-center justify-center">
            <RobotFace
              avatarMode={robot.avatarMode || 'preset'}
              customAvatar={robot.customAvatar}
              bodyColor={robot.bodyColor}
              eyeType={robot.eyeType}
              mouthType={robot.mouthType}
              antennas={robot.antennas}
              expression={robot.expression}
              name={robot.name}
              emotion={robotEmotion}
              isSpeaking={isSpeaking}
            />
            <AssistantNameEditor name={robot.name} onNameChange={updateRobotName} />
          </section>

          {showCustomizer && (
            <section className="lg:col-span-3">
              <RobotCustomizer robot={robot} onChange={setRobot} />
            </section>
          )}

          <section className={`${showCustomizer ? 'lg:col-span-5' : 'lg:col-span-8'}`}>
            <ChatBox
              messages={messages}
              input={input}
              onInputChange={setInput}
              onSend={sendMessage}
              onClear={clearChat}
              isLoading={isLoading}
              suggestedFollowUp={suggestedFollowUp}
              onUseSuggestion={(s) => {
                setInput(s);
                setSuggestedFollowUp('');
              }}
              isListening={speech.isListening}
              isSpeechSupported={speech.isSupported}
              onToggleMic={speech.toggleListening}
              voiceEnabled={tts.isEnabled}
              onToggleVoice={tts.toggleEnabled}
              isVoiceSpeaking={tts.isSpeaking}
            />
          </section>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-6 px-4">
        RoboTutor Kids — Aprende con seguridad
        {Capacitor.isNativePlatform() && isStandaloneMode() && (
          <span className="block mt-1 text-green-600 font-semibold">📱 Modo independiente — solo necesitas internet</span>
        )}
        {Capacitor.isNativePlatform() && isCloudMode() && !isStandaloneMode() && (
          <span className="block mt-1 text-green-600 font-semibold">☁️ Modo nube — no necesitas laptop</span>
        )}
        {Capacitor.isNativePlatform() && !isCloudMode() && (
          <span className="block mt-1 text-amber-600">Modo local · Configura IP en Panel Adultos</span>
        )}
      </footer>

      {showAdultPanel && (
        <AdultPanel
          settings={adultSettings}
          onSettingsChange={setAdultSettings}
          history={chatHistory}
          onClose={() => setShowAdultPanel(false)}
        />
      )}
    </div>
  );
}
