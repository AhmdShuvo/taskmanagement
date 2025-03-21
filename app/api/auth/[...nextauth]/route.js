// api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import User from "@/lib/models/User";
import dbConnect from "@/lib/dbConnect";

const handler = NextAuth(authOptions);

// Helper function to handle role checks
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

// Check if a user has a specific role
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

// Check if user can manage tasks
export function canManageTasks(userRoles) {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.includes('Engineer') || userRoles.includes('Manager');
}

export { handler as GET, handler as POST };