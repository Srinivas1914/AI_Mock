import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MockInterviewPage from './pages/MockInterviewPage'
import CodingHelperPage from './pages/CodingHelperPage'
import TrackerPage from './pages/TrackerPage'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/login" replace />
}

function Loader() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060608', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: '2px solid rgba(99,179,237,0.2)',
        borderTop: '2px solid #63b3ed', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{ color: '#444', fontSize: '0.82rem', fontFamily: 'Syne, sans-serif' }}>
        Loading PrepLab...
      </span>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="mock" element={<MockInterviewPage />} />
        <Route path="coding" element={<CodingHelperPage />} />
        <Route path="tracker" element={<TrackerPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
