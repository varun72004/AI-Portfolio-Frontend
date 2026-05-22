import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiGithub, FiLinkedin, FiInstagram, FiSend, FiCheck, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const ContactPage = () => {
    const fallbackEmail = 'varunsharma1234566@gmail.com';
    const fallbackPhone = '+91 6239753187';
    const fallbackLocation = 'Pathankot, Punjab, India';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [info, setInfo] = useState(null);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const { data } = await axios.get(`${API}/api/portfolio/info`);
                setInfo(data);
            } catch (error) {
                console.error('Failed to fetch info:', error);
            }
        };
        fetchInfo();
        axios.post(`${API}/api/analytics/track`, { event_type: 'page_view', page: 'contact' }).catch(() => {});
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
        if (!formData.message.trim()) newErrors.message = 'Message is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            await axios.post(`${API}/api/contact`, formData);
            setSubmitStatus({ success: true, message: "Message sent successfully! I'll get back to you soon." });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            setSubmitStatus({ success: false, message: 'Failed to send message. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const emailValue = info?.email || fallbackEmail;
    const phoneValue = info?.phone || fallbackPhone;
    const locationValue = info?.location || fallbackLocation;

    const contactInfo = [
        { icon: FiMail, label: 'Email', value: emailValue, href: `mailto:${emailValue}` },
        { icon: FiPhone, label: 'Phone', value: phoneValue, href: `tel:${phoneValue}` },
        { icon: FiMapPin, label: 'Location', value: locationValue, href: null }
    ];

    const socialLinks = [
        { icon: FiGithub, href: info?.social?.github || 'https://github.com/varun72004', label: 'GitHub', color: 'hover:text-white' },
        { icon: FiLinkedin, href: info?.social?.linkedin || 'https://www.linkedin.com/in/varun-sharma-4525b1343', label: 'LinkedIn', color: 'hover:text-blue-400' },
        { icon: FiInstagram, href: info?.social?.instagram || 'https://www.instagram.com/_ordinary_boy14/', label: 'Instagram', color: 'hover:text-pink-400' }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="min-h-screen pt-24 pb-16" data-testid="contact-page">
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
                {/* Header */}
                <motion.div 
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <p className="label mb-4">Get in Touch</p>
                    <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tighter">
                        Let's <span className="gradient-text">Connect</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Have a project in mind or want to discuss opportunities? 
                        I'm always excited to collaborate on data science and AI projects.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Contact Info */}
                    <motion.div 
                        className="lg:col-span-5"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <div className="card-spotlight p-10 rounded-3xl h-full">
                            <h2 className="font-heading font-bold text-2xl mb-8">Contact Information</h2>
                            
                            <motion.div 
                                className="space-y-6 mb-10"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {contactInfo.map((item, idx) => (
                                    <motion.div 
                                        key={item.label} 
                                        className="flex items-start gap-4"
                                        variants={itemVariants}
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            <item.icon size={24} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">{item.label}</p>
                                            {item.href ? (
                                                <a 
                                                    href={item.href}
                                                    className="text-white hover:text-purple-400 transition-colors"
                                                >
                                                    {item.value}
                                                </a>
                                            ) : (
                                                <p className="text-white">{item.value}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Social Links */}
                            <div>
                                <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-4">Follow me</p>
                                <div className="flex gap-4">
                                    {socialLinks.map((link) => (
                                        <motion.a
                                            key={link.label}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-14 h-14 rounded-2xl glass border border-white/10 flex items-center justify-center text-slate-400 ${link.color} hover:border-purple-500/50 transition-all`}
                                            whileHover={{ scale: 1.1, y: -4 }}
                                            whileTap={{ scale: 0.95 }}
                                            aria-label={link.label}
                                            data-testid={`social-${link.label.toLowerCase()}`}
                                        >
                                            <link.icon size={24} />
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div 
                        className="lg:col-span-7"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <div className="card-spotlight p-10 rounded-3xl">
                            <h2 className="font-heading font-bold text-2xl mb-8">Send a Message</h2>
                            
                            <AnimatePresence mode="wait">
                                {submitStatus?.success ? (
                                    <motion.div 
                                        className="text-center py-16"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <motion.div
                                            className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto mb-6 flex items-center justify-center"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.2 }}
                                        >
                                            <FiCheck size={40} className="text-white" />
                                        </motion.div>
                                        <h3 className="font-heading font-bold text-2xl mb-3">Message Sent!</h3>
                                        <p className="text-slate-400 mb-8">{submitStatus.message}</p>
                                        <motion.button
                                            onClick={() => setSubmitStatus(null)}
                                            className="btn-primary"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Send Another Message
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.form 
                                        onSubmit={handleSubmit} 
                                        className="space-y-6"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {/* Name Input */}
                                            <div>
                                                <label htmlFor="name" className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
                                                    Name
                                                </label>
                                                <motion.div
                                                    animate={errors.name ? { x: [-10, 10, -10, 10, 0] } : {}}
                                                    transition={{ duration: 0.4 }}
                                                >
                                                    <input
                                                        type="text"
                                                        id="name"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        className={`w-full bg-slate-900/50 border rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                            errors.name 
                                                                ? 'border-red-500 focus:ring-red-500/20' 
                                                                : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500/20'
                                                        }`}
                                                        placeholder="Your name"
                                                        data-testid="contact-name-input"
                                                    />
                                                </motion.div>
                                                <AnimatePresence>
                                                    {errors.name && (
                                                        <motion.p
                                                            className="text-red-400 text-xs mt-2 flex items-center gap-1"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                        >
                                                            <FiAlertCircle size={12} />
                                                            {errors.name}
                                                        </motion.p>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Email Input */}
                                            <div>
                                                <label htmlFor="email" className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
                                                    Email
                                                </label>
                                                <motion.div
                                                    animate={errors.email ? { x: [-10, 10, -10, 10, 0] } : {}}
                                                    transition={{ duration: 0.4 }}
                                                >
                                                    <input
                                                        type="email"
                                                        id="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        className={`w-full bg-slate-900/50 border rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                            errors.email 
                                                                ? 'border-red-500 focus:ring-red-500/20' 
                                                                : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500/20'
                                                        }`}
                                                        placeholder="your@email.com"
                                                        data-testid="contact-email-input"
                                                    />
                                                </motion.div>
                                                <AnimatePresence>
                                                    {errors.email && (
                                                        <motion.p
                                                            className="text-red-400 text-xs mt-2 flex items-center gap-1"
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                        >
                                                            <FiAlertCircle size={12} />
                                                            {errors.email}
                                                        </motion.p>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {/* Subject Input */}
                                        <div>
                                            <label htmlFor="subject" className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
                                                Subject
                                            </label>
                                            <motion.div
                                                animate={errors.subject ? { x: [-10, 10, -10, 10, 0] } : {}}
                                                transition={{ duration: 0.4 }}
                                            >
                                                <input
                                                    type="text"
                                                    id="subject"
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className={`w-full bg-slate-900/50 border rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                                                        errors.subject 
                                                            ? 'border-red-500 focus:ring-red-500/20' 
                                                            : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500/20'
                                                    }`}
                                                    placeholder="What's this about?"
                                                    data-testid="contact-subject-input"
                                                />
                                            </motion.div>
                                            <AnimatePresence>
                                                {errors.subject && (
                                                    <motion.p
                                                        className="text-red-400 text-xs mt-2 flex items-center gap-1"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                    >
                                                        <FiAlertCircle size={12} />
                                                        {errors.subject}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Message Input */}
                                        <div>
                                            <label htmlFor="message" className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">
                                                Message
                                            </label>
                                            <motion.div
                                                animate={errors.message ? { x: [-10, 10, -10, 10, 0] } : {}}
                                                transition={{ duration: 0.4 }}
                                            >
                                                <textarea
                                                    id="message"
                                                    name="message"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    rows={5}
                                                    className={`w-full bg-slate-900/50 border rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all resize-none ${
                                                        errors.message 
                                                            ? 'border-red-500 focus:ring-red-500/20' 
                                                            : 'border-slate-700 focus:border-purple-500 focus:ring-purple-500/20'
                                                    }`}
                                                    placeholder="Tell me about your project..."
                                                    data-testid="contact-message-input"
                                                />
                                            </motion.div>
                                            <AnimatePresence>
                                                {errors.message && (
                                                    <motion.p
                                                        className="text-red-400 text-xs mt-2 flex items-center gap-1"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                    >
                                                        <FiAlertCircle size={12} />
                                                        {errors.message}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {submitStatus?.success === false && (
                                            <motion.p 
                                                className="text-red-400 text-sm flex items-center gap-2"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                <FiAlertCircle />
                                                {submitStatus.message}
                                            </motion.p>
                                        )}

                                        <motion.button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn-secondary w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            data-testid="contact-submit-btn"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <motion.span
                                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                    />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <FiSend size={18} />
                                                    Send Message
                                                </>
                                            )}
                                        </motion.button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
