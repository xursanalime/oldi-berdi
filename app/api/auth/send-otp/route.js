import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { phone } = await request.json();
    
    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: 'Telefon raqami noto\'g\'ri' }, { status: 400 });
    }
    
    // Demo mode: OTP is always 1234
    const code = '1234';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    await prisma.otp.upsert({
      where: { phone },
      update: { code, expiresAt },
      create: { phone, code, expiresAt }
    });
    
    console.log(`[OTP] ${phone}: ${code}`);
    
    return NextResponse.json({ success: true, message: 'SMS kod yuborildi' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
