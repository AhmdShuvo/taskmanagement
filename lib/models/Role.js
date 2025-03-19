// lib/models/Role.js
import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a role name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Role name cannot exceed 50 characters'],
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission', // Reference to Permission model
    }],
}, { timestamps: true });

const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

export default Role;