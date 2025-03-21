import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

// Helper function to handle token-based authentication
async function authenticateRequest(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
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
    const auth = await authenticateRequest(request);
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
    
    // Get task counts by status
    const totalTasks = await Task.countDocuments(dateFilter);
    const completedTasks = await Task.countDocuments({ ...dateFilter, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ ...dateFilter, status: 'in progress' });
    const openTasks = await Task.countDocuments({ ...dateFilter, status: 'open' });
    const blockedTasks = await Task.countDocuments({ ...dateFilter, status: 'blocked' });
    
    // Get tasks by priority
    const tasksByPriorityData = await Task.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const priorityColors = {
      'high': '#EF4444',
      'medium': '#F59E0B',
      'low': '#10B981'
    };
    
    const tasksByPriority = tasksByPriorityData.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      color: priorityColors[item._id] || '#6B7280'
    }));
    
    // Get recent tasks
    const recentTasks = await Task.find(dateFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name email image')
      .lean();
    
    const formattedRecentTasks = recentTasks.map(task => ({
      id: task._id.toString(),
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      priority: task.priority,
      assignedTo: task.assignedTo?.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image
      }))
    }));
    
    // Get task completion trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const tasksByDay = await Task.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          created: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const completedByDay = await Task.aggregate([
      { 
        $match: { 
          status: 'completed',
          updatedAt: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          completed: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get day names for the last 7 days
    const dayNames = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      dayNames.push({
        date: date.toISOString().split('T')[0],
        name: dayName
      });
    }
    
    // Combine data for the trend chart
    const taskCompletionTrend = dayNames.map(day => {
      const createdData = tasksByDay.find(item => item._id === day.date);
      const completedData = completedByDay.find(item => item._id === day.date);
      
      return {
        name: day.name,
        created: createdData ? createdData.created : 0,
        completed: completedData ? completedData.completed : 0
      };
    });
    
    // Get tasks by assignee
    const tasksByAssignee = await Task.aggregate([
      { $match: dateFilter },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },
      { 
        $group: { 
          _id: "$assignedTo", 
          count: { $sum: 1 },
          completedCount: { 
            $sum: { 
              $cond: [ { $eq: ["$status", "completed"] }, 1, 0 ] 
            } 
          }
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get user details for assignees
    const assigneeIds = tasksByAssignee
      .filter(item => item._id !== null)
      .map(item => item._id);
      
    const users = await User.find({ _id: { $in: assigneeIds } }, 'name email');
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user.name || user.email;
    });
    
    const formattedTasksByAssignee = tasksByAssignee
      .filter(item => item._id !== null)
      .map(item => ({
        name: userMap[item._id.toString()] || 'Unknown User',
        count: item.count,
        completedCount: item.completedCount
      }));
      
    // Add "Unassigned" tasks if any
    const unassignedData = tasksByAssignee.find(item => item._id === null);
    if (unassignedData) {
      formattedTasksByAssignee.push({
        name: 'Unassigned',
        count: unassignedData.count,
        completedCount: unassignedData.completedCount
      });
    }
    
    // Combine all data
    const dashboardData = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      openTasks,
      blockedTasks,
      tasksByPriority,
      recentTasks: formattedRecentTasks,
      taskCompletionTrend,
      tasksByAssignee: formattedTasksByAssignee
    };
    
    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data", error: error.message }, 
      { status: 500 }
    );
  }
} 