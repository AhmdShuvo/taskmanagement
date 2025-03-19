// app/api/users/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function PUT(req) {
    await dbConnect();

    try {
        const { userId, roleIds } = await req.json();

        if (!userId || !Array.isArray(roleIds)) {
            return NextResponse.json({ success: false, error: 'User ID and an array of Role IDs are required' }, { status: 400 });
        }

        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Update the user's roles
        user.roles = roleIds;
        await user.save();

        return NextResponse.json({ success: true, message: 'User roles updated successfully' }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET() {
  await dbConnect();
  try {
      const users = await User.find({}).populate('roles'); // Populate roles to get their details
    //   console.log(users);
      
      return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
      console.error(error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}