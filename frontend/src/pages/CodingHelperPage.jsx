import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const MODES = [
  { id: 'explain', icon: '📖', label: 'Explain', color: '#80cbc4',
    placeholder: 'Paste a concept or problem you want explained...\n\nEx: What is a binary search tree and how does it work?',
    system: (lang) => `You are a patient senior engineer. Explain the concept or problem clearly for a job interview context. Use ${lang} examples. Structure: What it is → Why it matters → How it works → Example. Max 200 words. Be concrete.`,
  },
  { id: 'hint', icon: '💡', label: 'Hints', color: '#fff176',
    placeholder: 'Paste the problem you\'re stuck on...\n\nEx: Find two numbers in an array that sum to a target value.',
    system: (lang) => `You are a coding mentor giving progressive hints. Give exactly 3 hints in ${lang}, numbered, each more specific than the last. NEVER give the full solution. Format:\n1. [broad hint]\n2. [more specific hint]\n3. [almost-there hint — point to the key insight]\nMax 150 words.`,
  },
  { id: 'solve', icon: '✅', label: 'Solve', color: '#a5d6a7',
    placeholder: 'Paste the problem to get a full solution...\n\nEx: Reverse a linked list in place.',
    system: (lang) => `You are an expert competitive programmer. Write a clean ${lang} solution with:\n1. Brief approach explanation (1-2 lines)\n2. Well-commented code\n3. Time complexity: O(?)\n4. Space complexity: O(?)\nBe concise and production-quality.`,
  },
  { id: 'optimize', icon: '⚡', label: 'Optimize', color: '#ffcc80',
    placeholder: 'Paste your existing code or approach...\n\nEx: [paste your O(n²) solution here]',
    system: (lang) => `You are a performance expert. Analyze the ${lang} code/approach and:\n1. Identify bottlenecks\n2. Show the optimized version with comments\n3. Before/After complexity comparison\nFocus on time & space. Max 250 words.`,
  },
  { id: 'review', icon: '🔍', label: 'Review', color: '#ce93d8',
    placeholder: 'Paste your code for a professional code review...\n\nLooking for: bugs, edge cases, style, best practices.',
    system: (lang) => `You are a senior engineer doing a code review of ${lang} code. Give structured feedback:\n✅ What's good\n⚠️ Issues (bugs, edge cases, style)\n🔧 Specific fixes with corrected code snippets\nBe direct and professional. Max 250 words.`,
  },
]

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'SQL', 'Rust']

export default function CodingHelperPage() {
  const { API } = useAuth()
  const [mode, setMode] = useState('explain')
  const [lang, setLang] = useState('Python')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [isListening, setIsListening] = useState(false)
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
      
      let startText = input
      
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
        setInput(startText + (startText ? ' ' : '') + finalTranscript + interimTranscript)
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

  const activeMode = MODES.find(m => m.id === mode)

  const run = async () => {
    if (!input.trim()) return toast.error('Please enter a problem or code first')
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setLoading(true)
    setOutput('')
    try {
      const res = await fetch('/api/ai/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: activeMode.system(lang),
          messages: [{ role: 'user', content: input }],
        }),
      })
      const data = await res.json()
      const result = data.content?.[0]?.text || 'No response received.'
      setOutput(result)
      setHistory(h => [...h.slice(-9), { mode, lang, input: input.slice(0, 60), output: result }])
      await API.post('/sessions', { session_type: 'coding', domain: 'Software Engineering' }).catch(() => {})
    } catch {
      toast.error('Failed to get response. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.8rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#e8e8f0' }}>💻 Coding Helper</h2>
        <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
          Explain · Hint · Solve · Optimize · Review — pick your mode
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setOutput('') }} style={{
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Syne, sans-serif', fontSize: '0.78rem', fontWeight: mode === m.id ? 800 : 500,
            background: mode === m.id ? `${m.color}15` : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${mode === m.id ? m.color : 'rgba(255,255,255,0.07)'}`,
            color: mode === m.id ? m.color : '#555',
            transition: 'all 0.15s',
          }}>
            {m.icon} {m.label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto' }}>
          <select value={lang} onChange={e => setLang(e.target.value)} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, color: '#888',
            padding: '7px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
            cursor: 'pointer', outline: 'none',
          }}>
            {LANGUAGES.map(l => <option key={l} style={{ background: '#12121e' }}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Editor area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: '0.68rem', color: '#555', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
            INPUT · {lang}
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={activeMode.placeholder}
              style={{
                flex: 1, minHeight: 340, width: '100%',
                background: '#0a0a10',
                border: `1px solid ${activeMode.color}22`,
                borderRadius: 12, color: '#e8e8f0',
                padding: '1.2rem 3.5rem 1.2rem 1.2rem', fontSize: '0.85rem',
                fontFamily: 'JetBrains Mono, monospace',
                resize: 'vertical', outline: 'none',
                boxSizing: 'border-box', lineHeight: 1.8,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = activeMode.color}
              onBlur={e => e.target.style.borderColor = `${activeMode.color}22`}
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
                boxShadow: isListening ? '0 0 16px rgba(252, 129, 129, 0.3)' : 'none',
                transition: 'all 0.2s ease',
                animation: isListening ? 'pulse-glow 1.5s infinite' : 'none',
              }}
            >
              🎙️
            </button>
          </div>
          <button onClick={run} disabled={!input.trim() || loading} style={{
            padding: '11px',
            background: input.trim() ? `${activeMode.color}15` : 'rgba(255,255,255,0.02)',
            border: `1.5px solid ${input.trim() ? activeMode.color : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 10, color: input.trim() ? activeMode.color : '#444',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'Syne, sans-serif', fontSize: '0.88rem', fontWeight: 800,
            transition: 'all 0.2s',
            boxShadow: input.trim() ? `0 0 16px ${activeMode.color}18` : 'none',
          }}>
            {loading ? 'Processing...' : `${activeMode.icon} ${activeMode.label} →`}
          </button>
        </div>

        {/* Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: '#555', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
              OUTPUT · AI RESPONSE
            </div>
            {output && (
              <button onClick={() => { navigator.clipboard.writeText(output); toast.success('Copied!') }} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6,
                color: '#555', cursor: 'pointer', fontSize: '0.65rem', padding: '3px 8px',
                fontFamily: 'Syne, sans-serif',
              }}>Copy</button>
            )}
          </div>
          <div style={{
            flex: 1, minHeight: 340,
            background: '#0a0a10',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '1.2rem',
            overflowY: 'auto',
            position: 'relative',
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, border: `2px solid ${activeMode.color}33`,
                  borderTop: `2px solid ${activeMode.color}`, borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: '#444', fontSize: '0.78rem' }}>Analyzing with AI...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : output ? (
              <pre style={{
                color: '#d0d0d0', fontSize: '0.82rem', lineHeight: 1.9,
                whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace',
                margin: 0,
              }}>
                {output}
              </pre>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: '#333' }}>
                <span style={{ fontSize: '2rem' }}>{activeMode.icon}</span>
                <span style={{ fontSize: '0.78rem' }}>Output will appear here</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#444', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
            RECENT QUERIES
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.slice(-5).reverse().map((h, i) => (
              <button key={i} onClick={() => { setInput(h.input); setOutput(h.output); setMode(h.mode); setLang(h.lang) }} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#666',
                maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {MODES.find(m => m.id === h.mode)?.icon} {h.input}...
              </button>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(252, 129, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(252, 129, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(252, 129, 129, 0); }
        }
      `}</style>
    </div>
  )
}
