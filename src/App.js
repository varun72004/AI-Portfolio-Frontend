import React, { memo, useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import ChatbotWidget from "./components/ChatbotWidget";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ProjectsPage from "./pages/ProjectsPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import { FiGithub, FiLinkedin, FiInstagram, FiHeart } from "react-icons/fi";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const DEFAULT_PROFILE_INFO = {
  name: "Varun",
  social: {
    github: "https://github.com/varun72004",
    linkedin: "https://www.linkedin.com/in/varun-sharma-4525b1343",
    instagram: "https://www.instagram.com/_ordinary_boy14/",
  },
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#02040A]">
        <motion.div 
          className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Page Transition Wrapper
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
  >
    {children}
  </motion.div>
);

// Footer Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#02040A] px-6 text-center">
          <div>
            <h1 className="font-heading text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-slate-400 mb-6">Please refresh the page and try again.</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Footer = memo(() => {
  const [profileInfo, setProfileInfo] = useState(DEFAULT_PROFILE_INFO);

  useEffect(() => {
    let isMounted = true;

    axios
      .get(`${API}/api/profile/info`)
      .then(({ data }) => {
        if (!isMounted) return;
        setProfileInfo({
          ...DEFAULT_PROFILE_INFO,
          ...data,
          social: {
            ...DEFAULT_PROFILE_INFO.social,
            ...(data?.social || {}),
          },
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const socialLinks = [
    { icon: FiGithub, href: profileInfo.social?.github, label: "GitHub" },
    { icon: FiLinkedin, href: profileInfo.social?.linkedin, label: "LinkedIn" },
    { icon: FiInstagram, href: profileInfo.social?.instagram, label: "Instagram" },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-[#02040A]">
      {/* Gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="font-heading font-black text-white">V</span>
              </div>
              <span className="font-heading font-bold text-lg">{profileInfo.name || DEFAULT_PROFILE_INFO.name}</span>
            </div>
            <p className="text-slate-500 text-sm flex items-center justify-center md:justify-start gap-1">
              Made with <FiHeart className="text-red-500" size={14} /> in India
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-8">
            {['Home', 'About', 'Projects', 'Contact'].map((link) => (
              <motion.a
                key={link}
                href={`/${link.toLowerCase() === 'home' ? '' : link.toLowerCase()}`}
                className="text-sm text-slate-400 hover:text-white transition-colors font-mono uppercase tracking-wider"
                whileHover={{ y: -2 }}
              >
                {link}
              </motion.a>
            ))}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/50 transition-all"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <social.icon size={18} />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-slate-600 text-xs font-mono">
            {new Date().getFullYear()} {profileInfo.name || DEFAULT_PROFILE_INFO.name}. Built with React, FastAPI, MongoDB & AI.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#02040A] flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <PageWrapper>{children}</PageWrapper>
      </main>
      <ChatbotWidget />
      <Footer />
    </div>
  );
};

// Admin Layout (no chatbot or footer)
const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#02040A]">
      <Navbar />
      <PageWrapper>{children}</PageWrapper>
    </div>
  );
};

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/about"
          element={
            <Layout>
              <AboutPage />
            </Layout>
          }
        />
        <Route
          path="/projects"
          element={
            <Layout>
              <ProjectsPage />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <ContactPage />
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <LoginPage />
            </Layout>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
