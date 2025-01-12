import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { encryptMessage} from "../lib/utils.js";

export const getUsers = async (req,res) =>{
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id:{$ne:loggedInUserId}}).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"})    
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        // Get receiver's public key
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        // Encrypt the message with receiver's public key
        const encryptedText = text ? 
            await encryptMessage(text, JSON.parse(receiver.publicKey)) : 
            "";

        let imageUrl = "";
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            encryptedText,
            image: imageUrl,
            isEncrypted: !!text 
        });
        
        await newMessage.save();

        const messageObj = newMessage.toObject();
        messageObj.text = text;

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        
        res.status(201).json(messageObj);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}