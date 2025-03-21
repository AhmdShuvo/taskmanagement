import { NextResponse } from "next/server";
import dbConnect from '@/lib/dbConnect';
import Task from "@/lib/models/Task";
import TaskActivity from "@/lib/models/TaskActivity";
import User from "@/lib/models/User";
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
    
    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'weekly'; // daily, weekly, monthly
    
    let periodFormat, periodLabel, startDate, endDate;
    
    // Set date ranges and format based on period
    const now = new Date();
    
    switch (period) {
      case 'daily':
        // Last 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        
        periodFormat = "%Y-%m-%d";
        periodLabel = day => {
          const date = new Date(day);
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        };
        break;
        
      case 'weekly':
        // Last 8 weeks
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 8 * 7);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        
        periodFormat = "%G-%V"; // ISO week format (year-week)
        periodLabel = week => {
          const [year, weekNum] = week.split('-');
          return `W${weekNum}`;
        };
        break;
        
      case 'monthly':
        // Last 12 months
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 11);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        
        periodFormat = "%Y-%m";
        periodLabel = month => {
          const [year, monthNum] = month.split('-');
          const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
          return date.toLocaleDateString('en-US', { month: 'short' });
        };
        break;
        
      default:
        // Default to weekly
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7 * 8);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        
        periodFormat = "%G-%V";
        periodLabel = week => {
          const [year, weekNum] = week.split('-');
          return `W${weekNum}`;
        };
    }
    
    // Get tasks created per period
    const tasksCreated = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: periodFormat, date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get tasks completed per period
    // First try to get completion activity from the TaskActivity model if it exists
    let tasksCompleted = [];
    
    try {
      tasksCompleted = await TaskActivity.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
            type: 'status_change',
            'data.to': 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: periodFormat, date: "$timestamp" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } catch (error) {
      // If TaskActivity model doesn't exist or there's an error,
      // fallback to checking tasks that have a status of completed
      console.warn("Using fallback for completed tasks:", error.message);
      
      tasksCompleted = await Task.aggregate([
        {
          $match: {
            status: 'completed',
            updatedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: periodFormat, date: "$updatedAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }
    
    // Generate all periods in the range (fill in gaps)
    const allPeriods = [];
    
    if (period === 'daily') {
      const dayCount = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000));
      for (let i = 0; i <= dayCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const periodId = date.toISOString().split('T')[0]; // YYYY-MM-DD
        allPeriods.push({
          period: periodId,
          label: periodLabel(periodId)
        });
      }
    } else if (period === 'weekly') {
      // For weekly, we need to generate ISO week numbers
      // This is a simplified approach and might need adjustment
      const weekCount = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000));
      for (let i = 0; i < weekCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (i * 7));
        
        // Get ISO week number
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
        
        const periodId = `${date.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
        allPeriods.push({
          period: periodId,
          label: periodLabel(periodId)
        });
      }
    } else if (period === 'monthly') {
      const monthCount = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         endDate.getMonth() - startDate.getMonth() + 1;
      
      for (let i = 0; i < monthCount; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        const periodId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        allPeriods.push({
          period: periodId,
          label: periodLabel(periodId)
        });
      }
    }
    
    // Map data to all periods
    const result = allPeriods.map(({ period, label }) => {
      const created = tasksCreated.find(item => item._id === period)?.count || 0;
      const completed = tasksCompleted.find(item => item._id === period)?.count || 0;
      
      return {
        period,
        label,
        created,
        completed
      };
    });
    
    return NextResponse.json({
      period,
      data: result
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching activity trends:", error);
    return NextResponse.json(
      { message: "Failed to fetch activity trends", error: error.message }, 
      { status: 500 }
    );
  }
} 