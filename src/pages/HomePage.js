import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { FiArrowRight, FiGithub, FiLinkedin, FiInstagram, FiChevronDown, FiExternalLink } from 'react-icons/fi';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_HOME_STATS = [
    { label: 'Projects Completed', value: 15, suffix: '+' },
    { label: 'Technologies', value: 20, suffix: '+' },
    { label: 'Lines of Code', value: 50000, suffix: 'K+' },
    { label: 'Certifications', value: 3, suffix: '+' }
];

const DEFAULT_HOME_SKILLS = [
    { name: 'Python', level: 95 },
    { name: 'Machine Learning', level: 88 },
    { name: 'Data Analysis', level: 92 },
    { name: 'SQL', level: 85 },
    { name: 'Deep Learning', level: 78 },
    { name: 'Data Visualization', level: 90 }
];

const DEFAULT_PROFILE_INFO = {
    name: 'Varun',
    title: 'Data Scientist & ML Engineer',
    bio: 'Transforming raw data into intelligent solutions. Passionate about Machine Learning, AI, and building systems that make a difference.',
    social: {
        github: 'https://github.com/varun72004',
        linkedin: 'https://www.linkedin.com/in/varun-sharma-4525b1343',
        instagram: 'https://www.instagram.com/_ordinary_boy14/'
    }
};

const TYPING_TITLES = [
    'Data Scientist',
    'ML Engineer',
    'Python Developer',
    'AI Enthusiast'
];

let particlesEnginePromise;

// Typing effect hook
const useTypingEffect = (texts, typingSpeed = 100, deletingSpeed = 50, pauseDuration = 2000) => {
    const [displayText, setDisplayText] = useState('');
    const [textIndex, setTextIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentText = texts[textIndex];
        let pauseTimeout;
        
        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (displayText.length < currentText.length) {
                    setDisplayText(currentText.slice(0, displayText.length + 1));
                } else {
                    pauseTimeout = setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            } else {
                if (displayText.length > 0) {
                    setDisplayText(displayText.slice(0, -1));
                } else {
                    setIsDeleting(false);
                    setTextIndex((prev) => (prev + 1) % texts.length);
                }
            }
        }, isDeleting ? deletingSpeed : typingSpeed);

        return () => {
            clearTimeout(timeout);
            clearTimeout(pauseTimeout);
        };
    }, [displayText, textIndex, isDeleting, texts, typingSpeed, deletingSpeed, pauseDuration]);

    return displayText;
};

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 2 }) => {
    const [count, setCount] = useState(0);
    const spring = useSpring(0, { duration: duration * 1000 });

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        return spring.on('change', (latest) => {
            setCount(Math.floor(latest));
        });
    }, [spring]);

    return <span>{count}</span>;
};

