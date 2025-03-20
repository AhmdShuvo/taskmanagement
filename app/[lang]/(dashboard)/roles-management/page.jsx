// components/RoleTable.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


// Zod schema for role creation/update
const roleSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string().optional(),
});


const RoleTable = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false); // Dialog state
    const [editRoleId, setEditRoleId] = useState(null); // State to track which role is being edited

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(roleSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/roles');
            const data = await response.json();
            if (data.success) {
                setRoles(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch roles.');
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Error fetching roles.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = async (roleId) => {
        try {
            const response = await fetch(`/api/roles?id=${roleId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Role deleted successfully!');
                fetchRoles(); // Refresh roles after delete
            } else {
                toast.error(data.error || 'Failed to delete role.');
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error('Error deleting role.');
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const method = editRoleId ? 'PUT' : 'POST';
            const url = editRoleId ? `/api/roles?id=${editRoleId}` : '/api/roles';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success(`Role ${editRoleId ? 'updated' : 'created'} successfully!`);
                fetchRoles();  // Refresh the role list
                setOpen(false); // Close the dialog
                reset();        // Clear the form
                setEditRoleId(null); // Reset edit role ID
            } else {
                toast.error(result.error || `Failed to ${editRoleId ? 'update' : 'create'} role`);
            }
        } catch (error) {
            console.error(`Error ${editRoleId ? 'updating' : 'creating'} role:`, error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditRole = (role) => {
        setEditRoleId(role._id);
        setValue("name", role.name);
        setValue("description", role.description);
        setOpen(true);
    };


    const handleCreateRoleClick = () => {
        setEditRoleId(null); // Clear edit role ID when creating a new role
        reset(); // Reset the form
        setOpen(true);
    };

    const getDialogTitle = () => {
        return editRoleId ? "Edit Role" : "Create Role";
    };

    const getDialogDescription = () => {
        return editRoleId ? "Edit an existing role in the system." : "Add a new role to the system.";
    };


    if (loading) {
        return <div>Loading roles...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2>Roles</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreateRoleClick}>Create Role</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{getDialogTitle()}</DialogTitle>
                            <DialogDescription>
                                {getDialogDescription()}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    disabled={isSubmitting}
                                    className={cn({ "border-destructive": errors.name })}
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive mt-1">{errors.name?.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    disabled={isSubmitting}
                                    {...register("description")}
                                />
                            </div>

                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editRoleId ? "Update Role" : "Create Role"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>


            <Table>
                <TableCaption>A list of your current roles.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.map((role) => (
                        <TableRow key={role._id}>
                            <TableCell className="font-medium">{role._id}</TableCell>
                            <TableCell>{role.name}</TableCell>
                            <TableCell>{role.description || <Badge variant="outline">No Description</Badge>}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="secondary" size="sm" onClick={() => handleEditRole(role)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteRole(role._id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default RoleTable;