import { useState, useEffect } from 'react';
import useCurrentUser from './useCurrentUser';

function useUserRoles() {
  const { currentUser, isLoading: userLoading } = useCurrentUser();
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (userLoading) {
      setIsLoading(true);
      return;
    }
    
    if (!currentUser || !currentUser.roles) {
      setRoles([]);
      setIsLoading(false);
      return;
    }
    
    // Extract role names from user object
    const roleNames = currentUser.roles.map(role => 
      typeof role === 'object' ? role.name : role
    );
    
    setRoles(roleNames);
    setIsLoading(false);
  }, [currentUser, userLoading]);
  
  // Check if user has a specific role
  const hasRole = (roleName) => {
    return roles.includes(roleName);
  };
  
  // Check if user is CEO
  const isCEO = () => hasRole('CEO');
  
  // Check if user is Engineer
  const isEngineer = () => hasRole('Engineer');
  
  // Check if user can manage tasks (Engineer or Manager)
  const canManageTasks = () => {
    return hasRole('Engineer') || hasRole('Manager');
  };
  
  // Add the canCreateTasks function to the hook
  const canCreateTasks = () => {
    // If user is a CEO or Engineer, they cannot create tasks
    if (hasRole('CEO') || hasRole('Engineer')) {
      return false;
    }
    return true;
  };
  
  // Add Project Lead check
  const isProjectLead = () => hasRole('Project Lead');
  
  return {
    roles,
    isLoading,
    hasRole,
    isCEO,
    isEngineer,
    isProjectLead,
    canManageTasks,
    canCreateTasks,
    userId: currentUser?._id
  };
}

export default useUserRoles; 