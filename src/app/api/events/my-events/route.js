import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'ORGANIZER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const events = await prisma.event.findMany({
      where: {
        organizerId: decoded.userId // Hanya ambil event milik organizer yang login
      },
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });
    
    // Format response
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      location: event.location,
      price: event.price,
      organizerId: event.organizer.id,
      organizerName: event.organizer.fullName,
      organizerRole: event.organizer.role,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      cancellationTime: event.cancellationTime,
      active: event.active,
      cancelled: event.cancelled
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching organizer events:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}