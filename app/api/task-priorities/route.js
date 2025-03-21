import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import TaskPriority from "@/lib/models/TaskPriority";
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

// GET - Get all task priorities
export async function GET() {
  await dbConnect();
  
  try {
    // First, check if there are any priorities
    const count = await TaskPriority.countDocuments();
    
    // If no priorities exist, create defaults
    if (count === 0) {
      await TaskPriority.create([
        { name: 'high', label: 'High', color: '#EF4444', order: 1 },
        { name: 'medium', label: 'Medium', color: '#F59E0B', order: 2, isDefault: true },
        { name: 'low', label: 'Low', color: '#10B981', order: 3 }
      ]);
    }
    
    // Get all active priorities, sorted by order
    const priorities = await TaskPriority.find({ isActive: true }).sort({ order: 1 });
    
    return NextResponse.json(priorities, { status: 200 });
  } catch (error) {
    console.error("Error fetching task priorities:", error);
    return NextResponse.json(
      { message: "Failed to fetch task priorities", error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new task priority
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
    
    // Check if priority already exists
    const existingPriority = await TaskPriority.findOne({ name: body.name.toLowerCase() });
    if (existingPriority) {
      return NextResponse.json(
        { message: "A priority with this name already exists" },
        { status: 409 }
      );
    }
    
    // Create the new priority
    const priority = await TaskPriority.create({
      ...body,
      name: body.name.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json(priority, { status: 201 });
  } catch (error) {
    console.error("Error creating task priority:", error);
    return NextResponse.json(
      { message: "Failed to create task priority", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update task priorities (for bulk operations like reordering)
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
        { message: "Expected an array of priority updates" },
        { status: 400 }
      );
    }
    
    // Process each update
    const results = await Promise.all(
      updates.map(async (update) => {
        if (!update._id) {
          return { success: false, message: "Priority ID is required", update };
        }
        
        const updatedPriority = await TaskPriority.findByIdAndUpdate(
          update._id,
          { ...update, updatedAt: new Date() },
          { new: true, runValidators: true }
        );
        
        return updatedPriority
          ? { success: true, priority: updatedPriority }
          : { success: false, message: "Priority not found", update };
      })
    );
    
    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Error updating task priorities:", error);
    return NextResponse.json(
      { message: "Failed to update task priorities", error: error.message },
      { status: 500 }
    );
  }
} 