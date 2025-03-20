import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function DELETE(req, { params }) {
  console.log("DELETE user route params:", params);
  
  if (!params || !params.id) {
    console.error("Missing ID parameter");
    return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
  }
  
  const id = params.id;
  
  console.log("DELETE user request received for ID:", id);
  
  await dbConnect();
  
  try {
    // Find and delete the user
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      console.log("User not found with ID:", id);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    console.log("User successfully deleted, ID:", id);
    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  const { id } = params;
  
  await dbConnect();
  
  try {
    const user = await User.findById(id).populate('roles');
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { id } = params;
  
  await dbConnect();
  
  try {
    const body = await req.json();
    const { roles, ...updateData } = body;
    
    // Find and update the user
    const user = await User.findByIdAndUpdate(
      id,
      {
        ...updateData,
        roles: roles || [] // Ensure roles is always an array
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('roles');
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: user }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 