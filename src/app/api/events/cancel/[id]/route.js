import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'ORGANIZER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if event exists and belongs to the organizer
    const existingEvent = await prisma.event.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingEvent) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }
    
    if (existingEvent.organizerId !== decoded.userId) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Check if event is already cancelled
    if (existingEvent.cancelled) {
      return NextResponse.json(
        { message: 'Event is already cancelled' },
        { status: 400 }
      );
    }
    
    // Cancel event
    const cancelledEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { 
        cancelled: true,
        cancellationTime: new Date()
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
    const formattedEvent = {
      id: cancelledEvent.id,
      title: cancelledEvent.title,
      description: cancelledEvent.description,
      eventDate: cancelledEvent.eventDate,
      location: cancelledEvent.location,
      price: cancelledEvent.price,
      organizerId: cancelledEvent.organizer.id,
      organizerName: cancelledEvent.organizer.fullName,
      organizerRole: cancelledEvent.organizer.role,
      createdAt: cancelledEvent.createdAt,
      updatedAt: cancelledEvent.updatedAt,
      cancellationTime: cancelledEvent.cancellationTime,
      active: cancelledEvent.active,
      cancelled: cancelledEvent.cancelled
    };
    
    return NextResponse.json(
      { message: 'Event cancelled successfully', event: formattedEvent },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling event:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}