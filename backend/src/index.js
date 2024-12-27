import express from "express"
import authRoutes from "./routes/auth.route.js"
import dotenv from "dotenv"
import { connectDb } from "./lib/dbConnect.js";
import cookieParser from "cookie-parser"

dotenv.config()
const app = express(); 
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.send("Hello welcome to real time chat app");
});

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRoutes)

app.listen(PORT,()=>{
    console.log("server is running on port 5001")
    connectDb();
})