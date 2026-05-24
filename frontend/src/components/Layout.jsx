import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCameraMonitor } from '../hooks/useCameraMonitor'
import { useState } from 'react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⚡', exact: true },
  { to: '/mock', label: 'Mock Interview', icon: '🎤' },
  { to: '/coding', label: 'Coding Helper', icon: '💻' },
  { to: '/tracker', label: 'Topic Tracker', icon: '📚' },
]

const STATUS_COLOR = {
  idle: '#444',
  ok: '#68d391',
  warning: '#f6ad55',
  danger: '#fc8181',
}

const STATUS_LABEL = {
  idle: 'Camera Off',
  ok: 'Face Detected',
  warning: 'Look at Screen',
  danger: 'Alert!',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [camEnabled, setCamEnabled] = useState(false)

  const {
    videoRef, canvasRef,
    cameraActive, faceStatus, faceCount,
    alerts, currentAlert,
    loading: camLoading, error: camError,
    startCamera, stopCamera,
  } = useCameraMonitor({ enabled: false })

  const toggleCam = () => {
    if (cameraActive) { stopCamera(); setCamEnabled(false) }
    else { setCamEnabled(true); startCamera() }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#060608' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: '#0a0a10',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column',
        padding: '1.2rem 0',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #e8e8f0 30%, #63b3ed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>◈ PrepLab</div>
          <div style={{ fontSize: '0.65rem', color: '#444', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
            v2.0 · Interview Platform
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.6rem' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', borderRadius: 8, marginBottom: 3,
              textDecoration: 'none', fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
              color: isActive ? '#e8e8f0' : '#555',
              background: isActive ? 'rgba(99,179,237,0.1)' : 'transparent',
              borderLeft: isActive ? '2px solid #63b3ed' : '2px solid transparent',
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Camera Monitor */}
        <div style={{
          margin: '0 0.6rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{ padding: '0.7rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 700, letterSpacing: '0.06em' }}>
                FOCUS MONITOR
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: STATUS_COLOR[faceStatus],
                  boxShadow: cameraActive ? `0 0 6px ${STATUS_COLOR[faceStatus]}` : 'none',
                }} />
                <span style={{ fontSize: '0.6rem', color: STATUS_COLOR[faceStatus], fontFamily: 'JetBrains Mono, monospace' }}>
                  {STATUS_LABEL[faceStatus]}
                </span>
              </div>
            </div>

            {/* Video preview */}
            <div style={{
              width: '100%', aspectRatio: '4/3',
              background: '#0a0a10', borderRadius: 6, overflow: 'hidden',
              position: 'relative', border: `1px solid ${STATUS_COLOR[faceStatus]}33`,
            }}>
              <video ref={videoRef} muted playsInline style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: cameraActive ? 'block' : 'none',
                transform: 'scaleX(-1)',
              }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {!cameraActive && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: '1.2rem' }}>📷</span>
                  <span style={{ fontSize: '0.6rem', color: '#444' }}>Camera inactive</span>
                </div>
              )}

              {cameraActive && faceStatus === 'danger' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(252,129,129,0.12)',
                  border: '2px solid rgba(252,129,129,0.5)',
                  borderRadius: 6,
                  animation: 'pulse 1s infinite',
                }} />
              )}
            </div>

            <button onClick={toggleCam} disabled={camLoading} style={{
              width: '100%', marginTop: 6,
              padding: '6px', borderRadius: 6,
              background: cameraActive ? 'rgba(252,129,129,0.1)' : 'rgba(104,211,145,0.1)',
              border: `1px solid ${cameraActive ? 'rgba(252,129,129,0.4)' : 'rgba(104,211,145,0.4)'}`,
              color: cameraActive ? '#fc8181' : '#68d391',
              cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: '0.7rem', fontWeight: 700,
            }}>
              {camLoading ? 'Starting...' : cameraActive ? '⬛ Stop Monitor' : '▶ Start Monitor'}
            </button>

            {camError && (
              <div style={{ fontSize: '0.62rem', color: '#fc8181', marginTop: 4, textAlign: 'center' }}>
                {camError}
              </div>
            )}
          </div>

          {/* Alert count */}
          {alerts.length > 0 && (
            <div style={{ padding: '0.5rem 0.8rem' }}>
              <div style={{ fontSize: '0.62rem', color: '#666', marginBottom: 3 }}>RECENT ALERTS</div>
              {alerts.slice(0, 3).map(a => (
                <div key={a.id} style={{
                  fontSize: '0.62rem', color: '#fc8181', padding: '3px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  {a.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User info */}
        <div style={{
          padding: '0.8rem 0.6rem 0',
          marginTop: '0.8rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ padding: '0 0.6rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(99,179,237,0.15)',
              border: '1px solid rgba(99,179,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 800, color: '#63b3ed', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <button onClick={logout} title="Logout" style={{
              background: 'none', border: 'none', color: '#444',
              cursor: 'pointer', fontSize: '0.75rem', padding: 2,
              flexShrink: 0,
            }}>⏻</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {/* Alert toast */}
        {currentAlert && (
          <div style={{
            position: 'fixed', top: 16, right: 16, zIndex: 1000,
            background: '#12121e',
            border: `1px solid ${currentAlert.type === 'multiple_faces' ? '#fc8181' : '#f6ad55'}`,
            borderRadius: 10, padding: '10px 16px',
            fontSize: '0.82rem', color: '#e8e8f0',
            boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
            animation: 'slideIn 0.3s ease',
            maxWidth: 280,
          }}>
            {currentAlert.message}
          </div>
        )}

        <style>{`
          @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
          @keyframes slideIn { from { transform:translateX(20px); opacity:0 } to { transform:none; opacity:1 } }
        `}</style>

        <Outlet />
      </main>
    </div>
  )
}
