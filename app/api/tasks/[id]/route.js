import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import Comment from "@/lib/models/Comment"; // Add Comment model import
import User from "@/lib/models/User"; // Add User model import
import TaskActivity from "@/lib/models/TaskActivity";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

// Helper function to handle token-based authentication
async function authenticateRequest(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Authentication failed: No token found");
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
      console.log("Authentication failed: Invalid token format");
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
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log("Authentication failed: User not found");
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
      console.log("Token verification failed:", err.message);
      return {
        success: false,
        error: {
          message: "Invalid or expired token",
          status: 401
        }
      };
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return { 
      success: false, 
      error: { 
        message: "Authentication error occurred", 
        status: 500 
      } 
    };
  }
}

// GET - Retrieve a single task
export async function GET(request, { params }) {
  await dbConnect();
  
  try {
    // Authenticate the request using token
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID format" }, { status: 400 });
    }
    
    // Ensure models are loaded before populate
    await import('@/lib/models/Comment');
    await import('@/lib/models/User');
    
    // Make sure the models are registered with mongoose
    const userModel = mongoose.models.User || mongoose.model('User', require('@/lib/models/User').default.schema);
    const commentModel = mongoose.models.Comment || mongoose.model('Comment', require('@/lib/models/Comment').default.schema);
    
    const task = await Task.findById(id)
      .populate({
        path: 'createdBy',
        model: userModel,
        select: 'name email image'
      })
      .populate({
        path: 'assignedTo',
        model: userModel,
        select: 'name email image'
      })
      .populate({
        path: 'comments',
        model: commentModel,
        populate: {
          path: 'user',
          model: userModel,
          select: 'name email image'
        }
      });
    
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ message: "Failed to fetch task", error: error.message }, { status: 500 });
  }
}

// PATCH - Update a task (partial update)
export async function PATCH(request, { params }) {
  await dbConnect();
  
  try {
    // Authenticate the request using token
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const user = auth.user;
    console.log("Authenticated user:", user.email);
    
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID format" }, { status: 400 });
    }
    
    const body = await request.json();
    const task = await Task.findById(id);
    
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    
    // Store original values for activity log
    const originalTask = { ...task.toObject() };
    
    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'createdBy',
      model: mongoose.models.User || mongoose.model('User', require('@/lib/models/User').default.schema),
      select: 'name email image'
    })
    .populate({
      path: 'assignedTo',
      model: mongoose.models.User || mongoose.model('User', require('@/lib/models/User').default.schema),
      select: 'name email image'
    })
    .populate({
      path: 'comments',
      model: mongoose.models.Comment || mongoose.model('Comment', require('@/lib/models/Comment').default.schema),
      populate: {
        path: 'user',
        model: mongoose.models.User || mongoose.model('User', require('@/lib/models/User').default.schema),
        select: 'name email image'
      }
    });
    
    // Create activity log entries
    const userId = user._id;
    
    // Special handling for status change
    if (body.status && body.status !== originalTask.status) {
      await TaskActivity.create({
        taskId: id,
        user: userId,
        type: 'status_change',
        data: {
          from: originalTask.status,
          to: body.status
        },
        timestamp: new Date()
      });
    } 
    // Handle other field updates
    else {
      const updatedFields = Object.keys(body).filter(key => 
        JSON.stringify(body[key]) !== JSON.stringify(originalTask[key])
      );
      
      for (const field of updatedFields) {
        await TaskActivity.create({
          taskId: id,
          user: userId,
          type: 'updated',
          data: { field },
          timestamp: new Date()
        });
      }
    }
    
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ message: "Failed to update task", error: error.message }, { status: 500 });
  }
}

// PUT - Full update of a task
export async function PUT(request, { params }) {
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const user = auth.user;
    
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID format" }, { status: 400 });
    }
    
    const body = await request.json();
    const task = await Task.findById(id);
    
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    
    // Store original values for activity log
    const originalTask = { ...task.toObject() };
    
    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'createdBy',
      model: mongoose.models.User || mongoose.model('User', require('@/lib/models/User').default.schema),
      select: 'name email image'
    })
    .populate({
      path: 'assignedTo',
      model: mongoose.models.User || mongoose.model('User', require('@/lib/models/User').default.schema),
      select: 'name email image'
    })
    .populate({
      path: 'comments',
      model: mongoose.models.Comment || mongoose.model('Comment', require('@/lib/models/Comment').default.schema),
      populate: {
        path: 'user',
        model: mongoose.models.User || mongoose.model('User', require('@/lib/models/User').default.schema),
        select: 'name email image'
      }
    });
    
    // Create activity log entries
    const userId = user._id;
    
    // Special handling for status change
    if (body.status && body.status !== originalTask.status) {
      await TaskActivity.create({
        taskId: id,
        user: userId,
        type: 'status_change',
        data: {
          from: originalTask.status,
          to: body.status
        },
        timestamp: new Date()
      });
    } 
    // Handle other field updates
    else {
      const updatedFields = Object.keys(body).filter(key => 
        JSON.stringify(body[key]) !== JSON.stringify(originalTask[key])
      );
      
      for (const field of updatedFields) {
        await TaskActivity.create({
          taskId: id,
          user: userId,
          type: 'updated',
          data: { field },
          timestamp: new Date()
        });
      }
    }
    
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ message: "Failed to update task", error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a task
export async function DELETE(request, { params }) {
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID format" }, { status: 400 });
    }
    
    const task = await Task.findByIdAndDelete(id);
    
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    
    // Also delete all related activities and comments
    await TaskActivity.deleteMany({ taskId: id });
    await Comment.deleteMany({ taskId: id });
    
    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ message: "Failed to delete task", error: error.message }, { status: 500 });
  }
}
