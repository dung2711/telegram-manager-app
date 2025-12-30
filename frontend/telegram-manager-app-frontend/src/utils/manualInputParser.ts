// src/utils/manualInputParser.ts
import { ParsedMember } from '@/types';
import { normalizePhone, getPhoneValidationError } from './phoneNormalizer';

/**
 * Parse manual input (textarea với nhiều phone numbers)
 * Supports:
 * - One phone per line
 * - Comma-separated phones
 * - Mixed formats
 */
export const parseManualInput = (text: string): ParsedMember[] => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split by newlines first, then by commas
  const lines = text.split('\n');
  const allPhones: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains commas
    if (trimmed.includes(',')) {
      const phones = trimmed.split(',').map(p => p.trim()).filter(Boolean);
      allPhones.push(...phones);
    } else {
      allPhones.push(trimmed);
    }
  }

  // Parse each phone number
  return allPhones.map((rawPhone, idx) => {
    const phoneNumber = normalizePhone(rawPhone);
    const validationError = getPhoneValidationError(rawPhone);

    return {
      phoneNumber,
      rawPhone,
      lineNumber: idx + 1,
      isValid: !validationError,
      validationError,
    };
  });
};

/**
 * Get statistics from manual input
 */
export const getManualInputStats = (members: ParsedMember[]) => {
  const total = members.length;
  const valid = members.filter(m => m.isValid).length;
  const invalid = total - valid;
  const duplicates = total - new Set(members.map(m => m.phoneNumber)).size;

  return { total, valid, invalid, duplicates };
};

/**
 * Remove duplicates from manual input
 */
export const removeDuplicates = (members: ParsedMember[]): ParsedMember[] => {
  const seen = new Set<string>();
  return members.filter(member => {
    if (seen.has(member.phoneNumber)) {
      return false;
    }
    seen.add(member.phoneNumber);
    return true;
  });
};