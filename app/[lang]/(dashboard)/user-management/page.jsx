// components/UserManagement.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Search,
    UserPlus,
    Users,
    Mail,
    User as UserIcon,
    Edit,
    Trash,
    MoreHorizontal,
    UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Zod schema for user creation/update
const userSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
    roles: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userRoles, setUserRoles] = useState({});

    const createForm = useForm({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            roles: [],
            isActive: true,
        },
        mode: "onChange",
    });

    const editForm = useForm({
        resolver: zodResolver(userSchema.omit({ password: true })),
        defaultValues: {
            name: '',
            email: '',
            roles: [],
            isActive: true,
        },
        mode: "onChange",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersResponse, rolesResponse] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/roles')
            ]);

            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                const usersList = usersData.users || usersData.data || [];
                setUsers(usersList);

                // Initialize userRoles state
                const initialUserRoles = {};
                usersList.forEach(user => {
                    initialUserRoles[user._id] = user.roles?.map(role =>
                        typeof role === 'object' ? role._id : role
                    ) || [];
                });
                setUserRoles(initialUserRoles);
            } else {
                toast.error("Failed to load users.");
            }

            if (rolesResponse.ok) {
                const rolesData = await rolesResponse.json();
                setRoles(rolesData.roles || rolesData.data || []);
            } else {
                toast.error("Failed to load roles.");
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error fetching data.');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (userId, roleIds) => {
        setUserRoles(prev => ({
            ...prev,
            [userId]: Array.isArray(roleIds) ? roleIds : [roleIds],
        }));
    };

    const handleSaveRoles = async (userId) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/users`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    roleIds: userRoles[userId] || []
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('User roles updated successfully!');
                // Update the user in the state with the returned updated user
                setUsers(users.map(user =>
                    user._id === userId ? data.user : user
                ));
            } else {
                toast.error(data.error || 'Failed to update user roles.');
            }
        } catch (error) {
            console.error('Error updating user roles:', error);
            toast.error('Error updating user roles.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const name = user.name || '';
        const email = user.email || '';

        return name.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower);
    });

    const openEditDialog = (user) => {
        setCurrentUser(user);
        editForm.reset({
            name: user.name,
            email: user.email,
            roles: user.roles?.map(role => role._id || role) || [], // Ensure role._id exists
            isActive: user.isActive !== false,
        });
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (user) => {
        setCurrentUser(user);
        setDeleteDialogOpen(true);
    };

    const handleCreateUser = async (data) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("User created successfully!");
                fetchData();  // Refresh user list
                setCreateDialogOpen(false);
                createForm.reset();
            } else {
                toast.error(result.error || "Failed to create user");
            }
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async (data) => {
        if (!currentUser) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/users/${currentUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    roles: data.roles || [] //Ensure roles are sent
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("User updated successfully!");
                fetchData();  // Refresh user list
                setEditDialogOpen(false);
            } else {
                toast.error(result.error || "Failed to update user");
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!currentUser) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/users/${currentUser._id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("User deleted successfully!");
                fetchData();  // Refresh user list
                setDeleteDialogOpen(false);
            } else {
                toast.error(result.error || "Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to get user initials for avatar
    const getUserInitials = (name) => {
        if (!name) return "U";
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full py-20">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <p>Loading user data...</p>
            </div>
        );
    }
    // console.log(roles, "roles from upddate");
    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl flex items-center">
                                <Users className="mr-2 h-6 w-6" />
                                User Management
                            </CardTitle>
                            <CardDescription>
                                Manage user accounts, roles and permissions
                            </CardDescription>
                        </div>

                    </div>
                    <div className="relative mt-4">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users by name, email or username..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredUsers.length === 0 ? (
                        <Alert>
                            <Users className="h-4 w-4" />
                            <AlertTitle>No users found</AlertTitle>
                            <AlertDescription>
                                {searchTerm
                                    ? "No users match your search criteria. Try adjusting your search."
                                    : "There are no users in the system yet. Create your first user to get started."}
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Table>
                            <TableCaption>A list of all users in the system</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.map(role => (
                                                    <Badge
                                                        key={role._id}
                                                        variant="secondary"
                                                        className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                                                    >
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive !== false ? "success" : "secondary"}>
                                                {user.isActive !== false ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openDeleteDialog(user)}>
                                                        <Trash className="h-4 w-4 mr-2" />
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Edit User Dialog */}
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                    Update user information and roles.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={editForm.handleSubmit(handleUpdateUser)} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input
                                        id="edit-name"
                                        disabled={isSubmitting}
                                        className={cn({ "border-destructive": editForm.formState.errors.name })}
                                        {...editForm.register("name")}
                                    />
                                    {editForm.formState.errors.name && (
                                        <p className="text-sm text-destructive mt-1">{editForm.formState.errors.name?.message}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        disabled={isSubmitting}
                                        className={cn({ "border-destructive": editForm.formState.errors.email })}
                                        {...editForm.register("email")}
                                    />
                                    {editForm.formState.errors.email && (
                                        <p className="text-sm text-destructive mt-1">{editForm.formState.errors.email?.message}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-roles">Roles</Label>
                                    <Select
                                        value={editForm.watch("roles")}
                                        onValueChange={(value) => {
                                            editForm.setValue("roles", value);
                                        }}
                                        multiple
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select roles">
                                                {editForm.watch("roles")?.length > 0
                                                    ? roles
                                                        .filter(role => (editForm.watch("roles") || []).includes(role._id))
                                                        .map(role => role.name)
                                                        .join(", ")
                                                    : "Select roles"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(role => (
                                                <SelectItem
                                                    key={role._id}
                                                    value={role._id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span>{role.name}</span>
                                                    <span className="text-xs text-muted-foreground">({role.description})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-isActive"
                                        checked={editForm.watch("isActive")}
                                        onCheckedChange={value => editForm.setValue("isActive", value)}
                                    />
                                    <Label htmlFor="edit-isActive">Active Account</Label>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" type="button" onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update User
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Delete User</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this user? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                {currentUser && (
                                    <Alert className="mb-4">
                                        <AlertTitle>Warning</AlertTitle>
                                        <AlertDescription>
                                            Deleting user "{currentUser.name}" ({currentUser.email}) will permanently remove all their data and access.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteUser}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserManagement;