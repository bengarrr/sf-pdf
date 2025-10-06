// lib/auth/session.js

/**
 * Get the current user session from localStorage
 */
export function getSession() {
  if (typeof window === 'undefined') return null;
  
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return null;
    
    const user = JSON.parse(userStr);
    return { token, user };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Set user session in localStorage
 */
export function setSession(token, user) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error setting session:', error);
  }
}

/**
 * Clear user session from localStorage
 */
export function clearSession() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const session = getSession();
  return !!session?.token;
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders() {
  const session = getSession();
  
  if (!session?.token) {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.token}`,
  };
}