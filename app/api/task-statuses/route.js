import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import TaskStatus from "@/lib/models/TaskStatus";
import { headers } from "next/headers";
import jwt from 'jsonwebtoken';

// Helper function to verify token
const verifyToken = async (req) => {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return { success: false, message: "Unauthorized" };
    }
    
    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return { success: true, userId: decoded.id };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// GET - Get all task statuses
export async function GET() {
  await dbConnect();
  
  try {
    // First, check if there are any statuses
    const count = await TaskStatus.countDocuments();
    
    // If no statuses exist, create defaults
    if (count === 0) {
      await TaskStatus.create([
        { name: 'open', label: 'Open', color: '#FFC107', order: 1, isDefault: true },
        { name: 'in progress', label: 'In Progress', color: '#3B82F6', order: 2 },
        { name: 'completed', label: 'Completed', color: '#10B981', order: 3 },
        { name: 'blocked', label: 'Blocked', color: '#EF4444', order: 4 }
      ]);
    }
    
    // Get all active statuses, sorted by order
    const statuses = await TaskStatus.find({ isActive: true }).sort({ order: 1 });
    
    return NextResponse.json(statuses, { status: 200 });
  } catch (error) {
    console.error("Error fetching task statuses:", error);
    return NextResponse.json(
      { message: "Failed to fetch task statuses", error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new task status
export async function POST(request) {
  await dbConnect();
  
  try {
    // Verify the token
    const auth = await verifyToken(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.label || !body.color) {
      return NextResponse.json(
        { message: "Name, label, and color are required" },
        { status: 400 }
      );
    }
    
    // Check if status already exists
    const existingStatus = await TaskStatus.findOne({ name: body.name.toLowerCase() });
    if (existingStatus) {
      return NextResponse.json(
        { message: "A status with this name already exists" },
        { status: 409 }
      );
    }
    
    // Create the new status
    const status = await TaskStatus.create({
      ...body,
      name: body.name.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    console.error("Error creating task status:", error);
    return NextResponse.json(
      { message: "Failed to create task status", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update task statuses (for bulk operations like reordering)
export async function PATCH(request) {
  await dbConnect();
  
  try {
    // Verify the token
    const auth = await verifyToken(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.message }, { status: 401 });
    }
    
    const updates = await request.json();
    
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { message: "Expected an array of status updates" },
        { status: 400 }
      );
    }
    
    // Process each update
    const results = await Promise.all(
      updates.map(async (update) => {
        if (!update._id) {
          return { success: false, message: "Status ID is required", update };
        }
        
        const updatedStatus = await TaskStatus.findByIdAndUpdate(
          update._id,
          { ...update, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
        
        return updatedStatus
          ? { success: true, status: updatedStatus }
          : { success: false, message: "Status not found", update };
      })
    );
    
    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Error updating task statuses:", error);
    return NextResponse.json(
      { message: "Failed to update task statuses", error: error.message },
      { status: 500 }
    );
  }
} 