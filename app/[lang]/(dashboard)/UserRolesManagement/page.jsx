"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Select } from "@/components/ui/select"; // Example using a 'Select' component

const UserRolesManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editedUserRoles, setEditedUserRoles] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([fetchUsers(), fetchRoles()])
            } catch (error) {
                console.error("Error fetching users or roles:", error);
                toast.error("Error fetching users or roles.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');  // Assuming you have an endpoint to fetch all users
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            } else {
                toast.error("Failed to load users.");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Error fetching users.");
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/roles');
            if (response.ok) {
                const data = await response.json();
                setRoles(data.roles);
            } else {
                toast.error("Failed to load roles.");
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.error("Error fetching roles.");
        }
    };

    const handleStartEdit = (user) => {
        setEditingUserId(user._id);
        setEditedUserRoles(user.roles.map(role => role._id)); // Extract role IDs
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
    };

    const handleUpdateUserRoles = async (id) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/${id}/roles`, { // Corrected URL
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roleIds: editedUserRoles }),
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(users.map(user => (user._id === id ? data.user : user))); // Update in state
                setEditingUserId(null);
                toast.success("User roles updated successfully!");
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to update user roles.");
            }
        } catch (error) {
            console.error("Error updating user roles:", error);
            toast.error("Error updating user roles.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2>User Roles Management</h2>

            {isLoading ? (
                <p>Loading users and roles...</p>
            ) : (
                <ul>
                    {users.map(user => (
                        <li key={user._id}>
                            {editingUserId === user._id ? (
                                <div>
                                    <Label htmlFor={`edit-roles-${user._id}`}>Roles:</Label>
                                    {/* Replace with your multiselect component */}
                                    <Select
                                        multiple
                                        value={editedUserRoles}
                                        onValueChange={(value) => setEditedUserRoles(value)}
                                    >
                                        {roles.map(role => (
                                            <Select.Item key={role._id} value={role._id}>{role.name}</Select.Item>
                                        ))}
                                    </Select>

                                    <Button onClick={() => handleUpdateUserRoles(user._id)}>Save</Button>
                                    <Button onClick={handleCancelEdit}>Cancel</Button>
                                </div>
                            ) : (
                                <>
                                    {user.username} - Roles: {user.roles.map(role => role.name).join(", ")}
                                    <Button onClick={() => handleStartEdit(user)}>Edit Roles</Button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserRolesManagement;