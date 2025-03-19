import mongoose from 'mongoose';
import Role from '@/lib/models/Role'; // Import the Role model

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (process.env.NODE_ENV === 'production') {
    cached = { conn: null, promise: null }; // Clear cache for production
}

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false,
            connectTimeoutMS: 10000,  // Increase timeout to 10 seconds
            socketTimeoutMS: 45000,   // Increase socket timeout to 45 seconds
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    cached.conn = await cached.promise;

    // Seed initial roles only once, when the app connects
    await seedRoles();

    return cached.conn;
}

async function seedRoles() {
    try {
        const roleCount = await Role.countDocuments();
        if (roleCount === 0) {
            console.log("Seeding initial roles...");
            await Role.create([
                { name: "user", permissions: ["read:profile", "create:task"], description: "Default user role" },
                { name: "moderator", permissions: ["read:profile", "create:task", "edit:task", "delete:comment"], description: "Moderator role" },
                { name: "admin", permissions: ["read:profile", "create:task", "edit:task", "delete:task", "create:user", "edit:user", "delete:user", "read:analytics"], description: "Administrator role" },
            ]);
            console.log("Initial roles seeded successfully.");
        } else {
            console.log("Roles already exist, skipping seeding.");
        }
    } catch (error) {
        console.error("Error seeding initial roles:", error);
    }
}

export default dbConnect;
