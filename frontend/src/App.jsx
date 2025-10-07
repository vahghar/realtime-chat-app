import { Routes, Route, Navigate } from 'react-router-dom'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import Navbar from './components/Navbar'
import { useAuthStore } from './store/useAuthStore'
import { useEffect } from 'react'
import { Loader } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useThemeStore } from './store/useThemeStore'
import ForgotPassLink from './pages/ForgotPassLink'
import ResetPasswordPage from './pages/ResetPasswordPage'
import LandingPage from './pages/LandingPage'
import GraffitiWall from './pages/GraffitiWall'
//deploy
function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore()
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const {theme} = useThemeStore();

  if (isCheckingAuth && !authUser) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Loader className='size-10 animate-spin' />
      </div>
    )
  }
  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <LandingPage/>} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/forgot-pass-link" element={<ForgotPassLink/>} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage/>} />
        <Route path="/graffiti" element={<GraffitiWall />} />
      </Routes>

      <Toaster />
    </div>
  )
}

export default App
