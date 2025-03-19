// app/api/clock-in/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ClockIn from '@/lib/models/ClockIn'; // Create ClockIn model
import User from '@/lib/models/User'; // Assuming you have a User model
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

        const { latitude, longitude, address } = await req.json();

        if (!latitude || !longitude || !address) {
            return NextResponse.json({ message: "Latitude, longitude, and address are required", success: false }, { status: 400 });
        }

        // Verify user exists to avoid errors.
        const user = await User.findById(userId);

        if (!user) {
          return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
        }

        // Update the user's clockedIn status in the database
        user.clockedIn = true; // Set user to clocked in
        await user.save(); // Save the change to the User record

        const clockIn = await ClockIn.create({
            user: userId,
            time: new Date(), // Current time
            location: {
                type: 'Point',
                coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
            },
            latitude,
            longitude,
            address,
        });

        return NextResponse.json({ message: "Clock-in successful", success: true, data: clockIn }, { status: 201 });

    } catch (error) {
        console.error("Error clocking in:", error);
        return NextResponse.json({ message: "Failed to clock in", error: error.message, success: false }, { status: 500 });
    }
}