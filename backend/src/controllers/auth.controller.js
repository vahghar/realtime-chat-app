import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { generateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';
import nodemailer from "nodemailer";
import jwt from 'jsonwebtoken';
import { generateKeyPair } from '../lib/utils.js';


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

export const signup = async (req, res) => {
    const { username, email, password } = req.body;
    const { publicKey, privateKey } = await generateKeyPair();
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" })
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be atleast 6 characters long" })
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists with this email" })
        }
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            publicKey: JSON.stringify(publicKey)
        });
        if (newUser) {
            generateToken(newUser._id, res);
            await newUser.save();
            return res.status(201).json({
                _id: newUser._id, username: newUser.username, email: newUser.email, profilePic: newUser.profilePic, createdAt: newUser.createdAt,
                privateKey: JSON.stringify(privateKey)
            })
        }
        else {
            res.status(400).json({ message: "User not created" })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" })
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist with this email" })
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" })
        }
        generateToken(user._id, res);
        return res.status(200).json({ _id: user._id, username: user.username, email: user.email, profilePic: user.profilePic })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({ message: "Logged out" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const update = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;
        if (!profilePic) {
            return res.status(400).json({ message: "Please provide a profile picture" })
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true });
        res.status(200).json({ _id: updatedUser._id, username: updatedUser.username, email: updatedUser.email, profilePic: updatedUser.profilePic })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })

    }
}

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json({ _id: req.user._id, username: req.user.username, email: req.user.email, profilePic: req.user.profilePic })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

export const forgotPassLink = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: "User does not exist with this email" })
    }
    const resetToken = jwt.sign({ userId: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const reset_url = `http://localhost:5173/reset-password/${resetToken}`

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `<p>Click <a href="${reset_url}"> here</a> to reset your password.</p>
              <p>Link expires in 30 minutes.</p>`
    });

    res.status(200).json({ message: "Password reset link sent to your email" })
}

export const forgotPass = async (req, res) => {
    const {newPassword, confirmPassword} = req.body;

    if(newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(
        req.user._id, 
        { password: hashedPassword },
        { new: true } 
    );

    res.status(200).json({ success: true, message: 'Password updated successfully' });
}