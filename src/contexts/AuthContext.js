import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper to format API errors
const formatApiError = (detail) => {
    if (detail == null) return "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
    }
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // null = checking, false = not authenticated
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/api/auth/me`, { withCredentials: true });
            setUser(data);
        } catch {
            setUser(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = useCallback(async (email, password) => {
        try {
            const { data } = await axios.post(
                `${API}/api/auth/login`,
                { email, password },
                { withCredentials: true }
            );
            setUser(data);
            return { success: true, user: data };
        } catch (e) {
            return { success: false, error: formatApiError(e.response?.data?.detail) };
        }
    }, []);

    const register = useCallback(async (email, password, name) => {
        try {
            const { data } = await axios.post(
                `${API}/api/auth/register`,
                { email, password, name },
                { withCredentials: true }
            );
            setUser(data);
            return { success: true, user: data };
        } catch (e) {
            return { success: false, error: formatApiError(e.response?.data?.detail) };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
        } catch {
            // Ignore errors
        }
        setUser(false);
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        checkAuth
    }), [user, loading, login, register, logout, checkAuth]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
