// components/PermissionTable.jsx
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


// Zod schema for permission creation/update
const permissionSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string().optional(),
});


const PermissionTable = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editPermissionId, setEditPermissionId] = useState(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(permissionSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/permissions');
            const data = await response.json();
            if (data.success) {
                setPermissions(data.data);
            } else {
                toast.error(data.error || 'Failed to fetch permissions.');
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Error fetching permissions.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePermission = async (permissionId) => {
        try {
            const response = await fetch(`/api/permissions?id=${permissionId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Permission deleted successfully!');
                fetchPermissions();
            } else {
                toast.error(data.error || 'Failed to delete permission.');
            }
        } catch (error) {
            console.error('Error deleting permission:', error);
            toast.error('Error deleting permission.');
        }
    };


    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const method = editPermissionId ? 'PUT' : 'POST';
            const url = editPermissionId ? `/api/permissions?id=${editPermissionId}` : '/api/permissions';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success(`Permission ${editPermissionId ? 'updated' : 'created'} successfully!`);
                fetchPermissions();
                setOpen(false);
                reset();
                setEditPermissionId(null);
            } else {
                toast.error(result.error || `Failed to ${editPermissionId ? 'update' : 'create'} permission`);
            }
        } catch (error) {
            console.error(`Error ${editPermissionId ? 'updating' : 'creating'} permission:`, error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPermission = (permission) => {
        setEditPermissionId(permission._id);
        setValue("name", permission.name);
        setValue("description", permission.description);
        setOpen(true);
    };

    const handleCreatePermissionClick = () => {
        setEditPermissionId(null);
        reset();
        setOpen(true);
    };

    const getDialogTitle = () => {
        return editPermissionId ? "Edit Permission" : "Create Permission";
    };

    const getDialogDescription = () => {
        return editPermissionId ? "Edit an existing permission in the system." : "Add a new permission to the system.";
    };


    if (loading) {
        return <div>Loading permissions...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2>Permissions</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreatePermissionClick}>Create Permission</Button>
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
                                {editPermissionId ? "Update Permission" : "Create Permission"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Table>
                <TableCaption>A list of your current permissions.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {permissions.map((permission) => (
                        <TableRow key={permission._id}>
                            <TableCell className="font-medium">{permission._id}</TableCell>
                            <TableCell>{permission.name}</TableCell>
                            <TableCell>{permission.description || <Badge variant="outline">No Description</Badge>}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="secondary" size="sm" onClick={() => handleEditPermission(permission)}><Pencil className="h-4 w-4 mr-2" />Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeletePermission(permission._id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default PermissionTable;