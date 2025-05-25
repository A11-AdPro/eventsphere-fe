import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET single event by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const event = await prisma.event.findUnique({
      where: {
        id: parseInt(id),
        active: true
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
    
    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Format response
    const formattedEvent = {
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
    };
    
    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update event
export async function PUT(request, { params }) {
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
    
    const eventData = await request.json();
    const validationErrors = validateEventData(eventData);
    
    if (validationErrors) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validationErrors },
        { status: 400 }
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
    
    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title: eventData.title,
        description: eventData.description,
        eventDate: new Date(eventData.eventDate),
        location: eventData.location,
        price: parseFloat(eventData.price)
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
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      eventDate: updatedEvent.eventDate,
      location: updatedEvent.location,
      price: updatedEvent.price,
      organizerId: updatedEvent.organizer.id,
      organizerName: updatedEvent.organizer.fullName,
      organizerRole: updatedEvent.organizer.role,
      createdAt: updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt,
      cancellationTime: updatedEvent.cancellationTime,
      active: updatedEvent.active,
      cancelled: updatedEvent.cancelled
    };
    
    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE event (soft delete)
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
    
    // Soft delete
    await prisma.event.update({
      where: { id: parseInt(id) },
      data: { active: false }
    });
    
    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}