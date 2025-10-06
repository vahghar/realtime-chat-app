import axios from "axios"

const BASE_URL = process.env.VITE_API_URL;


export const axiosInstance = axios.create({
    baseURL: `${BASE_URL}/api`,
    withCredentials: true,
});