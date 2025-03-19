// app/api/permissions/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Permission from '@/lib/models/Permission';

export async function PUT(req, { params }) {
    const { id } = params.id;

    await dbConnect();

    try {
        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ message: "Name is required" }, { status: 400 });
        }

        const updatedPermission = await Permission.findByIdAndUpdate(id, { name, description }, { new: true });

        if (!updatedPermission) {
            return NextResponse.json({ message: "Permission not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Permission updated successfully", permission: updatedPermission }, { status: 200 });

    } catch (error) {
        console.error("Permission update error:", error);
        return NextResponse.json({ message: "Permission update failed", error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const { id } = params.id;

    await dbConnect();

    try {
        const deletedPermission = await Permission.findByIdAndDelete(id);

        if (!deletedPermission) {
            return NextResponse.json({ message: "Permission not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Permission deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Permission delete error:", error);
        return NextResponse.json({ message: "Permission delete failed", error: error.message }, { status: 500 });
    }
}

