import mongoose from 'mongoose';

const TaskActivitySchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
        index: true, // Add index for better query performance
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['created', 'updated', 'status_change', 'comment_added', 'assigned', 'deleted'],
        required: true,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

// Create a compound index for efficient querying
TaskActivitySchema.index({ taskId: 1, timestamp: -1 });

const TaskActivity = mongoose.models.TaskActivity || mongoose.model('TaskActivity', TaskActivitySchema);

export default TaskActivity; 