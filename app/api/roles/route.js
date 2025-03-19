// app/api/roles/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Role from '@/lib/models/Role';

export async function GET() {
    await dbConnect();
    try {
        const roles = await Role.find({});
        return NextResponse.json({ success: true, data: roles }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const role = await Role.create(body);
        return NextResponse.json({ success: true, data: role }, { status: 201 });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
          return NextResponse.json({ success: false, error: "Role name already exists" }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const { id, ...updateData } = body;
        const role = await Role.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!role) {
            return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: role }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: 'Role ID is required' }, { status: 400 });
        }

        const role = await Role.findByIdAndDelete(id);

        if (!role) {
            return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}