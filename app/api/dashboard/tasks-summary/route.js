import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import Role from "@/lib/models/Role";
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
      
      // Find user from database based on decoded user ID including roles
      await dbConnect();
      const user = await User.findById(decoded.id).populate('roles');
      
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

// Check if user has CEO role
function isCEO(user) {
  if (!user.roles || user.roles.length === 0) return false;
  
  return user.roles.some(role => 
    role.name === 'CEO' || 
    (typeof role === 'object' && role.name === 'CEO')
  );
}

// Get users who have the current user as their senior
async function getSubordinateUsers(userId) {
  return await User.find({ seniorPerson: userId }, '_id name email image');
}

export async function GET(request) {
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest();
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const currentUser = auth.user;
    const isCeoUser = isCEO(currentUser);
    
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
    
    // Apply role-based filtering for tasks
    let taskFilter = { ...dateFilter };
    
    // If not a CEO, only show tasks assigned to or created by the user
    if (!isCeoUser) {
      // Get subordinates (users who have this user as their senior)
      const subordinates = await getSubordinateUsers(currentUser._id);
      const subordinateIds = subordinates.map(sub => sub._id);
      
      // Add the current user to the list of IDs
      const relevantUserIds = [currentUser._id, ...subordinateIds];
      
      taskFilter.$or = [
        { assignedTo: { $in: relevantUserIds } },
        { createdBy: { $in: relevantUserIds } }
      ];
    }
    
    // Get task counts by status with role-based restrictions
    const totalTasks = await Task.countDocuments(taskFilter);
    const completedTasks = await Task.countDocuments({ ...taskFilter, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ ...taskFilter, status: 'in progress' });
    const openTasks = await Task.countDocuments({ ...taskFilter, status: 'open' });
    const blockedTasks = await Task.countDocuments({ ...taskFilter, status: 'blocked' });
    
    // Get tasks by priority
    const tasksByPriorityData = await Task.aggregate([
      { $match: taskFilter },
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
    
    // Get recent tasks with role-based restrictions
    const recentTasks = await Task.find(taskFilter)
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
    
    // Get task completion trend (last 7 days) with role-based restrictions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Add date filter to the role-based task filter
    const trendTaskFilter = { 
      ...taskFilter,
      createdAt: { $gte: sevenDaysAgo } 
    };
    
    const tasksByDay = await Task.aggregate([
      { $match: trendTaskFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          created: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const completedTaskFilter = {
      ...taskFilter,
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo }
    };
    
    const completedByDay = await Task.aggregate([
      { $match: completedTaskFilter },
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
    
    // Get tasks by assignee with role-based restrictions
    // For non-CEO, only show data for subordinates and self
    let userFilter = {};
    if (!isCeoUser) {
      // Get subordinates and include current user
      const subordinates = await getSubordinateUsers(currentUser._id);
      const relevantUserIds = [currentUser._id, ...subordinates.map(sub => sub._id)];
      userFilter = { _id: { $in: relevantUserIds } };
    }
    
    // For CEOs, show all assignees. For others, filter by relevant users
    let tasksByAssigneeFilter = { ...taskFilter };
    if (!isCeoUser) {
      tasksByAssigneeFilter.$or = [
        { assignedTo: { $in: Object.keys(userFilter).length > 0 ? userFilter._id.$in : [currentUser._id] } },
        { createdBy: { $in: Object.keys(userFilter).length > 0 ? userFilter._id.$in : [currentUser._id] } }
      ];
    }
    
    const tasksByAssignee = await Task.aggregate([
      { $match: tasksByAssigneeFilter },
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
    
    // Get user details for assignees with role-based filtering
    const assigneeIds = tasksByAssignee
      .filter(item => item._id !== null)
      .map(item => item._id);
      
    // Apply user filter for non-CEOs
    let userQuery = { _id: { $in: assigneeIds } };
    if (!isCeoUser && Object.keys(userFilter).length > 0) {
      // Intersection of assignee IDs and filtered user IDs
      const filteredAssigneeIds = assigneeIds.filter(id => 
        userFilter._id.$in.some(userId => userId.toString() === id.toString())
      );
      userQuery = { _id: { $in: filteredAssigneeIds } };
    }
    
    const users = await User.find(userQuery, 'name email');
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user.name || user.email;
    });
    
    const formattedTasksByAssignee = tasksByAssignee
      .filter(item => item._id !== null && (!Object.keys(userFilter).length || userMap[item._id.toString()]))
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
      tasksByAssignee: formattedTasksByAssignee,
      userRole: isCeoUser ? 'CEO' : 'Regular'
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