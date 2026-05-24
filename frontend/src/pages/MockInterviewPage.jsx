import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const DOMAINS = {
  'Software Engineering': {
    color: '#4fc3f7',
    questions: [
      'Explain the difference between == and === in JavaScript.',
      'What is a closure? Give a real-world example.',
      'How does React\'s virtual DOM work?',
      'Explain Big O notation with examples.',
      'REST vs GraphQL — when would you choose each?',
      'What is a deadlock and how do you prevent it?',
      'Difference between SQL and NoSQL databases?',
      'What is memoization and when do you use it?',
      'Explain event loop in JavaScript.',
      'What is the difference between process and thread?',
    ],
  },
  'Data Science': {
    color: '#a5d6a7',
    questions: [
      'What is overfitting and how do you prevent it?',
      'Explain the bias-variance tradeoff.',
      'Supervised vs unsupervised learning — explain with examples.',
      'How do you handle missing data in a dataset?',
      'What is cross-validation and why is it important?',
      'Explain precision, recall, and F1 score.',
      'How does gradient descent work?',
      'What is the difference between bagging and boosting?',
    ],
  },
  'HR / Non-Tech': {
    color: '#ffcc80',
    questions: [
      'Tell me about yourself.',
      'What are your greatest strengths and weaknesses?',
      'Where do you see yourself in 5 years?',
      'Describe a challenge you overcame at work.',
      'Why do you want to work at our company?',
      'Tell me about a time you showed leadership.',
      'How do you handle pressure and tight deadlines?',
      'Describe a conflict with a colleague and how you resolved it.',
    ],
  },
}

const SYSTEM_PROMPT = (domain, difficulty) =>
  `You are a senior ${domain} interviewer at a top tech company. Evaluate the candidate's answer.
Respond EXACTLY in this format (no deviations):

SCORE: X/10

✅ STRENGTHS:
• [strength 1]
• [strength 2]

❌ GAPS:
• [what was missing, wrong, or unclear]

💡 IDEAL ANSWER:
[2–3 sentence model answer a top candidate would give]

⚡ ONE TIP:
[Single most impactful improvement for next time]

Difficulty: ${difficulty}. Be honest but encouraging. Max 220 words total.`

