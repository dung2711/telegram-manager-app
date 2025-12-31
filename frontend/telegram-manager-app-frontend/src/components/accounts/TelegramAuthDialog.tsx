'use client';

// src/components/accounts/TelegramAuthDialog.tsx

import { useState, FormEvent, useEffect } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { TelegramAuthStep } from '@/types';

interface TelegramAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TelegramAuthDialog({ isOpen, onClose, onSuccess }: TelegramAuthDialogProps) {
  const {
    step,
    phoneNumber,
    isLoading,
    error,
    startLogin,
    submitCode,
    submit2FA,
    reset,
  } = useTelegramAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Reset khi đóng dialog
  useEffect(() => {
    if (!isOpen) {
      reset();
      setPhone('');
      setCode('');
      setPassword('');
      setLocalError('');
    }
  }, [isOpen, reset]);

  // Handle success
  useEffect(() => {
    if (step === TelegramAuthStep.SUCCESS) {
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }, [step, onSuccess, onClose]);

  const handlePhoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!phone.trim()) {
      setLocalError('Phone number is required');
      return;
    }

    if (!phone.startsWith('+')) {
      setLocalError('Phone number must start with +');
      return;
    }

    try {
      await startLogin(phone);
    } catch (err) {
      // Error đã được handle trong hook
    }
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!code.trim()) {
      setLocalError('Verification code is required');
      return;
    }

    try {
      await submitCode(code);
    } catch (err) {
      // Error đã được handle trong hook
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!password) {
      setLocalError('2FA password is required');
      return;
    }

    try {
      await submit2FA(password);
    } catch (err) {
      // Error đã được handle trong hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Add Telegram Account
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2">
            <StepIndicator 
              stepNumber={1} 
              label="Phone" 
              isActive={step === TelegramAuthStep.PHONE}
              isCompleted={step !== TelegramAuthStep.PHONE}
            />
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <StepIndicator 
              stepNumber={2} 
              label="Code" 
              isActive={step === TelegramAuthStep.CODE}
              isCompleted={step === TelegramAuthStep.PASSWORD || step === TelegramAuthStep.SUCCESS}
            />
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <StepIndicator 
              stepNumber={3} 
              label="2FA" 
              isActive={step === TelegramAuthStep.PASSWORD}
              isCompleted={step === TelegramAuthStep.SUCCESS}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {/* Step 1: Phone Number */}
          {step === TelegramAuthStep.PHONE && (
            <form onSubmit={handlePhoneSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+84123456789"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter your phone number with country code (e.g., +84 for Vietnam)
              </p>
              {(localError || error) && (
                <p className="mt-2 text-sm text-red-600">{localError || error}</p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Sending code...
                  </>
                ) : (
                  'Send Code'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verification Code */}
          {step === TelegramAuthStep.CODE && (
            <form onSubmit={handleCodeSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Check your Telegram app for the verification code sent to {phoneNumber}
              </p>
              {(localError || error) && (
                <p className="mt-2 text-sm text-red-600">{localError || error}</p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>
          )}

          {/* Step 3: 2FA Password */}
          {step === TelegramAuthStep.PASSWORD && (
            <form onSubmit={handlePasswordSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2FA Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your 2FA password"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Your account has 2-step verification enabled. Please enter your password.
              </p>
              {(localError || error) && (
                <p className="mt-2 text-sm text-red-600">{localError || error}</p>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Verifying...
                  </>
                ) : (
                  'Verify Password'
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === TelegramAuthStep.SUCCESS && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Account Connected!
              </h3>
              <p className="text-sm text-gray-600">
                Your Telegram account has been successfully added.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ 
  stepNumber, 
  label, 
  isActive, 
  isCompleted 
}: { 
  stepNumber: number; 
  label: string; 
  isActive: boolean; 
  isCompleted: boolean; 
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isCompleted
            ? 'bg-green-600 text-white'
            : isActive
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {isCompleted ? '✓' : stepNumber}
      </div>
      <span className="text-xs mt-1 text-gray-600">{label}</span>
    </div>
  );
}

// Spinner Component
function Spinner() {
  return (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}