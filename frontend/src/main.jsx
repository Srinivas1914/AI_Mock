import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#12121e',
              color: '#e8e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: "'Syne', sans-serif",
              fontSize: '0.85rem',
            },
            success: { iconTheme: { primary: '#68d391', secondary: '#12121e' } },
            error: { iconTheme: { primary: '#fc8181', secondary: '#12121e' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