export default function MockInterviewPage() {
  const { API } = useAuth()
  const [domain, setDomain] = useState('Software Engineering')
  const [difficulty, setDifficulty] = useState('Medium')
  const [phase, setPhase] = useState('idle') // idle|answering|feedback
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [history, setHistory] = useState([])
  const [qIdx, setQIdx] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const timerRef = useRef(null)
  const textRef = useRef(null)
  const recognitionRef = useRef(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const isSpeechSupported = !!SpeechRecognition

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (!isSpeechSupported) {
        toast.error('Voice typing is not supported in this browser. Try Chrome or Edge!')
        return
      }
      
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'
      
      let startText = answer
      
      rec.onstart = () => {
        setIsListening(true)
        toast.success('Microphone is active. Speak now!')
      }
      
      rec.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        setAnswer(startText + (startText ? ' ' : '') + finalTranscript + interimTranscript)
      }
      
      rec.onerror = (err) => {
        console.error('Speech recognition error:', err)
        if (err.error !== 'no-speech') {
          toast.error(`Mic error: ${err.error}`)
          setIsListening(false)
        }
      }
      
      rec.onend = () => {
        setIsListening(false)
      }
      
      rec.start()
      recognitionRef.current = rec
    }
  }

  const domainInfo = DOMAINS[domain]
  const color = domainInfo.color

  useEffect(() => {
    if (phase === 'answering') {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const start = () => {
    const q = domainInfo.questions[qIdx % domainInfo.questions.length]
    setQuestion(q)
    setAnswer('')
    setFeedback('')
    setTimer(0)
    setPhase('answering')
    setTimeout(() => textRef.current?.focus(), 100)
  }

  const submit = async () => {
    if (!answer.trim()) return toast.error('Please write your answer first')
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setPhase('feedback')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT(domain, difficulty),
          messages: [{ role: 'user', content: `Question: "${question}"\n\nAnswer: "${answer}"\n\nTime taken: ${fmt(timer)}` }],
        }),
      })
      const data = await res.json()
      const fb = data.content?.[0]?.text || 'Could not get feedback.'
      setFeedback(fb)
      const scoreMatch = fb.match(/SCORE:\s*(\d+)/)
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null
      setHistory(h => [...h, { q: question, a: answer, fb, score, time: fmt(timer) }])
      await API.post('/sessions', { session_type: 'mock', domain, score, duration: timer }).catch(() => {})
    } catch {
      toast.error('Failed to get AI feedback. Check your connection.')
      setPhase('answering')
    } finally {
      setLoading(false)
    }
  }

  const next = () => { setQIdx(i => i + 1); setPhase('idle') }

  const avgScore = history.length
    ? Math.round(history.reduce((a, h) => a + (h.score || 0), 0) / history.length)
    : null

  return (
    <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.8rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#e8e8f0' }}>🎤 Mock Interview</h2>
          <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
            AI-powered · Real-time feedback · {history.length} questions done
            {avgScore !== null && ` · Avg ${avgScore}/10`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* Domain */}
          {Object.entries(DOMAINS).map(([d, info]) => (
            <button key={d} onClick={() => { setDomain(d); setPhase('idle') }} style={{
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
              fontSize: '0.72rem', fontWeight: domain === d ? 800 : 500,
              background: domain === d ? `${info.color}15` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${domain === d ? info.color : 'rgba(255,255,255,0.08)'}`,
              color: domain === d ? info.color : '#555',
            }}>{d.split('/')[0].trim()}</button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem' }}>
        {[['Easy', '#a5d6a7'], ['Medium', '#ffcc80'], ['Hard', '#fc8181']].map(([d, c]) => (
          <button key={d} onClick={() => setDifficulty(d)} style={{
            padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            fontSize: '0.72rem', fontWeight: difficulty === d ? 800 : 400,
            background: difficulty === d ? `${c}15` : 'transparent',
            border: `1px solid ${difficulty === d ? c : 'rgba(255,255,255,0.06)'}`,
            color: difficulty === d ? c : '#444',
          }}>{d}</button>
        ))}
      </div>

      {/* IDLE */}
      {phase === 'idle' && (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '3.5rem 2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>🎯</div>
          <h3 style={{ color: '#e8e8f0', fontSize: '1.1rem', marginBottom: 8, fontWeight: 700 }}>
            Ready for your next question?
          </h3>
          <p style={{ color: '#555', fontSize: '0.82rem', lineHeight: 1.8, marginBottom: '2rem', maxWidth: 420, margin: '0 auto 2rem' }}>
            The AI interviewer will ask you a <strong style={{ color: color }}>{difficulty}</strong> {domain} question.
            Type your best answer and receive a detailed score with feedback.
          </p>
          <button onClick={start} style={{
            padding: '13px 40px',
            background: `${color}15`, border: `1.5px solid ${color}`,
            borderRadius: 10, color, cursor: 'pointer',
            fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', fontWeight: 800,
            boxShadow: `0 0 24px ${color}22`,
            transition: 'all 0.2s',
          }}>
            Start Question →
          </button>

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.68rem', color: '#444', letterSpacing: '0.08em', marginBottom: 10 }}>
                SESSION HISTORY
              </div>
              {history.slice(-4).reverse().map((h, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)', marginBottom: 6,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: h.score >= 7 ? 'rgba(104,211,145,0.15)' : h.score >= 5 ? 'rgba(246,173,85,0.15)' : 'rgba(252,129,129,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '0.8rem',
                    color: h.score >= 7 ? '#68d391' : h.score >= 5 ? '#f6ad55' : '#fc8181',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {h.score ?? '?'}
                  </div>
                  <div style={{ flex: 1, fontSize: '0.78rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.q}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#444', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                    {h.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANSWERING */}
      {phase === 'answering' && (
        <div>
          {/* Question card */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${color}33`,
            borderRadius: 14, padding: '1.5rem',
            marginBottom: '1.2rem', position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#fc8181',
                  boxShadow: '0 0 6px #fc8181', animation: 'pulse 1s infinite',
                }} />
                <span style={{ fontSize: '0.68rem', color: color, letterSpacing: '0.1em', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                  INTERVIEWER
                </span>
              </div>
              <div style={{
                fontSize: '0.88rem', fontWeight: 800,
                color: timer > 120 ? '#fc8181' : '#888',
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'color 0.3s',
              }}>
                ⏱ {fmt(timer)}
              </div>
            </div>
            <p style={{ color: '#e8e8f0', fontSize: '1.05rem', lineHeight: 1.7, fontWeight: 600, margin: 0 }}>
              {question}
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <textarea
              ref={textRef}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here... Be specific, use examples where possible. You can also use the microphone button below to voice type your answer."
              style={{
                width: '100%', minHeight: 200,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, color: '#e8e8f0',
                padding: '1.2rem 3.5rem 1.2rem 1.2rem', fontSize: '0.9rem',
                fontFamily: 'Syne, sans-serif',
                resize: 'vertical', outline: 'none',
                boxSizing: 'border-box', lineHeight: 1.8,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = color}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button
              onClick={toggleListening}
              title={isListening ? 'Stop Listening' : 'Start Voice Typing'}
              type="button"
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '12px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: isListening ? `1.5px solid #fc8181` : '1.5px solid rgba(255,255,255,0.1)',
                background: isListening ? 'rgba(252,129,129,0.15)' : 'rgba(255,255,255,0.03)',
                color: isListening ? '#fc8181' : '#888',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                boxShadow: isListening ? '0 0 16px rgba(252,129,129,0.3)' : 'none',
                transition: 'all 0.2s ease',
                animation: isListening ? 'pulse-glow 1.5s infinite' : 'none',
              }}
            >
              🎙️
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: '0.72rem', color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
              {answer.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPhase('idle')} style={{
                padding: '9px 18px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
                color: '#555', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: '0.8rem',
              }}>Skip</button>
              <button onClick={submit} disabled={!answer.trim()} style={{
                padding: '9px 24px',
                background: answer.trim() ? 'rgba(104,211,145,0.12)' : 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${answer.trim() ? '#68d391' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 8, color: answer.trim() ? '#68d391' : '#444',
                cursor: answer.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'Syne, sans-serif', fontSize: '0.88rem', fontWeight: 800,
              }}>
                Submit Answer →
              </button>
            </div>
          </div>
          <style>{`
            @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
            @keyframes pulse-glow {
              0% { box-shadow: 0 0 0 0 rgba(252, 129, 129, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(252, 129, 129, 0); }
              100% { box-shadow: 0 0 0 0 rgba(252, 129, 129, 0); }
            }
          `}</style>
        </div>
      )}

      {/* FEEDBACK */}
      {phase === 'feedback' && (
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '1rem 1.2rem', marginBottom: '1rem',
            fontSize: '0.8rem', color: '#666', fontStyle: 'italic',
          }}>
            Q: {question}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '1.5rem', minHeight: 200,
            marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '0.68rem', color: '#f6ad55', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 14, fontFamily: 'JetBrains Mono, monospace' }}>
              ◈ AI FEEDBACK
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, border: '2px solid rgba(246,173,85,0.2)',
                  borderTop: '2px solid #f6ad55', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: '#555', fontSize: '0.8rem' }}>Evaluating your answer...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : (
              <div style={{ color: '#d0d0d0', fontSize: '0.88rem', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
                {feedback}
              </div>
            )}
          </div>

          {!loading && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={next} style={{
                flex: 1, padding: '12px',
                background: `${color}12`, border: `1.5px solid ${color}`,
                borderRadius: 10, color, cursor: 'pointer',
                fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 800,
              }}>Next Question →</button>
              <button onClick={() => setPhase('idle')} style={{
                padding: '12px 20px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
                color: '#555', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: '0.82rem',
              }}>End Session</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
