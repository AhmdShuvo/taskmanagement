// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Role from '@/lib/models/Role'; // Import the Role model

export async function POST(req) {
    await dbConnect();

    try {
        const body = await req.json();
        const { name, email, password, image, roles, seniorPerson } = body; // Get an array of roles (Role IDs)

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: "Email already exists" }, { status: 400 });
        }

        // Verify that the roles exist in the database
        const existingRoles = await Role.find({ _id: { $in: roles } });
        if (existingRoles.length !== roles.length) {
            return NextResponse.json({ message: "One or more roles are invalid", success: false }, { status: 400 });
        }

        const user = await User.create({
            name,
            email,
            password,
            image, // Save image as base64
            roles,  // Save the array of Role IDs
            seniorPerson,
        });

        return NextResponse.json({ message: "User registered successfully", success: true }, { status: 201 });

    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ message: "Registration failed", error: error.message }, { status: 500 });
    }
}