// Tilt Card Component
const TiltCard = ({ children, className = '' }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        setRotateX((y - centerY) / 10);
        setRotateY((centerX - x) / 10);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            className={`card-spotlight ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: 'transform 0.1s ease-out'
            }}
        >
            {children}
        </motion.div>
    );
};

// Magnetic Button Component
const MagneticButton = ({ children, className = '', onClick, href, external = false }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setPosition({ x: x * 0.3, y: y * 0.3 });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const ButtonContent = (
        <motion.span
            className={`inline-flex items-center gap-2 ${className}`}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        >
            {children}
        </motion.span>
    );

    if (href) {
        if (external) {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="inline-block"
                >
                    {ButtonContent}
                </a>
            );
        }
        return (
            <Link
                to={href}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="inline-block"
            >
                {ButtonContent}
            </Link>
        );
    }

    return (
        <button
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {ButtonContent}
        </button>
    );
};

const HomePage = () => {
    const [projects, setProjects] = useState([]);
    const [homeInfo, setHomeInfo] = useState({
        stats: DEFAULT_HOME_STATS,
        skills: DEFAULT_HOME_SKILLS
    });
    const [profileInfo, setProfileInfo] = useState(DEFAULT_PROFILE_INFO);
    const [particlesInit, setParticlesInit] = useState(false);
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
    
    const typedText = useTypingEffect(TYPING_TITLES, 80, 40, 2000);

    const stats = homeInfo.stats || DEFAULT_HOME_STATS;
    const skills = homeInfo.skills || DEFAULT_HOME_SKILLS;
    const featuredProjects = projects.filter((project) => project.featured).slice(0, 3);

    useEffect(() => {
        let isMounted = true;
        if (!particlesEnginePromise) {
            particlesEnginePromise = initParticlesEngine(async (engine) => {
                await loadSlim(engine);
            });
        }
        particlesEnginePromise.then(() => {
            if (isMounted) {
                setParticlesInit(true);
            }
        });

        const fetchData = async () => {
            try {
                const [projectsRes, homeRes, profileRes] = await Promise.all([
                    axios.get(`${API}/api/projects`),
                    axios.get(`${API}/api/home/info`),
                    axios.get(`${API}/api/profile/info`)
                ]);
                if (!isMounted) return;
                setProjects(projectsRes.data);
                setHomeInfo({
                    stats: homeRes.data?.stats || DEFAULT_HOME_STATS,
                    skills: homeRes.data?.skills || DEFAULT_HOME_SKILLS
                });
                setProfileInfo({
                    ...DEFAULT_PROFILE_INFO,
                    ...profileRes.data,
                    social: {
                        ...DEFAULT_PROFILE_INFO.social,
                        ...(profileRes.data?.social || {})
                    }
                });
            } catch (error) {
                console.error('Failed to fetch home data');
            }
        };
        fetchData();
        
        axios.post(`${API}/api/analytics/track`, { event_type: 'page_view', page: 'home' }).catch(() => {});

        return () => {
            isMounted = false;
        };
    }, []);

    const particlesOptions = useMemo(() => ({
        fullScreen: false,
        background: { color: { value: 'transparent' } },
        fpsLimit: 30,
        particles: {
            color: { value: ['#A855F7', '#06B6D4'] },
            links: {
                color: '#A855F7',
                distance: 150,
                enable: true,
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 0.45,
                direction: 'none',
                random: true,
                straight: false,
                outModes: { default: 'bounce' }
            },
            number: { value: 28, density: { enable: true, area: 900 } },
            opacity: { value: 0.22 },
            size: { value: { min: 1, max: 3 } }
        },
        detectRetina: true
    }), []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] } }
    };

    return (
        <div className="min-h-screen" data-testid="home-page">
            {/* Hero Section */}
            <motion.section 
                className="relative min-h-screen flex items-center justify-center overflow-hidden"
                style={{ opacity: heroOpacity, scale: heroScale }}
            >
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/dd8d4152-3726-4bcf-afd9-da6518a514c1/images/d3f1d43a80fd3c71849e48da76b10f5807386eea3732e277bf1fb76e949ea85c.png)'
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#02040A]/60 via-[#02040A]/80 to-[#02040A]"></div>
                </div>

                {/* Particles */}
                {particlesInit && (
                    <Particles id="tsparticles" options={particlesOptions} className="absolute inset-0" />
                )}

                {/* Content */}
                <motion.div 
                    className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.p 
                        className="label mb-6"
                        variants={itemVariants}
                    >
                        Welcome to my universe
                    </motion.p>
                    
                    <motion.h1 
                        className="font-heading text-4xl sm:text-5xl lg:text-7xl font-black mb-6 tracking-tighter"
                        variants={itemVariants}
                    >
                        Hi, I'm <span className="gradient-text">{profileInfo.name || DEFAULT_PROFILE_INFO.name}</span>
                    </motion.h1>
                    
                    <motion.div 
                        className="text-xl sm:text-2xl lg:text-3xl text-slate-300 mb-4 h-12"
                        variants={itemVariants}
                    >
                        <span className="text-glow-cyan">{typedText}</span>
                        <span className="typing-cursor"></span>
                    </motion.div>

                    <motion.p 
                        className="text-slate-400 max-w-2xl mx-auto mb-12 text-lg"
                        variants={itemVariants}
                    >
                        {profileInfo.bio || DEFAULT_PROFILE_INFO.bio}
                    </motion.p>

                    <motion.div 
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
                        variants={itemVariants}
                    >
                        <MagneticButton href="/projects" className="btn-secondary" data-testid="view-projects-btn">
                            Explore My Work
                            <FiArrowRight className="ml-2" />
                        </MagneticButton>
                        <MagneticButton href="/contact" className="btn-primary" data-testid="contact-btn">
                            Get in Touch
                        </MagneticButton>
                    </motion.div>

                    {/* Social Links */}
                    <motion.div 
                        className="flex items-center justify-center gap-8"
                        variants={itemVariants}
                    >
                        {[
                            { icon: FiGithub, href: profileInfo.social?.github || DEFAULT_PROFILE_INFO.social.github, label: 'GitHub' },
                            { icon: FiLinkedin, href: profileInfo.social?.linkedin || DEFAULT_PROFILE_INFO.social.linkedin, label: 'LinkedIn' },
                            { icon: FiInstagram, href: profileInfo.social?.instagram || DEFAULT_PROFILE_INFO.social.instagram, label: 'Instagram' }
                        ].map((social) => (
                            <motion.a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-purple-400 transition-colors"
                                whileHover={{ scale: 1.2, y: -4 }}
                                data-testid={`social-${social.label.toLowerCase()}`}
                            >
                                <social.icon size={28} />
                            </motion.a>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div 
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <FiChevronDown size={32} className="text-purple-400" />
                </motion.div>
            </motion.section>

            {/* Stats Section */}
            <section className="py-24 px-6 md:px-12 lg:px-24 relative">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        className="grid grid-cols-2 lg:grid-cols-4 gap-8"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={containerVariants}
                    >
                        {stats.map((stat, index) => (
                            <motion.div 
                                key={stat.label}
                                className="text-center"
                                variants={itemVariants}
                            >
                                <div className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black gradient-text mb-2">
                                    <AnimatedCounter value={Number(stat.value) || 0} />
                                    {stat.suffix || '+'}
                                </div>
                                <p className="text-slate-400 text-sm font-mono uppercase tracking-wider">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Skills Section */}
            <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#02040A]">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="label mb-4">Expertise</p>
                        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">Technical Skills</h2>
                    </motion.div>

                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={containerVariants}
                    >
                        {skills.map((skill) => (
                            <motion.div 
                                key={skill.name}
                                className="glass p-6 rounded-2xl"
                                variants={itemVariants}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-medium text-white">{skill.name}</span>
                                    <span className="text-cyan-400 font-mono text-sm">{skill.level}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="progress-bar"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${skill.level}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Featured Projects */}
            <section className="py-24 px-6 md:px-12 lg:px-24">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        className="flex items-end justify-between mb-16"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div>
                            <p className="label mb-4">Portfolio</p>
                            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">Featured Projects</h2>
                        </div>
                        <Link 
                            to="/projects" 
                            className="hidden sm:flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-mono text-sm"
                        >
                            View All
                            <FiArrowRight />
                        </Link>
                    </motion.div>

                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={containerVariants}
                    >
                        {featuredProjects.map((project) => (
                            <motion.div key={project.id} variants={itemVariants}>
                                <TiltCard className="h-full">
                                    <div className="aspect-video bg-slate-900 relative overflow-hidden">
                                        {project.image_url ? (
                                            <img 
                                                src={project.image_url} 
                                                alt={project.title}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-cyan-900/30">
                                                <span className="text-5xl font-heading font-bold text-purple-500/50">
                                                    {project.title?.[0] || 'P'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent"></div>
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 text-xs font-mono bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                                                {project.category?.replace('-', ' ') || 'Project'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-heading font-bold text-xl mb-3">{project.title}</h3>
                                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {project.technologies?.slice(0, 3).map((tech) => (
                                                <span 
                                                    key={tech}
                                                    className="px-2 py-1 text-xs bg-slate-800 text-cyan-400 rounded font-mono"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </TiltCard>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 md:px-12 lg:px-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/20"></div>
                <motion.div 
                    className="relative max-w-4xl mx-auto text-center"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        Ready to Build Something <span className="gradient-text">Amazing</span>?
                    </h2>
                    <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
                        I'm always excited to discuss new opportunities in Data Science, 
                        Machine Learning, and AI. Let's create something extraordinary together.
                    </p>
                    <MagneticButton href="/contact" className="btn-secondary" data-testid="cta-contact-btn">
                        Start a Conversation
                        <FiArrowRight className="ml-2" />
                    </MagneticButton>
                </motion.div>
            </section>
        </div>
    );
};

export default HomePage;
