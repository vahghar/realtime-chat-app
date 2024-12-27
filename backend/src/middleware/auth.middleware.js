import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import cookieParser from 'cookie-parser';


export const protectedRoute = async (req,res,next) =>{
    try {
        const token = req.cookies.jwt;
        
        if(!token){
            return res.status(401).json({message:"Unauthorized"})
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET);

        if(!decoded){
            return res.status(401).json({message:"Unauthorized, Invalid token"})
        }

        const user = await User.findById(decoded.userId).select("-password");

        if(!user){
            return res.status(404).json({message:"Unauthorized, User not found"})
        }

        req.user = user;
        next();

    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"}) 
    }
}