import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiHome, FiUser, FiFolder, FiMail, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;
const DEFAULT_NAME = 'Varun';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [profileName, setProfileName] = useState(DEFAULT_NAME);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAdmin, logout } = useAuth();

    const navLinks = [
        { path: '/', label: 'Home', icon: FiHome },
        { path: '/about', label: 'About', icon: FiUser },
        { path: '/projects', label: 'Projects', icon: FiFolder },
        { path: '/contact', label: 'Contact', icon: FiMail },
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    useEffect(() => {
        let isMounted = true;

        axios.get(`${API}/api/profile/info`)
            .then(({ data }) => {
                if (!isMounted) return;
                if (data?.name) {
                    setProfileName(data.name);
                }
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <motion.nav 
            className="fixed top-0 left-0 right-0 z-50 bg-[#02040A]/60 backdrop-blur-2xl border-b border-white/10"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            data-testid="navbar"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link 
                        to="/" 
                        className="flex items-center gap-3"
                        data-testid="nav-logo"
                    >
                        <motion.div 
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="font-heading font-black text-white text-xl">V</span>
                        </motion.div>
                        <span className="font-heading font-bold text-xl text-white hidden sm:block">
                            {profileName || DEFAULT_NAME}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="relative px-5 py-2"
                                data-testid={`nav-link-${link.label.toLowerCase()}`}
                            >
                                <motion.span 
                                    className={`text-sm font-mono tracking-widest uppercase transition-colors ${
                                        isActive(link.path)
                                            ? 'text-white'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                    whileHover={{ y: -2 }}
                                >
                                    {link.label}
                                </motion.span>
                                {isActive(link.path) && (
                                    <motion.div
                                        className="absolute bottom-0 left-5 right-5 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-500"
                                        layoutId="navIndicator"
                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Right Section */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <>
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-2 text-sm font-mono text-slate-400 hover:text-white transition-colors"
                                        data-testid="nav-admin-link"
                                    >
                                        <FiSettings size={18} />
                                        Admin
                                    </Link>
                                )}
                                <motion.button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-sm font-mono text-slate-400 hover:text-red-400 transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    data-testid="nav-logout-btn"
                                >
                                    <FiLogOut size={18} />
                                    Logout
                                </motion.button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                data-testid="nav-login-btn"
                            >
                                <motion.span 
                                    className="btn-primary text-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Admin Login
                                </motion.span>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-slate-400 hover:text-white"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        data-testid="mobile-menu-btn"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
                    </motion.button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        className="md:hidden bg-[#02040A]/95 backdrop-blur-2xl border-t border-white/10"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="px-6 py-6 space-y-2">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.path}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={link.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-4 py-3 px-4 rounded-xl text-sm font-mono uppercase tracking-wider transition-all ${
                                            isActive(link.path)
                                                ? 'text-white bg-purple-500/10 border border-purple-500/30'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <link.icon size={20} />
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="pt-4 border-t border-white/10">
                                {user ? (
                                    <>
                                        {isAdmin && (
                                            <Link
                                                to="/admin"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex items-center gap-4 py-3 px-4 text-sm font-mono text-slate-400 hover:text-white"
                                            >
                                                <FiSettings size={20} />
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex items-center gap-4 py-3 px-4 text-sm font-mono text-red-400"
                                        >
                                            <FiLogOut size={20} />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        to="/login"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block btn-secondary text-center text-sm"
                                    >
                                        Admin Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
