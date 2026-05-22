import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    House, Folder, Users, ChartLine, Plus, Pencil, Trash, 
    ChatCircle, SignOut, X, Check, ArrowCounterClockwise, UserCircle, UploadSimple, FileText,
    Camera, Warning
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;
const DEFAULT_PROFILE_IMAGE = 'https://static.prod-images.emergentagent.com/jobs/dd8d4152-3726-4bcf-afd9-da6518a514c1/images/f23f4b73d684e0d789993f4e15e4e9e7654806dc57bf09052fb0ebf6c99f92cd.png';
const DEFAULT_PROFILE_SOCIAL = {
    github: '',
    linkedin: '',
    instagram: '',
    website: ''
};

const emptyEducation = {
    degree: '',
    institution: '',
    location: '',
    period: '',
    coursework: []
};

const emptyCertification = {
    name: '',
    institution: '',
    period: '',
    credential_url: ''
};

const emptyHomeStat = {
    label: '',
    value: 0,
    suffix: '+'
};

const emptyHomeSkill = {
    name: '',
    level: 0
};

const normalizeHomeForm = (info = {}) => ({
    stats: info.stats || [],
    skills: info.skills || []
});

const normalizePortfolioForm = (info = {}) => ({
    skills: info.skills || {},
    education: info.education || [],
    certifications: info.certifications || []
});

const normalizeProfileForm = (info = {}) => ({
    name: info.name || '',
    title: info.title || '',
    field_of_study: info.field_of_study || '',
    tagline: info.tagline || '',
    bio: info.bio || info.description || '',
    location: info.location || '',
    email: info.email || '',
    phone: info.phone || '',
    profile_image_url: info.profile_image_url || '',
    social: {
        ...DEFAULT_PROFILE_SOCIAL,
        ...(info.social || {})
    }
});

const splitCommaList = (value) => (
    value.split(',').map((item) => item.trim()).filter(Boolean)
);

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const aboutSectionLabels = {
    skills: 'Technical Arsenal',
    education: 'Education',
    certifications: 'Certifications'
};

