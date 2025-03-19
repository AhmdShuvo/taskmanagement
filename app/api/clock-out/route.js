// app/api/clock-out/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User'; // Assuming you have a User model
import ClockIn from '@/lib/models/ClockIn';
import { verifyJWT } from '@/lib/jwt'; // Import your JWT verification function

export async function POST(req) {
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

        // Verify user exists to avoid errors.
        const user = await User.findById(userId);

        if (!user) {
          return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
        }

        // Update the user's clockedIn status in the database
        user.clockedIn = false; // Set user to clocked out
        await user.save(); // Save the change to the User record

        // Potentially add logic to track the clock-out time (new model? update ClockIn model?)
        return NextResponse.json({ message: "Clock-out successful", success: true }, { status: 200 });

    } catch (error) {
        console.error("Error clocking out:", error);
        return NextResponse.json({ message: "Failed to clock out", error: error.message, success: false }, { status: 500 });
    }
}