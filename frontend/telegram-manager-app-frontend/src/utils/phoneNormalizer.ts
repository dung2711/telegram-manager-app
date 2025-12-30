// src/utils/phoneNormalizer.ts

/**
 * Normalize phone number về format quốc tế
 * Default country code: +84 (Vietnam)
 */
export const normalizePhone = (phone: string, defaultCountryCode = '84'): string => {
  // Remove all spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Nếu đã có +, giữ nguyên
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Nếu bắt đầu bằng 0, thay bằng country code
  if (cleaned.startsWith('0')) {
    return `+${defaultCountryCode}${cleaned.substring(1)}`;
  }
  
  // Nếu bắt đầu bằng country code không có +
  if (cleaned.startsWith(defaultCountryCode)) {
    return `+${cleaned}`;
  }
  
  // Mặc định thêm + và country code
  return `+${defaultCountryCode}${cleaned}`;
};

/**
 * Validate phone number format
 * Rules: 10-15 digits (không tính dấu +)
 */
export const isValidPhone = (phone: string): boolean => {
  // Phải có format: +[digits]
  if (!phone.startsWith('+')) {
    return false;
  }
  
  // Extract digits only
  const digits = phone.substring(1);
  
  // Check length và chỉ chứa số
  if (!/^\d{10,15}$/.test(digits)) {
    return false;
  }
  
  return true;
};

/**
 * Get validation error message
 */
export const getPhoneValidationError = (rawPhone: string): string | undefined => {
  if (!rawPhone || rawPhone.trim().length === 0) {
    return 'Phone number is empty';
  }
  
  const normalized = normalizePhone(rawPhone);
  
  if (!isValidPhone(normalized)) {
    const digits = normalized.replace(/\D/g, '');
    
    if (digits.length < 10) {
      return 'Phone number too short (min 10 digits)';
    }
    if (digits.length > 15) {
      return 'Phone number too long (max 15 digits)';
    }
    
    return 'Invalid phone number format';
  }
  
  return undefined;
};