// lib/models/ClockIn.js
import mongoose from 'mongoose';

const ClockInSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    time: {
        type: Date,
        default: Date.now,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number], // Array of numbers [longitude, latitude]
            required: true,
        },
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
}, { timestamps: true });

ClockInSchema.index({ location: '2dsphere' }); // Create a 2dsphere index for geospatial queries

const ClockIn = mongoose.models.ClockIn || mongoose.model('ClockIn', ClockInSchema);

export default ClockIn;