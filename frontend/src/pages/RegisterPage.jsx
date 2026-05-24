import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! Welcome to PrepLab 🚀')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3

  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#fc8181', '#f6ad55', '#68d391']

  return (
    <div style={{
      minHeight: '100vh', background: '#060608',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: `linear-gradient(rgba(99,179,237,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99,179,237,0.04) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '1.8rem', fontWeight: 900,
            background: 'linear-gradient(135deg, #e8e8f0 30%, #63b3ed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
          }}>◈ PrepLab</div>
          <div style={{ color: '#555', fontSize: '0.8rem', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
            Start your interview journey
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '2rem',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e8e8f0', marginBottom: 6 }}>
            Create Account
          </h2>
          <p style={{ color: '#555', fontSize: '0.78rem', marginBottom: '1.8rem' }}>
            Join thousands of candidates preparing smarter
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Full Name" type="text" name="name"
              value={form.name} onChange={handle} placeholder="Alex Johnson" />
            <Field label="Email Address" type="email" name="email"
              value={form.email} onChange={handle} placeholder="you@example.com" />
            <div>
              <Field label="Password" type="password" name="password"
                value={form.password} onChange={handle} placeholder="Min 6 characters" />
              {form.password.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 999,
                      background: i <= strength ? strengthColor[strength] : 'rgba(255,255,255,0.06)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                  <span style={{ fontSize: '0.62rem', color: strengthColor[strength], marginLeft: 4, fontWeight: 700 }}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>
            <Field label="Confirm Password" type="password" name="confirm"
              value={form.confirm} onChange={handle} placeholder="Re-enter password" />

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '11px',
              background: 'rgba(104,211,145,0.12)',
              border: '1px solid rgba(104,211,145,0.4)',
              borderRadius: 10, color: '#68d391',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', fontWeight: 800,
              boxShadow: '0 0 20px rgba(104,211,145,0.1)',
            }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center', fontSize: '0.78rem', color: '#555',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#63b3ed', fontWeight: 700, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ ...props }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', color: '#888', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>
        {props.label.toUpperCase()}
      </label>
      <input {...props} label={undefined} style={{
        width: '100%', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
        color: '#e8e8f0', padding: '10px 14px',
        fontSize: '0.88rem', fontFamily: 'Syne, sans-serif',
        outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
      }}
        onFocus={e => e.target.style.borderColor = 'rgba(99,179,237,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
    </div>
  )
}
