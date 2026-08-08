import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, newPassword } = await request.json();
    const targetUsername = username || 'Shirantha';
    const passToSet = newPassword || 'shira123456';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passToSet, salt);

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: targetUsername
        }
      }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          isActive: true,
          role: 'admin'
        }
      });
    } else {
      await prisma.user.create({
        data: {
          username: targetUsername,
          passwordHash,
          role: 'admin',
          isActive: true
        }
      });
    }

    return NextResponse.json({ success: true, message: `Password per ${targetUsername} impostata a ${passToSet}` });
  } catch (error) {
    console.error("Force reset error:", error);
    return NextResponse.json({ error: "Errore durante il ripristino della password" }, { status: 500 });
  }
}
