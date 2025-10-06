// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getUserByEmail } from '../../db';

// Simple in-memory rate limiter (use Redis in production)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

function checkRateLimit(email) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, firstAttempt: now };
  
  // Reset if lockout time has passed
  if (now - attempts.firstAttempt > LOCKOUT_TIME) {
    loginAttempts.delete(email);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const timeRemaining = Math.ceil((LOCKOUT_TIME - (now - attempts.firstAttempt)) / 1000 / 60);
    return { 
      allowed: false, 
      remainingAttempts: 0,
      lockoutMinutes: timeRemaining
    };
  }
  
  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS - attempts.count 
  };
}

function recordFailedAttempt(email) {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, firstAttempt: now };
  
  loginAttempts.set(email, {
    count: attempts.count + 1,
    firstAttempt: attempts.firstAttempt,
  });
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    const { email, password, rememberMe } = validationResult.data;
    const normalizedEmail = email.toLowerCase();
    
    // Check rate limit
    const rateLimit = checkRateLimit(normalizedEmail);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: `Too many login attempts. Please try again in ${rateLimit.lockoutMinutes} minutes.` 
        },
        { status: 429 }
      );
    }
    
    // Find user
    const user = await getUserByEmail(email);
    
    if (!user) {
      recordFailedAttempt(normalizedEmail);
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          remainingAttempts: rateLimit.remainingAttempts - 1
        },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      recordFailedAttempt(normalizedEmail);
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          remainingAttempts: rateLimit.remainingAttempts - 1
        },
        { status: 401 }
      );
    }
    
    // Clear failed attempts on successful login
    clearAttempts(normalizedEmail);
    
    // Generate JWT token
    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );
    
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: {
            id: user.id, 
            email: user.email 
        },
        token
      },
      { status: 200 }
    );
    
    // Set HTTP-only cookie
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge,
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}