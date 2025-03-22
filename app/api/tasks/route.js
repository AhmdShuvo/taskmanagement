// app/api/tasks/route.js
import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import { headers } from "next/headers";
import { isCEO, getTaskAccessList } from "@/lib/roleUtils";
import { authenticateRequest } from '@/lib/authUtils';

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
    
    // Apply role-based access control using the canAccess field
    if (!isCeoUser) {
      // Only show tasks where the current user has access
      query.canAccess = currentUser._id;
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
      .populate('canAccess', 'name email') // Also populate canAccess for debugging
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
export async function POST(req) {
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
    
    // Check if user can create tasks
    if (userRoles.includes('CEO') || userRoles.includes('Engineer')) {
      return NextResponse.json(
        { message: "You don't have permission to create tasks" },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }
    
    // Generate the access list based on creator's hierarchy
    const accessList = await getTaskAccessList(currentUser._id);
    
    // Ensure creator ID is set to current user
    body.createdBy = currentUser._id;
    
    // Add the accessList to canAccess field
    body.canAccess = accessList;
    
    // Create the task
    const task = await Task.create(body);
    
    // Populate reference fields for the response
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email image')
      .populate('createdBy', 'name email image');
    
    return NextResponse.json(populatedTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { message: "Failed to create task", error: error.message },
      { status: 500 }
    );
  }
}