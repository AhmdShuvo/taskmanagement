import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/authUtils';
import { isCEO } from '@/lib/roleUtils';

/**
 * GET - Retrieve users filtered by role and hierarchy
 * 
 * CEO: Can see all users
 * Project Lead: Can only see users they are senior to (where they are the seniorPerson)
 * Others: Can only see themselves
 */
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
    
    // Determine which users to return based on role
    let query = {};
    
    // CEO can see all users
    if (isCEO(userRoles)) {
      // No need to filter - return all users
    } 
    // Project Lead can see users they are senior to
    else if (userRoles.includes('Project Lead')) {
      // Find all users who have this user as their seniorPerson
      query = { seniorPerson: currentUser._id };
    } 
    // Other roles can only see themselves
    else {
      query = { _id: currentUser._id };
    }
    
    // Get URL parameters
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Retrieve the filtered users
    const users = await User.find(query)
      .select('_id name email image roles')
      .populate('roles', 'name') // Populate roles to display role names
      .sort({ name: 1 }); // Sort by name ascending
    
    return NextResponse.json({
      success: true,
      data: users,
      totalCount: users.length,
      filter: { 
        role: isCEO(userRoles) ? 'CEO' : userRoles.includes('Project Lead') ? 'Project Lead' : 'Other'
      }
    });
    
  } catch (error) {
    console.error('Error fetching filtered users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve users', error: error.message },
      { status: 500 }
    );
  }
} 