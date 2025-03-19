// lib/models/User.js (Modified)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Make sure you have this installed

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Exclude password from query results by default
    },
    image: {
        type: String, // Store image as a base64 string
        default: null, // Or a default image URL
    },
    roles: [{  // Array of role IDs
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role', // Reference to the Role model
    }],
    clockedIn: {  // New status field
        type: Boolean,
        default: false,
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    },
    profile: {
        type: String,
        default: null // or other default profile information
    },    seniorPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model,
        default: null
    },

}, { timestamps: true });

// Hash the password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT
UserSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME,
    });
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;