// components/UserManagement.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRoles, setUserRoles] = useState({}); // Store roles per user

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersResponse = await fetch('/api/users');
            const usersData = await usersResponse.json();
            if (usersData.success) {
                setUsers(usersData.data);
                // Initialize userRoles state
                const initialUserRoles = {};
                usersData.data.forEach(user => {
                    initialUserRoles[user._id] = user.roles.map(role => role._id); // Assuming user.roles is an array of role IDs
                });
                setUserRoles(initialUserRoles);
            } else {
                toast.error(usersData.error || 'Failed to fetch users.');
            }

            const rolesResponse = await fetch('/api/roles');
            const rolesData = await rolesResponse.json();
            if (rolesData.success) {
                setRoles(rolesData.data);
            } else {
                toast.error(rolesData.error || 'Failed to fetch roles.');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error fetching data.');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (userId, roleIds) => {
        setUserRoles(prevUserRoles => ({
            ...prevUserRoles,
            [userId]: roleIds,
        }));
    };

    const handleSaveRoles = async (userId) => {
        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId, roleIds: userRoles[userId] || [] }), // Send the array of role IDs
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('User roles updated successfully!');
                // Refresh data after update to reflect changes
                fetchData();
            } else {
                toast.error(data.error || 'Failed to update user roles.');
            }
        } catch (error) {
            console.error('Error updating user roles:', error);
            toast.error('Error updating user roles.');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {users.map(user => (
                <div key={user._id}>
                    <h3>{user.name} ({user.email})</h3>
                    <Select
                        multiple
                        onValueChange={(roleIds) => handleRoleChange(user._id, roleIds)}
                        defaultValue={userRoles[user._id] || []}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select roles" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role._id} value={role._id}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => handleSaveRoles(user._id)}>Save Roles</Button>
                    <p>Current Roles: {user.roles.map(role => role.name).join(', ') || 'No roles assigned'}</p>
                </div>
            ))}
        </div>
    );
};

export default UserManagement;