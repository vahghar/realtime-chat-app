import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { decryptMessage } from "../lib/utils";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUserLoading: false,
    isMessagesLoading: false,

    getUsers: async () => {
        set({ isUserLoading: true });
        try {
            const res = await axiosInstance.get("/message/users");
            set({ users: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch users");
        } finally {
            set({ isUserLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/message/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser } = get();
        const { authUser } = useAuthStore.getState();

        const tempId = `temp_${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text,
            image: messageData.image ? URL.createObjectURL(new Blob([messageData.image])) : null,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };
        console.log("Creating optimistic message:", optimisticMessage); // <-- ADD THIS LINE

        set(state => ({ messages: [...state.messages, optimisticMessage] }));

        try {
            const res = await axiosInstance.post(`/message/send/${selectedUser._id}`, messageData);
            const savedMessage = res.data;

            set(state => ({
                messages: state.messages.map(msg =>
                    msg._id === tempId ? { ...savedMessage, text: messageData.text } : msg
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
            set(state => ({ messages: state.messages.filter(msg => msg._id !== tempId) }));
        }
    },

    subscribeToMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        console.log("Subscribing to 'newMessage' events...");
        socket.on("newMessage", async (newMessage) => {
            console.log("Received 'newMessage' event:", newMessage);
            const { selectedUser } = get();
            const privateKey = localStorage.getItem('privateKey');
            console.log(`Is this message from the selected user? Sender: ${newMessage.senderId}, Selected: ${selectedUser?._id}`);
            if (newMessage.senderId === selectedUser?._id) {
                console.log("Message is for the selected user. Decrypting...");
                try {
                    const decryptedText = await decryptMessage(
                        newMessage.encryptedText,
                        JSON.parse(privateKey)
                    );
                    const decryptedMessage = { ...newMessage, text: decryptedText };
                    set(state => ({ messages: [...state.messages, decryptedMessage] }));
                } catch (error) {
                    console.error('Failed to decrypt incoming message:', error);
                    set(state => ({ messages: [...state.messages, { ...newMessage, text: "[Decryption Failed]" }] }));
                }
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (socket) {
            socket.off("newMessage");
        }
    },

    setSelectedUser: (selectedUser) => set({ selectedUser, messages: [] }),
}));