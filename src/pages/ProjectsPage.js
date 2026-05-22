import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGithub, FiExternalLink, FiX, FiFilter } from 'react-icons/fi';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// Tilt Card Component
const TiltCard = ({ children, className = '', onClick }) => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [mouseX, setMouseX] = useState(50);
    const [mouseY, setMouseY] = useState(50);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        setRotateX((y - centerY) / 15);
        setRotateY((centerX - x) / 15);
        setMouseX((x / rect.width) * 100);
        setMouseY((y / rect.height) * 100);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <motion.div
            className={`card-spotlight cursor-pointer ${className}`}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                '--mouse-x': `${mouseX}%`,
                '--mouse-y': `${mouseY}%`,
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: 'transform 0.1s ease-out'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </motion.div>
    );
};

const ProjectsPage = () => {
    const [filter, setFilter] = useState('all');
    const [selectedProject, setSelectedProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchProjects = async () => {
            setIsLoading(true);
            setError('');

            try {
                const { data } = await axios.get(`${API}/api/projects`);
                if (isMounted) {
                    setProjects(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Projects are unavailable right now. Please try again soon.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchProjects();
        axios.post(`${API}/api/analytics/track`, { event_type: 'page_view', page: 'projects' }).catch(() => {});

        return () => {
            isMounted = false;
        };
    }, []);

    const baseCategories = [
        { id: 'all', label: 'All Projects' },
        { id: 'machine-learning', label: 'Machine Learning' },
        { id: 'deep-learning', label: 'Deep Learning' },
        { id: 'data-analysis', label: 'Data Analysis' },
        { id: 'basic-python', label: 'Basic Python' }
    ];

    const extraCategories = Array.from(new Set(projects.map((project) => project.category).filter(Boolean)))
        .filter((category) => !baseCategories.some((base) => base.id === category))
        .map((category) => ({
            id: category,
            label: category.replace(/-/g, ' ')
        }));

    const categories = [...baseCategories, ...extraCategories];
    
    const filteredProjects = filter === 'all' 
        ? projects 
        : projects.filter(p => p.category === filter);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
    };

    return (
        <div className="min-h-screen pt-24 pb-16" data-testid="projects-page">
            <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
                {/* Header */}
                <motion.div 
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <p className="label mb-4">Portfolio</p>
                    <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black mb-6 tracking-tighter">
                        My <span className="gradient-text">Projects</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        A collection of data science, machine learning, and AI projects 
                        showcasing my expertise in building intelligent solutions.
                    </p>
                </motion.div>

                {/* Filter */}
                <motion.div 
                    className="flex flex-wrap items-center justify-center gap-4 mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <FiFilter className="text-purple-400" size={20} />
                    {categories.map((cat) => (
                        <motion.button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest transition-all ${
                                filter === cat.id
                                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25'
                                    : 'glass text-slate-400 hover:text-white hover:border-purple-500/50'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            data-testid={`filter-${cat.id}`}
                        >
                            {cat.label}
                        </motion.button>
                    ))}
                </motion.div>

                {/* Projects Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <motion.div
                            className="w-14 h-14 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>
                ) : error ? (
                    <div className="glass p-8 rounded-2xl text-center text-slate-300">
                        {error}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="glass p-8 rounded-2xl text-center text-slate-300">
                        No projects found for this category.
                    </div>
                ) : (
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={filter}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredProjects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    variants={itemVariants}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <TiltCard 
                                        className="h-full"
                                        onClick={() => setSelectedProject(project)}
                                        data-testid={`project-card-${project.id}`}
                                    >
                                        {/* Image */}
                                        <div className="aspect-video bg-slate-900 relative overflow-hidden">
                                            {project.image_url ? (
                                                <motion.img 
                                                    src={project.image_url} 
                                                    alt={project.title}
                                                    className="w-full h-full object-cover"
                                                    whileHover={{ scale: 1.1 }}
                                                    transition={{ duration: 0.6 }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-cyan-900/30">
                                                    <span className="text-5xl font-heading font-bold text-purple-500/50">
                                                        {project.title?.[0] || 'P'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent"></div>
                                            
                                            {/* Category Badge */}
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 text-xs font-mono bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30 backdrop-blur-sm">
                                                    {project.category?.replace('-', ' ') || 'Project'}
                                                </span>
                                            </div>

                                            {/* Year Badge */}
                                            {project.year && (
                                                <div className="absolute top-4 right-4">
                                                    <span className="px-3 py-1 text-xs font-mono bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30 backdrop-blur-sm">
                                                        {project.year}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <motion.div 
                                                className="absolute inset-0 bg-purple-900/50 backdrop-blur-sm flex items-center justify-center gap-4 opacity-0"
                                                whileHover={{ opacity: 1 }}
                                            >
                                                {project.github_url && (
                                                    <motion.a
                                                        href={project.github_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <FiGithub size={24} className="text-white" />
                                                    </motion.a>
                                                )}
                                                <motion.button
                                                    className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <FiExternalLink size={24} className="text-white" />
                                                </motion.button>
                                            </motion.div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6">
                                            <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-purple-400 transition-colors">
                                                {project.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                                {project.description}
                                            </p>
                                            
                                            {/* Technologies */}
                                            <div className="flex flex-wrap gap-2">
                                                {project.technologies?.slice(0, 4).map((tech) => (
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
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            {/* Project Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedProject(null)}
                    >
                        <motion.div 
                            className="glass-strong rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="relative">
                                {selectedProject.image_url ? (
                                    <img 
                                        src={selectedProject.image_url} 
                                        alt={selectedProject.title}
                                        className="w-full h-64 object-cover rounded-t-3xl"
                                    />
                                ) : (
                                    <div className="w-full h-64 rounded-t-3xl bg-gradient-to-br from-purple-900/40 to-cyan-900/40 flex items-center justify-center">
                                        <span className="text-6xl font-heading font-bold text-purple-500/50">
                                            {selectedProject.title?.[0] || 'P'}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent"></div>
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 text-xs font-mono bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                                        {selectedProject.category?.replace('-', ' ')}
                                    </span>
                                    {selectedProject.year && (
                                        <span className="px-3 py-1 text-xs font-mono bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
                                            {selectedProject.year}
                                        </span>
                                    )}
                                </div>
                                
                                <h2 className="font-heading text-3xl font-bold mb-4">{selectedProject.title}</h2>
                                <p className="text-slate-300 mb-6 leading-relaxed">{selectedProject.description}</p>
                                
                                <div className="mb-8">
                                    <h4 className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-3">Technologies Used</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProject.technologies?.map((tech) => (
                                            <span 
                                                key={tech}
                                                className="px-4 py-2 bg-slate-800 text-white rounded-full text-sm font-medium"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    {selectedProject.github_url && (
                                        <a
                                            href={selectedProject.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            <FiGithub size={18} />
                                            View on GitHub
                                        </a>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectsPage;
