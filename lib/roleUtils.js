import User from "@/lib/models/User";
import dbConnect from "@/lib/dbConnect";

// Get user roles by userId
export async function getUserRoles(userId) {
  try {
    await dbConnect();
    const user = await User.findById(userId).populate('roles');
    
    if (!user || !user.roles) {
      return [];
    }
    
    // Extract role names
    return user.roles.map(role => 
      typeof role === 'object' ? role.name : role
    );
  } catch (error) {
    console.error("Error getting user roles:", error);
    return [];
  }
}

// Check if user has specific role
export function hasRole(userRoles, roleName) {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.includes(roleName);
}

// Check if user has CEO role
export function isCEO(userRoles) {
  return hasRole(userRoles, 'CEO');
}

// Check if user has Engineer role
export function isEngineer(userRoles) {
  return hasRole(userRoles, 'Engineer');
}

// Check if user can manage tasks (Engineer or Manager)
export function canManageTasks(userRoles) {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.includes('Engineer') || userRoles.includes('Manager');
}

// Check if user can comment on tasks
export function canCommentOnTasks(userRoles) {
  return canManageTasks(userRoles);
}

// Check if user can view tasks
export function canViewTask(userRoles, task, userId) {
  // CEO can view all tasks
  if (isCEO(userRoles)) return true;
  
  // Task creator can view their tasks
  if (task.createdBy && task.createdBy.toString() === userId.toString()) return true;
  
  // Assigned users can view tasks assigned to them
  if (task.assignedTo && task.assignedTo.some(id => id.toString() === userId.toString())) return true;
  
  return false;
}

// Get subordinate user IDs
export async function getSubordinateUserIds(userId) {
  try {
    await dbConnect();
    const subordinates = await User.find({ seniorPerson: userId }, '_id');
    return subordinates.map(sub => sub._id);
  } catch (error) {
    console.error("Error getting subordinate users:", error);
    return [];
  }
}

// Check if a user can access tasks based on role and relationships
export async function canAccessTasks(userRoles, userId) {
  // CEO can access all tasks
  if (isCEO(userRoles)) {
    return { 
      accessAll: true,
      filter: {} 
    };
  }
  
  // Get subordinates
  const subordinateIds = await getSubordinateUserIds(userId);
  
  // Include current user ID with subordinates
  const relevantUserIds = [userId, ...subordinateIds];
  
  return {
    accessAll: false,
    filter: {
      $or: [
        { assignedTo: { $in: relevantUserIds } },
        { createdBy: { $in: relevantUserIds } }
      ]
    }
  };
}

// Check if user can create tasks (only non-CEO, non-Engineer)
export function canCreateTasks(userRoles) {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  
  // If user is a CEO or Engineer, they cannot create tasks
  const restrictedRoles = ['CEO', 'Engineer'];
  return !restrictedRoles.some(role => userRoles.includes(role));
}

// Check if user has Project Lead role
export function isProjectLead(userRoles) {
  return hasRole(userRoles, 'Project Lead');
} 