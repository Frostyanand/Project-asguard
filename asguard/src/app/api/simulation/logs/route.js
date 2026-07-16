import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get('houseId');

    if (!houseId) {
      return NextResponse.json({ error: 'houseId is required' }, { status: 400 });
    }

    // Fetch all logs for this house, ordered chronologically
    const logs = await prisma.energyLog.findMany({
      where: {
        houseId: houseId
      },
      orderBy: {
        timestamp: 'asc'
      },
      include: {
        room: true,
        appliance: true
      }
      // Since it's ~21,600 rows, this will be around ~3-5MB of JSON.
      // Next.js response will gzip it automatically.
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching simulation logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}
