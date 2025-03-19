// app/api/allroles/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Role from '@/lib/models/Role';

export async function GET(req) {
    await dbConnect();

    try {
        const roles = await Role.find();
        return NextResponse.json({ roles }, { status: 200 });
    } catch (error) {
        console.error("Error getting roles:", error);
        return NextResponse.json({ message: "Failed to get roles", error: error.message }, { status: 500 });
    }
}