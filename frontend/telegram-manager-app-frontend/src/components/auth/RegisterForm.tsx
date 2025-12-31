'use client';

// src/components/auth/RegisterForm.tsx

import { useState, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function RegisterForm() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    fullname?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Fullname validation
    if (!fullname.trim()) {
      newErrors.fullname = 'Full name is required';
    } else if (fullname.trim().length < 2) {
      newErrors.fullname = 'Full name must be at least 2 characters';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setIsLoading(true);
      setErrors({});
      await register(username, fullname, password);
      // AuthContext sẽ redirect đến /dashboard
    } catch (error) {
      // Error đã được hiển thị qua toast
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username Input */}
      <div>
        <label htmlFor="register-username" className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          id="register-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Choose a username"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      {/* Full Name Input */}
      <div>
        <label htmlFor="register-fullname" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          id="register-fullname"
          type="text"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
          disabled={isLoading}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.fullname ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your full name"
        />
        {errors.fullname && (
          <p className="mt-1 text-sm text-red-600">{errors.fullname}</p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Create a password (min. 6 characters)"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          id="register-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}