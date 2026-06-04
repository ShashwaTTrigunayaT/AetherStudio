import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import ProfilePage from './pages/ProfilePage';
import UserPage from './pages/UserPage';
import AboutPage from './pages/AboutPage';
import RoadmapPage from './pages/RoadmapPage';
import StatusPage from './pages/StatusPage';
import ContactPage from './pages/ContactPage';
import DocsPage from './pages/DocsPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/Common/ErrorBoundary';
import AppLayout from './components/Layout/AppLayout';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] } },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing page - standalone public page */}
        <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />

        {/* Auth pages - standalone (no AppLayout) */}
        <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
        <Route path="/forgot-password" element={<AnimatedPage><ForgotPasswordPage /></AnimatedPage>} />
        <Route path="/reset-password" element={<AnimatedPage><ResetPasswordPage /></AnimatedPage>} />

        {/* Dashboard - standalone, uses Navbar */}
        <Route path="/dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />

        {/* Company pages */}
        <Route path="/about" element={<AnimatedPage><AboutPage /></AnimatedPage>} />
        <Route path="/roadmap" element={<AnimatedPage><RoadmapPage /></AnimatedPage>} />
        <Route path="/status" element={<AnimatedPage><StatusPage /></AnimatedPage>} />
        <Route path="/contact" element={<AnimatedPage><ContactPage /></AnimatedPage>} />

        {/* Resource pages */}
        <Route path="/docs" element={<AnimatedPage><DocsPage /></AnimatedPage>} />

        {/* Profile pages */}
        <Route path="/profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
        <Route path="/user/:id" element={<AnimatedPage><UserPage /></AnimatedPage>} />

        {/* Workspace - no AppLayout (it has its own layout) */}
        <Route path="/workspace/:id" element={<AnimatedPage><WorkspacePage /></AnimatedPage>} />

        {/* 404 */}
        <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}

function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        mixBlendMode: 'overlay',
        opacity: 0.015,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
      }}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NoiseOverlay />
        <AppRoutes />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'rgba(30, 30, 32, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#f5f5f7',
              fontSize: '14px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}
