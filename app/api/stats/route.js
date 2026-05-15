import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId talab qilinadi' }, { status: 400 });
    }
    
    const debts = await prisma.debt.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { counterpartyId: userId }
        ]
      }
    });

    let totalLent = 0;
    let totalBorrowed = 0;
    let activeCount = 0;
    let pendingCount = 0;
    
    debts.forEach(d => {
      const isLender = (d.creatorId === userId && d.creatorRole === 'lender') ||
                       (d.counterpartyId === userId && d.creatorRole === 'borrower');
      
      if (d.status === 'active' || d.status === 'overdue') {
        activeCount++;
        if (isLender) totalLent += d.amount;
        else totalBorrowed += d.amount;
      }
      
      if (d.status === 'pending') {
        pendingCount++;
      }
    });
    
    return NextResponse.json({ totalLent, totalBorrowed, activeCount, pendingCount });
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
