import { prisma } from '@/lib/prisma';
import { omitRoomPasswordHash } from '@/lib/room';
import { NextResponse } from 'next/server';

// 短いルームIDを生成する関数
function generateShortId(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST() {
  try {
    const data = await prisma.room.create({
      data: {
        short_id: generateShortId(),
      },
    });

    return NextResponse.json(omitRoomPasswordHash(data));
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create room', details: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = await prisma.room.findMany({
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(data.map(omitRoomPasswordHash));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
