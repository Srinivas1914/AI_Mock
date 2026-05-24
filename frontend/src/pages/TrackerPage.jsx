import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const DOMAINS = {
  'Software Engineering': {
    color: '#4fc3f7', icon: '⚙️',
    topics: [
      { name: 'Arrays & Strings', difficulty: 'Easy', tag: 'DSA' },
      { name: 'Trees & Graphs', difficulty: 'Medium', tag: 'DSA' },
      { name: 'Dynamic Programming', difficulty: 'Hard', tag: 'DSA' },
      { name: 'System Design', difficulty: 'Hard', tag: 'Architecture' },
      { name: 'OOP Concepts', difficulty: 'Medium', tag: 'Concepts' },
      { name: 'React / Frontend', difficulty: 'Medium', tag: 'Web' },
      { name: 'Node.js / Backend', difficulty: 'Medium', tag: 'Web' },
      { name: 'SQL & Databases', difficulty: 'Medium', tag: 'Data' },
      { name: 'OS & Networking', difficulty: 'Hard', tag: 'Systems' },
      { name: 'Sorting & Searching', difficulty: 'Easy', tag: 'DSA' },
    ],
  },
  'Data Science': {
    color: '#a5d6a7', icon: '📊',
    topics: [
      { name: 'Statistics & Probability', difficulty: 'Medium', tag: 'Math' },
      { name: 'Machine Learning Basics', difficulty: 'Medium', tag: 'ML' },
      { name: 'Python / Pandas', difficulty: 'Easy', tag: 'Tools' },
      { name: 'SQL for Analytics', difficulty: 'Easy', tag: 'Data' },
      { name: 'Feature Engineering', difficulty: 'Hard', tag: 'ML' },
      { name: 'Model Evaluation', difficulty: 'Medium', tag: 'ML' },
      { name: 'Deep Learning', difficulty: 'Hard', tag: 'DL' },
      { name: 'Data Visualization', difficulty: 'Easy', tag: 'Tools' },
    ],
  },
  'HR / Non-Tech': {
    color: '#ffcc80', icon: '🤝',
    topics: [
      { name: 'Tell Me About Yourself', difficulty: 'Easy', tag: 'Core' },
      { name: 'Strengths & Weaknesses', difficulty: 'Easy', tag: 'Core' },
      { name: 'STAR Method Questions', difficulty: 'Medium', tag: 'Behavioral' },
      { name: 'Leadership Examples', difficulty: 'Medium', tag: 'Behavioral' },
      { name: 'Conflict Resolution', difficulty: 'Medium', tag: 'Behavioral' },
      { name: 'Career Goals', difficulty: 'Easy', tag: 'Core' },
      { name: 'Company Research', difficulty: 'Easy', tag: 'Preparation' },
      { name: 'Salary Negotiation', difficulty: 'Hard', tag: 'Negotiation' },
    ],
  },
}

const DIFF_COLOR = { Easy: '#a5d6a7', Medium: '#ffcc80', Hard: '#fc8181' }

