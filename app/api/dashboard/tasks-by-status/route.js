import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import TaskStatus from "@/lib/models/TaskStatus";
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
    
    // Get all available statuses first
    const statusList = await TaskStatus.find({ isActive: true }).sort({ order: 1 });
    
    // Get task count by status
    const tasksByStatus = await Task.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Map status colors from the status list
    const statusMap = {};
    statusList.forEach(status => {
      statusMap[status.name] = {
        label: status.label,
        color: status.color,
        order: status.order
      };
    });
    
    // Format the response
    const formattedData = tasksByStatus.map(item => {
      const statusInfo = statusMap[item._id] || { 
        label: item._id.charAt(0).toUpperCase() + item._id.slice(1), 
        color: '#6B7280',
        order: 999
      };
      
      return {
        status: item._id,
        label: statusInfo.label,
        count: item.count,
        color: statusInfo.color,
        order: statusInfo.order
      };
    });
    
    // Sort by the status order
    const sortedData = formattedData.sort((a, b) => a.order - b.order);
    
    return NextResponse.json(sortedData, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks by status:", error);
    return NextResponse.json(
      { message: "Failed to fetch tasks by status", error: error.message }, 
      { status: 500 }
    );
  }
} 