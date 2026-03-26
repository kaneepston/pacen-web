import { useState, useEffect, useRef } from 'react';
import './App.css';

const INITIAL_MESSAGES = [
  { id: 1, role: 'ai', text: 'Hello. I am PACEN, your personal medical copilot. May I ask your name?' }
];

const GENERIC_REPLIES = [
  name => `Based on what you've shared, ${name}, I'd suggest focusing on consistent sleep schedules. Quality rest is foundational to everything I track.`,
  () => `That's a meaningful question. Once Apple Health is connected, I can give you far more precise and personalised insights.`,
  () => `I'm designed to detect patterns across your physiological signals over time. What aspect of your health matters most to you right now?`,
  () => `Heart rate variability is one of the key indicators I monitor. It reflects your recovery and autonomic balance in real time.`,
  name => `You're in good hands, ${name}. Keep asking — the more context you give me, the better I can support you.`,
];

function TypingIndicator() {
  return (
    <div className="ai-bubble-wrapper message-enter">
      <div className="glow-wrap">
        <div className="ai-bubble typing-bubble">
          <div className="typing-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthCard({ onConnect, onSkip }) {
  return (
    <div className="ai-bubble-wrapper health-card-row message-enter">
      <div className="glow-wrap health-card-glow">
        <div className="health-card">
          <div className="health-icon-container">
            <span className="health-heart">♥</span>
          </div>
          <div className="health-text">
            <p className="health-title">Apple Health</p>
            <p className="health-subtitle">
              Securely sync heart rate, activity, and sleep data for personalised analysis.
            </p>
          </div>
          <button className="health-button" onClick={onConnect}>Connect</button>
          <button className="health-skip-button" onClick={onSkip}>Not now</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState('ask_name');
  const [userName, setUserName] = useState('');
  const [showHealthCard, setShowHealthCard] = useState(false);
  const [replyIndex, setReplyIndex] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showHealthCard]);

  const addMsg = (role, text) =>
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), role, text }]);

  const pacenSays = (text, delay = 1300, afterFn = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMsg('ai', text);
      afterFn?.();
    }, delay);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    addMsg('user', text);

    if (step === 'ask_name') {
      const name = text.split(/[\s,!.]+/)[0];
      const capitalised = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      setUserName(capitalised);
      setStep('ask_health');
      pacenSays(
        `It's a pleasure to meet you, ${capitalised}. To provide accurate insights, I need to synchronise with your physiological signals.`,
        1400,
        () => setTimeout(() => setShowHealthCard(true), 500)
      );

    } else if (step === 'chat' || step === 'connected') {
      const reply = GENERIC_REPLIES[replyIndex % GENERIC_REPLIES.length](userName);
      setReplyIndex(i => i + 1);
      pacenSays(reply);

    } else {
      pacenSays(`I'm here to help, ${userName}. Once we set up your health data sync, I can provide much more personalised insights.`);
    }
  };

  const handleConnect = () => {
    setShowHealthCard(false);
    setStep('connected');
    addMsg('user', 'Connect');
    pacenSays(
      `Apple Health connected. I now have access to your heart rate, activity, and sleep data.`,
      1200,
      () => pacenSays(
        `What would you like to explore today? I can analyse your sleep quality, activity trends, or cardiovascular patterns.`,
        1600
      )
    );
  };

  const handleSkip = () => {
    setShowHealthCard(false);
    setStep('chat');
    addMsg('user', 'Not now');
    pacenSays(`No worries — you can connect Apple Health anytime from settings. How can I help you today, ${userName}?`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      <div className="orb-top-right" />
      <div className="orb-bottom-left" />
      <div className="orb-center" />

      <div className="viewport">
        <div className="phone">
          <header className="header">
            <h1 className="header-title">PACEN</h1>
          </header>

          <main className="chat-area">
            {messages.map(msg =>
              msg.role === 'ai' ? (
                <div key={msg.id} className="ai-bubble-wrapper message-enter">
                  <div className="glow-wrap">
                    <div className="ai-bubble">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="user-bubble-wrapper message-enter">
                  <div className="user-bubble">
                    <p>{msg.text}</p>
                  </div>
                </div>
              )
            )}

            {showHealthCard && (
              <HealthCard onConnect={handleConnect} onSkip={handleSkip} />
            )}

            {isTyping && <TypingIndicator />}

            <div ref={bottomRef} />
          </main>

          <div className="input-bar">
            <div className="glow-wrap">
              <div className="input-inner">
                <input
                  className="input-field"
                  type="text"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                />
                <button
                  className={`send-button${input.trim() ? ' send-button--active' : ''}`}
                  onClick={handleSend}
                  disabled={isTyping || !input.trim()}
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
