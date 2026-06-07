import React from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { 
  MessageSquare, Send, Tag, 
  RefreshCw, CheckCircle, ArrowLeft, Heart 
} from 'lucide-react';

export const Chat: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const location = useLocation();

  const [threads, setThreads] = React.useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [newMessageText, setNewMessageText] = React.useState('');
  const [isLoadingThreads, setIsLoadingThreads] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [showMobileList, setShowMobileList] = React.useState(true);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Retrieve thread ID passed in from redirect state
  React.useEffect(() => {
    const state = location.state as { activeThreadId?: string } | null;
    if (state?.activeThreadId) {
      setActiveThreadId(state.activeThreadId);
      setShowMobileList(false);
    }
  }, [location.state]);

  // Ensure socket is connected
  React.useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
    }
  }, [user]);

  // Fetch threads
  const fetchThreads = async (selectFirst = false) => {
    try {
      setIsLoadingThreads(true);
      const res = await api.get('/chats/threads');
      setThreads(res.data.threads);

      // If requested, select first thread automatically on desktop
      if (selectFirst && res.data.threads.length > 0 && !activeThreadId) {
        if (window.innerWidth >= 768) {
          setActiveThreadId(res.data.threads[0]._id);
          setShowMobileList(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat threads', err);
      addToast('Failed to load conversations', 'error');
    } finally {
      setIsLoadingThreads(false);
    }
  };

  React.useEffect(() => {
    fetchThreads(true);
  }, []);

  // Fetch messages when activeThreadId changes
  const fetchMessages = async () => {
    if (!activeThreadId) return;
    try {
      setIsLoadingMessages(true);
      const res = await api.get(`/chats/threads/${activeThreadId}/messages`);
      setMessages(res.data.messages);
      
      // Mark read locally on selection list
      setThreads(prev => 
        prev.map(t => t._id === activeThreadId ? { ...t, lastMessage: t.lastMessage, isRead: true } : t)
      );
    } catch (err) {
      console.error('Failed to fetch messages', err);
      addToast('Failed to load message history', 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  React.useEffect(() => {
    fetchMessages();
  }, [activeThreadId]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time socket message handler
  React.useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data: { threadId: string; message: any }) => {
      // If message is for the currently active thread
      if (data.threadId === activeThreadId) {
        setMessages(prev => [...prev, data.message]);
        // Call read confirmation endpoint or let state reflect it
        api.get(`/chats/threads/${activeThreadId}/messages`).catch(() => {});
      } else {
        // Find if thread already exists
        const exists = threads.some(t => t._id === data.threadId);
        if (!exists) {
          // Re-fetch threads list to get the new thread
          fetchThreads(false);
        }
      }

      // Update thread last message in list
      setThreads(prev => {
        const updated = prev.map(t => {
          if (t._id === data.threadId) {
            return {
              ...t,
              lastMessage: data.message.message,
              lastMessageAt: data.message.createdAt,
              isRead: data.threadId === activeThreadId // if active, it's read
            };
          }
          return t;
        });
        // Sort by last message date descending
        return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [activeThreadId, threads]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !newMessageText.trim()) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');
    setIsSending(true);

    try {
      const res = await api.post('/chats/messages', {
        threadId: activeThreadId,
        message: textToSend
      });

      const messageObj = res.data.message;
      setMessages(prev => [...prev, messageObj]);

      // Update threads list
      setThreads(prev => {
        const updated = prev.map(t => {
          if (t._id === activeThreadId) {
            return {
              ...t,
              lastMessage: textToSend,
              lastMessageAt: messageObj.createdAt,
              isRead: true
            };
          }
          return t;
        });
        return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });

    } catch (err) {
      console.error('Failed to send message', err);
      addToast('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const activeThread = threads.find(t => t._id === activeThreadId);
  const otherParticipant = activeThread?.participants.find(
    (p: any) => p._id !== user?.id && p !== user?.id
  );

  const getListingImage = (listing: any) => {
    if (listing?.images && listing.images.length > 0) {
      return listing.images[0];
    }
    return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=120&auto=format&fit=crop&q=60';
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 md:px-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex-grow flex bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden min-h-[500px]">
        
        {/* Left Pane: Threads list */}
        <div className={`w-full md:w-80 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/50
          ${!showMobileList ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 bg-white">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary-600" />
              Conversations
            </h2>
          </div>

          <div className="flex-grow overflow-y-auto divide-y divide-slate-100/50">
            {isLoadingThreads ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                <span className="text-xs text-slate-400">Loading chat threads...</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-3">
                <MessageSquare size={24} className="stroke-1" />
                <p className="text-xs">No chats active. Find school items in the feed to start a swap discussion!</p>
              </div>
            ) : (
              threads.map((thread) => {
                const partner = thread.participants.find((p: any) => p._id !== user?.id && p !== user?.id);
                const listing = thread.listingId;
                const isSelected = thread._id === activeThreadId;

                return (
                  <button
                    key={thread._id}
                    onClick={() => {
                      setActiveThreadId(thread._id);
                      setShowMobileList(false);
                    }}
                    className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors touch-target
                      ${isSelected ? 'bg-primary-50/70 border-l-4 border-primary-600' : 'bg-transparent hover:bg-slate-100/50'}`}
                  >
                    <img
                      src={getListingImage(listing)}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover bg-slate-200 flex-shrink-0 border border-slate-200"
                    />
                    <div className="flex-grow min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate text-sm">
                          {partner?.displayName || 'Parent'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        {listing?.title || 'Unknown Supply'}
                      </span>
                      <span className="text-xs text-slate-400 truncate font-light">
                        {thread.lastMessage || 'No messages yet'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Message window */}
        <div className={`flex-grow flex flex-col bg-white
          ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
          {activeThreadId && activeThread ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20">
                <button 
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-1 hover:bg-slate-100 rounded-lg"
                >
                  <ArrowLeft size={20} className="text-slate-600" />
                </button>
                
                <div className="flex-grow flex items-center gap-3 min-w-0">
                  <img
                    src={getListingImage(activeThread.listingId)}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover bg-slate-200 flex-shrink-0 border border-slate-100"
                  />
                  <div className="flex-col min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate flex items-center gap-1">
                      {otherParticipant?.displayName || 'SchoolSwap Member'}
                      {otherParticipant?.isNgo && (
                        <CheckCircle size={14} className="text-primary-600 fill-primary-50" />
                      )}
                    </h3>
                    {activeThread.listingId && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate mt-0.5">
                        <span className="truncate max-w-[120px] sm:max-w-[200px]">{activeThread.listingId.title}</span>
                        <span>•</span>
                        {activeThread.listingId.mode === 'sell' && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                            <Tag size={10} />
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(activeThread.listingId.pricePaise / 100)}
                          </span>
                        )}
                        {activeThread.listingId.mode === 'barter' && (
                          <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                            <RefreshCw size={10} /> Swap
                          </span>
                        )}
                        {activeThread.listingId.mode === 'free' && (
                          <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                            <Heart size={10} className="fill-blue-50" /> Free
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat bubbles container */}
              <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/20">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    <span className="text-xs text-slate-400">Loading messages...</span>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                        >
                          <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                            ${isMe 
                              ? 'bg-primary-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Bottom message input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
                <Input
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow mb-0 text-sm py-2 px-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 shadow-md touch-target"
                  disabled={!newMessageText.trim() || isSending}
                >
                  <Send size={16} />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 gap-4 bg-slate-50/10">
              <div className="bg-primary-50 p-4 rounded-full text-primary-400">
                <MessageSquare size={36} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Select a Conversation</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Choose a parent's listing chat from the left column to read messages and negotiate swap terms.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
