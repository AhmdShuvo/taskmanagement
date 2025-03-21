import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import Comment from "@/lib/models/Comment";
import User from "@/lib/models/User";
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

// GET - Retrieve all comments for a task
export async function GET(request, { params }) {
  await dbConnect();
  
  try {
    const { id } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID format" }, { status: 400 });
    }
    
    const comments = await Comment.find({ taskId: id })
      .populate('user', 'name email image')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ message: "Failed to fetch comments", error: error.message }, { status: 500 });
  }
}

// POST - Add a comment to a task
export async function POST(request, { params }) {
  await dbConnect();
  
  try {
    const { id } = params;
    
    // Authenticate the request using token
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const user = auth.user;
    console.log("Authenticated user:", user.email);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID format" }, { status: 400 });
    }
    
    const { content } = await request.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json({ message: "Comment content is required" }, { status: 400 });
    }
    
    // Check if task exists
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    
    // Create the comment
    const userId = user._id;
    const comment = await Comment.create({
      taskId: id,
      user: userId,
      content,
      createdAt: new Date()
    });
    
    // Add comment to task
    await Task.findByIdAndUpdate(id, {
      $push: { comments: comment._id }
    });
    
    // Create activity log entry
    await TaskActivity.create({
      taskId: id,
      user: userId,
      type: 'comment_added',
      data: { commentId: comment._id },
      timestamp: new Date()
    });
    
    // Return populated comment
    const populatedComment = await Comment.findById(comment._id).populate('user', 'name email image');
    
    return NextResponse.json(populatedComment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json({ message: "Failed to add comment", error: error.message }, { status: 500 });
  }
} 