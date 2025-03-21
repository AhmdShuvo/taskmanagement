import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import Comment from "@/lib/models/Comment";
import User from "@/lib/models/User";
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

// DELETE - Delete a comment
export async function DELETE(request, { params }) {
  await dbConnect();
  
  try {
    const { id, commentId } = params;
    
    // Authenticate the request using token
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const user = auth.user;
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
    }
    
    // Find the comment
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }
    
    // Check if user is authorized to delete (either comment owner or admin)
    const userId = user._id;
    const isOwner = comment.user.toString() === userId.toString();
    const isAdmin = user.roles?.includes('admin'); // Check for admin role in user's roles
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Not authorized to delete this comment" }, { status: 403 });
    }
    
    // Delete the comment
    await Comment.findByIdAndDelete(commentId);
    
    // Remove comment from task
    await Task.findByIdAndUpdate(id, {
      $pull: { comments: commentId }
    });
    
    return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ message: "Failed to delete comment", error: error.message }, { status: 500 });
  }
} 