import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import TaskPriority from "@/lib/models/TaskPriority";
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
    
    // Get query parameters for date filtering if needed
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: { 
          $gte: new Date(startDate), 
          $lte: new Date(endDate) 
        }
      };
    }
    
    // Get all available priorities first
    let priorityList = [];
    try {
      priorityList = await TaskPriority.find({ isActive: true }).sort({ level: 1 });
    } catch (error) {
      // If TaskPriority model doesn't exist or there's an error, use default priorities
      console.warn("Using default priorities due to error:", error.message);
      priorityList = [
        { name: 'high', label: 'High', color: '#EF4444', level: 1 },
        { name: 'medium', label: 'Medium', color: '#F59E0B', level: 2 },
        { name: 'low', label: 'Low', color: '#10B981', level: 3 }
      ];
    }
    
    // Get task count by priority
    const tasksByPriority = await Task.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Map priority colors from the priority list
    const priorityMap = {};
    priorityList.forEach(priority => {
      priorityMap[priority.name] = {
        label: priority.label,
        color: priority.color,
        level: priority.level
      };
    });
    
    // Add default mappings if not found in the database
    if (!priorityMap.high) {
      priorityMap.high = { label: 'High', color: '#EF4444', level: 1 };
    }
    if (!priorityMap.medium) {
      priorityMap.medium = { label: 'Medium', color: '#F59E0B', level: 2 };
    }
    if (!priorityMap.low) {
      priorityMap.low = { label: 'Low', color: '#10B981', level: 3 };
    }
    
    // Format the response for charts (will be used for Recharts)
    const formattedData = tasksByPriority.map(item => {
      const priorityInfo = priorityMap[item._id] || { 
        label: item._id.charAt(0).toUpperCase() + item._id.slice(1), 
        color: '#6B7280',
        level: 999
      };
      
      return {
        name: priorityInfo.label,
        value: item.count,
        color: priorityInfo.color,
        priority: item._id,
        level: priorityInfo.level
      };
    });
    
    // Sort by priority level
    const sortedData = formattedData.sort((a, b) => a.level - b.level);
    
    return NextResponse.json(sortedData, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks by priority:", error);
    return NextResponse.json(
      { message: "Failed to fetch tasks by priority", error: error.message }, 
      { status: 500 }
    );
  }
} 