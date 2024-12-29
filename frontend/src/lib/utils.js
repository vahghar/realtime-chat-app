// utils/formatTime.js

export const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // Check if the message is from today
    const isToday = date.toDateString() === now.toDateString();

    // Check if the message is from yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    // Format time
    const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

    if (isToday) {
        return formattedTime; // Returns: "8:28 AM"
    } else if (isYesterday) {
        return `Yesterday at ${formattedTime}`; // Returns: "Yesterday at 8:28 AM"
    } else {
        // Format date for older messages
        const dateOptions = { month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', dateOptions);
        return `${formattedDate} at ${formattedTime}`; // Returns: "Dec 28 at 8:28 AM"
    }
};