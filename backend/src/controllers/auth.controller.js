import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { generateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';

export const signup = async (req, res) => 
{
    const {username,email,password}=req.body;
    try {
        if(!username || !email || !password){
            return res.status(400).json({message:"Please fill all the fields"})
        }

        if(password.length<6){
            return res.status(400).json({message:"Password must be atleast 6 characters long"})
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message:"User already exists with this email"})
        }
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password,salt);
        const newUser = new User({
            username,
            email,
            password:hashedPassword
        });
        if(newUser){
            generateToken(newUser._id,res);
            await newUser.save();
            return res.status(201).json({_id:newUser._id,username:newUser.username,email:newUser.email,profilePic:newUser.profilePic,createdAt:newUser.createdAt
            })
        }
        else{
            res.status(400).json({message:"User not created"})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"})
    }
}

export const login = async (req,res) =>{
    const {email,password}=req.body;
    try {
        if(!email || !password){
            return res.status(400).json({message:"Please fill all the fields"})
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"User does not exist with this email"})
        }
        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid credentials"})
        }
        generateToken(user._id,res);
        return res.status(200).json({_id:user._id,username:user.username,email:user.email,profilePic:user.profilePic})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"})
    }
}

export const logout = (req,res) =>{
    try {
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Logged out"})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"})
    }
}

export const update = async (req,res) =>{
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;
        if(!profilePic){
            return res.status(400).json({message:"Please provide a profile picture"})
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true});
        res.status(200).json({_id:updatedUser._id,username:updatedUser.username,email:updatedUser.email,profilePic:updatedUser.profilePic})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"})
        
    }
}

export const checkAuth = async (req,res) =>{
    try {
        res.status(200).json({_id:req.user._id,username:req.user.username,email:req.user.email,profilePic:req.user.profilePic})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"})
    }
}