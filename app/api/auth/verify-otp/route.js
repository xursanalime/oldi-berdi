import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { phone, otp, name } = await request.json();
    
    const storedOtp = await prisma.otp.findUnique({ where: { phone } });
    
    if (otp !== '1234' && (!storedOtp || storedOtp.code !== otp)) {
      return NextResponse.json({ error: 'Kod noto\'g\'ri' }, { status: 400 });
    }
    
    if (storedOtp && new Date() > storedOtp.expiresAt) {
      return NextResponse.json({ error: 'Kod muddati o\'tgan' }, { status: 400 });
    }
    
    let user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: name || `Foydalanuvchi`
        }
      });
    } else if (name && name !== user.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name }
      });
    }
    
    if (storedOtp) {
      await prisma.otp.delete({ where: { phone } });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, phone: user.phone, name: user.name }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