const homeSectionLabels = {
    stats: 'Home Stats',
    skills: 'Home Technical Skills'
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [projectForm, setProjectForm] = useState({
        title: '',
        description: '',
        technologies: '',
        image_url: '',
        github_url: '',
        demo_url: '',
        category: 'data-analysis',
        featured: false,
        year: ''
    });
    const [deletedProject, setDeletedProject] = useState(null);
    const [projectActionError, setProjectActionError] = useState('');
    const [homeInfo, setHomeInfo] = useState(null);
    const [homeForm, setHomeForm] = useState(normalizeHomeForm());
    const [homeStatus, setHomeStatus] = useState(null);
    const [homeUndo, setHomeUndo] = useState(null);
    const [portfolioInfo, setPortfolioInfo] = useState(null);
    const [portfolioForm, setPortfolioForm] = useState(normalizePortfolioForm());
    const [portfolioStatus, setPortfolioStatus] = useState(null);
    const [portfolioUndo, setPortfolioUndo] = useState(null);
    const [profileInfo, setProfileInfo] = useState(null);
    const [profileForm, setProfileForm] = useState(normalizeProfileForm());
    const [profileStatus, setProfileStatus] = useState(null);
    const [profileUndo, setProfileUndo] = useState(null);
    const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
    const [uploadingCertificateIndex, setUploadingCertificateIndex] = useState(null);
    const [resumeInfo, setResumeInfo] = useState(null);
    const [resumeStatus, setResumeStatus] = useState(null);
    const [uploadingResume, setUploadingResume] = useState(false);

    // Face Recognition States & Refs
    const [faceTemplates, setFaceTemplates] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [faceLoading, setFaceLoading] = useState(false);
    const [faceError, setFaceError] = useState('');
    const [faceSuccess, setFaceSuccess] = useState('');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Stop camera on tab change or component unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (activeTab !== 'face-recognition') {
            stopCamera();
        } else {
            fetchFaceTemplates();
        }
    }, [activeTab]);

    const fetchFaceTemplates = async () => {
        try {
            const { data } = await axios.get(`${API}/api/face/templates`, { withCredentials: true });
            setFaceTemplates(data);
        } catch (error) {
            console.error('Failed to fetch face templates:', error);
            setFaceError('Failed to load registered face templates.');
        }
    };

    const startCamera = async () => {
        setFaceError('');
        setFaceSuccess('');
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
            setFaceError('Camera access denied. Please allow camera permissions to capture face.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const captureAndRegisterFace = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        setFaceLoading(true);
        setFaceError('');
        setFaceSuccess('');

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        try {
            await axios.post(`${API}/api/face/register`, {
                face_data: imageData
            }, { withCredentials: true });
            
            setFaceSuccess('Face registered successfully! You can now use your face to log in.');
            stopCamera();
            fetchFaceTemplates();
        } catch (err) {
            setFaceError(err.response?.data?.detail || 'Failed to register face. Please try again with better lighting.');
        } finally {
            setFaceLoading(false);
        }
    };

    const handleDeleteFaceTemplate = async (filename) => {
        if (!window.confirm(`Are you sure you want to delete the face template '${filename}'?`)) return;
        setFaceError('');
        setFaceSuccess('');
        try {
            await axios.delete(`${API}/api/face/templates/${filename}`, { withCredentials: true });
            setFaceSuccess(`Face template '${filename}' deleted successfully.`);
            fetchFaceTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
            setFaceError('Failed to delete the template. Please try again.');
        }
    };

    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    useEffect(() => {
        if (!isAdmin) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [isAdmin, navigate]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [projectsRes, usersRes, analyticsRes, messagesRes, portfolioRes, homeRes, profileRes, resumeRes] = await Promise.all([
                axios.get(`${API}/api/projects`, { withCredentials: true }),
                axios.get(`${API}/api/admin/users`, { withCredentials: true }),
                axios.get(`${API}/api/analytics/summary`, { withCredentials: true }),
                axios.get(`${API}/api/contact/messages`, { withCredentials: true }),
                axios.get(`${API}/api/admin/portfolio/info`, { withCredentials: true }),
                axios.get(`${API}/api/admin/home/info`, { withCredentials: true }),
                axios.get(`${API}/api/admin/profile/info`, { withCredentials: true }),
                axios.get(`${API}/api/admin/resume/info`, { withCredentials: true })
            ]);
            setProjects(projectsRes.data);
            setUsers(usersRes.data);
            setAnalytics(analyticsRes.data);
            setMessages(messagesRes.data);
            setPortfolioInfo(portfolioRes.data);
            setPortfolioForm(normalizePortfolioForm(portfolioRes.data));
            setHomeInfo(homeRes.data);
            setHomeForm(normalizeHomeForm(homeRes.data));
            setProfileInfo(profileRes.data);
            setProfileForm(normalizeProfileForm(profileRes.data));
            setResumeInfo(resumeRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const projectData = {
                ...projectForm,
                technologies: projectForm.technologies.split(',').map(t => t.trim()).filter(Boolean)
            };
            
            if (editingProject) {
                await axios.put(`${API}/api/projects/${editingProject.id}`, projectData, { withCredentials: true });
            } else {
                await axios.post(`${API}/api/projects`, projectData, { withCredentials: true });
            }
            
            setShowProjectModal(false);
            setEditingProject(null);
            setProjectForm({
                title: '',
                description: '',
                technologies: '',
                image_url: '',
                github_url: '',
                demo_url: '',
                category: 'data-analysis',
                featured: false,
                year: ''
            });
            setProjectActionError('');
            fetchData();
        } catch (error) {
            console.error('Failed to save project:', error);
            setProjectActionError('Failed to save project. Please check the fields and try again.');
        }
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setProjectForm({
            title: project.title,
            description: project.description,
            technologies: project.technologies?.join(', ') || '',
            image_url: project.image_url || '',
            github_url: project.github_url || '',
            demo_url: project.demo_url || '',
            category: project.category || 'data-analysis',
            featured: project.featured || false,
            year: project.year || ''
        });
        setProjectActionError('');
        setShowProjectModal(true);
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            const projectToDelete = projects.find((project) => project.id === id);
            const { data } = await axios.delete(`${API}/api/projects/${id}`, { withCredentials: true });
            setProjects((prevProjects) => prevProjects.filter((project) => project.id !== id));
            setDeletedProject(data.project || projectToDelete || null);
            setProjectActionError('');
        } catch (error) {
            console.error('Failed to delete project:', error);
            setProjectActionError('Failed to delete project. Please try again.');
        }
    };

    const handleUndoDelete = async () => {
        if (!deletedProject) return;

        try {
            const { data } = await axios.post(`${API}/api/projects/restore`, deletedProject, { withCredentials: true });
            setProjects((prevProjects) => {
                if (prevProjects.some((project) => project.id === data.project.id)) {
                    return prevProjects;
                }
                return [...prevProjects, data.project].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
            });
            setDeletedProject(null);
            setProjectActionError('');
        } catch (error) {
            console.error('Failed to restore project:', error);
            setProjectActionError('Failed to restore project. It may already exist.');
        }
    };

    const handleHomeStatChange = (index, field, value) => {
        setHomeForm((prev) => ({
            ...prev,
            stats: prev.stats.map((item, itemIndex) => (
                itemIndex === index ? { ...item, [field]: field === 'value' ? Number(value) : value } : item
            ))
        }));
    };

    const handleHomeSkillChange = (index, field, value) => {
        setHomeForm((prev) => ({
            ...prev,
            skills: prev.skills.map((item, itemIndex) => (
                itemIndex === index ? { ...item, [field]: field === 'level' ? Number(value) : value } : item
            ))
        }));
    };

    const cleanHomeSection = (section) => {
        if (section === 'stats') {
            return (homeForm.stats || []).map((stat) => ({
                label: stat.label.trim(),
                value: Math.max(0, Number(stat.value) || 0),
                suffix: stat.suffix?.trim() || '+'
            })).filter((stat) => stat.label);
        }

        if (section === 'skills') {
            return (homeForm.skills || []).map((skill) => ({
                name: skill.name.trim(),
                level: Math.max(0, Math.min(100, Number(skill.level) || 0))
            })).filter((skill) => skill.name);
        }

        return null;
    };

    const handleSaveHomeSection = async (section) => {
        setHomeStatus(null);

        const label = homeSectionLabels[section];
        const previousValue = cloneValue(homeInfo?.[section] ?? homeForm[section]);
        const payload = { [section]: cleanHomeSection(section) };

        try {
            const { data } = await axios.put(`${API}/api/admin/home/info`, payload, { withCredentials: true });
            setHomeInfo(data);
            setHomeForm(normalizeHomeForm(data));
            setHomeUndo({ section, label, previousValue });
            setHomeStatus({ success: true, message: `${label} updated successfully.` });
        } catch (error) {
            console.error(`Failed to save ${section}:`, error);
            setHomeStatus({ success: false, message: `Failed to save ${label}.` });
        }
    };

    const handleUndoHomeSection = async () => {
        if (!homeUndo) return;

        const { section, label, previousValue } = homeUndo;

        try {
            const { data } = await axios.put(
                `${API}/api/admin/home/info`,
                { [section]: previousValue },
                { withCredentials: true }
            );
            setHomeInfo(data);
            setHomeForm(normalizeHomeForm(data));
            setHomeUndo(null);
            setHomeStatus({ success: true, message: `${label} restored.` });
        } catch (error) {
            console.error(`Failed to undo ${section}:`, error);
            setHomeStatus({ success: false, message: `Failed to undo ${label}.` });
        }
    };

    const handleSkillCategoryChange = (oldCategory, newCategory) => {
        setPortfolioForm((prev) => {
            const nextSkills = { ...prev.skills };
            const skills = nextSkills[oldCategory] || [];
            delete nextSkills[oldCategory];
            nextSkills[newCategory] = skills;
            return { ...prev, skills: nextSkills };
        });
    };

    const handleSkillListChange = (category, value) => {
        setPortfolioForm((prev) => ({
            ...prev,
            skills: {
                ...prev.skills,
                [category]: splitCommaList(value)
            }
        }));
    };

    const handleAddSkillCategory = () => {
        setPortfolioForm((prev) => {
            const nextSkills = { ...prev.skills };
            let count = 1;
            let category = 'new_category';
            while (nextSkills[category]) {
                count += 1;
                category = `new_category_${count}`;
            }
            nextSkills[category] = [];
            return { ...prev, skills: nextSkills };
        });
    };

    const handleRemoveSkillCategory = (category) => {
        setPortfolioForm((prev) => {
            const nextSkills = { ...prev.skills };
            delete nextSkills[category];
            return { ...prev, skills: nextSkills };
        });
    };

    const handleEducationChange = (index, field, value) => {
        setPortfolioForm((prev) => ({
            ...prev,
            education: prev.education.map((item, itemIndex) => (
                itemIndex === index ? { ...item, [field]: value } : item
            ))
        }));
    };

    const handleCertificationChange = (index, field, value) => {
        setPortfolioForm((prev) => ({
            ...prev,
            certifications: prev.certifications.map((item, itemIndex) => (
                itemIndex === index ? { ...item, [field]: value } : item
            ))
        }));
    };

    const handleCertificationFileUpload = async (index, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setUploadingCertificateIndex(index);
        setPortfolioStatus(null);

        try {
            const { data } = await axios.post(`${API}/api/admin/certificates/upload`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleCertificationChange(index, 'credential_url', data.credential_url);
            setPortfolioStatus({ success: true, message: 'Certificate file uploaded. Update changes to save it.' });
        } catch (error) {
            console.error('Failed to upload certificate:', error);
            setPortfolioStatus({ success: false, message: error.response?.data?.detail || 'Failed to upload certificate file.' });
        } finally {
            setUploadingCertificateIndex(null);
        }
    };

    const cleanPortfolioSection = (section) => {
        if (section === 'skills') {
            return Object.entries(portfolioForm.skills || {}).reduce((acc, [category, skills]) => {
            const key = category.trim();
            if (key) {
                acc[key] = (skills || []).map((skill) => skill.trim()).filter(Boolean);
            }
            return acc;
        }, {});
        }

        if (section === 'education') {
            return (portfolioForm.education || []).map((edu) => ({
                degree: edu.degree.trim(),
                institution: edu.institution.trim(),
                location: edu.location.trim(),
                period: edu.period.trim(),
                coursework: (edu.coursework || []).map((course) => course.trim()).filter(Boolean)
            })).filter((edu) => edu.degree && edu.institution && edu.location && edu.period);
        }

        if (section === 'certifications') {
            return (portfolioForm.certifications || []).map((cert) => ({
                name: cert.name.trim(),
                institution: cert.institution.trim(),
                period: cert.period.trim(),
                credential_url: cert.credential_url?.trim() || null
            })).filter((cert) => cert.name && cert.institution && cert.period);
        }

        return null;
    };

    const handleSavePortfolioSection = async (section) => {
        setPortfolioStatus(null);

        const label = aboutSectionLabels[section];
        const previousValue = cloneValue(portfolioInfo?.[section] ?? portfolioForm[section]);
        const payload = { [section]: cleanPortfolioSection(section) };

        try {
            const { data } = await axios.put(`${API}/api/admin/portfolio/info`, payload, { withCredentials: true });
            setPortfolioInfo(data);
            setPortfolioForm(normalizePortfolioForm(data));
            setPortfolioUndo({ section, label, previousValue });
            setPortfolioStatus({ success: true, message: `${label} updated successfully.` });
        } catch (error) {
            console.error(`Failed to save ${section}:`, error);
            setPortfolioStatus({ success: false, message: `Failed to save ${label}.` });
        }
    };

    const handleUndoPortfolioSection = async () => {
        if (!portfolioUndo) return;

        const { section, label, previousValue } = portfolioUndo;

        try {
            const { data } = await axios.put(
                `${API}/api/admin/portfolio/info`,
                { [section]: previousValue },
                { withCredentials: true }
            );
            setPortfolioInfo(data);
            setPortfolioForm(normalizePortfolioForm(data));
            setPortfolioUndo(null);
            setPortfolioStatus({ success: true, message: `${label} restored.` });
        } catch (error) {
            console.error(`Failed to undo ${section}:`, error);
            setPortfolioStatus({ success: false, message: `Failed to undo ${label}.` });
        }
    };

    const handleProfileFieldChange = (field, value) => {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleProfileSocialChange = (platform, value) => {
        setProfileForm((prev) => ({
            ...prev,
            social: {
                ...(prev.social || {}),
                [platform]: value
            }
        }));
    };

    const cleanProfilePayload = () => ({
        name: profileForm.name.trim(),
        title: profileForm.title.trim(),
        field_of_study: profileForm.field_of_study.trim(),
        tagline: profileForm.tagline.trim(),
        bio: profileForm.bio.trim(),
        location: profileForm.location.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        social: Object.entries(profileForm.social || {}).reduce((acc, [platform, link]) => {
            const key = platform.trim();
            const value = (link || '').trim();
            if (key && value) {
                acc[key] = value;
            }
            return acc;
        }, {}),
        profile_image_url: profileForm.profile_image_url || ''
    });

    const handleSaveProfile = async () => {
        setProfileStatus(null);

        const payload = cleanProfilePayload();

        if (!payload.name) {
            setProfileStatus({ success: false, message: 'Name is required for the profile.' });
            return;
        }

        try {
            const { data } = await axios.put(`${API}/api/admin/profile/info`, payload, { withCredentials: true });
            setProfileInfo(data);
            setProfileForm(normalizeProfileForm(data));
            setProfileUndo({ label: 'Profile details updated.' });
            setProfileStatus({ success: true, message: 'Profile details updated successfully.' });
        } catch (error) {
            console.error('Failed to save profile:', error);
            setProfileStatus({ success: false, message: 'Failed to update profile details.' });
        }
    };

    const handleUndoProfile = async () => {
        try {
            const { data } = await axios.post(`${API}/api/admin/profile/undo`, {}, { withCredentials: true });
            setProfileInfo(data);
            setProfileForm(normalizeProfileForm(data));
            setProfileUndo(null);
            setProfileStatus({ success: true, message: 'Last profile change restored.' });
        } catch (error) {
            if (error?.response?.status === 404) {
                setProfileStatus({ success: false, message: 'No profile changes available to undo.' });
                return;
            }
            console.error('Failed to undo profile update:', error);
            setProfileStatus({ success: false, message: 'Failed to undo profile change.' });
        }
    };

    const handleUploadProfileImage = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setProfileStatus(null);
        setUploadingProfileImage(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await axios.post(
                `${API}/api/admin/profile/image`,
                formData,
                {
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            setProfileInfo(data);
            setProfileForm(normalizeProfileForm(data));
            setProfileUndo({ label: 'Profile image updated.' });
            setProfileStatus({ success: true, message: 'Profile image uploaded successfully.' });
        } catch (error) {
            console.error('Failed to upload profile image:', error);
            setProfileStatus({
                success: false,
                message: error?.response?.data?.detail || 'Failed to upload profile image.'
            });
        } finally {
            setUploadingProfileImage(false);
            event.target.value = '';
        }
    };

    const handleUploadResume = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setResumeStatus(null);
        setUploadingResume(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await axios.post(`${API}/api/admin/resume/upload`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResumeInfo(data);
            setResumeStatus({ success: true, message: 'Resume uploaded and published successfully.' });
        } catch (error) {
            console.error('Failed to upload resume:', error);
            setResumeStatus({
                success: false,
                message: error?.response?.data?.detail || 'Failed to upload resume.'
            });
        } finally {
            setUploadingResume(false);
            event.target.value = '';
        }
    };

    const handleDeleteMessage = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await axios.delete(`${API}/api/contact/messages/${id}`, { withCredentials: true });
            setMessages((prevMessages) => prevMessages.filter((message) => message.id !== id));
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`${API}/api/admin/users/${id}`, { withCredentials: true });
            fetchData();
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: House },
        { id: 'home', label: 'Home', icon: House },
        { id: 'profile', label: 'Profile', icon: UserCircle },
        { id: 'face-recognition', label: 'Face Recognition', icon: Camera },
        { id: 'resume', label: 'Resume', icon: FileText },
        { id: 'projects', label: 'Projects', icon: Folder },
        { id: 'about', label: 'About', icon: Pencil },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: ChartLine },
        { id: 'messages', label: 'Messages', icon: ChatCircle }
    ];

    return (
        <div className="min-h-screen pt-20" data-testid="admin-dashboard">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 fixed left-0 top-16 bottom-0 bg-[#0A0A0C] border-r border-white/10 p-4">
                    <div className="mb-8">
                        <p className="text-sm text-gray-400 mb-1">Welcome back,</p>
                        <p className="font-heading font-bold">{user?.name}</p>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                                data-testid={`tab-${tab.id}`}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="absolute bottom-4 left-4 right-4 flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-sm transition-colors"
                        data-testid="admin-logout-btn"
                    >
                        <SignOut size={20} />
                        Logout
                    </button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <h1 className="font-heading text-3xl font-bold mb-8">Dashboard Overview</h1>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <div className="card-surface p-6 rounded-sm">
                                            <p className="text-sm text-gray-400 mb-2">Total Visits</p>
                                            <p className="font-heading text-3xl font-bold">{analytics?.total_visits || 0}</p>
                                        </div>
                                        <div className="card-surface p-6 rounded-sm">
                                            <p className="text-sm text-gray-400 mb-2">Today's Visits</p>
                                            <p className="font-heading text-3xl font-bold text-blue-400">{analytics?.today_visits || 0}</p>
                                        </div>
                                        <div className="card-surface p-6 rounded-sm">
                                            <p className="text-sm text-gray-400 mb-2">Chatbot Interactions</p>
                                            <p className="font-heading text-3xl font-bold text-indigo-400">{analytics?.chatbot_interactions || 0}</p>
                                        </div>
                                        <div className="card-surface p-6 rounded-sm">
                                            <p className="text-sm text-gray-400 mb-2">Total Projects</p>
                                            <p className="font-heading text-3xl font-bold text-green-400">{projects.length}</p>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="card-surface p-6 rounded-sm">
                                        <h2 className="font-heading font-bold text-xl mb-4">Recent Activity</h2>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {analytics?.recent_activity?.slice(0, 10).map((activity, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-1 text-xs rounded-sm ${
                                                            activity.event_type === 'page_view' ? 'bg-blue-500/10 text-blue-400' :
                                                            activity.event_type === 'chatbot_interaction' ? 'bg-indigo-500/10 text-indigo-400' :
                                                            'bg-gray-500/10 text-gray-400'
                                                        }`}>
                                                            {activity.event_type.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-sm text-gray-400">{activity.page || 'N/A'}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(activity.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Home Tab */}
                            {activeTab === 'home' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h1 className="font-heading text-3xl font-bold">Home Page</h1>
                                            <p className="text-sm text-gray-400 mt-2">
                                                Edit home stats, technical skill percentages, and featured project behavior.
                                            </p>
                                        </div>
                                    </div>

                                    {homeStatus && (
                                        <div className={`mb-6 rounded-sm border px-5 py-4 text-sm ${
                                            homeStatus.success
                                                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                                : 'border-red-500/30 bg-red-500/10 text-red-300'
                                        }`}>
                                            {homeStatus.message}
                                        </div>
                                    )}

                                    {homeUndo && (
                                        <motion.div
                                            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-green-500/30 bg-green-500/10 px-5 py-4"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-green-300">Changes saved</p>
                                                <p className="text-sm text-gray-300">{homeUndo.label}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleUndoHomeSection}
                                                    className="flex items-center gap-2 rounded-sm border border-green-500/40 px-4 py-2 text-sm text-green-200 hover:bg-green-500/10"
                                                    data-testid="undo-home-changes-btn"
                                                >
                                                    <ArrowCounterClockwise size={18} />
                                                    Undo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setHomeUndo(null)}
                                                    className="p-2 text-gray-400 hover:text-white"
                                                    aria-label="Dismiss undo"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="space-y-8">
                                        <section className="card-surface p-6 rounded-sm">
                                            <div className="flex items-center justify-between gap-4 mb-6">
                                                <div>
                                                    <h2 className="font-heading font-bold text-xl">Stats Counter</h2>
                                                    <p className="text-sm text-gray-400 mt-1">Edit the value and suffix shown under the hero.</p>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setHomeForm((prev) => ({ ...prev, stats: [...prev.stats, { ...emptyHomeStat }] }))}
                                                        className="flex items-center gap-2 rounded-sm border border-blue-500/40 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                                                        data-testid="add-home-stat-btn"
                                                    >
                                                        <Plus size={18} />
                                                        Add Stat
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveHomeSection('stats')}
                                                        className="btn-primary px-5 py-2"
                                                        data-testid="update-home-stats-btn"
                                                    >
                                                        Update Changes
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {(homeForm.stats || []).map((stat, index) => (
                                                    <div key={index} className="rounded-sm border border-white/10 bg-[#0A0A0C] p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                            <div className="md:col-span-5">
                                                                <label className="block text-xs text-gray-400 mb-2">Label</label>
                                                                <input
                                                                    type="text"
                                                                    value={stat.label}
                                                                    onChange={(e) => handleHomeStatChange(index, 'label', e.target.value)}
                                                                    className="w-full bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                                    placeholder="Projects Completed"
                                                                />
                                                            </div>
                                                            <div className="md:col-span-3">
                                                                <label className="block text-xs text-gray-400 mb-2">Value</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={stat.value}
                                                                    onChange={(e) => handleHomeStatChange(index, 'value', e.target.value)}
                                                                    className="w-full bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                                />
                                                            </div>
                                                            <div className="md:col-span-3">
                                                                <label className="block text-xs text-gray-400 mb-2">Suffix</label>
                                                                <input
                                                                    type="text"
                                                                    value={stat.suffix}
                                                                    onChange={(e) => handleHomeStatChange(index, 'suffix', e.target.value)}
                                                                    className="w-full bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                                    placeholder="+"
                                                                />
                                                            </div>
                                                            <div className="md:col-span-1 flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setHomeForm((prev) => ({ ...prev, stats: prev.stats.filter((_, itemIndex) => itemIndex !== index) }))}
                                                                    className="p-3 text-gray-400 hover:text-red-400"
                                                                    aria-label="Remove stat"
                                                                >
                                                                    <Trash size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="card-surface p-6 rounded-sm">
                                            <div className="flex items-center justify-between gap-4 mb-6">
                                                <div>
                                                    <h2 className="font-heading font-bold text-xl">Technical Skills</h2>
                                                    <p className="text-sm text-gray-400 mt-1">Set the percentage for each home page progress bar.</p>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setHomeForm((prev) => ({ ...prev, skills: [...prev.skills, { ...emptyHomeSkill }] }))}
                                                        className="flex items-center gap-2 rounded-sm border border-blue-500/40 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                                                        data-testid="add-home-skill-btn"
                                                    >
                                                        <Plus size={18} />
                                                        Add Skill
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveHomeSection('skills')}
                                                        className="btn-primary px-5 py-2"
                                                        data-testid="update-home-skills-btn"
                                                    >
                                                        Update Changes
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {(homeForm.skills || []).map((skill, index) => (
                                                    <div key={index} className="rounded-sm border border-white/10 bg-[#0A0A0C] p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                            <div className="md:col-span-6">
                                                                <label className="block text-xs text-gray-400 mb-2">Skill</label>
                                                                <input
                                                                    type="text"
                                                                    value={skill.name}
                                                                    onChange={(e) => handleHomeSkillChange(index, 'name', e.target.value)}
                                                                    className="w-full bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                                    placeholder="Python"
                                                                />
                                                            </div>
                                                            <div className="md:col-span-5">
                                                                <label className="block text-xs text-gray-400 mb-2">Percentage</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={skill.level}
                                                                    onChange={(e) => handleHomeSkillChange(index, 'level', e.target.value)}
                                                                    className="w-full bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                                />
                                                            </div>
                                                            <div className="md:col-span-1 flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setHomeForm((prev) => ({ ...prev, skills: prev.skills.filter((_, itemIndex) => itemIndex !== index) }))}
                                                                    className="p-3 text-gray-400 hover:text-red-400"
                                                                    aria-label="Remove home skill"
                                                                >
                                                                    <Trash size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="card-surface p-6 rounded-sm">
                                            <h2 className="font-heading font-bold text-xl mb-2">Featured Projects</h2>
                                            <p className="text-sm text-gray-400">
                                                The home page now shows only projects marked as Featured in the Projects tab.
                                            </p>
                                        </section>
                                    </div>
                                </motion.div>
                            )}

                            {/* Face Recognition Tab */}
                            {activeTab === 'face-recognition' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h1 className="font-heading text-3xl font-bold">Face Recognition Biometrics</h1>
                                        <p className="text-sm text-gray-400 mt-2">
                                            Register your face to enable secure biometric login. You can register multiple facial angles for higher accuracy.
                                        </p>
                                    </div>

                                    {faceSuccess && (
                                        <div className="rounded-sm border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-300">
                                            {faceSuccess}
                                        </div>
                                    )}

                                    {faceError && (
                                        <div className="flex items-center gap-2 rounded-sm border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                                            <Warning size={20} />
                                            <span>{faceError}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Camera Capture Panel */}
                                        <div className="card-surface p-6 rounded-sm flex flex-col justify-between">
                                            <div>
                                                <h2 className="font-heading font-bold text-xl mb-4">Biometric Enroller</h2>
                                                
                                                <div className="relative aspect-[4/3] bg-[#0A0A0C] rounded-sm overflow-hidden border border-white/5 mb-4">
                                                    {isCameraActive ? (
                                                        <>
                                                            <video
                                                                ref={videoRef}
                                                                autoPlay
                                                                playsInline
                                                                muted
                                                                className="w-full h-full object-cover"
                                                            />
                                                            {/* Oval alignment guide */}
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <div className={`w-48 h-64 border-2 rounded-full transition-all duration-500 ${faceLoading ? 'border-blue-500 animate-pulse' : 'border-blue-500/40'}`}></div>
                                                            </div>
                                                            {faceLoading && (
                                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                                                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                                    <p className="text-sm text-blue-400">Extracting Deep Face Embeddings...</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-gray-500">
                                                            <Camera size={48} className="mb-3 opacity-40 text-blue-500 animate-pulse" />
                                                            <p className="font-medium text-gray-400">Camera Inactive</p>
                                                            <p className="text-xs text-gray-500 mt-1 max-w-xs">
                                                                Enable the camera to capture a live webcam picture of your face.
                                                            </p>
                                                        </div>
                                                    )}
                                                    <canvas ref={canvasRef} className="hidden" />
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                {!isCameraActive ? (
                                                    <button
                                                        type="button"
                                                        onClick={startCamera}
                                                        className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                                                    >
                                                        <Camera size={20} />
                                                        Activate Camera
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={stopCamera}
                                                            className="flex-1 btn-secondary py-3"
                                                            disabled={faceLoading}
                                                        >
                                                            Stop Camera
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={captureAndRegisterFace}
                                                            className="flex-1 btn-primary py-3"
                                                            disabled={faceLoading}
                                                        >
                                                            {faceLoading ? 'Extracting...' : 'Capture & Register'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Registered Templates list */}
                                        <div className="card-surface p-6 rounded-sm flex flex-col">
                                            <h2 className="font-heading font-bold text-xl mb-4">Authorized Face Templates</h2>
                                            
                                            <div className="flex-1 space-y-4 max-h-[360px] overflow-y-auto pr-2">
                                                {faceTemplates.length === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-sm">
                                                        <Warning size={32} className="mb-2 opacity-40" />
                                                        <p className="text-sm">No Face Templates Registered</p>
                                                        <p className="text-xs text-gray-600 mt-1 max-w-xs">
                                                            Please capture and register your face using the enroller to enable secure logins.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    faceTemplates.map((template) => (
                                                        <div 
                                                            key={template.id || template.filename} 
                                                            className="flex items-center justify-between p-4 bg-[#0A0A0C] border border-white/5 rounded-sm hover:border-white/15 transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-blue-500/10 rounded-sm text-blue-400">
                                                                    <Camera size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs">{template.filename}</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        Model: <span className="text-indigo-400 font-mono">{template.model_name}</span>
                                                                    </p>
                                                                    {template.created_at && (
                                                                        <p className="text-[10px] text-gray-600 mt-0.5">
                                                                            Registered: {new Date(template.created_at).toLocaleString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteFaceTemplate(template.filename)}
                                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-colors"
                                                                title="Delete face template"
                                                            >
                                                                <Trash size={18} />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            
                                            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-sm">
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    <span className="text-blue-400 font-semibold">Tip:</span> For best login reliability, register 1-2 images in a well-lit environment from a straight angle. If you change your workspace environment or lighting, you can delete old templates and capture new ones!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                        <div>
                                            <h1 className="font-heading text-3xl font-bold">Profile</h1>
                                            <p className="text-sm text-gray-400 mt-2">
                                                Manage core profile details used across home, about, contact, and footer sections.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleUndoProfile}
                                                className="flex items-center gap-2 rounded-sm border border-green-500/40 px-4 py-2 text-sm text-green-200 hover:bg-green-500/10"
                                                data-testid="undo-profile-changes-btn"
                                            >
                                                <ArrowCounterClockwise size={18} />
                                                Undo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveProfile}
                                                className="btn-primary px-5 py-2"
                                                data-testid="save-profile-btn"
                                            >
                                                Save Profile
                                            </button>
                                        </div>
                                    </div>

                                    {profileStatus && (
                                        <div className={`mb-6 rounded-sm border px-5 py-4 text-sm ${
                                            profileStatus.success
                                                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                                : 'border-red-500/30 bg-red-500/10 text-red-300'
                                        }`}>
                                            {profileStatus.message}
                                        </div>
                                    )}

                                    {profileUndo && (
                                        <motion.div
                                            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-green-500/30 bg-green-500/10 px-5 py-4"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-green-300">Changes saved</p>
                                                <p className="text-sm text-gray-300">{profileUndo.label}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setProfileUndo(null)}
                                                className="p-2 text-gray-400 hover:text-white"
                                                aria-label="Dismiss profile undo"
                                            >
                                                <X size={18} />
                                            </button>
                                        </motion.div>
                                    )}

                                    <div className="space-y-8">
                                        <section className="card-surface p-6 rounded-sm">
                                            <h2 className="font-heading font-bold text-xl mb-6">Profile Image</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                                <div className="md:col-span-4">
                                                    <div className="aspect-[4/5] max-w-xs overflow-hidden rounded-sm border border-white/10 bg-[#0A0A0C]">
                                                        <img
                                                            src={profileForm.profile_image_url || DEFAULT_PROFILE_IMAGE}
                                                            alt={profileInfo?.name || profileForm.name || 'Profile'}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-8">
                                                    <p className="text-sm text-gray-400 mb-4">
                                                        Upload a new image for your About page profile card.
                                                    </p>
                                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-blue-500/40 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10">
                                                        <UploadSimple size={18} />
                                                        {uploadingProfileImage ? 'Uploading...' : 'Upload Image'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleUploadProfileImage}
                                                            className="hidden"
                                                            disabled={uploadingProfileImage}
                                                            data-testid="profile-image-upload-input"
                                                        />
                                                    </label>
                                                    <p className="text-xs text-gray-500 mt-3">
                                                        JPG, PNG, or WebP up to 2MB.
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="card-surface p-6 rounded-sm">
                                            <h2 className="font-heading font-bold text-xl mb-6">Basic Details</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    value={profileForm.name}
                                                    onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                                                    placeholder="Name"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={profileForm.title}
                                                    onChange={(e) => handleProfileFieldChange('title', e.target.value)}
                                                    placeholder="Title"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={profileForm.field_of_study}
                                                    onChange={(e) => handleProfileFieldChange('field_of_study', e.target.value)}
                                                    placeholder="Field of study"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={profileForm.tagline}
                                                    onChange={(e) => handleProfileFieldChange('tagline', e.target.value)}
                                                    placeholder="Tagline"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="email"
                                                    value={profileForm.email}
                                                    onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                                                    placeholder="Email"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={profileForm.phone}
                                                    onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                                                    placeholder="Phone"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={profileForm.location}
                                                    onChange={(e) => handleProfileFieldChange('location', e.target.value)}
                                                    placeholder="Location"
                                                    className="md:col-span-2 bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <textarea
                                                    value={profileForm.bio}
                                                    onChange={(e) => handleProfileFieldChange('bio', e.target.value)}
                                                    placeholder="Description / bio"
                                                    rows={4}
                                                    className="md:col-span-2 bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                                                />
                                            </div>
                                        </section>

                                        <section className="card-surface p-6 rounded-sm">
                                            <h2 className="font-heading font-bold text-xl mb-6">Links</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input
                                                    type="url"
                                                    value={profileForm.social?.github || ''}
                                                    onChange={(e) => handleProfileSocialChange('github', e.target.value)}
                                                    placeholder="GitHub URL"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="url"
                                                    value={profileForm.social?.linkedin || ''}
                                                    onChange={(e) => handleProfileSocialChange('linkedin', e.target.value)}
                                                    placeholder="LinkedIn URL"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="url"
                                                    value={profileForm.social?.instagram || ''}
                                                    onChange={(e) => handleProfileSocialChange('instagram', e.target.value)}
                                                    placeholder="Instagram URL"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <input
                                                    type="url"
                                                    value={profileForm.social?.website || ''}
                                                    onChange={(e) => handleProfileSocialChange('website', e.target.value)}
                                                    placeholder="Website URL"
                                                    className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </section>
                                    </div>
                                </motion.div>
                            )}

                            {/* Projects Tab */}
                            {activeTab === 'projects' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <h1 className="font-heading text-3xl font-bold">Projects</h1>
                                        <button
                                            onClick={() => {
                                                setEditingProject(null);
                                                setProjectForm({
                                                    title: '',
                                                    description: '',
                                                    technologies: '',
                                                    image_url: '',
                                                    github_url: '',
                                                    demo_url: '',
                                                    category: 'data-analysis',
                                                    featured: false,
                                                    year: ''
                                                });
                                                setProjectActionError('');
                                                setShowProjectModal(true);
                                            }}
                                            className="btn-primary flex items-center gap-2"
                                            data-testid="add-project-btn"
                                        >
                                            <Plus size={20} />
                                            Add Project
                                        </button>
                                    </div>

                                    {deletedProject && (
                                        <motion.div
                                            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-green-500/30 bg-green-500/10 px-5 py-4"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-green-300">Project deleted</p>
                                                <p className="text-sm text-gray-300">{deletedProject.title}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={handleUndoDelete}
                                                    className="flex items-center gap-2 rounded-sm border border-green-500/40 px-4 py-2 text-sm text-green-200 hover:bg-green-500/10"
                                                    data-testid="undo-delete-project-btn"
                                                >
                                                    <ArrowCounterClockwise size={18} />
                                                    Undo
                                                </button>
                                                <button
                                                    onClick={() => setDeletedProject(null)}
                                                    className="p-2 text-gray-400 hover:text-white"
                                                    aria-label="Dismiss undo"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {projectActionError && (
                                        <div className="mb-6 rounded-sm border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                                            {projectActionError}
                                        </div>
                                    )}

                                    <div className="card-surface rounded-sm overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-[#0A0A0C]">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Title</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Category</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Featured</th>
                                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projects.map((project) => (
                                                    <tr key={project.id} className="border-t border-white/5">
                                                        <td className="px-6 py-4">
                                                            <p className="font-medium">{project.title}</p>
                                                            <p className="text-sm text-gray-400 line-clamp-1">{project.description}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-sm capitalize">
                                                                {project.category?.replace('-', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {project.featured && <Check size={20} className="text-green-400" />}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleEditProject(project)}
                                                                className="p-2 text-gray-400 hover:text-white"
                                                                data-testid={`edit-project-${project.id}`}
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProject(project.id)}
                                                                className="p-2 text-gray-400 hover:text-red-400"
                                                                data-testid={`delete-project-${project.id}`}
                                                            >
                                                                <Trash size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}

                            {/* Resume Tab */}
                            {activeTab === 'resume' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h1 className="font-heading text-3xl font-bold">Resume Manager</h1>
                                            <p className="text-sm text-gray-400 mt-2">
                                                Upload or replace the public PDF resume shown on the portfolio.
                                            </p>
                                        </div>
                                    </div>

                                    {resumeStatus && (
                                        <div className={`mb-6 rounded-sm border px-5 py-4 text-sm ${
                                            resumeStatus.success
                                                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                                : 'border-red-500/30 bg-red-500/10 text-red-300'
                                        }`}>
                                            {resumeStatus.message}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                        <section className="xl:col-span-5 card-surface p-6 rounded-sm">
                                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-sm border border-blue-500/30 bg-blue-500/10 text-blue-300">
                                                <FileText size={28} />
                                            </div>
                                            <h2 className="font-heading font-bold text-xl mb-3">
                                                {resumeInfo?.title && resumeInfo.title !== 'Varun Sharma Resume' ? resumeInfo.title : 'Resume'}
                                            </h2>
                                            <div className="space-y-2 text-sm text-gray-400 mb-6">
                                                <p>File: {resumeInfo?.filename || 'No resume uploaded'}</p>
                                                <p>Size: {resumeInfo?.size ? `${Math.round(resumeInfo.size / 1024)} KB` : 'Unknown'}</p>
                                                <p>
                                                    Updated: {resumeInfo?.uploaded_at
                                                        ? new Date(resumeInfo.uploaded_at).toLocaleString()
                                                        : 'Default resume'}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <label className="inline-flex items-center justify-center gap-2 rounded-sm border border-blue-500/40 px-4 py-3 text-sm text-blue-300 hover:bg-blue-500/10 cursor-pointer">
                                                    <UploadSimple size={18} />
                                                    {uploadingResume ? 'Uploading...' : resumeInfo?.url ? 'Replace Resume PDF' : 'Upload Resume PDF'}
                                                    <input
                                                        type="file"
                                                        accept="application/pdf"
                                                        className="hidden"
                                                        disabled={uploadingResume}
                                                        onChange={handleUploadResume}
                                                        data-testid="resume-upload-input"
                                                    />
                                                </label>
                                                {resumeInfo?.url && (
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <a
                                                            href={resumeInfo.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn-secondary flex-1 text-center"
                                                        >
                                                            Preview
                                                        </a>
                                                        <a
                                                            href={resumeInfo.url}
                                                            download={resumeInfo.filename || 'varun-resume.pdf'}
                                                            className="btn-primary flex-1 text-center"
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <section className="xl:col-span-7 card-surface p-6 rounded-sm">
                                            <h2 className="font-heading font-bold text-xl mb-4">Live Preview</h2>
                                            {resumeInfo?.url ? (
                                                <div className="h-[620px] overflow-hidden rounded-sm border border-white/10 bg-white">
                                                    <iframe
                                                        title="Resume preview"
                                                        src={`${resumeInfo.url}#toolbar=0&navpanes=0&view=FitH`}
                                                        className="h-full w-full"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex h-[420px] items-center justify-center rounded-sm border border-dashed border-white/10 text-gray-500">
                                                    Upload a PDF to preview it here.
                                                </div>
                                            )}
                                        </section>
                                    </div>
                                </motion.div>
                            )}

                            {/* About Tab */}
                            {activeTab === 'about' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h1 className="font-heading text-3xl font-bold">About Page</h1>
                                            <p className="text-sm text-gray-400 mt-2">
                                                Edit technical arsenal, education, and certifications for {portfolioInfo?.name || 'the portfolio'}.
                                            </p>
                                        </div>
                                    </div>

                                    {portfolioStatus && (
                                        <div className={`mb-6 rounded-sm border px-5 py-4 text-sm ${
                                            portfolioStatus.success
                                                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                                : 'border-red-500/30 bg-red-500/10 text-red-300'
                                        }`}>
                                            {portfolioStatus.message}
                                        </div>
                                    )}

                                    {portfolioUndo && (
                                        <motion.div
                                            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-green-500/30 bg-green-500/10 px-5 py-4"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-green-300">Changes saved</p>
                                                <p className="text-sm text-gray-300">{portfolioUndo.label}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={handleUndoPortfolioSection}
                                                    className="flex items-center gap-2 rounded-sm border border-green-500/40 px-4 py-2 text-sm text-green-200 hover:bg-green-500/10"
                                                    data-testid="undo-about-changes-btn"
                                                >
                                                    <ArrowCounterClockwise size={18} />
                                                    Undo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPortfolioUndo(null)}
                                                    className="p-2 text-gray-400 hover:text-white"
                                                    aria-label="Dismiss undo"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="space-y-8">
                                        <section className="card-surface p-6 rounded-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h2 className="font-heading font-bold text-xl">Technical Arsenal</h2>
                                                    <p className="text-sm text-gray-400 mt-1">Use comma-separated skills inside each category.</p>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddSkillCategory}
                                                        className="flex items-center gap-2 rounded-sm border border-blue-500/40 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                                                        data-testid="add-skill-category-btn"
                                                    >
                                                        <Plus size={18} />
                                                        Add Category
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSavePortfolioSection('skills')}
                                                        className="btn-primary px-5 py-2"
                                                        data-testid="update-skills-btn"
                                                    >
                                                        Update Changes
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {Object.entries(portfolioForm.skills || {}).map(([category, skills]) => (
                                                    <div key={category} className="rounded-sm border border-white/10 bg-[#0A0A0C] p-4">
                                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                                            <div className="lg:col-span-3">
                                                                <label className="block text-xs text-gray-400 mb-2">Category</label>
                                                                <input
                                                                    type="text"
                                                                    value={category}
                                                                    onChange={(e) => handleSkillCategoryChange(category, e.target.value)}
                                                                    className="w-full bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                                />
                                                            </div>
                                                            <div className="lg:col-span-8">
                                                                <label className="block text-xs text-gray-400 mb-2">Skills</label>
                                                                <textarea
                                                                    value={(skills || []).join(', ')}
                                                                    onChange={(e) => handleSkillListChange(category, e.target.value)}
                                                                    rows={2}
                                                                    className="w-full bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                                                                />
                                                            </div>
                                                            <div className="lg:col-span-1 flex items-end justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveSkillCategory(category)}
                                                                    className="p-3 text-gray-400 hover:text-red-400"
                                                                    aria-label={`Remove ${category}`}
                                                                >
                                                                    <Trash size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="card-surface p-6 rounded-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="font-heading font-bold text-xl">Education</h2>
                                                <div className="flex flex-wrap items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPortfolioForm((prev) => ({ ...prev, education: [...prev.education, { ...emptyEducation }] }))}
                                                        className="flex items-center gap-2 rounded-sm border border-blue-500/40 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                                                        data-testid="add-education-btn"
                                                    >
                                                        <Plus size={18} />
                                                        Add Education
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSavePortfolioSection('education')}
                                                        className="btn-primary px-5 py-2"
                                                        data-testid="update-education-btn"
                                                    >
                                                        Update Changes
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {(portfolioForm.education || []).map((edu, index) => (
                                                    <div key={index} className="rounded-sm border border-white/10 bg-[#0A0A0C] p-4">
                                                        <div className="flex items-start justify-between gap-4 mb-4">
                                                            <p className="text-sm font-medium text-gray-300">Education #{index + 1}</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPortfolioForm((prev) => ({ ...prev, education: prev.education.filter((_, itemIndex) => itemIndex !== index) }))}
                                                                className="p-2 text-gray-400 hover:text-red-400"
                                                                aria-label="Remove education"
                                                            >
                                                                <Trash size={18} />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <input
                                                                type="text"
                                                                value={edu.degree}
                                                                onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                                                                placeholder="Degree"
                                                                className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={edu.institution}
                                                                onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                                                                placeholder="Institution"
                                                                className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={edu.location}
                                                                onChange={(e) => handleEducationChange(index, 'location', e.target.value)}
                                                                placeholder="Location"
                                                                className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={edu.period}
                                                                onChange={(e) => handleEducationChange(index, 'period', e.target.value)}
                                                                placeholder="Period"
                                                                className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={(edu.coursework || []).join(', ')}
                                                                onChange={(e) => handleEducationChange(index, 'coursework', splitCommaList(e.target.value))}
                                                                placeholder="Coursework, comma-separated"
                                                                className="md:col-span-2 bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="card-surface p-6 rounded-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <h2 className="font-heading font-bold text-xl">Certifications</h2>
                                                <div className="flex flex-wrap items-center justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPortfolioForm((prev) => ({ ...prev, certifications: [...prev.certifications, { ...emptyCertification }] }))}
                                                        className="flex items-center gap-2 rounded-sm border border-blue-500/40 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10"
                                                        data-testid="add-certification-btn"
                                                    >
                                                        <Plus size={18} />
                                                        Add Certificate
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSavePortfolioSection('certifications')}
                                                        className="btn-primary px-5 py-2"
                                                        data-testid="update-certifications-btn"
                                                    >
                                                        Update Changes
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {(portfolioForm.certifications || []).map((cert, index) => (
                                                    <div key={index} className="rounded-sm border border-white/10 bg-[#0A0A0C] p-4">
                                                        <div className="flex items-start justify-between gap-4 mb-4">
                                                            <p className="text-sm font-medium text-gray-300">Certificate #{index + 1}</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPortfolioForm((prev) => ({ ...prev, certifications: prev.certifications.filter((_, itemIndex) => itemIndex !== index) }))}
                                                                className="p-2 text-gray-400 hover:text-red-400"
                                                                aria-label="Remove certificate"
                                                            >
                                                                <Trash size={18} />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <input
                                                                type="text"
                                                                value={cert.name || ''}
                                                                onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                                                                placeholder="Certificate name"
                                                                className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={cert.institution || ''}
                                                                onChange={(e) => handleCertificationChange(index, 'institution', e.target.value)}
                                                                placeholder="Institution"
                                                                className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={cert.period || ''}
                                                                onChange={(e) => handleCertificationChange(index, 'period', e.target.value)}
                                                                placeholder="Period"
                                                                className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={cert.credential_url || ''}
                                                                onChange={(e) => handleCertificationChange(index, 'credential_url', e.target.value)}
                                                                placeholder="Certificate file URL"
                                                                className="bg-[#121216] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                                            <label className="inline-flex items-center justify-center gap-2 rounded-sm border border-blue-500/40 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10 cursor-pointer">
                                                                <UploadSimple size={18} />
                                                                {uploadingCertificateIndex === index ? 'Uploading...' : 'Upload certificate'}
                                                                <input
                                                                    type="file"
                                                                    accept="application/pdf,image/png,image/jpeg,image/webp"
                                                                    className="hidden"
                                                                    disabled={uploadingCertificateIndex === index}
                                                                    onChange={(e) => {
                                                                        handleCertificationFileUpload(index, e.target.files?.[0]);
                                                                        e.target.value = '';
                                                                    }}
                                                                />
                                                            </label>
                                                            {cert.credential_url && (
                                                                <>
                                                                    <a
                                                                        href={cert.credential_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-sm text-cyan-300 hover:text-cyan-200 truncate"
                                                                    >
                                                                        Preview current file
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCertificationChange(index, 'credential_url', '')}
                                                                        className="inline-flex items-center justify-center gap-2 rounded-sm border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
                                                                    >
                                                                        <X size={16} />
                                                                        Remove file
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </motion.div>
                            )}

                            {/* Users Tab */}
                            {activeTab === 'users' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <h1 className="font-heading text-3xl font-bold mb-8">Users</h1>
                                    
                                    <div className="card-surface rounded-sm overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-[#0A0A0C]">
                                                <tr>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Name</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
                                                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Role</th>
                                                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((u) => (
                                                    <tr key={u._id} className="border-t border-white/5">
                                                        <td className="px-6 py-4 font-medium">{u.name}</td>
                                                        <td className="px-6 py-4 text-gray-400">{u.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 text-xs rounded-sm ${
                                                                u.role === 'admin' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'
                                                            }`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {u._id !== user?.id && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u._id)}
                                                                    className="p-2 text-gray-400 hover:text-red-400"
                                                                >
                                                                    <Trash size={18} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <h1 className="font-heading text-3xl font-bold mb-8">Analytics</h1>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="card-surface p-6 rounded-sm">
                                            <h2 className="font-heading font-bold text-xl mb-4">Page Views</h2>
                                            <div className="space-y-4">
                                                {analytics?.page_views?.map((pv, idx) => (
                                                    <div key={idx} className="flex items-center justify-between">
                                                        <span className="text-gray-400 capitalize">{pv._id || 'Unknown'}</span>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-32 h-2 bg-[#0A0A0C] rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-blue-500"
                                                                    style={{ width: `${Math.min((pv.count / (analytics.total_visits || 1)) * 100, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm font-medium w-12 text-right">{pv.count}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="card-surface p-6 rounded-sm">
                                            <h2 className="font-heading font-bold text-xl mb-4">Statistics</h2>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-400">Total Page Views</span>
                                                    <span className="font-bold">{analytics?.total_visits || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-400">Today's Views</span>
                                                    <span className="font-bold text-blue-400">{analytics?.today_visits || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-400">Chatbot Interactions</span>
                                                    <span className="font-bold text-indigo-400">{analytics?.chatbot_interactions || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-gray-400">Registered Users</span>
                                                    <span className="font-bold text-green-400">{users.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Messages Tab */}
                            {activeTab === 'messages' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <h1 className="font-heading text-3xl font-bold mb-8">Contact Messages</h1>
                                    
                                    <div className="space-y-4">
                                        {messages.length === 0 ? (
                                            <p className="text-gray-400 text-center py-12">No messages yet.</p>
                                        ) : (
                                            messages.map((msg, idx) => (
                                                <div key={msg.id || idx} className="card-surface p-6 rounded-sm">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-heading font-bold">{msg.name}</h3>
                                                            <p className="text-sm text-gray-400">{msg.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(msg.created_at).toLocaleString()}
                                                            </span>
                                                            {msg.id && (
                                                                <button
                                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-400"
                                                                    data-testid={`delete-message-${msg.id}`}
                                                                    aria-label="Delete message"
                                                                >
                                                                    <Trash size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-blue-400 font-medium mb-2">{msg.subject}</p>
                                                    <p className="text-gray-300">{msg.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Project Modal */}
            {showProjectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <motion.div 
                        className="bg-[#121216] border border-white/10 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="font-heading font-bold text-xl">
                                {editingProject ? 'Edit Project' : 'Add New Project'}
                            </h2>
                            <button
                                onClick={() => setShowProjectModal(false)}
                                className="p-2 text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateProject} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={projectForm.title}
                                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                                    required
                                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    data-testid="project-title-input"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Description *</label>
                                <textarea
                                    value={projectForm.description}
                                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                    required
                                    rows={4}
                                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                                    data-testid="project-description-input"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Technologies (comma-separated)</label>
                                <input
                                    type="text"
                                    value={projectForm.technologies}
                                    onChange={(e) => setProjectForm({ ...projectForm, technologies: e.target.value })}
                                    placeholder="Python, Pandas, Scikit-learn"
                                    className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Image URL</label>
                                    <input
                                        type="url"
                                        value={projectForm.image_url}
                                        onChange={(e) => setProjectForm({ ...projectForm, image_url: e.target.value })}
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">GitHub URL</label>
                                    <input
                                        type="url"
                                        value={projectForm.github_url}
                                        onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Demo URL</label>
                                    <input
                                        type="url"
                                        value={projectForm.demo_url}
                                        onChange={(e) => setProjectForm({ ...projectForm, demo_url: e.target.value })}
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Year</label>
                                    <input
                                        type="text"
                                        value={projectForm.year}
                                        onChange={(e) => setProjectForm({ ...projectForm, year: e.target.value })}
                                        placeholder="2025"
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                        data-testid="project-year-input"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Category</label>
                                    <select
                                        value={projectForm.category}
                                        onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-sm px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="data-analysis">Data Analysis</option>
                                        <option value="machine-learning">Machine Learning</option>
                                        <option value="deep-learning">Deep Learning</option>
                                        <option value="basic-python">Basic Python</option>
                                        <option value="web-development">Web Development</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-8">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={projectForm.featured}
                                            onChange={(e) => setProjectForm({ ...projectForm, featured: e.target.checked })}
                                            className="w-5 h-5 rounded border-white/20 bg-[#0A0A0C] text-blue-500 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-400">Featured Project</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProjectModal(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                    data-testid="save-project-btn"
                                >
                                    {editingProject ? 'Update Project' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
