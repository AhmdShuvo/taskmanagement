// lib/models/Task.js
import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a task title'],
        trim: true,
        maxlength: [100, 'Task title cannot exceed 100 characters'],
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['open', 'in progress', 'completed', 'blocked'], // example status
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
    },
    dueDate: {
        type: Date,
        default: null,
    },
    assignedTo: [{  // Change: Make it an array of ObjectIds
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // User who created the task
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }], // References to comments
}, { timestamps: true });

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

export default Task;