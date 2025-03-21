import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import { headers } from "next/headers";

// Helper function to handle token-based authentication
async function authenticateRequest() {
  try {
    const headersList = headers();
    // Get authorization header
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { 
        success: false, 
        error: { 
          message: "Authentication required. Please sign in.", 
          status: 401 
        } 
      };
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return { 
        success: false, 
        error: { 
          message: "Invalid authentication token", 
          status: 401 
        } 
      };
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user from database based on decoded user ID
      await dbConnect();
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return {
          success: false,
          error: {
            message: "User not found",
            status: 401
          }
        };
      }
      
      return { 
        success: true, 
        user 
      };
    } catch (err) {
      return {
        success: false,
        error: {
          message: "Invalid or expired token",
          status: 401
        }
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: { 
        message: "Authentication error occurred", 
        status: 500 
      } 
    };
  }
}

export async function GET(request) {
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest();
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 5; // Default to 5 tasks
    
    // Get today's date at beginning of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find overdue tasks (due date before today and not completed)
    const overdueTasks = await Task.find({
      dueDate: { $lt: today },
      status: { $ne: 'completed' }
    })
    .sort({ dueDate: 1 }) // Sort by due date, oldest first
    .limit(limit)
    .populate('assignedTo', 'name email image')
    .lean();
    
    // Format the response
    const formattedTasks = overdueTasks.map(task => {
      const dueDate = new Date(task.dueDate);
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      
      return {
        id: task._id.toString(),
        title: task.title,
        description: task.description ? (
          task.description.length > 100 
            ? task.description.substring(0, 100) + '...' 
            : task.description
        ) : '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignedTo?.length > 0 ? {
          id: task.assignedTo[0]._id.toString(),
          name: task.assignedTo[0].name,
          email: task.assignedTo[0].email,
          image: task.assignedTo[0].image
        } : null,
        daysOverdue
      };
    });
    
    // Get total count of overdue tasks (for badge/notification)
    const totalOverdueTasks = await Task.countDocuments({
      dueDate: { $lt: today },
      status: { $ne: 'completed' }
    });
    
    return NextResponse.json({
      tasks: formattedTasks,
      total: totalOverdueTasks
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching overdue tasks:", error);
    return NextResponse.json(
      { message: "Failed to fetch overdue tasks", error: error.message }, 
      { status: 500 }
    );
  }
} 