// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    await dbConnect();

    try {
        const body = await req.json();
        const { email, password } = body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password'); // Explicitly select password

        if (!user) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        // Check if password is correct
        const isPasswordMatched = await user.comparePassword(password);

        if (!isPasswordMatched) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        // Create JWT token
        const token = jwt.sign({
            id: user._id,
            // image:user.image,
            name: user.name,       // Include user name
            email: user.email,     // Include user email
            // ... add any other user data you want in the token
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_TIME || '7d',
        });

        // Create response with token (send JWT but also setting the cookie)
        const response = NextResponse.json({
            message: "Login successful",
            success: true,
            image:user?.image,
            token // Send the token in the response
        }, { status: 200 });

        // Set cookie with token for enhanced security (httpOnly)
        response.cookies.set('token', token, {
            httpOnly: true,    // Prevent client-side access (security)
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'strict',  // Protect against CSRF attacks
            path: '/',          // Cookie valid for entire domain
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        response.cookies.set('image', user?.image, {
            httpOnly: true,    // Prevent client-side access (security)
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'strict',  // Protect against CSRF attacks
            path: '/',          // Cookie valid for entire domain
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return response;

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ message: "Login failed", error: error.message }, { status: 500 });
    }
}