// app/api/messages/route.js
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createMessage, getChatById, getMessages, getUserById } from "../db";

// Validation schema
const messageSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
  text: z.string().min(1, 'Message text is required').max(5000, 'Message too long'),
  senderId: z.string().min(1, 'Sender ID is required'),
});

// GET - Retrieve messages for a chat
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    const messages = await getMessages(chatId);

    return NextResponse.json(
      { messages },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new message
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = messageSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { chatId, text, senderId } = validationResult.data;

    // Verify chat exists
    const chat = await getChatById(chatId);

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Verify sender exists
    const sender = await getUserById(senderId);

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    // Create message
    const message = await createMessage({
        authorId: senderId,
        chatId,
        content: text
    })

    return NextResponse.json(
      { 
        message: message,
        success: true 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}