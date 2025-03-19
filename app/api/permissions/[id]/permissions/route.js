export async function PUT(req, { params }) {
    const { id } = params.id;

    await dbConnect();

    try {
        const body = await req.json();
        const { permissionIds } = body; // Expect an array of permission IDs

        if (!Array.isArray(permissionIds)) {
            return NextResponse.json({ message: "permissionIds must be an array" }, { status: 400 });
        }

        const updatedRole = await Role.findByIdAndUpdate(id, { permissions: permissionIds }, { new: true }).populate('permissions'); // Populate permissions for easier access

        if (!updatedRole) {
            return NextResponse.json({ message: "Role not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Role permissions updated successfully", role: updatedRole }, { status: 200 });

    } catch (error) {
        console.error("Role permissions update error:", error);
        return NextResponse.json({ message: "Role permissions update failed", error: error.message }, { status: 500 });
    }
}