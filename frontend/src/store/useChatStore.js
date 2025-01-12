import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { decryptMessage } from "../lib/utils";

export const useChatStore = create((set,get) => ({
    messages:[],
    users:[],
    selectedUser:null,
    isUserLoading:false,
    isMessagesLoading:false,

    getUsers: async () =>{
        set({isUserLoading:true});
        try {
            const res = await axiosInstance.get("/message/users");
            set({users:res.data})
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({isUserLoading:false});
        }
    },

    getMessages: async(userId) =>{
        set({isMessagesLoading:true});
        try {
            const res = await axiosInstance.get(`/message/${userId}`);
            const privateKey = localStorage.getItem('privateKey');
            const decryptedMessages = await Promise.all(res.data.map(async message => {
                try {
                    const decryptedText = await decryptMessage(
                        message.encryptedText,
                        JSON.parse(privateKey)
                    );
                    return { ...message, text: decryptedText };
                } catch (error) {
                    console.error('Decryption failed:', error);
                    return { ...message, text: '[Failed to decrypt message]' };
                }
            }))
            set({messages:decryptedMessages})
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({isMessagesLoading:false});
        }
    },

    sendMessage: async (messageData) =>{
        const {selectedUser,messages}= get();
        try {
           const res = await axiosInstance.post(`/message/send/${selectedUser._id}`,messageData);

           set({messages:[...messages,res.data]}); 
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    subscribeToMessages: () =>{
        const {selectedUser} = get()
        if(!selectedUser) return;
        
        const socket = useAuthStore.getState().socket;

        socket.on("newMessage",(newMessage)=>{
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if(!isMessageSentFromSelectedUser) return;

            set({
                messages:[...get().messages,newMessage],
            })
        })
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },



    setSelectedUser: (selectedUser) => set({selectedUser}),
}))