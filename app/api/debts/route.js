import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId talab qilinadi' }, { status: 400 });
    }
    
    const where = {
      OR: [
        { creatorId: userId },
        { counterpartyId: userId }
      ]
    };
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const debts = await prisma.debt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: true,
        counterparty: true
      }
    });
    
    const enriched = debts.map(d => ({
      ...d,
      creatorName: d.creator?.name || 'Noma\'lum',
      creatorPhone: d.creator?.phone || '',
      counterpartyName: d.counterparty?.name || 'Noma\'lum',
      counterpartyPhone: d.counterparty?.phone || '',
    }));
    
    return NextResponse.json({ debts: enriched });
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, reason, dueDate, creatorId, counterpartyPhone, creatorRole } = body;
    
    if (!amount || !dueDate || !creatorId || !counterpartyPhone || !creatorRole) {
      return NextResponse.json({ error: 'Barcha maydonlar to\'ldirilishi kerak' }, { status: 400 });
    }
    
    const counterparty = await prisma.user.findUnique({ where: { phone: counterpartyPhone } });
    if (!counterparty) {
      return NextResponse.json({ 
        error: 'Bu telefon raqami bo\'yicha foydalanuvchi topilmadi. Ikkinchi tomon avval ilovada ro\'yxatdan o\'tishi kerak.' 
      }, { status: 404 });
    }
    
    if (counterparty.id === creatorId) {
      return NextResponse.json({ error: 'O\'zingizga qarz yarata olmaysiz' }, { status: 400 });
    }
    
    const debt = await prisma.debt.create({
      data: {
        amount: Number(amount),
        reason: reason || '',
        dueDate,
        creatorId,
        counterpartyId: counterparty.id,
        creatorRole,
        status: 'pending',
        creatorConfirmed: true,
        counterpartyConfirmed: false,
        auditLogs: {
          create: {
            userId: creatorId,
            action: 'created'
          }
        }
      }
    });
    
    return NextResponse.json({ success: true, debt });
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
