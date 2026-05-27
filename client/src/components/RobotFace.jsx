const EYE_RENDERERS = {
  round: (cx, cy, emotion) => (
    <g>
      <circle cx={cx} cy={cy} r="14" fill="white" stroke="#2D3748" strokeWidth="2" />
      <circle
        cx={cx + (emotion === 'curious' ? 3 : 0)}
        cy={cy + (emotion === 'thinking' ? -2 : 2)}
        r="7"
        fill="#2D3748"
      />
      <circle cx={cx + 4} cy={cy} r="2.5" fill="white" />
    </g>
  ),
  happy: (cx, cy) => (
    <g>
      <path
        d={`M ${cx - 14} ${cy} Q ${cx} ${cy - 10} ${cx + 14} ${cy}`}
        fill="none"
        stroke="#2D3748"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  ),
  curious: (cx, cy) => (
    <g>
      <circle cx={cx} cy={cy} r="16" fill="white" stroke="#2D3748" strokeWidth="2" />
      <circle cx={cx + 4} cy={cy + 2} r="9" fill="#2D3748" />
      <circle cx={cx + 7} cy={cy - 1} r="3" fill="white" />
      <line x1={cx - 18} y1={cy - 12} x2={cx - 8} y2={cy - 6} stroke="#2D3748" strokeWidth="2" />
    </g>
  ),
  star: (cx, cy) => (
    <g>
      <polygon
        points={`${cx},${cy - 14} ${cx + 4},${cy - 4} ${cx + 14},${cy - 4} ${cx + 6},${cy + 3} ${cx + 9},${cy + 14} ${cx},${cy + 7} ${cx - 9},${cy + 14} ${cx - 6},${cy + 3} ${cx - 14},${cy - 4} ${cx - 4},${cy - 4}`}
        fill="#FFD700"
        stroke="#2D3748"
        strokeWidth="1.5"
      />
    </g>
  ),
};

const MOUTH_RENDERERS = {
  smile: () => (
    <path
      d="M 115 175 Q 150 200 185 175"
      fill="none"
      stroke="#2D3748"
      strokeWidth="4"
      strokeLinecap="round"
    />
  ),
  open: () => (
    <ellipse cx="150" cy="182" rx="18" ry="14" fill="#FC8181" stroke="#2D3748" strokeWidth="2" />
  ),
  o: () => (
    <circle cx="150" cy="180" r="12" fill="#FC8181" stroke="#2D3748" strokeWidth="2" />
  ),
  line: () => (
    <line x1="130" y1="180" x2="170" y2="180" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" />
  ),
};

const EMOTION_CLASSES = {
  happy: 'animate-bounce-soft',
  curious: 'animate-pulse-glow',
  thinking: '',
  surprised: 'animate-wiggle',
  neutral: '',
};

export default function RobotFace({
  avatarMode = 'preset',
  customAvatar = null,
  bodyColor = '#63B3ED',
  eyeType = 'round',
  mouthType = 'smile',
  antennas = true,
  expression = 'happy',
  name = 'RoboTutor',
  isSpeaking = false,
  emotion,
}) {
  const activeEmotion = emotion || expression;
  const renderEyes = EYE_RENDERERS[eyeType] || EYE_RENDERERS.round;
  const renderMouth = MOUTH_RENDERERS[mouthType] || MOUTH_RENDERERS.smile;
  const animClass = isSpeaking ? 'animate-pulse-glow' : EMOTION_CLASSES[activeEmotion] || '';
  const showCustom = avatarMode === 'draw' && customAvatar;

  return (
    <div className={`flex flex-col items-center ${animClass}`}>
      <p className="text-xl font-extrabold text-slate-700 mb-2 tracking-wide">{name}</p>

      {showCustom ? (
        <div
          className={`w-full max-w-[280px] rounded-3xl border-4 border-sky-200 bg-white p-3 shadow-xl ${
            isSpeaking ? 'ring-4 ring-sky-300 ring-offset-2' : ''
          }`}
        >
          <img
            src={customAvatar}
            alt={`Dibujo de ${name}`}
            className="w-full aspect-square object-contain rounded-2xl"
          />
          {isSpeaking && (
            <div className="mt-2 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
      <svg
        viewBox="0 0 300 320"
        className="w-full max-w-[280px] drop-shadow-xl transition-all duration-500"
        aria-label={`Robot ${name}, expresión ${activeEmotion}`}
      >
        {antennas && (
          <g>
            <line x1="110" y1="55" x2="95" y2="15" stroke="#718096" strokeWidth="5" strokeLinecap="round" />
            <circle cx="95" cy="12" r="10" fill="#FC8181" />
            <line x1="190" y1="55" x2="205" y2="15" stroke="#718096" strokeWidth="5" strokeLinecap="round" />
            <circle cx="205" cy="10" r="10" fill="#68D391" />
          </g>
        )}

        <rect x="70" y="50" width="160" height="140" rx="35" fill={bodyColor} stroke="#2D3748" strokeWidth="3" />

        {renderEyes(115, 115, activeEmotion)}
        {renderEyes(185, 115, activeEmotion)}

        {activeEmotion === 'happy' && (
          <>
            <circle cx="95" cy="145" r="10" fill="#FC8181" opacity="0.4" />
            <circle cx="205" cy="145" r="10" fill="#FC8181" opacity="0.4" />
          </>
        )}

        {activeEmotion === 'thinking' && (
          <>
            <line x1="100" y1="95" x2="130" y2="90" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" />
            <line x1="170" y1="90" x2="200" y2="95" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {activeEmotion === 'surprised' && (
          <>
            <line x1="100" y1="92" x2="130" y2="98" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" />
            <line x1="170" y1="98" x2="200" y2="92" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {renderMouth()}

        <rect x="90" y="200" width="120" height="90" rx="25" fill={bodyColor} stroke="#2D3748" strokeWidth="3" opacity="0.9" />
        <rect x="120" y="225" width="60" height="40" rx="10" fill="white" opacity="0.5" stroke="#2D3748" strokeWidth="2" />
        <circle cx="135" cy="245" r="5" fill="#68D391" className={isSpeaking ? 'animate-pulse' : ''} />
        <circle cx="150" cy="245" r="5" fill="#FC8181" />
        <circle cx="165" cy="245" r="5" fill="#FFD700" />
        <rect x="45" y="210" width="35" height="15" rx="7" fill={bodyColor} stroke="#2D3748" strokeWidth="2" />
        <rect x="220" y="210" width="35" height="15" rx="7" fill={bodyColor} stroke="#2D3748" strokeWidth="2" />
        <rect x="105" y="290" width="30" height="20" rx="8" fill="#718096" stroke="#2D3748" strokeWidth="2" />
        <rect x="165" y="290" width="30" height="20" rx="8" fill="#718096" stroke="#2D3748" strokeWidth="2" />
      </svg>
      )}

      {isSpeaking && !showCustom && (
        <div className="mt-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
