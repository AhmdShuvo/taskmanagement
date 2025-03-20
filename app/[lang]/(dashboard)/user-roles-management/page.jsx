"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const UserRolesManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editedUserRoles, setEditedUserRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingUser, setUpdatingUser] = useState(null);

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
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || data.data || []);
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
                setRoles(data.roles || data.data || []);
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
        // Extract role IDs, ensuring it works regardless of the data structure
        const userRoles = user.roles || [];
        const roleIds = userRoles.map(role => typeof role === 'object' ? role._id : role);
        setEditedUserRoles(roleIds);
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
    };

    const handleUpdateUserRoles = async (id) => {
        setUpdatingUser(id);
        try {
            const response = await fetch(`/api/users/${id}/roles`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ roleIds: editedUserRoles }),
            });

            if (response.ok) {
                const data = await response.json();
                const updatedUser = data.user || data.data;
                setUsers(users.map(user => (user._id === id ? updatedUser : user)));
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
            setUpdatingUser(null);
        }
    };

    const handleRoleChange = (value) => {
        setEditedUserRoles(Array.isArray(value) ? value : [value]);
    };

    const filteredUsers = users.filter(user => {
        const username = user.username || user.name || '';
        const email = user.email || '';
        const searchLower = searchTerm.toLowerCase();
        return username.toLowerCase().includes(searchLower) || 
               email.toLowerCase().includes(searchLower);
    });

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center">
                        <UserCheck className="mr-2 h-6 w-6" />
                        User Roles Management
                    </CardTitle>
                    <CardDescription>
                        Assign roles to users to manage their permissions and access control
                    </CardDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users by name or email..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
            {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Loading users and roles...</span>
                        </div>
                    ) : (
                        <Table>
                            <TableCaption>A list of all users and their assigned roles</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">User</TableHead>
                                    <TableHead>Current Roles</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8">
                                            No users found. Try adjusting your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map(user => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    {user.username || user.name}
                                                    {user.email && (
                                                        <div className="text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                            {editingUserId === user._id ? (
                                    <Select
                                        value={editedUserRoles}
                                                        onValueChange={handleRoleChange}
                                                        multiple={true}
                                    >
                                                        <SelectTrigger className="w-full">
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
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles && user.roles.length > 0 ? (
                                                            user.roles.map(role => (
                                                                <Badge key={typeof role === 'object' ? role._id : role} variant="outline">
                                                                    {typeof role === 'object' ? role.name : role}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-500">No roles assigned</span>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingUserId === user._id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="default" 
                                                            size="sm" 
                                                            onClick={() => handleUpdateUserRoles(user._id)}
                                                            disabled={updatingUser === user._id}
                                                        >
                                                            {updatingUser === user._id && (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            )}
                                                            Save
                                                        </Button>
                                                        <Button 
                                                            variant="secondary" 
                                                            size="sm" 
                                                            onClick={handleCancelEdit}
                                                            disabled={updatingUser === user._id}
                                                        >
                                                            Cancel
                                                        </Button>
                                </div>
                            ) : (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => handleStartEdit(user)}
                                                    >
                                                        Edit Roles
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserRolesManagement;