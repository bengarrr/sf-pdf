// app/api/chats/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createChat, getChatsByUser, getUserById } from '../db';

// Validation schema for creating a chat
const createChatSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().optional(),
});

// GET - Retrieve all chats for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const chats = await getChatsByUser(userId);

    return NextResponse.json(
      { chats },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new chat
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createChatSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { userId } = validationResult.data;

    // Verify user exists
    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create new chat
    const chat = await createChat(userId);

    return NextResponse.json(
      { 
        chat: chat,
        message: 'Chat created successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}