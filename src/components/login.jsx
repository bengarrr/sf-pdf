'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (isSignUp && !name.trim()) {
      newErrors.name = true;
    }
    
    if (!email.trim()) {
      newErrors.email = true;
    }
    
    if (!password) {
      newErrors.password = true;
    }
    
    if (isSignUp && !confirmPassword) {
      newErrors.confirmPassword = true;
    }
    
    if (isSignUp && password && confirmPassword && password !== confirmPassword) {
      newErrors.password = true;
      newErrors.confirmPassword = true;
      setErrors(newErrors);
      showToast('Passwords do not match', 'error');
      return false;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fill in all required fields', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up request
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
            confirmPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Sign up failed');
        }

        // Store session data
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        showToast('Account created successfully!', 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/home');
        }, 1000);

      } else {
        // Login request
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Store session data
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        showToast('Signed in successfully!', 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/home');
        }, 1000);
      }

    } catch (error) {
      console.error('Authentication error:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setErrors({});
  };

  const getInputClass = (fieldName) => {
    const baseClass = "w-full px-3 py-2 border rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
    const errorClass = "border-red-500 dark:border-red-500 focus:ring-red-500";
    const normalClass = "border-gray-300 dark:border-gray-600 focus:ring-blue-500";
    
    return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      {toast && (
        <div className={`fixed top-4 right-4 bg-white dark:bg-gray-800 border-l-4 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in z-50 ${
          toast.type === 'error' 
            ? 'border-red-500 dark:border-red-400' 
            : toast.type === 'success'
            ? 'border-green-500 dark:border-green-400'
            : 'border-blue-500 dark:border-blue-400'
        }`}>
          <p className="text-gray-900 dark:text-white text-sm font-medium">{toast.message}</p>
        </div>
      )}
      
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-all duration-300">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          
          <div className="space-y-6">
            <div 
              className="overflow-hidden transition-all duration-300"
              style={{ 
                maxHeight: isSignUp ? '100px' : '0px',
                opacity: isSignUp ? 1 : 0
              }}
            >
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({...errors, name: false});
                }}
                className={getInputClass('name')}
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({...errors, email: false});
                }}
                className={getInputClass('email')}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({...errors, password: false});
                }}
                className={getInputClass('password')}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div 
              className="overflow-hidden transition-all duration-300"
              style={{ 
                maxHeight: isSignUp ? '100px' : '0px',
                opacity: isSignUp ? 1 : 0
              }}
            >
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({...errors, confirmPassword: false});
                }}
                className={getInputClass('confirmPassword')}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div 
              className="flex items-center justify-between text-sm overflow-hidden transition-all duration-300"
              style={{ 
                maxHeight: isSignUp ? '0px' : '50px',
                opacity: isSignUp ? 0 : 1
              }}
            >
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                Remember me
              </label>
              <button 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                : (isSignUp ? 'Create Account' : 'Sign In')
              }
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={toggleMode}
              disabled={loading}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium transition-colors disabled:opacity-50"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}