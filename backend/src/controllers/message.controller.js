import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { encryptMessage, decryptMessage } from "../lib/utils.js";

export const getUsers = async (req,res) =>{
    try {
        const loggedInUserId = req.user._id;

        // Get current user's friends
        const currentUser = await User.findById(loggedInUserId)
            .populate('friends', 'username email profilePic')
            .select('friends');

        const friends = currentUser.friends || [];

        res.status(200).json(friends);
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Internal server error"})
    }
}

/*
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
*/
/*
export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user?._id;

        if (!req.user?.privateKey) {
            console.error("Private key not found in user object");
            return res.status(400).json({ message: "User authentication error" });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        // ✅ Decrypt messages before sending them
        const decryptedMessages = await Promise.all(messages.map(async (message) => {
            const messageObj = message.toObject();
            
            // Only decrypt if the message has encrypted content
            if (message.encryptedText) {
                try {
                    // NOTE: A message can only be decrypted by the *receiver's* private key.
                    // This logic will correctly decrypt messages sent TO the current user.
                    // It will fail on messages sent BY the current user (as intended),
                    // and the catch block will handle it.
                    const privateKey = JSON.parse(req.user.privateKey);
                    
                    const decryptedText = await decryptMessage(
                        message.encryptedText, 
                        privateKey
                    );
                    messageObj.text = decryptedText;
                } catch (error) {
                    console.error("Error decrypting message:", {
                        error: error.message,
                        messageId: message._id,
                    });
                    // Set the text to an error message for the frontend
                    messageObj.text = "[Failed to decrypt message]"; 
                    messageObj.error = "Could not decrypt message";
                }
            }
            
            return messageObj;
        }));

        res.status(200).json(decryptedMessages);
    } catch (error) {
        console.error("Error in getMessages:", {
            error: error.message,
            userId: req.user?._id,
        });
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user?._id;

        if (!req.user?.privateKey) {
            console.error("Private key not found in user object");
            return res.status(400).json({ message: "User authentication error" });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        const processedMessages = await Promise.all(messages.map(async (message) => {
            const messageObj = message.toObject();
            
            // ✅ ADD THIS CHECK: Only decrypt if the current user is the receiver.
            if (message.encryptedText && message.receiverId.toString() === myId.toString()) {
                try {
                    
                    console.log("Attempting to decrypt message:", message._id);
                    console.log("Private Key from req.user:", req.user.privateKey);
                    const privateKey = JSON.parse(req.user.privateKey);

                    console.log("Encrypted text:", message.encryptedText);
                    const decryptedText = await decryptMessage(
                        message.encryptedText, 
                        privateKey
                    );
                    messageObj.text = decryptedText;
                    console.log("Decryption successful for message:", message._id);
                } catch (error) {
                    console.error("DECRYPTION FAILED for message:", message._id, "Error:", error);
                    messageObj.text = "[Decryption Failed]";
                }
            }
            
            return messageObj;
        }));

        res.status(200).json(processedMessages);
    } catch (error) {
        console.error("Error in getMessages:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
*/

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user?._id;

        if (!req.user?.privateKey) {
            return res.status(400).json({ message: "User authentication error" });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        // Parse the private key once outside the loop for efficiency
        const privateKey = JSON.parse(req.user.privateKey);

        const processedMessages = await Promise.all(messages.map(async (message) => {
            const messageObj = message.toObject();
            
            try {
                // Case 1: ✅ You are the SENDER of the message
                // Decrypt the copy saved specifically for you.
                if (message.senderId.toString() === myId.toString()) {
                    if (message.encryptedTextForSender) {
                        messageObj.text = await decryptMessage(message.encryptedTextForSender, privateKey);
                    }
                } 
                // Case 2: ✅ You are the RECEIVER of the message
                // Decrypt the standard copy.
                else if (message.receiverId.toString() === myId.toString()) {
                     if (message.encryptedText) {
                        messageObj.text = await decryptMessage(message.encryptedText, privateKey);
                    }
                }
            } catch (error) {
                console.error("DECRYPTION FAILED for message:", message._id, "Error:", error);
                messageObj.text = "[Decryption Failed]";
            }
            
            return messageObj;
        }));

        res.status(200).json(processedMessages);
    } catch (error) {
        console.error("Error in getMessages:", error);
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
        const sender = req.user; 
        // Encrypt the message with receiver's public key
        const encryptedText = text ? 
            await encryptMessage(text, JSON.parse(receiver.publicKey)) : 
            "";
        const encryptedTextForSender = text ? 
            await encryptMessage(text, JSON.parse(sender.publicKey)) : 
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
            encryptedTextForSender,
            image: imageUrl,
            isEncrypted: !!text 
        });
        
        await newMessage.save();

        const messageObj = newMessage.toObject();
        messageObj.text = text;

        const receiverSocketId = getReceiverSocketId(receiverId);
        console.log(`Attempting to emit to receiver. Receiver ID: ${receiverId}, Socket ID: ${receiverSocketId}`);

        // TEMPORARY TEST: Emit test event first
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("testEvent", {test: "Socket is working", timestamp: new Date().toISOString()});
            console.log(`Test event emitted to socket: ${receiverSocketId}`);
        }

        if (receiverId && receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
            console.log(`Event "newMessage" emitted successfully to socket: ${receiverSocketId}`);
        }
        else{
            console.log(`No active socket found for receiver ID: ${receiverId}. Message will be delivered on next history fetch.`);
        }
        
        res.status(201).json(messageObj);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}