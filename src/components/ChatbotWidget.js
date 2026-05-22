import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiMic, FiMicOff, FiVolume2, FiVolumeX, FiZap } from 'react-icons/fi';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const stripMarkdownForSpeech = (text = '') => (
    text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^- /gm, '')
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim()
);

const renderInlineMarkdown = (value) => (
    value.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map((part, index) => {
        const strongMatch = part.match(/^\*\*([^*]+)\*\*$/);
        if (strongMatch) {
            return <strong key={`${part}-${index}`} className="font-semibold text-cyan-100">{strongMatch[1]}</strong>;
        }

        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
            return (
                <a
                    key={`${part}-${index}`}
                    href={linkMatch[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-4 hover:text-cyan-200"
                >
                    {linkMatch[1]}
                </a>
            );
        }

        return part;
    })
);

const useTypewriter = (text, enabled) => {
    const [visibleText, setVisibleText] = useState(enabled ? '' : text);

    useEffect(() => {
        if (!enabled) {
            setVisibleText(text);
            return undefined;
        }

        let index = 0;
        setVisibleText('');
        const interval = window.setInterval(() => {
            index += 3;
            setVisibleText(text.slice(0, index));
            if (index >= text.length) {
                window.clearInterval(interval);
            }
        }, 12);

        return () => window.clearInterval(interval);
    }, [text, enabled]);

    return visibleText;
};

const BotMessage = memo(({ text, onSpeak, isSpeaking, animate = false }) => {
    const renderedText = useTypewriter(text, animate);
    const lines = renderedText.split('\n').map((line) => line.trim()).filter(Boolean);
    const introLines = lines.filter((line) => !line.startsWith('- '));
    const items = lines.filter((line) => line.startsWith('- ')).map((line) => line.replace(/^- /, ''));

    return (
        <div>
            {introLines.map((line, index) => (
                <p key={`${line}-${index}`} className="text-sm leading-relaxed text-slate-100 mb-2 last:mb-0">
                    {renderInlineMarkdown(line)}
                </p>
            ))}
            {items.length > 0 && (
                <div className="mt-3 space-y-2">
                    {items.map((item, index) => {
                        const [title, ...rest] = item.split(':');
                        return (
                            <div key={`${item}-${index}`} className="rounded-xl border border-cyan-500/15 bg-slate-900/70 p-3">
                                <p className="text-sm font-semibold text-cyan-200">{renderInlineMarkdown(title)}</p>
                                {rest.length > 0 && (
                                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                                        {renderInlineMarkdown(rest.join(':').trim())}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {renderedText && (
                <motion.button
                    onClick={() => onSpeak(text)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    aria-label={isSpeaking ? 'Stop listening to message' : 'Listen to message'}
                >
                    {isSpeaking ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
                    {isSpeaking ? 'Stop' : 'Listen'}
                </motion.button>
            )}
        </div>
    );
});

BotMessage.displayName = 'BotMessage';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [profileName, setProfileName] = useState('Varun');
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            type: 'bot',
            text: "Hey there! I'm your portfolio AI assistant. Ask me about skills, projects, resume, experience, or collaboration ideas."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [speakingText, setSpeakingText] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('');
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const manualStopRef = useRef(false);
    const recognitionErrorRef = useRef(false);
    const isSubmittingRef = useRef(false);
    const lastSubmittedRef = useRef({ text: '', at: 0 });
    const recognitionHandledRef = useRef(false);

    const suggestions = useMemo(() => [
        `Tell me about ${profileName}`,
        'What are your career goals?',
        'Tell me about your experience',
        'How can I collaborate with you?',
        'Can I preview your resume?',
        'Show me the projects',
        'What skills are listed?',
        'Show certifications',
        'Education details',
        'How can I contact Varun?'
    ], [profileName]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        let isMounted = true;

        axios.get(`${API}/api/profile/info`)
            .then(({ data }) => {
                if (isMounted && data?.name) {
                    setProfileName(data.name);
                }
            })
            .catch(() => {});

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                try {
                    recognitionRef.current.stop();
                } catch {
                    recognitionRef.current.abort();
                }
                recognitionRef.current = null;
            }
            window.speechSynthesis?.cancel();
        };
    }, []);

    const sendMessage = useCallback(async (text = input) => {
        const trimmed = text.trim();
        const now = Date.now();
        if (
            !trimmed ||
            isLoading ||
            isSubmittingRef.current ||
            (lastSubmittedRef.current.text === trimmed && now - lastSubmittedRef.current.at < 1500)
        ) {
            return;
        }

        isSubmittingRef.current = true;
        lastSubmittedRef.current = { text: trimmed, at: now };

        setMessages((prev) => [...prev, { id: `user-${Date.now()}`, type: 'user', text: trimmed }]);
        setInput('');
        setIsLoading(true);
        setVoiceStatus('');

        try {
            const { data } = await axios.post(`${API}/api/chat`, {
                message: trimmed,
                session_id: sessionId
            }, { withCredentials: true });

            setSessionId(data.session_id);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    type: 'bot',
                    text: data.response,
                    intent: data.intent,
                    sources: data.sources || [],
                    animate: true
                }
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-error-${Date.now()}`,
                    type: 'bot',
                    text: "Apologies, I'm having trouble responding right now. Please try again in a moment."
                }
            ]);
        } finally {
            setIsLoading(false);
            isSubmittingRef.current = false;
        }
    }, [input, isLoading, sessionId]);

    const stopRecording = useCallback(() => {
        manualStopRef.current = true;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        } else {
            setIsRecording(false);
        }
    }, []);

    const startRecording = useCallback(async () => {
        if (isRecording) {
            stopRecording();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceStatus('Voice input is not supported in this browser. Try Chrome or Edge.');
            return;
        }

        if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            setVoiceStatus('Voice input needs HTTPS or localhost to access the microphone.');
            return;
        }

        try {
            const permissions = await navigator.permissions.query({ name: 'microphone' });
            if (permissions.state === 'denied') {
                setVoiceStatus('Microphone permission denied. Please allow mic access in browser settings.');
                return;
            }
        } catch {
            // Some browsers do not expose microphone permission status.
        }

        try {
            const stream = await navigator.mediaDevices?.getUserMedia?.({ audio: true });
            stream?.getTracks().forEach((track) => track.stop());
        } catch {
            setVoiceStatus('Microphone could not be opened. Check browser permission, close other apps using the mic, then try again.');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        let finalTranscript = '';
        let latestTranscript = '';
        manualStopRef.current = false;
        recognitionErrorRef.current = false;
        recognitionHandledRef.current = false;

        recognition.onstart = () => {
            setIsRecording(true);
            setVoiceStatus('Listening... Speak now.');
        };
        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0].transcript;
                if (event.results[index].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            latestTranscript = (finalTranscript + interimTranscript).trim();
            setInput(latestTranscript);
        };
        recognition.onerror = (event) => {
            recognitionErrorRef.current = true;
            recognitionHandledRef.current = true;
            const errorMessages = {
                'not-allowed': 'Microphone permission was blocked. Allow mic access in the browser and try again.',
                'no-speech': 'No speech detected. Try speaking a little louder.',
                'audio-capture': 'No microphone was found. Check your input device and try again.',
                network: 'Network error. Check your connection and try again.',
                'service-not-allowed': 'Speech recognition is not allowed right now.'
            };
            setVoiceStatus(errorMessages[event.error] || `Speech recognition error: ${event.error}.`);
            setIsRecording(false);
        };
        recognition.onend = () => {
            setIsRecording(false);
            recognitionRef.current = null;

            if (recognitionHandledRef.current) {
                recognitionHandledRef.current = false;
                recognitionErrorRef.current = false;
                manualStopRef.current = false;
                return;
            }

            if (recognitionErrorRef.current) {
                recognitionErrorRef.current = false;
                manualStopRef.current = false;
                return;
            }

            if (latestTranscript) {
                setVoiceStatus('');
                recognitionHandledRef.current = true;
                sendMessage(latestTranscript);
            } else if (!manualStopRef.current) {
                setVoiceStatus('No speech detected. Try speaking more clearly.');
            } else {
                setVoiceStatus('');
            }
            manualStopRef.current = false;
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch {
            recognitionRef.current = null;
            setIsRecording(false);
            setVoiceStatus('Failed to start microphone. Please check permissions and try again.');
        }
    }, [isRecording, sendMessage, stopRecording]);

    const speakMessage = useCallback((text) => {
        if (!window.speechSynthesis) {
            setVoiceStatus('Voice playback is not supported in this browser.');
            return;
        }

        if (speakingText === text) {
            window.speechSynthesis.cancel();
            setSpeakingText('');
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
        utterance.lang = 'en-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.onstart = () => setSpeakingText(text);
        utterance.onend = () => setSpeakingText('');
        utterance.onerror = () => setSpeakingText('');
        window.speechSynthesis.speak(utterance);
    }, [speakingText]);

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chatbot-container" data-testid="chatbot-widget">
            <motion.button
                onClick={() => setIsOpen((value) => !value)}
                className="chatbot-toggle"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                data-testid="chatbot-toggle-btn"
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.16 }}>
                            <FiX size={28} color="white" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.16 }}>
                            <FiMessageCircle size={28} color="white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chatbot-window"
                        initial={{ opacity: 0, scale: 0.92, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 18 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        data-testid="chatbot-window"
                    >
                        <div className="bg-gradient-to-r from-purple-600 to-cyan-500 p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <FiMessageCircle size={24} color="white" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-white text-lg">{profileName}'s AI</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        <p className="text-xs text-white/80 font-mono">Online - RAG assistant</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ height: 'calc(100% - 168px)' }}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.22 }}
                                >
                                    <div className={`max-w-[85%] p-4 rounded-2xl ${
                                        msg.type === 'user'
                                            ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-br-md'
                                            : 'bg-slate-800/80 text-slate-200 border border-slate-700 rounded-bl-md'
                                    }`}>
                                        {msg.type === 'bot' ? (
                                            <BotMessage
                                                text={msg.text}
                                                animate={msg.animate}
                                                onSpeak={speakMessage}
                                                isSpeaking={speakingText === msg.text}
                                            />
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {!isLoading && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowSuggestions((value) => !value)}
                                        className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                                    >
                                        <FiZap size={14} />
                                        Quick suggestions
                                        <span className={`ml-auto transition-transform ${showSuggestions ? 'rotate-180' : ''}`}>v</span>
                                    </button>

                                    <AnimatePresence>
                                        {showSuggestions && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-slate-700/70 bg-slate-900/95 backdrop-blur-sm p-3 shadow-xl"
                                            >
                                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                                    {suggestions.map((suggestion) => (
                                                        <button
                                                            key={suggestion}
                                                            type="button"
                                                            onClick={() => {
                                                                sendMessage(suggestion);
                                                                setShowSuggestions(false);
                                                            }}
                                                            className="w-full rounded-lg border border-cyan-500/15 bg-slate-800/50 px-3 py-2 text-left text-xs text-slate-100 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-colors leading-tight"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {isLoading && (
                                <motion.div className="flex justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl rounded-bl-md">
                                        <div className="flex items-center gap-2 text-xs text-slate-300">
                                            Thinking
                                            {[0, 1, 2].map((i) => (
                                                <motion.span
                                                    key={i}
                                                    className="w-2 h-2 bg-cyan-400 rounded-full"
                                                    animate={{ opacity: [0.35, 1, 0.35] }}
                                                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-slate-700/50 bg-[#02040A]">
                            {voiceStatus && <p className="mb-3 text-xs text-cyan-200">{voiceStatus}</p>}
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={`Ask about ${profileName}...`}
                                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    data-testid="chatbot-input"
                                />
                                <motion.button
                                    type="button"
                                    onClick={startRecording}
                                    disabled={isLoading}
                                    className={`p-3 rounded-xl border transition-colors ${
                                        isRecording
                                            ? 'border-red-400 bg-red-500/15 text-red-200'
                                            : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:border-cyan-400/40'
                                    }`}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                                >
                                    {isRecording ? <FiMicOff size={20} /> : <FiMic size={20} />}
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || isLoading}
                                    className="p-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    data-testid="chatbot-send-btn"
                                    aria-label="Send message"
                                >
                                    <FiSend size={20} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(ChatbotWidget);
