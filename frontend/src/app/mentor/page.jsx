"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  SmartToy as BotIcon,
  Person as UserIcon,
  Send as SendIcon,
  EmojiObjects as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Savings as PiggyBankIcon,
  CreditCard as CreditCardIcon,
  Link as LinkIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon,
} from "@mui/icons-material";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { LogOut } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import Link from "next/link";
import { logout } from "../../services/authServices";
import { usePathname } from "next/navigation";
import {
  sendMessageToAI,
  getQuickTip,
  analyzeBudgetWithAI as analyzeBudgetService,
  getLearningPath as getLearningPathService,
} from "../../services/chatServices";

export default function MentorPage() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      content:
        "Hi! I'm your AI Financial Mentor. I'm here to help you with budgeting, saving, investing, and any other money questions you have as a student. What would you like to learn about today?",
      sender: "ai",
      timestamp: new Date(),
      expandedSources: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedExpert, setSelectedExpert] = useState("default");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [showVoiceError, setShowVoiceError] = useState(false);

  // Rate limiting cooldown (5 seconds between requests)
  const [lastRequestTime, setLastRequestTime] = useState(0);

  // Initialize speech recognition (unchanged)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-US";
          recognition.maxAlternatives = 1;

          recognition.onresult = (event) => {
            let finalTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) finalTranscript += transcript;
            }
            if (finalTranscript) {
              setInputMessage((prev) => (prev + " " + finalTranscript).trim());
            }
          };
          recognition.onstart = () => {
            setVoiceError("");
            setShowVoiceError(false);
          };
          recognition.onend = () => setIsListening(false);
          recognition.onerror = (event) => {
            setIsListening(false);
            let errorMessage = "Speech recognition failed. ";
            let showError = true;
            switch (event.error) {
              case "no-speech":
                errorMessage += "No speech detected.";
                break;
              case "audio-capture":
                errorMessage += "Microphone not found.";
                break;
              case "not-allowed":
                errorMessage += "Microphone access denied.";
                break;
              case "network":
                showError = false;
                break;
              default:
                showError = false;
            }
            if (showError) {
              setVoiceError(errorMessage);
              setShowVoiceError(true);
            }
          };
          setSpeechRecognition(recognition);
        } catch (error) {
          setSpeechSupported(false);
        }
      }
    }
  }, []);

  const startListening = () => {
    if (speechRecognition && speechSupported && !isListening) {
      try {
        setIsListening(true);
        speechRecognition.start();
      } catch (error) {
        setIsListening(false);
        setVoiceError("Failed to start. Please try again.");
        setShowVoiceError(true);
      }
    }
  };

  const stopListening = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  useEffect(() => {
    return () => {
      if (speechRecognition && isListening) speechRecognition.stop();
    };
  }, [speechRecognition, isListening]);

  const EXPERT_OPTIONS = [
    { value: "default", label: "General Finance" },
    { value: "budgeting", label: "Budgeting Expert" },
    { value: "investing", label: "Investment Advisor" },
    { value: "saving", label: "Savings Specialist" },
    { value: "credit", label: "Credit Expert" },
  ];

  const quickQuestions = [
    {
      icon: PiggyBankIcon,
      text: "How much should I save each month?",
      category: "Savings",
    },
    {
      icon: TrendingUpIcon,
      text: "What's the best investment for students?",
      category: "Investing",
    },
    {
      icon: CreditCardIcon,
      text: "Should I get a credit card?",
      category: "Credit",
    },
    {
      icon: LightbulbIcon,
      text: "How do I start budgeting?",
      category: "Budgeting",
    },
  ];

  const isActive = (path) => pathname === path;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const formatTime = (value) => {
    try {
      const date = value instanceof Date ? value : new Date(value);
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    } catch (_e) {
      return "";
    }
  };

  // Actual API call for sending message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Rate-limit check: 5 seconds between messages
    const now = Date.now();
    if (now - lastRequestTime < 5000) {
      alert("Please wait a moment before asking another question.");
      return;
    }
    setLastRequestTime(now);

    if (isListening) stopListening();

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      expert: selectedExpert,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call the real AI service (backend will auto-inject user context)
      const response = await sendMessageToAI(
        inputMessage,
        null,
        selectedExpert,
      );

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: response.message || response.content,
        sender: "ai",
        expert: selectedExpert,
        timestamp: new Date(),
        sources: response.sources || [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI response error:", error);
      const errorMessage = {
        id: Date.now().toString(),
        content:
          "Sorry, I'm having trouble connecting. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick question clicks exactly like the user typed it
  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  // Handle quick actions: Quick Tip, Analyze Budget, Learning Path, Clear History
  const handleQuickAction = async (action) => {
    const now = Date.now();
    if (now - lastRequestTime < 3000 && action !== "clear") {
      alert("Please wait a moment.");
      return;
    }
    setLastRequestTime(now);

    setIsLoading(true);
    try {
      switch (action) {
        case "tip": {
          const result = await getQuickTip();
          const tipMessage = {
            id: Date.now().toString(),
            content: `💡 **Quick Tip:** ${result.tip}`,
            sender: "ai",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, tipMessage]);
          break;
        }
        case "budget":
          // In a real app you'd pass actual budget data, here we simulate
          const budgetData = {
            totalIncome: 10000,
            expenses: { food: 3000, travel: 1000, rent: 4000 },
            savingsRate: 20,
          };
          const analysis = await analyzeBudgetService(budgetData);
          const analysisMessage = {
            id: Date.now().toString(),
            content: analysis.analysis,
            sender: "ai",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, analysisMessage]);
          break;
        case "learning": {
          const learning = await getLearningPathService();
          const learningMessage = {
            id: Date.now().toString(),
            content: learning.recommendations,
            sender: "ai",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, learningMessage]);
          break;
        }
        case "clear":
          setMessages([messages[0]]);
          break;
        default:
          break;
      }
    } catch (error) {
      const errMsg = {
        id: Date.now().toString(),
        content: "Could not fetch this right now. Try again later.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-12">
        {/* Header */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 no-underline"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
                >
                  <span className="text-white font-bold text-sm">F</span>
                </motion.div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FinWise
                </span>
              </Link>

              <nav className="flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className={`${isActive("/dashboard") ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"} transition-colors no-underline`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/budget-planner"
                  className={`${isActive("/budget-planner") ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"} transition-colors no-underline`}
                >
                  Budget
                </Link>
                <Link
                  href="/goals"
                  className={`${isActive("/goals") ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"} transition-colors no-underline`}
                >
                  Goals
                </Link>
                <Link
                  href="/qna"
                  className={`${isActive("/qna") ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"} transition-colors no-underline`}
                >
                  Q&A
                </Link>
                <Link
                  href="/mentor"
                  className={`${isActive("/mentor") ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"} transition-colors no-underline`}
                >
                  AI Mentor
                </Link>
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  <LogOut size={20} />
                </button>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? (
                    <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <SunIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              </nav>
            </div>
          </header>
        </motion.div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              AI Financial Mentor 🤖
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Get personalized financial advice tailored for students
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => handleQuickAction("tip")}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Quick Tip
            </button>
            <button
              onClick={() => handleQuickAction("budget")}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Analyze My Budget
            </button>
            <button
              onClick={() => handleQuickAction("learning")}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Learning Path
            </button>
            <button
              onClick={() => handleQuickAction("clear")}
              disabled={isLoading}
              className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
            >
              Clear History
            </button>
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && messages[0].id === "welcome" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Questions to Get Started
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question.text)}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <question.icon className="text-blue-600 dark:text-blue-400 mt-1" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {question.text}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {question.category}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="h-96 overflow-y-auto p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"} rounded-lg p-4`}
                    >
                      {message.sender === "ai" ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <BotIcon className="text-white text-sm" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {message.expert
                                  ? EXPERT_OPTIONS.find(
                                      (e) => e.value === message.expert,
                                    )?.label || "AI Assistant"
                                  : "AI Assistant"}
                              </div>
                              {message.expert && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                  {message.expert.replace("-", " ")}
                                </span>
                              )}
                            </div>
                            {isMounted && message.timestamp && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                                {formatTime(message.timestamp)}
                              </span>
                            )}
                          </div>

                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ node, ...props }) => (
                                    <h1
                                      className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3"
                                      {...props}
                                    />
                                  ),
                                  h2: ({ node, ...props }) => (
                                    <h2
                                      className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
                                      {...props}
                                    />
                                  ),
                                  h3: ({ node, ...props }) => (
                                    <h3
                                      className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2"
                                      {...props}
                                    />
                                  ),
                                  p: ({ node, ...props }) => (
                                    <p
                                      className="text-gray-800 dark:text-gray-200 mb-3 leading-relaxed"
                                      {...props}
                                    />
                                  ),
                                  ul: ({ node, ...props }) => (
                                    <ul
                                      className="text-gray-800 dark:text-gray-200 mb-3 space-y-1"
                                      {...props}
                                    />
                                  ),
                                  ol: ({ node, ...props }) => (
                                    <ol
                                      className="text-gray-800 dark:text-gray-200 mb-3 space-y-1"
                                      {...props}
                                    />
                                  ),
                                  li: ({ node, ...props }) => (
                                    <li
                                      className="text-gray-800 dark:text-gray-200"
                                      {...props}
                                    />
                                  ),
                                  strong: ({ node, ...props }) => (
                                    <strong
                                      className="font-semibold text-gray-900 dark:text-gray-100"
                                      {...props}
                                    />
                                  ),
                                  code: ({ node, ...props }) => (
                                    <code
                                      className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm"
                                      {...props}
                                    />
                                  ),
                                  pre: ({ node, ...props }) => (
                                    <pre
                                      className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-4 rounded-lg overflow-x-auto mb-3"
                                      {...props}
                                    />
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>

                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Sources ({message.sources.length})
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {message.sources.map((source, index) => (
                                    <div
                                      key={index}
                                      className="p-2 bg-gray-50 dark:bg-gray-600 rounded border"
                                    >
                                      <a
                                        href={source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm block mb-1"
                                      >
                                        {source}
                                      </a>
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <LinkIcon className="w-3 h-3" />
                                        {new URL(source).hostname.replace(
                                          "www.",
                                          "",
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <UserIcon className="text-white/80 mt-1" />
                          <div className="flex-1">
                            <div className="whitespace-pre-wrap">
                              {message.content}
                            </div>
                            <div className="text-white/70 text-xs mt-2">
                              {isMounted ? formatTime(message.timestamp) : ""}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <BotIcon className="text-blue-600 dark:text-blue-400" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-3 mb-3">
              <select
                value={selectedExpert}
                onChange={(e) => setSelectedExpert(e.target.value)}
                disabled={isLoading}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-w-48"
              >
                {EXPERT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Ask me anything about personal finance..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded transition-all ${
                      isListening
                        ? "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 animate-pulse"
                        : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? (
                      <MicOffIcon className="w-5 h-5" />
                    ) : (
                      <MicIcon className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>

              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <SendIcon className="w-5 h-5" />
                )}
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-500 dark:text-gray-400">
                💡 Tip: Ask specific questions like "How much should I save for
                an emergency fund?" for better advice
              </div>
              {speechSupported && (
                <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MicIcon style={{ fontSize: "1rem" }} />
                  <p className="text-xs">
                    {isListening ? "Listening..." : "Click mic to speak"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showVoiceError && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{voiceError}</span>
              <button
                onClick={() => setShowVoiceError(false)}
                className="ml-2 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
