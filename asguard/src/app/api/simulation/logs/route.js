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

    return NextResponse.json({ logs }, {
      headers: {
        // Cache in browser and CDN for 1 hour, stale-while-revalidate for 1 day
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching simulation logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error.message },
      { status: 500 }
    );
  }
}
