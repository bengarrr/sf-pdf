// app/api/auth/signup/route.js (App Router - Next.js 13+)
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createUser, getUserByEmail } from "../../db";

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = signupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { email, password } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await createUser({email, password: hashedPassword});

    // Generate JWT token
    const tokenExpiry = '7d';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );
    
    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
            id: user.id, 
            email: user.email 
        },
        token 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}