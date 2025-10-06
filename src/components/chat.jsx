'use client'

import { useState, useRef, useEffect } from 'react';
import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { useSearchParams } from 'next/navigation';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your actual API key
});

export default function Chatbox({currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const chatId = useSearchParams().get("chatId");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages when component mounts
  useEffect(() => {
    loadMessages();
  }, [chatId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update input value with final transcript
          if (finalTranscript) {
            setInputValue(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access in your browser settings.');
          } else if (event.error === 'no-speech') {
            // Silently handle no speech detected
          } else {
            alert(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages?chatId=${chatId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      console.log(data)
      setMessages(data.messages.map(message => {
        return {
          senderId: message.authorId,
          text: message.content,
          createdAt: message.createdAt
        }
      }) || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || sending) {
      return;
    }

    const messageText = inputValue.trim();
    const tempId = Date.now(); // Temporary ID for optimistic update
    
    // Optimistic update - add message immediately to UI
    const optimisticMessage = {
      id: tempId,
      text: messageText,
      sender: "user",
      senderId: currentUserId,
      timestamp: new Date(),
      chatId: chatId,
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setInputValue('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      setSending(true);
      
      // Send message to API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          text: messageText,
          senderId: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Replace optimistic message with real message from server
      const realMessage = {
        senderId: data.message.authorId,
        text: data.message.content,
        createdAt: data.message.createdAt
      }
      setMessages(prev => 
        prev.map(msg => msg.id === tempId ? realMessage : msg)
      );
      
      //await sendToAi(realMessage.text);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setInputValue(messageText); // Restore the input
      
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const sendToAi = async (userText) => {
    const { text } = await generateText({
      model: openai("gpt-5"),
      prompt: userText,
    });

    const optimisticMessage = {
      id: Date.now(),
      text: text,
      sender: "aiUser",
      senderId: "1",
      timestamp: new Date(),
      chatId: chatId,
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              JD
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">John Doe</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active now</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.senderId === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === currentUserId
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp || message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-end space-x-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
              disabled={sending}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden transition-colors disabled:opacity-50"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            
            {/* Microphone Button */}
            {speechSupported && (
              <button
                onClick={toggleSpeechRecognition}
                disabled={sending}
                className={`px-3 py-2 rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                  />
                </svg>
              </button>
            )}
            
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className={`px-4 py-2 rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${
                inputValue.trim() && !sending
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Press Enter to send, Shift+Enter for new line
            {speechSupported && (
              <span className="ml-2">
                • {isListening ? '🔴 Recording...' : 'Click mic to voice input'}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}