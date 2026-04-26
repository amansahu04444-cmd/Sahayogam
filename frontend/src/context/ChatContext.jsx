import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { auth, db } from '../config/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  limit,
} from 'firebase/firestore'
import { chatAPI } from '../services/api'
import { useAuth } from './AuthContext'

const ChatContext = createContext()

export const ChatProvider = ({ children }) => {
  const { user: currentUser } = useAuth()
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [unreadPerChat, setUnreadPerChat] = useState({})
  const unsubscribeMessagesRef = useRef(null)
  const selectedChatIdRef = useRef(null)

  // ── Fetch chat list (real-time) ─────────────────────────────────
  const fetchChats = useCallback(() => {
    if (!(currentUser?.uid || currentUser?.id)) return () => {}

    setIsLoadingChats(true)

    // Role-based query: NGO sees chats where ngoId === uid, Volunteer sees volunteerId === uid
    const roleField = currentUser.role === 'ngo' ? 'ngoId' : 'volunteerId'

    const chatsRef = collection(db, 'chats')
    const q = query(
      chatsRef,
      where(roleField, '==', (currentUser?.uid || currentUser?.id)),
      limit(50)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let chatsList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            ...data,
            // Resolve partner name
            partnerName:
              currentUser.role === 'ngo'
                ? data.volunteerName || 'Volunteer'
                : data.ngoName || 'NGO',
            partnerId:
              currentUser.role === 'ngo'
                ? data.volunteerId
                : data.ngoId,
            lastMessage: data.lastMessage || 'No messages yet',
            updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
          }
        })

        // Sort in memory by updatedAt descending
        chatsList.sort((a, b) => b.updatedAt - a.updatedAt)

        setChats(chatsList)
        setIsLoadingChats(false)
      },
      (err) => {
        console.error('[ChatContext] Error fetching chats:', err.message)
        setIsLoadingChats(false)
      }
    )

    return unsubscribe
  }, [(currentUser?.uid || currentUser?.id), currentUser?.role])

  // ── Set up chat list listener when currentUser changes ───────────
  useEffect(() => {
    if (!(currentUser?.uid || currentUser?.id)) return

    const unsubscribe = fetchChats()
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [(currentUser?.uid || currentUser?.id), currentUser?.role, fetchChats])

  // ── Load messages for a selected chat (real-time) ─────────────────
  const loadMessages = useCallback(
    async (chatId) => {
      if (!chatId) return

      // Clean up previous listener
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current()
        unsubscribeMessagesRef.current = null
      }

      setIsLoadingMessages(true)
      setMessages([])

      try {
        const messagesRef = collection(db, 'messages')
        const q = query(
          messagesRef,
          where('chatId', '==', chatId),
          limit(100)
        )

        unsubscribeMessagesRef.current = onSnapshot(
          q,
          (snapshot) => {
            let msgs = snapshot.docs.map((docSnap) => {
              const data = docSnap.data()
              return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
                isOwn: data.senderId === (currentUser?.uid || currentUser?.id),
              }
            })

            // Sort in memory by createdAt ascending
            msgs.sort((a, b) => a.createdAt - b.createdAt)

            setMessages(msgs)
            setIsLoadingMessages(false)
          },
          (err) => {
            console.error('[ChatContext] Error loading messages:', err.message)
            setIsLoadingMessages(false)
          }
        )
      } catch (err) {
        console.error('[ChatContext] Error setting up messages listener:', err.message)
        setIsLoadingMessages(false)
      }
    },
    [(currentUser?.uid || currentUser?.id)]
  )

  // ── Select a chat ────────────────────────────────────────────────
  const selectChat = useCallback(
    async (chat) => {
      if (!chat?.id) return

      // Prevent redundant loads
      if (selectedChatIdRef.current === chat.id) return
      selectedChatIdRef.current = chat.id

      setSelectedChat(chat)

      // Clear unread badge for this chat (locally)
      setUnreadPerChat((prev) => ({ ...prev, [chat.id]: 0 }))

      // Mark messages in this chat as read in Firestore
      markChatMessagesAsRead(chat.id)

      await loadMessages(chat.id)
    },
    [loadMessages]
  )

  // ── Clear selected chat ──────────────────────────────────────────
  const clearChat = useCallback(() => {
    selectedChatIdRef.current = null
    setSelectedChat(null)
    setMessages([])
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current()
      unsubscribeMessagesRef.current = null
    }
  }, [])

  // ── Mark all messages in a chat as read ─────────────────────────
  const markChatMessagesAsRead = async (chatId) => {
    if (!chatId || !(currentUser?.uid || currentUser?.id)) return

    try {
      const messagesRef = collection(db, 'messages')
      const q = query(
        messagesRef,
        where('chatId', '==', chatId),
        where('receiverId', '==', (currentUser?.uid || currentUser?.id)),
        where('isRead', '==', false)
      )

      const snapshot = await getDocs(q)
      const updatePromises = snapshot.docs.map(async (docSnap) => {
        await updateDoc(doc(db, 'messages', docSnap.id), { isRead: true })
      })

      await Promise.all(updatePromises)
    } catch (err) {
      console.warn('[ChatContext] Could not mark messages as read:', err.message)
    }
  }

  // ── Send a message ───────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text, receiverId, receiverRole) => {
      if (!text?.trim() || !(currentUser?.uid || currentUser?.id)) return

      const trimmedText = text.trim()

      try {
        // 1. Determine chatId (reuse existing or prepare new)
        let chatId = selectedChat?.id

        if (!chatId) {
          // Need to find or create a chat document
          const roleField = currentUser.role === 'ngo' ? 'ngoId' : 'volunteerId'
          const partnerField = currentUser.role === 'ngo' ? 'volunteerId' : 'ngoId'

          const chatsRef = collection(db, 'chats')
          const q = query(
            chatsRef,
            where(roleField, '==', (currentUser?.uid || currentUser?.id)),
            where(partnerField, '==', receiverId)
          )

          const existing = await getDocs(q)
          if (!existing.empty) {
            chatId = existing.docs[0].id
          }
        }

        // 2. Send message via backend API
        const response = await chatAPI.sendMessage(chatId, {
          message: trimmedText,
          receiverId,
          receiverRole
        });

        return response.data?.data?.id;
      } catch (err) {
        console.error('[ChatContext] Error sending message:', err.message)
        throw err
      }
    },
    [currentUser, selectedChat]
  )

  // ── Start or resume a chat with a specific user ─────────────────
  const openChatWith = useCallback(
    async (partnerId, partnerName, partnerRole) => {
      if (!(currentUser?.uid || currentUser?.id) || !partnerId) return

      try {
        const roleField = currentUser.role === 'ngo' ? 'ngoId' : 'volunteerId'
        const partnerField = currentUser.role === 'ngo' ? 'volunteerId' : 'ngoId'

        // Check if chat already exists
        const chatsRef = collection(db, 'chats')
        const q = query(
          chatsRef,
          where(roleField, '==', (currentUser?.uid || currentUser?.id)),
          where(partnerField, '==', partnerId)
        )

        const existing = await getDocs(q)
        let chatId

        if (existing.empty) {
          // Create new chat
          const newChat = {
            [roleField]: (currentUser?.uid || currentUser?.id),
            [partnerField]: partnerId,
            ngoName: currentUser.role === 'ngo' ? currentUser.name : partnerName,
            volunteerName: currentUser.role === 'ngo' ? partnerName : currentUser.name,
            lastMessage: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          const ref = await addDoc(collection(db, 'chats'), newChat)
          chatId = ref.id
        } else {
          chatId = existing.docs[0].id
        }

        // Load the chat
        const chatDoc = await getDoc(doc(db, 'chats', chatId))
        if (chatDoc.exists()) {
          const chatData = {
            id: chatDoc.id,
            ...chatDoc.data(),
            partnerName,
            partnerId,
            updatedAt: chatDoc.data().updatedAt?.toDate?.() || new Date(),
          }
          await selectChat(chatData)
        }
      } catch (err) {
        console.error('[ChatContext] Error opening chat:', err.message)
      }
    },
    [currentUser, selectChat]
  )

  // ── Get or create a task-based chat ──────────────────────────────
  const getOrCreateTaskChat = useCallback(
    async (taskId, ngoId, ngoName, volunteerId, volunteerName, taskTitle) => {
      if (!taskId || !ngoId || !volunteerId) {
        console.error('[ChatContext] Missing required task chat parameters')
        return null
      }

      try {
        // Query for existing task chat by taskId, ngoId, and volunteerId
        const chatsRef = collection(db, 'chats')
        const q = query(
          chatsRef,
          where('taskId', '==', taskId),
          where('ngoId', '==', ngoId),
          where('volunteerId', '==', volunteerId)
        )

        const existing = await getDocs(q)
        let chatId, chatData

        if (!existing.empty) {
          // Chat already exists, reuse it
          chatId = existing.docs[0].id
          const docData = existing.docs[0].data()
          chatData = {
            id: chatId,
            ...docData,
            partnerName:
              currentUser.role === 'ngo' ? docData.volunteerName : docData.ngoName,
            partnerId: currentUser.role === 'ngo' ? docData.volunteerId : docData.ngoId,
            updatedAt: docData.updatedAt?.toDate?.() || new Date(),
          }
        } else {
          // Create new task-based chat
          const newChat = {
            taskId,
            taskTitle: taskTitle || 'Task',
            ngoId,
            ngoName,
            volunteerId,
            volunteerName,
            lastMessage: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }

          const ref = await addDoc(collection(db, 'chats'), newChat)
          chatId = ref.id

          chatData = {
            id: chatId,
            ...newChat,
            partnerName:
              currentUser.role === 'ngo' ? newChat.volunteerName : newChat.ngoName,
            partnerId: currentUser.role === 'ngo' ? newChat.volunteerId : newChat.ngoId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }

        return chatData
      } catch (err) {
        console.error('[ChatContext] Error in getOrCreateTaskChat:', err.message)
        throw err
      }
    },
    [currentUser]
  )

  // ── Cleanup messages listener on unmount ─────────────────────────
  useEffect(() => {
    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current()
      }
    }
  }, [])

  // ── Delete a chat ────────────────────────────────────────────────
  const deleteChat = useCallback(
    async (chatId) => {
      if (!chatId) return

      try {
        await chatAPI.deleteChat(chatId)
        
        // Update local state: remove from chats list
        setChats((prev) => prev.filter((c) => c.id !== chatId))
        
        // If the deleted chat was selected, clear it
        if (selectedChatIdRef.current === chatId) {
          clearChat()
        }
      } catch (err) {
        console.error('[ChatContext] Error deleting chat:', err.message)
        throw err
      }
    },
    [clearChat]
  )

  const value = {
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
    getOrCreateTaskChat,
    setSelectedChat,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export default ChatContext
