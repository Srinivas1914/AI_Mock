import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#060608',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: `linear-gradient(rgba(99,179,237,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99,179,237,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
      {/* Glow */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,179,237,0.06) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '1.8rem', fontWeight: 900,
            background: 'linear-gradient(135deg, #e8e8f0 30%, #63b3ed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
          }}>◈ PrepLab</div>
          <div style={{ color: '#555', fontSize: '0.8rem', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
            Interview Preparation Platform
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '2rem',
          backdropFilter: 'blur(12px)',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e8e8f0', marginBottom: 6 }}>
            Sign In
          </h2>
          <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: '1.8rem' }}>
            Access your personalized prep dashboard
          </p>

          {/* Demo credentials */}
          <div style={{
            background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.2)',
            borderRadius: 8, padding: '0.7rem 0.9rem', marginBottom: '1.5rem',
            fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: '#63b3ed',
          }}>
            <div style={{ marginBottom: 3, color: '#555' }}>// Demo Credentials</div>
            <div>email: demo@preplab.io</div>
            <div>password: preplab123</div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Email Address" type="email" name="email"
              value={form.email} onChange={handle} placeholder="you@example.com" />
            <Field label="Password" type={show ? 'text' : 'password'} name="password"
              value={form.password} onChange={handle} placeholder="••••••••"
              suffix={
                <button type="button" onClick={() => setShow(s => !s)} style={{
                  background: 'none', border: 'none', color: '#555',
                  cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px',
                }}>
                  {show ? 'Hide' : 'Show'}
                </button>
              }
            />

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '11px',
              background: loading ? 'rgba(99,179,237,0.08)' : 'rgba(99,179,237,0.15)',
              border: '1px solid rgba(99,179,237,0.5)',
              borderRadius: 10, color: '#63b3ed',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 800,
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 0 20px rgba(99,179,237,0.15)',
            }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center', fontSize: '0.78rem', color: '#555',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#63b3ed', fontWeight: 700, textDecoration: 'none' }}>
              Create one →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, suffix, ...props }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>
        {label.toUpperCase()}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input {...props} style={{
          width: '100%', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
          color: '#e8e8f0', padding: '10px 14px',
          fontSize: '0.88rem', fontFamily: 'Syne, sans-serif',
          outline: 'none', transition: 'border-color 0.2s',
          paddingRight: suffix ? 60 : 14,
        }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,179,237,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        {suffix && <div style={{ position: 'absolute', right: 10 }}>{suffix}</div>}
      </div>
    </div>
  )
}
