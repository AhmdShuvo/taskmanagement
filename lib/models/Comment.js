// lib/models/Comment.js
import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: null,
    }
});

// Using the proper way to check if model exists before creating
const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

export default Comment;