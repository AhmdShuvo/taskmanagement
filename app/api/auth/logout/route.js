// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const response = NextResponse.json({
            message: "Logout successful",
            success: true,
        }, { status: 200 });

        // Clear the HTTP-only cookie
        response.cookies.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 0,  // Set maxAge to 0 to immediately expire the cookie
        });

        return response;

    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ message: "Logout failed", error: error.message }, { status: 500 });
    }
}