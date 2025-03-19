// app/api/users/[id]/roles/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function PUT(req, { params }) {
    const { id } = params.id; // User ID

    await dbConnect();

    try {
        const body = await req.json();
        const { roleIds } = body; // Expect an array of role IDs

        if (!Array.isArray(roleIds)) {
            return NextResponse.json({ message: "roleIds must be an array" }, { status: 400 });
        }

        const updatedUser = await User.findByIdAndUpdate(id, { roles: roleIds }, { new: true }).populate('roles'); // Populate roles for easier access

        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "User roles updated successfully", user: updatedUser }, { status: 200 });

    } catch (error) {
        console.error("User roles update error:", error);
        return NextResponse.json({ message: "User roles update failed", error: error.message }, { status: 500 });
    }
}