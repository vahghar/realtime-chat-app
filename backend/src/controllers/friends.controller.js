import User from "../models/user.model.js";

// Add friend by email (bidirectional)
export const addFriend = async (req, res) => {
    try {
        const { email } = req.body;
        const currentUserId = req.user._id;

        // Find user by email
        const friendToAdd = await User.findOne({ email: email.toLowerCase() });

        if (!friendToAdd) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        // Check if trying to add self
        if (friendToAdd._id.toString() === currentUserId.toString()) {
            return res.status(400).json({ message: "Cannot add yourself as a friend" });
        }

        // Check if already friends (check both directions)
        const currentUser = await User.findById(currentUserId);
        const isAlreadyFriends =
            currentUser.friends.includes(friendToAdd._id) ||
            friendToAdd.friends.includes(currentUserId);

        if (isAlreadyFriends) {
            return res.status(400).json({ message: "Users are already friends" });
        }

        // Add friend bidirectionally (both users get each other in friends list)
        await Promise.all([
            User.findByIdAndUpdate(currentUserId, {
                $push: { friends: friendToAdd._id }
            }),
            User.findByIdAndUpdate(friendToAdd._id, {
                $push: { friends: currentUserId }
            })
        ]);

        res.status(200).json({
            message: "Friend added successfully",
            friend: {
                _id: friendToAdd._id,
                username: friendToAdd.username,
                email: friendToAdd.email,
                profilePic: friendToAdd.profilePic
            }
        });

    } catch (error) {
        console.error("Error in addFriend:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get friends list
export const getFriends = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const currentUser = await User.findById(currentUserId)
            .populate('friends', 'username email profilePic')
            .select('friends');

        res.status(200).json(currentUser.friends || []);

    } catch (error) {
        console.error("Error in getFriends:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Remove friend (bidirectional)
export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const currentUserId = req.user._id;

        // Remove friend bidirectionally (both users lose each other from friends list)
        await Promise.all([
            User.findByIdAndUpdate(currentUserId, {
                $pull: { friends: friendId }
            }),
            User.findByIdAndUpdate(friendId, {
                $pull: { friends: currentUserId }
            })
        ]);

        res.status(200).json({ message: "Friend removed successfully" });

    } catch (error) {
        console.error("Error in removeFriend:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
