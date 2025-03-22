import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/authUtils';

/**
 * GET - Retrieve users for autocomplete with pagination and search
 * Used for senior person selection
 */
export async function GET(request) {
  await dbConnect();
  
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page')) || 1;
    let limit = parseInt(url.searchParams.get('limit')) || 5;
    
    // Ensure limit is not too high for initial load
    limit = Math.min(limit, 5);
    
    const roleFilter = url.searchParams.get('role') || '';
    const skip = (page - 1) * limit;
    
    // Build query for search
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add role filter if specified
    if (roleFilter) {
      query.roles = roleFilter;
    }
    
    // Retrieve users with pagination
    const users = await User.find(query)
      .select('_id name email image roles')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination info
    const totalCount = await User.countDocuments(query);
    
    console.log(`Returning ${users.length} users for page ${page} with limit ${limit}`);
    
    return NextResponse.json({
      success: true,
      data: users.map(user => ({
        id: user._id,
        value: user._id.toString(),
        label: user.name || user.email,
        image: user.image,
        roles: user.roles
      })),
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: skip + users.length < totalCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching users for autocomplete:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve users', error: error.message },
      { status: 500 }
    );
  }
} 