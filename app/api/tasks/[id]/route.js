import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import Comment from "@/lib/models/Comment"; // Add Comment model import
import User from "@/lib/models/User"; // Add User model import
import TaskActivity from "@/lib/models/TaskActivity";
import mongoose from "mongoose";
import { authenticateRequest } from '@/lib/authUtils';
import { isCEO, getSuperiorChain } from '@/lib/roleUtils';

// GET - Retrieve a single task
export async function GET(request, { params }) {
  const { id } = params;
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest();
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid task ID format" }, { status: 400 });
    }
    
    // Ensure models are loaded before populate
    await import('@/lib/models/Comment');
    await import('@/lib/models/User');
    
    const currentUser = auth.user;
    const userRoles = currentUser.roles.map(role => 
      typeof role === 'object' ? role.name : role
    );
    const isCeoUser = isCEO(userRoles);
    
    // Find the task
    const task = await Task.findById(id)
      .populate('assignedTo', 'name email image')
      .populate('createdBy', 'name email image')
      .populate('canAccess', 'name email')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name email image'
        }
      });
    
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    
    // Check if user has access
    const hasAccess = 
      isCeoUser || 
      task.canAccess.some(user => user._id.toString() === currentUser._id.toString());
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: "You don't have permission to view this task" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("Error getting task:", error);
    return NextResponse.json(
      { message: "Failed to fetch task", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update a task (partial update)
export async function PATCH(request, { params }) {
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest();
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
  const { id } = params;
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest();
    if (!auth.success) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    
    const currentUser = auth.user;
    
    // Get the task to check permissions
    const task = await Task.findById(id);
    
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    
    // Check if user has access to this task
    const userRoles = currentUser.roles.map(role => 
      typeof role === 'object' ? role.name : role
    );
    const isCeoUser = isCEO(userRoles);
    
    const hasAccess = 
      isCeoUser || 
      task.canAccess.some(userId => userId.toString() === currentUser._id.toString());
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: "You don't have permission to update this task" },
        { status: 403 }
      );
    }
    
    // Parse the updates
    const updates = await request.json();
    
    // Don't allow changing the canAccess field directly
    delete updates.canAccess;
    
    // If assignedTo is being changed, we need to update canAccess for all new assignees
    if (updates.assignedTo) {
      // Keep the existing canAccess for continuity
      const currentAccess = task.canAccess.map(id => id.toString());
      
      // For any new assignee, add their superior chain to canAccess
      for (const assigneeId of updates.assignedTo) {
        if (!task.assignedTo.includes(assigneeId)) {
          const superiorChain = await getSuperiorChain(assigneeId);
          
          // Add assignee and their superiors to canAccess if not already there
          const newAccess = [assigneeId, ...superiorChain].filter(
            id => !currentAccess.includes(id.toString())
          );
          
          // Update the task's canAccess array
          if (newAccess.length > 0) {
            await Task.findByIdAndUpdate(id, {
              $addToSet: { canAccess: { $each: newAccess } }
            });
          }
        }
      }
    }
    
    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'name email image')
    .populate('createdBy', 'name email image')
    .populate('canAccess', 'name email')
    .populate({
      path: 'comments',
      populate: {
        path: 'user',
        select: 'name email image'
      }
    });
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { message: "Failed to update task", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(request, { params }) {
  await dbConnect();
  
  try {
    // Authenticate the request
    const auth = await authenticateRequest();
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
