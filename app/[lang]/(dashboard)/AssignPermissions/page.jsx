// components/AssignPermissions.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast';

const AssignPermissions = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [assignedPermissions, setAssignedPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRolesAndPermissions();
    }, []);

    const fetchRolesAndPermissions = async () => {
        setLoading(true);
        try {
            const rolesResponse = await fetch('/api/roles');
            const rolesData = await rolesResponse.json();
            if (rolesData.success) {
                setRoles(rolesData.data);
            } else {
                toast.error(rolesData.error || 'Failed to fetch roles.');
            }

            const permissionsResponse = await fetch('/api/permissions');
            const permissionsData = await permissionsResponse.json();
            if (permissionsData.success) {
                setPermissions(permissionsData.data);
            } else {
                toast.error(permissionsData.error || 'Failed to fetch permissions.');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error fetching data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // When a role is selected, fetch its current permissions
        if (selectedRole) {
            const fetchAssignedPermissions = async () => {
                try {
                    const response = await fetch('/api/roles');
                    const data = await response.json();
                    if (data.success) {
                        const role = data.data.find(role => role._id === selectedRole);
                        if (role) {
                            const initialAssigned = {};
                            permissions.forEach(permission => {
                                initialAssigned[permission._id] = role.permissions.includes(permission._id);
                            });
                            setAssignedPermissions(initialAssigned);
                        }
                    } else {
                        toast.error(data.error || 'Failed to fetch roles.');
                    }
                } catch (error) {
                    console.error('Error fetching roles:', error);
                    toast.error('Error fetching roles.');
                }
            };
            fetchAssignedPermissions();
        }
    }, [selectedRole, permissions]);

    const handleRoleChange = (roleId) => {
        setSelectedRole(roleId);
    };

    const handlePermissionChange = async (permissionId) => {
        if (!selectedRole) {
            toast.error('Please select a role first.');
            return;
        }
        const newAssignedPermissions = { ...assignedPermissions, [permissionId]: !assignedPermissions[permissionId] };
        setAssignedPermissions(newAssignedPermissions);

        try {
            const method = newAssignedPermissions[permissionId] ? 'POST' : 'DELETE';
            let url = '/api/assign-permission';

            if (method === 'DELETE') {
                url += `?roleId=${selectedRole}&permissionId=${permissionId}`;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: method === 'POST' ? JSON.stringify({ roleId: selectedRole, permissionId: permissionId }) : null,
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(`Permission ${newAssignedPermissions[permissionId] ? 'assigned to' : 'removed from'} role successfully!`);
                // Refresh assigned permissions
                setAssignedPermissions(newAssignedPermissions);
            } else {
                toast.error(data.error || 'Failed to assign/remove permission.');
                // Revert the change if the API call fails
                setAssignedPermissions(prevState => ({ ...prevState, [permissionId]: !newAssignedPermissions[permissionId] }));
            }
        } catch (error) {
            console.error('Error assigning/removing permission:', error);
            toast.error('Error assigning/removing permission.');
            // Revert the change if there's an error
            setAssignedPermissions(prevState => ({ ...prevState, [permissionId]: !newAssignedPermissions[permissionId] }));
        }
    };


    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <Select onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    {roles.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                            {role.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedRole && (
                <div>
                    <h3>Permissions for {roles.find(role => role._id === selectedRole)?.name}</h3>
                    <ul>
                        {permissions.map((permission) => (
                            <li key={permission._id}>
                                <label>
                                    <Checkbox
                                        checked={assignedPermissions[permission._id] || false}
                                        onCheckedChange={() => handlePermissionChange(permission._id)}
                                    />
                                    {permission.name}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AssignPermissions;