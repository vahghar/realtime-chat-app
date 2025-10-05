import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    encryptedText: {  // renamed from text to encryptedText for clarity
        type: String,
    },
    encryptedTextForSender: {
        type: String,
    },
    image: {
        type: String,
    },
    isEncrypted: {    // flag to indicate if message is encrypted
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;