// components/AssignPermissions.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const AssignPermissions = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [assignedPermissions, setAssignedPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false); // Track saving state

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
                        if (role && role.permissions) {  // Make sure role and permissions are defined
                            const initialAssigned = {};
                            permissions.forEach(permission => {
                                initialAssigned[permission._id] = role.permissions.includes(permission._id);
                            });
                            setAssignedPermissions(initialAssigned);
                        } else {
                            // Handle case where role or permissions are missing
                            setAssignedPermissions({}); // Clear existing permissions
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
        } else {
            setAssignedPermissions({}); // Clear permissions when no role selected
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

        setIsSaving(true); // Start saving
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
        } finally {
            setIsSaving(false); // End saving, regardless of success or failure
        }
    };


    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Assign Permissions to Roles</CardTitle>
                    <CardDescription>Select a role and assign permissions.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="role">Select Role</Label>
                        <Select onValueChange={handleRoleChange} disabled={loading}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {loading ? (
                                    <SelectItem value="loading" disabled>
                                        <Skeleton className="h-4 w-full" />
                                    </SelectItem>
                                ) : (
                                    roles.map((role) => (
                                        <SelectItem key={role._id} value={role._id}>
                                            {role.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedRole && (
                        <div className="grid gap-2">
                            <Label>Permissions for {roles.find(role => role._id === selectedRole)?.name}</Label>
                            <Card className="border-none shadow-none">
                                <CardContent className="p-0">
                                    <ScrollArea className="h-[300px] w-full rounded-md border">
                                        <div className="p-4">
                                            {loading ? (
                                                // Skeleton loading state
                                                Array.from({ length: 5 }).map((_, index) => (
                                                    <div key={index} className="mb-2 flex items-center space-x-2">
                                                        <Skeleton className="h-4 w-4" />
                                                        <Skeleton className="h-4 w-32" />
                                                    </div>
                                                ))
                                            ) : (
                                                // Permission list
                                                permissions.map((permission) => (
                                                    <div key={permission._id} className="mb-2 flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`permission-${permission._id}`}
                                                            checked={assignedPermissions[permission._id] || false}
                                                            onCheckedChange={() => handlePermissionChange(permission._id)}
                                                            disabled={isSaving} // Disable during saving
                                                        />
                                                        <Label htmlFor={`permission-${permission._id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {permission.name}
                                                        </Label>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AssignPermissions;