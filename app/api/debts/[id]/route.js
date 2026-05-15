import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        creator: true,
        counterparty: true,
        auditLogs: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    
    if (!debt) {
      return NextResponse.json({ error: 'Qarz topilmadi' }, { status: 404 });
    }
    
    const responseData = {
      debt: {
        ...debt,
        creatorName: debt.creator?.name || 'Noma\'lum',
        creatorPhone: debt.creator?.phone || '',
        counterpartyName: debt.counterparty?.name || 'Noma\'lum',
        counterpartyPhone: debt.counterparty?.phone || '',
      },
      logs: debt.auditLogs,
    };
    
    // Convert array field back to JSON for frontend compatibility if needed
    if (debt.closeRequestedBy) {
      responseData.debt._closeConfirms = [debt.closeRequestedBy];
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { action, userId } = await request.json();
    
    if (!action || !userId) {
      return NextResponse.json({ error: 'action va userId talab qilinadi' }, { status: 400 });
    }
    
    const debt = await prisma.debt.findUnique({ where: { id } });
    if (!debt) return NextResponse.json({ error: 'Qarz topilmadi' }, { status: 404 });
    
    let updatedDebt;
    
    switch (action) {
      case 'confirm':
        if (debt.counterpartyId === userId) {
          const bothConfirmed = debt.creatorConfirmed;
          updatedDebt = await prisma.debt.update({
            where: { id },
            data: {
              counterpartyConfirmed: true,
              ...(bothConfirmed ? { status: 'active', confirmedAt: new Date() } : {}),
              auditLogs: { create: { userId, action: 'confirmed' } }
            }
          });
        }
        break;
        
      case 'reject':
        updatedDebt = await prisma.debt.update({
          where: { id },
          data: {
            status: 'cancelled',
            auditLogs: { create: { userId, action: 'rejected' } }
          }
        });
        break;
        
      case 'close':
        // If someone already requested close, and this is the other party
        if (debt.closeRequestedBy && debt.closeRequestedBy !== userId) {
          updatedDebt = await prisma.debt.update({
            where: { id },
            data: {
              status: 'closed',
              closedAt: new Date(),
              auditLogs: { create: { userId, action: 'closed' } }
            }
          });
        } else {
          // First person to request close
          updatedDebt = await prisma.debt.update({
            where: { id },
            data: {
              closeRequestedBy: userId,
              auditLogs: { create: { userId, action: 'close_requested' } }
            }
          });
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Noto\'g\'ri amal' }, { status: 400 });
    }
    
    if (updatedDebt && updatedDebt.closeRequestedBy) {
      updatedDebt._closeConfirms = [updatedDebt.closeRequestedBy];
    }
    
    return NextResponse.json({ success: true, debt: updatedDebt || debt });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
