import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeSimple, Lock, Eye, EyeSlash, Camera, Warning } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showFaceLogin, setShowFaceLogin] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated } = useAuth();

    const from = location.state?.from?.pathname || '/admin';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);
        
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.error);
        }
        
        setIsLoading(false);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: 640, height: 480 } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
        } catch (err) {
            setError('Camera access denied. Please allow camera access to use face login.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };

    const captureAndLogin = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        setIsLoading(true);
        setError('');

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
            const response = await axios.post(`${API}/api/face/login`, {
                face_data: imageData
            }, { withCredentials: true });
            
            if (response.data.id) {
                window.location.href = from;
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Face login failed. Please try password login.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFaceLogin = () => {
        if (showFaceLogin) {
            stopCamera();
        } else {
            startCamera();
        }
        setShowFaceLogin(!showFaceLogin);
        setError('');
    };

    return (
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" data-testid="login-page">
            <div className="max-w-md w-full mx-6">
                <motion.div 
                    className="card-surface p-8 rounded-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-3xl font-bold mb-2">Admin Login</h1>
                        <p className="text-gray-400">Sign in to access the dashboard</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400">
                            <Warning size={20} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {showFaceLogin ? (
                        <div className="space-y-6">
                            <div className="relative aspect-[4/3] bg-[#0A0A0C] rounded-sm overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                
                                {/* Face overlay guide */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-48 h-64 border-2 border-blue-500/50 rounded-full"></div>
                                </div>
                            </div>

                            <p className="text-center text-sm text-gray-400">
                                Position your face within the oval and click capture
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={toggleFaceLogin}
                                    className="flex-1 btn-secondary"
                                    data-testid="back-to-password-btn"
                                >
                                    Back to Password
                                </button>
                                <button
                                    onClick={captureAndLogin}
                                    disabled={isLoading || !isCameraActive}
                                    className="flex-1 btn-primary disabled:opacity-50"
                                    data-testid="capture-face-btn"
                                >
                                    {isLoading ? 'Verifying...' : 'Capture & Login'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <EnvelopeSimple 
                                        size={20} 
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" 
                                    />
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="admin@example.com"
                                        data-testid="login-email-input"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm text-gray-400 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock 
                                        size={20} 
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" 
                                    />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="Enter password"
                                        data-testid="login-password-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid="login-submit-btn"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-[#121216] text-gray-500">or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={toggleFaceLogin}
                                className="w-full btn-secondary flex items-center justify-center gap-2"
                                data-testid="face-login-btn"
                            >
                                <Camera size={20} />
                                Login with Face Recognition
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
