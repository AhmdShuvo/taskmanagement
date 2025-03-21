import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import TaskActivity from "@/lib/models/TaskActivity";
import mongoose from "mongoose";

// GET - Retrieve activity log for a task
export async function GET(request, { params }) {
  await dbConnect();
  
  try {
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID format" }, { status: 400 });
    }
    
    const activities = await TaskActivity.find({ taskId: id })
      .populate('user', 'name email image')
      .sort({ timestamp: -1 });
    
    return NextResponse.json(activities, { status: 200 });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return NextResponse.json({ message: "Failed to fetch activity log", error: error.message }, { status: 500 });
  }
} 