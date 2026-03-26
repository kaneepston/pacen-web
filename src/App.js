import { useState, useEffect, useRef } from 'react';
import './App.css';

let _id = 0;
const uid = () => ++_id;

const INITIAL_MESSAGES = [
  { id: uid(), role: 'ai', text: 'Hello. I am PACEN, your personal medical copilot. May I ask your name?' }
];

const GENERIC_REPLIES = [
  name => `Based on what you've shared, ${name}, I'd suggest focusing on consistent sleep schedules. Quality rest is foundational to everything I track.`,
  () => `I'm designed to detect patterns across your physiological signals over time. What aspect of your health matters most to you right now?`,
  name => `Your heart rate variability looks stable today, ${name}. That's a good sign — it suggests your nervous system is well-regulated.`,
  name => `You're in good hands, ${name}. Keep asking — the more context you give me, the better I can support you.`,
  () => `Cardiovascular coherence improves significantly with consistent breathing patterns. I can guide you through that if you'd like.`,
];

function TypingIndicator() {
  return (
    <div className="ai-bubble-wrapper">
      <div className="glow-wrap">
        <div className="ai-bubble typing-bubble">
          <div className="typing-dots"><span /><span /><span /></div>
        </div>
      </div>
    </div>
  );
}

function HealthCard({ onConnect, onSkip }) {
  return (
    <div className="ai-bubble-wrapper health-card-row">
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

function HeartRateWidget() {
  const [bpm, setBpm] = useState(72);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
      setBpm(prev => Math.min(95, Math.max(58, prev + Math.floor(Math.random() * 5) - 2)));
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="widget-card">
      <div className="widget-row">
        <div className="widget-metric">
          <span className={`widget-heart${pulse ? ' widget-heart--beat' : ''}`}>♥</span>
          <div className="widget-values">
            <span className="widget-number">{bpm}</span>
            <span className="widget-unit">BPM</span>
          </div>
          <span className="widget-label">Heart Rate</span>
        </div>
        <div className="widget-divider" />
        <div className="widget-metric">
          <span className="widget-icon">◎</span>
          <div className="widget-values">
            <span className="widget-number">6,842</span>
            <span className="widget-unit">steps</span>
          </div>
          <span className="widget-label">Activity</span>
        </div>
        <div className="widget-divider" />
        <div className="widget-metric">
          <span className="widget-icon">◐</span>
          <div className="widget-values">
            <span className="widget-number">7.2</span>
            <span className="widget-unit">hrs</span>
          </div>
          <span className="widget-label">Sleep</span>
        </div>
      </div>
      <div className="widget-status">
        <span className="widget-dot" />
        Live · Apple Health
      </div>
    </div>
  );
}

function SleepWidget() {
  const stages = [
    { label: 'Deep',  value: '1h 48m', pct: 25, color: 'rgba(99,102,241,0.85)'  },
    { label: 'REM',   value: '1h 30m', pct: 21, color: 'rgba(139,92,246,0.75)'  },
    { label: 'Light', value: '3h 55m', pct: 54, color: 'rgba(196,181,253,0.95)' },
  ];
  return (
    <div className="ai-bubble-wrapper sleep-card-row">
      <div className="sleep-card">
        <div className="sleep-header-row">
          <div>
            <p className="sleep-card-title">Last Night</p>
            <p className="sleep-card-meta">11:45 PM — 6:58 AM</p>
          </div>
          <div className="sleep-score-badge">
            <span className="sleep-score-num">82</span>
            <span className="sleep-score-label">SCORE</span>
          </div>
        </div>
        <p className="sleep-total">7<span className="sleep-total-unit">h </span>13<span className="sleep-total-unit">m</span></p>
        <div className="sleep-bar-track">
          {stages.map(s => (
            <div key={s.label} className="sleep-bar-seg" style={{ flex: s.pct, backgroundColor: s.color }} />
          ))}
        </div>
        <div className="sleep-legend">
          {stages.map(s => (
            <div key={s.label} className="sleep-legend-item">
              <div className="sleep-legend-dot" style={{ backgroundColor: s.color }} />
              <span className="sleep-legend-label">{s.label}</span>
              <span className="sleep-legend-value">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MsgBubble({ msg, onConnect, onSkip }) {
  if (msg.role === 'widget')       return <HeartRateWidget />;
  if (msg.role === 'sleep-widget') return <SleepWidget />;
  if (msg.role === 'health-card')  return <HealthCard onConnect={onConnect} onSkip={onSkip} />;
  if (msg.role === 'ai') return (
    <div className="ai-bubble-wrapper message-enter">
      <div className="glow-wrap">
        <div className="ai-bubble"><p>{msg.text}</p></div>
      </div>
    </div>
  );
  return (
    <div className="user-bubble-wrapper message-enter">
      <div className="user-bubble"><p>{msg.text}</p></div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages]     = useState(INITIAL_MESSAGES);
  const [input, setInput]           = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [step, setStep]             = useState('ask_name');
  const [userName, setUserName]     = useState('');
  const [replyIndex, setReplyIndex] = useState(0);
  const chatRef           = useRef(null);
  const spacerRef         = useRef(null);
  const widgetIdRef       = useRef(null);  // set when widget is added
  const scrollToWidget    = useRef(false); // one-shot: fires once then disarms
  const widgetPinned      = useRef(false); // once true, all scrolling stops

  // Spacer height = chat area client height, so the widget can always
  // scroll flush to the top regardless of how much content is above it.
  useEffect(() => {
    const sync = () => {
      if (chatRef.current && spacerRef.current)
        spacerRef.current.style.height = chatRef.current.clientHeight + 'px';
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (chatRef.current) ro.observe(chatRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;

    // Widget is pinned — scroll to show latest message at bottom,
    // but never go above widgetEl.offsetTop so the widget stays at the top
    if (widgetPinned.current) {
      const spacerH  = spacerRef.current ? spacerRef.current.offsetHeight : 0;
      const widgetEl = container.querySelector(`[data-id="${widgetIdRef.current}"]`);
      const minScroll = widgetEl ? widgetEl.offsetTop : 0;
      const target    = container.scrollHeight - spacerH - container.clientHeight;
      container.scrollTo({ top: Math.max(minScroll, target), behavior: 'smooth' });
      return;
    }

    // One-shot: scroll widget flush to the top, then pin
    if (scrollToWidget.current && widgetIdRef.current) {
      const el = container.querySelector(`[data-id="${widgetIdRef.current}"]`);
      if (el) {
        container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
        scrollToWidget.current = false;
        widgetPinned.current   = true;
        return;
      }
    }

    // scrollHeight = real content + spacer
    // Subtract both spacer and clientHeight so the last message sits at the bottom edge
    const spacerH = spacerRef.current ? spacerRef.current.offsetHeight : 0;
    container.scrollTo({ top: container.scrollHeight - spacerH - container.clientHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMsg = (role, text) => {
    const id = uid();
    if (role === 'widget') {
      widgetIdRef.current  = id;
      scrollToWidget.current = true; // arm the one-shot
    }
    setMessages(prev => [...prev, { id, role, text }]);
    return id;
  };

  const pacenSays = (text, delay = 1300, after = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMsg('ai', text);
      after?.();
    }, delay);
  };

  const handleConnect = () => {
    setMessages(prev => prev.filter(m => m.role !== 'health-card'));
    addMsg('user', 'Connect');
    setStep('connected');

    pacenSays(
      `Apple Health connected. Your live data is now syncing — I can see your heart rate, activity, and sleep.`,
      1200,
      () => {
        addMsg('widget');
        pacenSays(
          `What would you like to explore today? I can analyse your sleep quality, activity trends, or cardiovascular patterns.`,
          1600
        );
      }
    );
  };

  const handleSkip = () => {
    setMessages(prev => prev.filter(m => m.role !== 'health-card'));
    setStep('chat');
    addMsg('user', 'Not now');
    pacenSays(`No worries — you can connect Apple Health anytime from settings. How can I help you today, ${userName}?`);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    addMsg('user', text);

    if (step === 'ask_name') {
      const name = text.split(/[\s,!.]+/)[0];
      const cap  = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      setUserName(cap);
      setStep('ask_health');
      pacenSays(
        `It's a pleasure to meet you, ${cap}. To provide accurate insights, I need to synchronise with your physiological signals.`,
        1400,
        () => setTimeout(() => addMsg('health-card'), 500)
      );
    } else if (step === 'chat' || step === 'connected') {
      if (/\bsleep\b/i.test(text)) {
        pacenSays(
          `Here's a breakdown of your sleep data from last night. Your score of 82 shows good recovery — strong REM and deep cycles.`,
          1300,
          () => addMsg('sleep-widget')
        );
      } else {
        const reply = GENERIC_REPLIES[replyIndex % GENERIC_REPLIES.length](userName);
        setReplyIndex(i => i + 1);
        pacenSays(reply);
      }
    } else {
      pacenSays(`I'm here to help, ${userName}. Once we set up your health data sync, I can provide much more personalised insights.`);
    }
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

          <main className="chat-area" ref={chatRef}>
            {messages.map(msg => (
              <div key={msg.id} data-id={msg.id} className={msg.role === 'widget' ? 'widget-pin' : undefined}>
                <MsgBubble msg={msg} onConnect={handleConnect} onSkip={handleSkip} />
              </div>
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={spacerRef} style={{ flexShrink: 0 }} />
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
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={isTyping}
                />
                {input.trim() ? (
                  <button
                    className="send-button send-button--active"
                    onClick={handleSend}
                    disabled={isTyping}
                  >↑</button>
                ) : (
                  <div className="input-icons">
                    <button className="input-icon-btn" disabled aria-label="Attach">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                    </button>
                    <button className="input-icon-btn" disabled aria-label="Microphone">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0014 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
