// src/utils/memberFileParser.ts
import { ParsedMember } from '@/types';
import { normalizePhone, getPhoneValidationError } from './phoneNormalizer';

/**
 * Parse CSV file
 * Format: Name,PhoneNumber
 * 
 * @param content - File content
 * @param defaultCountryCode - Default country code (without +)
 * @param strict - Use strict validation
 */
export const parseCSV = (
  content: string,
  defaultCountryCode = '84',
  strict = true
): ParsedMember[] => {
  const lines = content.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  const members: ParsedMember[] = [];

  // Check if has header (first line contains "name" or "phone")
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('name') || firstLine.includes('phone');
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, handle quoted values
    const parts = line.split(',').map(part => 
      part.trim().replace(/^["']|["']$/g, '')
    );

    if (parts.length < 2) {
      members.push({
        name: '',
        phoneNumber: '',
        rawPhone: line,
        lineNumber: i + 1,
        isValid: false,
        validationError: 'Invalid CSV format (expected: Name,PhoneNumber)',
      });
      continue;
    }

    const [name, rawPhone] = parts;
    const phoneNumber = normalizePhone(rawPhone, defaultCountryCode);
    const validationError = getPhoneValidationError(rawPhone, strict);

    members.push({
      name: name || undefined,
      phoneNumber,
      rawPhone,
      lineNumber: i + 1,
      isValid: !validationError,
      validationError,
    });
  }

  return members;
};

/**
 * Parse TXT file
 * Format: One phone number per line
 * 
 * @param content - File content
 * @param defaultCountryCode - Default country code (without +)
 * @param strict - Use strict validation
 */
export const parseTXT = (
  content: string,
  defaultCountryCode = '84',
  strict = true
): ParsedMember[] => {
  const lines = content.trim().split('\n');
  const members: ParsedMember[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawPhone = lines[i].trim();
    if (!rawPhone) continue;

    const phoneNumber = normalizePhone(rawPhone, defaultCountryCode);
    const validationError = getPhoneValidationError(rawPhone, strict);

    members.push({
      phoneNumber,
      rawPhone,
      lineNumber: i + 1,
      isValid: !validationError,
      validationError,
    });
  }

  return members;
};

/**
 * Parse file based on extension
 * 
 * @param file - File to parse
 * @param defaultCountryCode - Default country code (without +)
 * @param strict - Use strict validation
 */
export const parseFile = async (
  file: File,
  defaultCountryCode = '84',
  strict = true
): Promise<ParsedMember[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;

      try {
        const extension = file.name.split('.').pop()?.toLowerCase();
        let members: ParsedMember[];

        if (extension === 'csv') {
          members = parseCSV(content, defaultCountryCode, strict);
        } else if (extension === 'txt') {
          members = parseTXT(content, defaultCountryCode, strict);
        } else {
          reject(new Error('Unsupported file type. Please use .csv or .txt'));
          return;
        }

        resolve(members);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Get summary statistics
 */
export const getMemberStats = (members: ParsedMember[]) => {
  const total = members.length;
  const valid = members.filter(m => m.isValid).length;
  const invalid = total - valid;

  return { total, valid, invalid };
};

/**
 * Export failed members to CSV
 */
export const exportFailedMembers = (members: ParsedMember[], filename = 'failed_members.csv') => {
  const failed = members.filter(m => !m.isValid);
  
  if (failed.length === 0) {
    return;
  }

  const headers = 'Line,Name,Phone,Error\n';
  const rows = failed.map(m => 
    `${m.lineNumber},"${m.name || '-'}","${m.rawPhone}","${m.validationError || '-'}"`
  ).join('\n');

  const csv = headers + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};