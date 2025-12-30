'use client';

import { useState } from 'react';
import { TelegramAuthState } from '@/types';
import { authService } from '@/services/authService';
import { X, Phone, Lock, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TelegramAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TelegramAuthDialog({
  isOpen,
  onClose,
  onSuccess,
}: TelegramAuthDialogProps) {
  const [authState, setAuthState] = useState<TelegramAuthState>({
    step: 'phone',
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.telegramLogin(phoneNumber);
      
      if (response.data.success) {
        setAuthState({
          step: 'code',
          accountID: response.data.data.accountID,
          phoneNumber,
        });
        toast.success('Verification code sent!');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to send code';
      toast.error(errorMsg);
      setAuthState({ ...authState, error: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim() || !authState.accountID) {
      toast.error('Please enter verification code');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyCode(authState.accountID, code);
      
      if (response.data.success) {
        // Check if 2FA is required
        if (response.data.data?.needPassword) {
          setAuthState({ ...authState, step: 'password' });
          toast('Please enter your 2FA password');
        } else {
          toast.success('Authentication successful!');
          onSuccess();
          handleClose();
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Invalid verification code';
      toast.error(errorMsg);
      setAuthState({ ...authState, error: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim() || !authState.accountID) {
      toast.error('Please enter password');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyPassword(authState.accountID, password);
      
      if (response.data.success) {
        toast.success('Authentication successful!');
        onSuccess();
        handleClose();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Invalid password';
      toast.error(errorMsg);
      setAuthState({ ...authState, error: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAuthState({ step: 'phone' });
    setPhoneNumber('');
    setCode('');
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {authState.step === 'phone' && 'Add Telegram Account'}
            {authState.step === 'code' && 'Enter Verification Code'}
            {authState.step === 'password' && 'Enter 2FA Password'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Phone Number */}
          {authState.step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+84912345678"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Enter your phone number with country code (e.g., +84...)
                </p>
              </div>

              {authState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {authState.error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !phoneNumber.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Verification Code */}
          {authState.step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  We've sent a verification code to <strong>{authState.phoneNumber}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="12345"
                    maxLength={6}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                </div>
              </div>

              {authState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {authState.error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAuthState({ step: 'phone' })}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || code.length < 5}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: 2FA Password */}
          {authState.step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  This account has Two-Factor Authentication enabled. Please enter your password.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2FA Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your 2FA password"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {authState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {authState.error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !password.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Authenticating...' : 'Complete Authentication'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}