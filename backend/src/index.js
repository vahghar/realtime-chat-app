import express from "express"
import authRoutes from "./routes/auth.route.js"
import dotenv from "dotenv"
import { connectDb } from "./lib/dbConnect.js";
import cookieParser from "cookie-parser"
import messageRoutes from "./routes/message.route.js"
import cors from "cors"
import { app,server } from "./lib/socket.js";

dotenv.config()
const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
    res.send("Hello welcome to real time chat app");
});

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}
))

app.use("/api/auth", authRoutes)
app.use("/api/message", messageRoutes)

server.listen(PORT, () => {
    console.log("server is running on port 5001")
    connectDb();
})