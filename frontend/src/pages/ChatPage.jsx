import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'




const ChatPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    chats,
    selectedChat,
    messages,
    isLoadingChats,
    isLoadingMessages,
    selectChat,
    clearChat,
    sendMessage,
    deleteChat,
    openChatWith,
  } = useChat()


  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef(null)
  const chatListRef = useRef(null)

  // ── Auto-open chat from notification navigation ─────────────────
  useEffect(() => {
    const state = location.state
    if (!state) return

    // Prevent multiple executions by tracking initialization
    if (window._chatInitialized === state.selectedChatId || 
        window._chatInitialized === state.openChatWith?.partnerId) {
      return
    }

    // Handle notification navigation or direct chat opening
    if (state?.selectedChatId) {
      if (state.chatData) {
        selectChat(state.chatData)
        window._chatInitialized = state.selectedChatId
      } else {
        const chat = chats.find((c) => c.id === state.selectedChatId)
        if (chat) {
          selectChat(chat)
          window._chatInitialized = state.selectedChatId
        } else {
          // If not found yet, maybe it's still loading
          const timer = setTimeout(() => {
            const found = chats.find((c) => c.id === state.selectedChatId)
            if (found) {
              selectChat(found)
              window._chatInitialized = state.selectedChatId
            }
          }, 1500)
          return () => clearTimeout(timer)
        }
      }
    }

    // Handle "message volunteer" navigation from task cards
    if (state?.openChatWith) {
      const { partnerId, partnerName, partnerRole } = state.openChatWith
      openChatWith(partnerId, partnerName, partnerRole)
      window._chatInitialized = partnerId
    }
  }, [location.state, chats, selectChat, openChatWith])

  // ── Clear selectedChat when navigating back ─────────────────────
  const handleBack = () => {
    clearChat()
    navigate(-1)
  }

  // ── Auto-scroll to latest message ─────────────────────────────────
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // ── Send message ──────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault()
    if (!messageText.trim() || isSending) return

    const text = messageText
    setMessageText('')
    setIsSending(true)

    try {
      // If we have a selected chat, use the partner info
      if (selectedChat) {
        await sendMessage(
          text,
          selectedChat.partnerId,
          user.role === 'ngo' ? 'volunteer' : 'ngo'
        )
      }
    } catch (err) {
      console.error('[ChatPage] Send error:', err.message)
      setMessageText(text) // Restore on failure
    } finally {
      setIsSending(false)
    }
  }

  // ── Delete chat ──────────────────────────────────────────────────
  const handleDeleteChat = async () => {
    if (!selectedChat) return
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete your conversation with ${selectedChat.partnerName}? This will permanently delete all messages.`
    )
    
    if (!confirmDelete) return

    try {
      await deleteChat(selectedChat.id)
      // clearChat is called inside context's deleteChat
    } catch (err) {
      alert('Failed to delete chat: ' + err.message)
    }
  }


  // ── Filter chats by search ─────────────────────────────────────────
  const filteredChats = chats.filter((chat) =>
    chat.partnerName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Format timestamp ───────────────────────────────────────────────
  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex h-[calc(100vh-1px)] bg-black">
      {/* ── Chat List Panel ── */}
      <div
        className={`w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col ${
          selectedChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-brand-500" />
              <h1 className="text-lg font-bold text-zinc-50">Messages</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 text-zinc-50 placeholder-zinc-500 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Chat List */}
        <div ref={chatListRef} className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <MessageCircle className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-zinc-400 font-medium">No conversations yet</p>
              <p className="text-sm text-zinc-500 mt-1">
                Start chatting from a task or profile
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-900/50 transition-colors text-left border-b border-zinc-800/50 ${
                  selectedChat?.id === chat.id ? 'bg-zinc-900' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center mt-0.5">
                  <span className="text-sm font-semibold text-brand-500">
                    {chat.partnerName?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-semibold text-zinc-50 truncate">
                      {chat.partnerName}
                    </span>
                    <span className="text-xs text-zinc-500 whitespace-nowrap ml-2">
                      {formatTime(chat.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div
        className={`flex-1 flex flex-col ${
          selectedChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
              {/* Back button (mobile) */}
              <button
                onClick={() => clearChat()}
                className="md:hidden p-2 text-zinc-400 hover:text-zinc-50 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-brand-500">
                  {selectedChat.partnerName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-50 truncate">
                  {selectedChat.partnerName}
                </p>
                <p className="text-xs text-zinc-500">Active now</p>
              </div>

              {/* Delete Button */}
              <button
                onClick={handleDeleteChat}
                className="p-2 text-zinc-500 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-all group"
                title="Delete Chat"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-10 h-10 text-zinc-700 mb-3" />
                  <p className="text-zinc-400">No messages yet</p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Send the first message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[11px] text-zinc-500 mb-1 px-1">
                      {msg.isOwn ? 'You' : selectedChat.partnerName}
                    </span>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.isOwn
                          ? 'bg-brand-600 text-white rounded-br-md'
                          : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <div
                        className={`text-[10px] mt-1 ${
                          msg.isOwn ? 'text-brand-200' : 'text-zinc-500'
                        }`}
                      >
                        {msg.createdAt
                          ? formatTime(msg.createdAt)
                          : 'sending...'}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-zinc-800 bg-zinc-950"
            >
              <div className="flex items-end gap-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend(e)
                    }
                  }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-zinc-900 text-zinc-50 placeholder-zinc-500 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="p-3 bg-brand-600 text-white rounded-2xl hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Empty state when no chat selected */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageCircle className="w-16 h-16 text-zinc-800 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">
              Select a conversation
            </h2>
            <p className="text-zinc-500 max-w-sm">
              Choose a chat from the list to start messaging, or message someone
              from their profile.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage
