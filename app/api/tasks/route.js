// app/tasks/route.js
import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import { revalidatePath } from "next/cache";

export async function GET(request, response) {
  await dbConnect(); // Connect to MongoDB

  try {
    const tasks = await Task.find().populate('createdBy',"name email")   // Populate the createdBy field
    .populate('assignedTo',"name email");  // Populate the assignedTo field
    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ message: "Failed to fetch tasks", error: error.message }, { status: 500 });
  }
}

export async function POST(request, response) {
  await dbConnect(); // Connect to MongoDB

  try {
    const body = await request.json(); // Parse request body as JSON
    //const { title, description, status, priority, dueDate, assignedTo, createdBy } = body;

    // Create a new task instance with the data from the request body
    const newTask = new Task(body);
    // Save the new task to the database
    const createdTask = await newTask.save();
    
    return NextResponse.json(createdTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ message: "Failed to create task", error: error.message }, { status: 500 });
  }
  
}