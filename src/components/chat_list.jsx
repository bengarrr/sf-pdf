// components/ChatList.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatList({ currentUserId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadChats();
  }, [currentUserId]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chats?userId=${currentUserId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load chats');
      }
      
      const data = await response.json();
      setChats(data.chats || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      setCreating(true);
      setError(null);

      console.log(currentUserId);

      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          // Add other participant IDs here if needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json();
      
      // Navigate to the new chat
      router.push(`/chat?chatId=${data.chat.id}`);
      
    } catch (err) {
      setError(err.message);
      console.error('Error creating chat:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleChatClick = (chatId) => {
    router.push(`/chat?chatId=${chatId}`);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants?.find(p => p.userId !== currentUserId)?.user || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat History</h1>
            <button
              onClick={createNewChat}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : '+ New Chat'}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {chats.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No chats yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Start a conversation by creating a new chat</p>
              <button
                onClick={createNewChat}
                disabled={creating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Create New Chat
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {chats.map((chat) => {
                const otherUser = getOtherParticipant(chat);
                const lastMessage = chat.lastMessage;
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => handleChatClick(chat.id)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {otherUser?.name || 'Unknown User'}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {chat.lastMessageAt ? formatDate(chat.lastMessageAt) : formatDate(chat.createdAt)}
                          </span>
                        </div>
                        
                        {lastMessage ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {lastMessage.senderId === currentUserId && 'You: '}
                            {lastMessage.text}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            No messages yet
                          </p>
                        )}
                      </div>

                      {/* Unread indicator (optional) */}
                      {chat.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-semibold">
                            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}