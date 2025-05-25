import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper function to validate event data
const validateEventData = (data) => {
  const errors = {};
  
  if (!data.title || data.title.trim() === '') {
    errors.title = 'Title is required';
  }
  
  if (!data.eventDate) {
    errors.eventDate = 'Event date is required';
  } else if (new Date(data.eventDate) <= new Date()) {
    errors.eventDate = 'Event date must be in the future';
  }
  
  if (!data.location || data.location.trim() === '') {
    errors.location = 'Location is required';
  }
  
  if (!data.price) {
    errors.price = 'Price is required';
  } else if (isNaN(data.price)) {
    errors.price = 'Price must be a number';
  } else if (parseFloat(data.price) <= 0) {
    errors.price = 'Price must be positive';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
};

// GET all events
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const myEvents = searchParams.get('my-events');
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let events;
    
    if (myEvents) {
      // Get organizer's events
      events = await prisma.event.findMany({
        where: {
          organizerId: decoded.userId,
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
    } else {
      // Get all active events
      events = await prisma.event.findMany({
        where: {
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
    }
    
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
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new event
export async function POST(request) {
  try {
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
    
    const newEvent = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        eventDate: new Date(eventData.eventDate),
        location: eventData.location,
        price: parseFloat(eventData.price),
        organizerId: decoded.userId,
        active: true,
        cancelled: false
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
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description,
      eventDate: newEvent.eventDate,
      location: newEvent.location,
      price: newEvent.price,
      organizerId: newEvent.organizer.id,
      organizerName: newEvent.organizer.fullName,
      organizerRole: newEvent.organizer.role,
      createdAt: newEvent.createdAt,
      updatedAt: newEvent.updatedAt,
      cancellationTime: newEvent.cancellationTime,
      active: newEvent.active,
      cancelled: newEvent.cancelled
    };
    
    return NextResponse.json(formattedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}