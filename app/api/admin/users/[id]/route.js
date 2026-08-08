import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const data = await request.json();

    const updateData = {};
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.autoLogoutEnabled !== undefined) updateData.autoLogoutEnabled = data.autoLogoutEnabled;
    if (data.autoLogoutMinutes !== undefined) updateData.autoLogoutMinutes = Number(data.autoLogoutMinutes);
    
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(data.password, salt);
    }

    // Previeni che l'unico admin venga disabilitato
    if (data.isActive === false || (data.role && data.role !== 'admin')) {
      const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
      if (userToUpdate.role === 'admin') {
        const adminCount = await prisma.user.count({ where: { role: 'admin', isActive: true } });
        if (adminCount <= 1) {
          return NextResponse.json({ error: "Non puoi disabilitare l'unico amministratore" }, { status: 400 });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, role: true, isActive: true, autoLogoutEnabled: true, autoLogoutMinutes: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT user error:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento dell'utente" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
    if (userToDelete.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Non puoi eliminare l'unico amministratore" }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE user error:", error);
    return NextResponse.json({ error: "Errore nell'eliminazione dell'utente" }, { status: 500 });
  }
}
