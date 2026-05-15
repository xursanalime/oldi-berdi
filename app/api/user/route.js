import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId talab qilinadi' }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }
    
    return NextResponse.json({ user: { id: user.id, phone: user.phone, name: user.name } });
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { userId, name } = await request.json();
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }
    
    let updatedUser = user;
    if (name) {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name }
      });
    }
    
    return NextResponse.json({ success: true, user: { id: updatedUser.id, phone: updatedUser.phone, name: updatedUser.name } });
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
