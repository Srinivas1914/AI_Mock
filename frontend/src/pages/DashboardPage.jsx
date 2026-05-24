import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts'

const DOMAINS = {
  'Software Engineering': { color: '#4fc3f7', icon: '⚙️', topicCount: 10 },
  'Data Science': { color: '#a5d6a7', icon: '📊', topicCount: 8 },
  'HR / Non-Tech': { color: '#ffcc80', icon: '🤝', topicCount: 8 },
}

const QUICK_ACTIONS = [
  { path: '/mock', icon: '🎤', title: 'Mock Interview', desc: 'AI-powered Q&A with instant feedback', color: '#ce93d8' },
  { path: '/coding', icon: '💻', title: 'Coding Helper', desc: 'Explain · Hint · Solve · Optimize', color: '#80cbc4' },
  { path: '/tracker', icon: '📚', title: 'Topic Tracker', desc: 'Mark progress & get AI study tips', color: '#ffcc80' },
]

const TIPS = [
  'Use the STAR method for behavioral questions.',
  'Practice speaking your answers aloud — not just typing.',
  'Research the company before every interview.',
  'Always ask 2-3 thoughtful questions at the end.',
  'Review your past mock scores to spot weak areas.',
  'Time yourself — most answers should be 1-2 minutes.',
]

export default function DashboardPage() {
  const { user, API } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])

  useEffect(() => {
    API.get('/stats').then(r => setStats(r.data)).catch(() => {})
    API.get('/sessions').then(r => setSessions(r.data)).catch(() => {})
  }, [])

  const mockSessions = sessions.filter(s => s.session_type === 'mock')
  const chartData = mockSessions.slice(-7).map((s, i) => ({
    name: `S${i + 1}`,
    score: s.score || 0,
  }))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
              {greeting}, 
            </p>
            <h1 style={{
              fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, margin: 0,
              background: 'linear-gradient(135deg, #e8e8f0 40%, #63b3ed)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {user?.name} 👋
            </h1>
          </div>
          <div style={{
            background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.2)',
            borderRadius: 10, padding: '0.7rem 1rem',
            fontSize: '0.78rem', color: '#63b3ed', maxWidth: 280,
            fontStyle: 'italic',
          }}>
            💡 {tip}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: '2rem' }}>
        {[
          { label: 'Total Sessions', val: stats?.total_sessions ?? '—', color: '#63b3ed', icon: '📋' },
          { label: 'Mock Interviews', val: stats?.mock_sessions ?? '—', color: '#ce93d8', icon: '🎤' },
          { label: 'Avg Score', val: stats?.avg_score ? `${stats.avg_score}/10` : '—', color: '#68d391', icon: '⭐' },
          { label: 'Focus Alerts', val: stats?.total_alerts ?? '0', color: '#fc8181', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '1.2rem',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
            <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Domain progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>

        {/* Score trend */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '1.4rem',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '1rem' }}>
            MOCK INTERVIEW SCORE TREND
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#63b3ed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#63b3ed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.78rem' }}
                  labelStyle={{ color: '#888' }}
                  itemStyle={{ color: '#63b3ed' }}
                />
                <Area type="monotone" dataKey="score" stroke="#63b3ed" strokeWidth={2}
                  fill="url(#scoreGrad)" dot={{ fill: '#63b3ed', strokeWidth: 0, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '0.8rem', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '1.5rem' }}>🎤</span>
              Complete mock interviews to see your score trend
            </div>
          )}
        </div>

        {/* Domain coverage */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '1.4rem',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#888', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '1rem' }}>
            DOMAIN COVERAGE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(DOMAINS).map(([name, info]) => {
              const pct = Math.floor(Math.random() * 80) + 10 // placeholder — replace with real progress
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{info.icon} {name}</span>
                    <span style={{ fontSize: '0.72rem', color: info.color, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 5 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 999,
                      background: info.color,
                      boxShadow: `0 0 6px ${info.color}66`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#555', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '1rem' }}>
          QUICK START
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '1.3rem',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'Syne, sans-serif',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = `${a.color}0a` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: 10 }}>{a.icon}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#e8e8f0', marginBottom: 5 }}>{a.title}</div>
              <div style={{ fontSize: '0.72rem', color: '#555', lineHeight: 1.6 }}>{a.desc}</div>
              <div style={{ marginTop: 12, fontSize: '0.72rem', color: a.color, fontWeight: 700 }}>Launch →</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', color: '#555', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '1rem' }}>
            RECENT ACTIVITY
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {sessions.slice(-5).reverse().map((s, i) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '0.8rem 1.2rem',
                borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <div style={{ fontSize: '1rem' }}>
                  {s.session_type === 'mock' ? '🎤' : s.session_type === 'coding' ? '💻' : '📚'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#ccc', fontWeight: 600 }}>
                    {s.session_type === 'mock' ? 'Mock Interview' : s.session_type === 'coding' ? 'Coding Session' : 'Tracker Update'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#555', marginTop: 1 }}>{s.domain}</div>
                </div>
                {s.score && (
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 800,
                    color: s.score >= 7 ? '#68d391' : s.score >= 5 ? '#f6ad55' : '#fc8181',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {s.score}/10
                  </div>
                )}
                <div style={{ fontSize: '0.65rem', color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {new Date(s.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
