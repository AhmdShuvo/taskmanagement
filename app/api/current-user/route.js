// app/api/current-user/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { verifyJWT } from '@/lib/jwt'; // Import your JWT verification function
import Permission from '@/lib/models/Permission'; // **IMPORT THE PERMISSION MODEL HERE**

export async function GET(req) {
    await dbConnect();

    try {
        const token = req.headers.get('authorization')?.split(' ')[1]; // Get token from Authorization header

        if (!token) {
            return NextResponse.json({ message: "Unauthorized: No token provided", success: false }, { status: 401 });
        }

        const decodedToken = verifyJWT(token); // Verify the token
        if (!decodedToken) {
            return NextResponse.json({ message: "Unauthorized: Invalid token", success: false }, { status: 401 });
        }

        const userId = decodedToken.id; // Extract the user ID from the token

        // Fetch the user from the database, including roles and their permissions
        const user = await User.findById(userId)
            .populate({
                path: 'roles',
                populate: {
                    path: 'permissions', // Populate permissions within roles
                    model: 'Permission'  // Explicitly specify the model
                }
            })
            .select('-password'); // Exclude password for security


        if (!user) {
            return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user }, { status: 200 });

    } catch (error) {
        console.error("Error fetching current user:", error);
        return NextResponse.json({ message: "Failed to fetch current user", error: error.message, success: false }, { status: 500 });
    }
}