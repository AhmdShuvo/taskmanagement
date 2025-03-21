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
    tags: [{
        type: String,
        trim: true
    }], // Optional array of tags
    canAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true // Add index for performance
    }], // Array of user IDs who can access this task based on hierarchy
}, { timestamps: true });

// Create indexes for better query performance
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ 'assignedTo': 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ canAccess: 1 }); // Add index for the canAccess field

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

export default Task;