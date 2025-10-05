import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide a name"],
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minLength: 6,
        select: false,
    },
    profilePic:{
        type: String,
        default: "",
    },
    publicKey:{
        type: String,
        required: true,
    },
    privateKey: {
        type: String,
        required: true,
        select: false,
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
},{timestamps:true});

const User = mongoose.model("User", userSchema);

export default User;