// app/tasks/route.js
import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import jwt from 'jsonwebtoken';
import { headers } from "next/headers";
import { isCEO } from "@/lib/roleUtils";

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

// Get users who have the current user as their senior
async function getSubordinateUsers(userId) {
  return await User.find({ seniorPerson: userId }, '_id');
}

// GET all tasks with pagination, filtering, and sorting
export async function GET(request) {
  await dbConnect();

  try {
    // Authenticate the request
    const auth = await authenticateRequest();
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const currentUser = auth.user;
    const userRoles = currentUser.roles.map(role => 
      typeof role === 'object' ? role.name : role
    );
    const isCeoUser = isCEO(userRoles);
    
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Apply role-based filtering
    if (!isCeoUser) {
      // Get subordinates (users who have this user as their senior)
      const subordinates = await getSubordinateUsers(currentUser._id);
      const subordinateIds = subordinates.map(sub => sub._id);
      
      // Add the current user to the list of IDs
      const relevantUserIds = [currentUser._id, ...subordinateIds];
      
      query.$or = [
        { assignedTo: { $in: relevantUserIds } },
        { createdBy: { $in: relevantUserIds } }
      ];
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add priority filter if provided
    if (priority) {
      query.priority = priority;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email image')
      .populate('createdBy', 'name email image')
      .lean();
    
    // Get total count
    const totalTasks = await Task.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalTasks / limit);
    
    return NextResponse.json({
      tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalTasks,
        itemsPerPage: limit
      },
      userRole: isCeoUser ? 'CEO' : 'Regular'
    });
  } catch (error) {
    console.error("Error getting tasks:", error);
    return NextResponse.json(
      { message: "Failed to fetch tasks", error: error.message },
      { status: 500 }
    );
  }
}

// Create a new task
export async function POST(request) {
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest();
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const currentUser = auth.user;
    
    // Populate roles to check user permissions
    await currentUser.populate('roles');
    
    // Extract role names
    const userRoles = currentUser.roles.map(role => 
      typeof role === 'object' ? role.name : role
    );
    
    // Check if user is CEO or Engineer - they cannot create tasks
    if (userRoles.includes('CEO') || userRoles.includes('Engineer')) {
      return NextResponse.json({ 
        message: "You don't have permission to create tasks with your current role" 
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Set the current user as the task creator
    body.createdBy = currentUser._id;
    
    // Create the task
    const task = await Task.create(body);
    
    // Return the new task
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { message: "Failed to create task", error: error.message },
      { status: 500 }
    );
  }
}