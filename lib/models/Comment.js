// lib/models/Comment.js
import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    }
}, { timestamps: true });

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

export default Comment;