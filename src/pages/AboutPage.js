import React, { memo, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiMapPin, FiMail, FiPhone, FiGithub, FiLinkedin, FiAward, FiBook, FiMaximize2, FiX, FiFileText, FiDownload, FiExternalLink } from 'react-icons/fi';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const DEFAULT_PROFILE_IMAGE = 'https://static.prod-images.emergentagent.com/jobs/dd8d4152-3726-4bcf-afd9-da6518a514c1/images/f23f4b73d684e0d789993f4e15e4e9e7654806dc57bf09052fb0ebf6c99f92cd.png';

const isPdfCertificate = (url = '') => url.toLowerCase().split('?')[0].endsWith('.pdf');

const CertificatePreview = memo(({ cert, large = false }) => {
    if (!cert?.credential_url) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/80">
                <FiAward className="text-cyan-400" size={large ? 48 : 28} />
            </div>
        );
    }

    if (isPdfCertificate(cert.credential_url)) {
        return (
            <iframe
                title={`${cert.name} preview`}
                src={`${cert.credential_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className={`w-full h-full bg-white ${large ? '' : 'pointer-events-none'}`}
            />
        );
    }

    return (
        <img
            src={cert.credential_url}
            alt={`${cert.name} certificate`}
            className="w-full h-full object-contain bg-slate-950"
        />
    );
});

// Animated Counter
const AnimatedCounter = ({ value, suffix = '', duration = 2 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = parseInt(value);
        const timer = setInterval(() => {
            start += Math.ceil(end / (duration * 60));
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{count}{suffix}</span>;
};

const AboutPage = () => {
    const [info, setInfo] = useState(null);
    const [resumeInfo, setResumeInfo] = useState(null);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const [portfolioRes, resumeRes] = await Promise.all([
                    axios.get(`${API}/api/portfolio/info`),
                    axios.get(`${API}/api/resume/info`)
                ]);
                setInfo(portfolioRes.data);
                setResumeInfo(resumeRes.data);
            } catch (error) {
                console.error('Failed to fetch info:', error);
            }
        };
        fetchInfo();
        axios.post(`${API}/api/analytics/track`, { event_type: 'page_view', page: 'about' }).catch(() => { });
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
    };

    if (!info) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <motion.div
                    className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16" data-testid="about-page">
            {/* Hero Section */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-transparent"></div>

                <motion.div
                    className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        {/* Image */}
                        <motion.div
                            className="lg:col-span-5"
                            variants={itemVariants}
                            style={{ y }}
                        >
                            <div className="relative">
                                <motion.div
                                    className="aspect-[4/5] rounded-3xl overflow-hidden glass border border-purple-500/20"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <img
                                        src={info.profile_image_url || DEFAULT_PROFILE_IMAGE}
                                        alt={info.name || 'Profile'}
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                                {/* Decorative elements */}
                                <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-gradient-to-br from-purple-500/30 to-cyan-500/30 rounded-3xl blur-3xl -z-10"></div>
                                <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-full blur-2xl -z-10"></div>
                            </div>
                        </motion.div>

                        {/* Bio */}
                        <motion.div
                            className="lg:col-span-7"
                            variants={itemVariants}
                        >
                            <p className="label mb-4">About Me</p>
                            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tighter">
                                {info.name}
                            </h1>
                            <p className="text-xl sm:text-2xl gradient-text font-bold mb-6">
                                {info.title}
                            </p>
                            {info.field_of_study && (
                                <p className="text-sm text-cyan-400 font-mono uppercase tracking-wider mb-6">
                                    {info.field_of_study}
                                </p>
                            )}
                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                {info.bio}
                            </p>

                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {[
                                    { icon: FiMapPin, label: info.location },
                                    { icon: FiMail, label: info.email, href: `mailto:${info.email}` },
                                    { icon: FiPhone, label: info.phone, href: `tel:${info.phone}` },
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="flex items-center gap-3 text-slate-400"
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                            <item.icon className="text-purple-400" size={18} />
                                        </div>
                                        {item.href ? (
                                            <a href={item.href} className="hover:text-white transition-colors text-sm">
                                                {item.label}
                                            </a>
                                        ) : (
                                            <span className="text-sm">{item.label}</span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Social Links */}
                            <div className="flex items-center gap-4">
                                {[
                                    { icon: FiGithub, href: info.social?.github, label: 'GitHub' },
                                    { icon: FiLinkedin, href: info.social?.linkedin, label: 'LinkedIn' },
                                ].map((social) => (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 rounded-xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/50 transition-all"
                                        whileHover={{ scale: 1.1, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <social.icon size={22} />
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Resume */}
            {resumeInfo?.url && (
                <section className="py-16 px-6 md:px-12 lg:px-24">
                    <motion.div
                        className="max-w-7xl mx-auto"
                        initial={{ opacity: 0, y: 32 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-3xl border border-cyan-500/15 bg-slate-950/60 p-6 md:p-8">
                            <div className="lg:col-span-7 flex flex-col justify-center">
                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-500/10">
                                    <FiFileText className="text-cyan-300" size={26} />
                                </div>
                                <p className="label mb-3">Resume</p>
                                <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
                                    {resumeInfo.title && resumeInfo.title !== "Varun Sharma Resume" ? resumeInfo.title : `${info.name} Resume`}
                                </h2>
                                <p className="text-slate-400 leading-relaxed mb-6">
                                    Preview the latest resume directly in the browser or download a PDF copy for opportunities, collaborations, and interviews.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a
                                        href={resumeInfo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary inline-flex items-center justify-center gap-2"
                                    >
                                        <FiExternalLink size={18} />
                                        Preview Resume
                                    </a>
                                    <a
                                        href={resumeInfo.url}
                                        download={resumeInfo.filename || 'varun-resume.pdf'}
                                        className="btn-secondary inline-flex items-center justify-center gap-2"
                                    >
                                        <FiDownload size={18} />
                                        Download Resume
                                    </a>
                                </div>
                            </div>
                            <div className="lg:col-span-5">
                                <div className="h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-white">
                                    <iframe
                                        title={`${info.name} resume preview`}
                                        src={`${resumeInfo.url}#toolbar=0&navpanes=0&view=FitH`}
                                        className="h-full w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>
            )}

            {/* Skills Section */}
            <section className="py-24 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <p className="label mb-4">Expertise</p>
                        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">Technical Arsenal</h2>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={containerVariants}
                    >
                        {Object.entries(info.skills || {}).map(([category, skillList], idx) => (
                            <motion.div
                                key={category}
                                className="card-spotlight p-8 rounded-3xl"
                                variants={itemVariants}
                            >
                                <h3 className="font-heading font-bold text-lg mb-6 text-cyan-400 uppercase tracking-wider">
                                    {category.replace('_', ' ')}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {skillList.map((skill) => (
                                        <motion.span
                                            key={skill}
                                            className="px-4 py-2 text-sm bg-slate-800/50 border border-slate-700/50 rounded-full text-slate-300 hover:border-purple-500/50 hover:text-white transition-all cursor-default"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            {skill}
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Education Timeline */}
            <section className="py-24 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-[#02040A] via-purple-900/5 to-[#02040A]">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="flex items-center gap-4 mb-16"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <FiBook className="text-purple-400" size={24} />
                        </div>
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold">Education</h2>
                    </motion.div>

                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-cyan-500/50 to-transparent hidden md:block"></div>

                        <motion.div
                            className="space-y-8"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={containerVariants}
                        >
                            {info.education?.map((edu, index) => (
                                <motion.div
                                    key={index}
                                    className="relative pl-0 md:pl-20"
                                    variants={itemVariants}
                                >
                                    {/* Timeline dot */}
                                    <div className="absolute left-6 top-8 w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 hidden md:block shadow-lg shadow-purple-500/50"></div>

                                    <motion.div
                                        className="card-spotlight p-8 rounded-3xl border-l-4 border-purple-500"
                                        whileHover={{ x: 8 }}
                                    >
                                        <h3 className="font-heading font-bold text-xl mb-2">{edu.degree}</h3>
                                        <p className="text-purple-400 font-medium mb-2">{edu.institution}</p>
                                        <p className="text-sm text-slate-500 mb-4">
                                            {edu.location} • {edu.period}
                                        </p>
                                        {edu.coursework && (
                                            <div className="flex flex-wrap gap-2">
                                                {edu.coursework.map((course) => (
                                                    <span
                                                        key={course}
                                                        className="px-3 py-1 text-xs bg-slate-800/50 rounded-full text-slate-400"
                                                    >
                                                        {course}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Certifications */}
            <section className="py-24 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="flex items-center gap-4 mb-16"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <FiAward className="text-cyan-400" size={24} />
                        </div>
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold">Certifications</h2>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={containerVariants}
                    >
                        {info.certifications?.map((cert, index) => (
                            <motion.div
                                key={index}
                                className="card-spotlight p-5 rounded-3xl group"
                                variants={itemVariants}
                            >
                                <button
                                    type="button"
                                    onClick={() => cert.credential_url && setSelectedCertificate(cert)}
                                    className="relative w-full aspect-[4/3] max-h-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 mb-5 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    aria-label={`Open ${cert.name} certificate`}
                                >
                                    <CertificatePreview cert={cert} />
                                    {cert.credential_url && (
                                        <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white border border-white/15">
                                            <FiMaximize2 size={16} />
                                        </span>
                                    )}
                                </button>
                                <h3 className="font-heading font-bold text-base mb-2 leading-snug">{cert.name}</h3>
                                <p className="text-sm text-slate-400 mb-2">{cert.institution}</p>
                                <p className="text-xs text-cyan-400 font-mono">{cert.period}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>
            {selectedCertificate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
                    onClick={() => setSelectedCertificate(null)}
                >
                    <motion.div
                        className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/10 bg-[#06080f]"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                            <div className="min-w-0">
                                <h3 className="font-heading font-bold text-lg truncate">{selectedCertificate.name}</h3>
                                <p className="text-sm text-slate-400 truncate">{selectedCertificate.institution}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCertificate(null)}
                                className="h-10 w-10 shrink-0 rounded-full border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10"
                                aria-label="Close certificate preview"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="h-[72vh] max-h-[720px] bg-slate-950">
                            <CertificatePreview cert={selectedCertificate} large />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AboutPage;
