// lib/models/Permission.js
import mongoose from 'mongoose';

const PermissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a permission name'],
        unique: true,
        trim: true,
        maxlength: [100, 'Permission name cannot exceed 100 characters'],
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
}, { timestamps: true });

const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);

export default Permission;