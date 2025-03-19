// app/api/assign-permission/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Role from '@/lib/models/Role';
import Permission from '@/lib/models/Permission';

export async function POST(req) {
    await dbConnect();

    try {
        const { roleId, permissionId } = await req.json();

        if (!roleId || !permissionId) {
            return NextResponse.json({ success: false, error: 'Role ID and Permission ID are required' }, { status: 400 });
        }

        const role = await Role.findById(roleId);
        const permission = await Permission.findById(permissionId);

        if (!role) {
            return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
        }

        if (!permission) {
            return NextResponse.json({ success: false, error: 'Permission not found' }, { status: 404 });
        }

        // Check if the permission is already assigned to the role
        if (role.permissions.includes(permissionId)) {
            return NextResponse.json({ success: false, error: 'Permission already assigned to this role' }, { status: 400 });
        }

        role.permissions.push(permissionId);
        await role.save();

        return NextResponse.json({ success: true, message: 'Permission assigned to role successfully' }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    await dbConnect();

    try {
        const { searchParams } = new URL(req.url);
        const roleId = searchParams.get("roleId");
        const permissionId = searchParams.get("permissionId");


        if (!roleId || !permissionId) {
            return NextResponse.json({ success: false, error: 'Role ID and Permission ID are required' }, { status: 400 });
        }

        const role = await Role.findById(roleId);
        if (!role) {
            return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
        }

        // Check if the permission is assigned to the role
        if (!role.permissions.includes(permissionId)) {
            return NextResponse.json({ success: false, error: 'Permission not assigned to this role' }, { status: 400 });
        }

        // Remove the permission from the role's permissions array
        role.permissions = role.permissions.filter(permission => permission.toString() !== permissionId);
        await role.save();

        return NextResponse.json({ success: true, message: 'Permission removed from role successfully' }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}