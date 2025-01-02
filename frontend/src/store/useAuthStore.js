import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {io} from "socket.io-client"

const BASE_URL = "http://localhost:5001";

export const useAuthStore = create((set,get) => ({
    authUser:null,
    isSignUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers:[],
    isCheckingAuth: true,
    socket:null,
    
    checkAuth: async () =>{
        try {
            const res = await axiosInstance.get("/auth/check");
            set({authUser:res.data})
            get().connectSocket();
        } catch (error) {
            console.log(error)
            set({authUser:null})
        } finally{
            set({isCheckingAuth:false})
        }
    },
    signup: async (data) =>{
        set({isSignUp:true});
        try {
            const res = await axiosInstance.post("/auth/signup",data);
            toast.success("Account created successfully")
            set({authUser:res.data})
            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({isSignUp:false})
        }
    },
    logout: async () =>{
        try {
            await axiosInstance.get("/auth/logout");
            set({authUser:null})
            toast.success("Logged out successfully")
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },
    login: async (data) =>{
        set({isLoggingIn:true});
        try {
            const res = await axiosInstance.post("/auth/login",data);
            set({authUser:res.data})
            toast.success("Logged in successfully")
            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({isLoggingIn:false})
        }
    },
    updateProfile: async (data) =>{
        set({isUpdatingProfile:true});
        try {
            const res = await axiosInstance.put("/auth/update",data);
            set({authUser:res.data})
            toast.success("Profile updated successfully")
        } catch (error) {
            console.log(error)
            toast.error(error.response.data.message)
        } finally {
            set({isUpdatingProfile:false})
        }
    },
    connectSocket: () =>{
        const {authUser} = get();
        if(!authUser || get().socket?.connected) return;
        const socket = io(BASE_URL, {
            query:{
                userId:authUser._id,
            },
        });
        socket.connect();

        set({socket:socket});

        socket.on("getOnlineUsers ",(userIds)=>{
            set({onlineUsers: userIds});
        })
    },
    disconnectSocket: () => {
        if(get().socket?.connected){
            get().socket.disconnect();
        }
    },
    sendPassLink: async (email) =>{
        try {
            await axiosInstance.post("/auth/forgot-password-link", {email});
            toast.success("Password reset link sent to your email")
        } catch (error) {
            toast.error(error.response.data.message)
        }
    }
}));