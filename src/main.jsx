import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import App from './App.jsx'
import SuccessPage from './pages/SuccessPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import PlayPage from './pages/PlayPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/"        element={<App />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/play"    element={<PlayPage />} />
          {/* Catch-all: redirect unknown paths back to main app */}
          <Route path="*"        element={<App />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>,
)
