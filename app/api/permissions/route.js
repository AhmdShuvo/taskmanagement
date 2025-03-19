// app/api/permissions/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Permission from '@/lib/models/Permission';

export async function GET() {
    await dbConnect();
    try {
        const permissions = await Permission.find({});
        return NextResponse.json({ success: true, data: permissions }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const permission = await Permission.create(body);
        return NextResponse.json({ success: true, data: permission }, { status: 201 });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
          return NextResponse.json({ success: false, error: "Permission name already exists" }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const { id, ...updateData } = body;
        const permission = await Permission.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!permission) {
            return NextResponse.json({ success: false, error: 'Permission not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: permission }, { status: 200 });
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
            return NextResponse.json({ success: false, error: 'Permission ID is required' }, { status: 400 });
        }

        const permission = await Permission.findByIdAndDelete(id);

        if (!permission) {
            return NextResponse.json({ success: false, error: 'Permission not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}