export default function TrackerPage() {
  const { API } = useAuth()
  const [domain, setDomain] = useState('Software Engineering')
  const [progress, setProgress] = useState({})
  const [activeTip, setActiveTip] = useState(null)
  const [tips, setTips] = useState({})
  const [loadingTip, setLoadingTip] = useState(null)
  const [notes, setNotes] = useState({})
  const [filter, setFilter] = useState('All')
  const [saving, setSaving] = useState(false)

  const info = DOMAINS[domain]
  const color = info.color
  const topics = info.topics
  const domainProgress = progress[domain] || {}
  const done = Object.values(domainProgress).filter(Boolean).length
  const pct = topics.length ? Math.round((done / topics.length) * 100) : 0

  useEffect(() => {
    API.get('/progress').then(r => {
      const raw = r.data
      const converted = {}
      Object.entries(raw).forEach(([d, topicMap]) => {
        converted[d] = {}
        Object.entries(topicMap).forEach(([idx, val]) => { converted[d][idx] = val })
      })
      setProgress(converted)
    }).catch(() => {})
  }, [])

  const toggle = async (i) => {
    const current = domainProgress[i] || false
    const updated = { ...domainProgress, [i]: !current }
    setProgress(p => ({ ...p, [domain]: updated }))
    setSaving(true)
    try {
      await API.post('/progress', { domain, topic_index: i, completed: !current })
    } catch {
      toast.error('Failed to save progress')
    } finally {
      setSaving(false)
    }
  }

  const getTip = async (topic, i) => {
    if (activeTip === i) { setActiveTip(null); return }
    setActiveTip(i)
    if (tips[`${domain}-${i}`]) return
    setLoadingTip(i)
    try {
      const res = await fetch('/api/ai/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: 'You are a concise interview coach. Respond ONLY with 3 bullet points, each under 25 words. No intro. Format: • tip1\n• tip2\n• tip3',
          messages: [{ role: 'user', content: `Top 3 interview tips for "${topic.name}" in a ${domain} interview.` }],
        }),
      })
      const data = await res.json()
      setTips(t => ({ ...t, [`${domain}-${i}`]: data.content?.[0]?.text || 'No tips available.' }))
    } catch {
      setTips(t => ({ ...t, [`${domain}-${i}`]: '• Review core concepts\n• Practice with examples\n• Explain your thought process' }))
    } finally {
      setLoadingTip(null)
    }
  }

  const filtered = topics.filter(t => filter === 'All' || t.difficulty === filter || t.tag === filter)
  const tags = ['All', ...new Set(topics.map(t => t.difficulty)), ...new Set(topics.map(t => t.tag))]

  return (
    <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#e8e8f0' }}>📚 Topic Tracker</h2>
          <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {done}/{topics.length} complete · {pct}% ready
            {saving && <span style={{ color: '#f6ad55', marginLeft: 8 }}>saving...</span>}
          </p>
        </div>
        {/* Domain selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(DOMAINS).map(([d, info]) => (
            <button key={d} onClick={() => { setDomain(d); setActiveTip(null); setFilter('All') }} style={{
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
              fontSize: '0.72rem', fontWeight: domain === d ? 800 : 500,
              background: domain === d ? `${info.color}15` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${domain === d ? info.color : 'rgba(255,255,255,0.07)'}`,
              color: domain === d ? info.color : '#555',
            }}>{info.icon}</button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 999,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}66`,
            transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
          {topics.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 999,
              background: domainProgress[i] ? color : 'rgba(255,255,255,0.05)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        {['All', 'Easy', 'Medium', 'Hard'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'Syne, sans-serif', fontSize: '0.7rem', fontWeight: filter === f ? 800 : 400,
            background: filter === f ? (f === 'All' ? 'rgba(255,255,255,0.1)' : `${DIFF_COLOR[f]}15`) : 'transparent',
            border: `1px solid ${filter === f ? (f === 'All' ? '#888' : DIFF_COLOR[f]) : 'rgba(255,255,255,0.07)'}`,
            color: filter === f ? (f === 'All' ? '#e8e8f0' : DIFF_COLOR[f]) : '#555',
          }}>{f}</button>
        ))}
      </div>

      {/* Topics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(topic => {
          const i = topics.indexOf(topic)
          const checked = domainProgress[i] || false
          const isActive = activeTip === i
          const tipKey = `${domain}-${i}`

          return (
            <div key={topic.name} style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${checked ? `${color}33` : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 12, overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.9rem 1rem', gap: 12 }}>
                {/* Checkbox */}
                <div onClick={() => toggle(i)} style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `2px solid ${checked ? color : '#333'}`,
                  background: checked ? `${color}20` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  color: color, fontWeight: 900, fontSize: '0.75rem',
                }}>
                  {checked && '✓'}
                </div>

                {/* Name */}
                <span style={{
                  flex: 1, fontSize: '0.86rem', fontWeight: 600,
                  color: checked ? '#4a4a5a' : '#d8d8e8',
                  textDecoration: checked ? 'line-through' : 'none',
                  textDecorationColor: color,
                }}>
                  {topic.name}
                </span>

                {/* Tag */}
                <span style={{
                  fontSize: '0.6rem', padding: '2px 7px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#555', fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {topic.tag}
                </span>

                {/* Difficulty */}
                <span style={{
                  fontSize: '0.62rem', padding: '2px 8px', borderRadius: 999,
                  background: `${DIFF_COLOR[topic.difficulty]}12`,
                  border: `1px solid ${DIFF_COLOR[topic.difficulty]}33`,
                  color: DIFF_COLOR[topic.difficulty], fontWeight: 700,
                }}>
                  {topic.difficulty}
                </span>

                {/* Tips btn */}
                <button onClick={() => getTip(topic, i)} style={{
                  padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  background: isActive ? 'rgba(255,204,128,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? '#ffcc80' : 'rgba(255,255,255,0.07)'}`,
                  color: isActive ? '#ffcc80' : '#555',
                  fontSize: '0.68rem', fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  transition: 'all 0.15s',
                }}>
                  💡 Tips
                </button>
              </div>

              {/* Tips panel */}
              {isActive && (
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  padding: '1rem 1.2rem',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <div style={{ fontSize: '0.65rem', color: '#ffcc80', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
                    KEY INTERVIEW TIPS
                  </div>
                  {loadingTip === i ? (
                    <div style={{ color: '#555', fontSize: '0.78rem' }}>Loading tips...</div>
                  ) : (
                    <div style={{ color: '#bbb', fontSize: '0.82rem', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
                      {tips[tipKey]}
                    </div>
                  )}

                  <textarea
                    placeholder="Your personal notes for this topic..."
                    value={notes[tipKey] || ''}
                    onChange={e => setNotes(n => ({ ...n, [tipKey]: e.target.value }))}
                    style={{
                      width: '100%', minHeight: 60,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 8, color: '#aaa',
                      padding: '0.6rem 0.8rem', fontSize: '0.78rem',
                      fontFamily: 'Syne, sans-serif', resize: 'vertical',
                      outline: 'none', marginTop: 10, boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion */}
      {done === topics.length && topics.length > 0 && (
        <div style={{
          marginTop: '1.5rem', textAlign: 'center', padding: '1.5rem',
          background: `${color}08`, border: `1px solid ${color}33`, borderRadius: 14,
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏆</div>
          <div style={{ color, fontWeight: 800, fontSize: '0.95rem' }}>
            All {domain} topics complete — you're ready!
          </div>
        </div>
      )}
    </div>
  )
}
