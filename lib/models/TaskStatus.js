import mongoose from 'mongoose';

// Check if the model is already defined
const TaskStatus = mongoose.models.TaskStatus || mongoose.model('TaskStatus', new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    default: "#FFC107"
  },
  order: {
    type: Number,
    default: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}));

export default TaskStatus; 