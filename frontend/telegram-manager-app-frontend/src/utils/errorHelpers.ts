// src/utils/errorHelpers.ts

/**
 * Parse error message từ API response
 */
export const parseApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

/**
 * Check nếu error là "already member"
 */
export const isAlreadyMemberError = (error: string): boolean => {
  const normalizedError = error.toLowerCase();
  return (
    normalizedError.includes('already') ||
    normalizedError.includes('exist') ||
    normalizedError.includes('duplicate')
  );
};

/**
 * Check nếu error là "not found"
 */
export const isNotFoundError = (error: string): boolean => {
  const normalizedError = error.toLowerCase();
  return (
    normalizedError.includes('not found') ||
    normalizedError.includes('does not exist') ||
    normalizedError.includes('invalid')
  );
};

/**
 * Check nếu error là "no permission"
 */
export const isPermissionError = (error: string): boolean => {
  const normalizedError = error.toLowerCase();
  return (
    normalizedError.includes('permission') ||
    normalizedError.includes('forbidden') ||
    normalizedError.includes('access denied') ||
    normalizedError.includes('not allowed')
  );
};

/**
 * Check nếu error là rate limit
 */
export const isRateLimitError = (error: string): boolean => {
  const normalizedError = error.toLowerCase();
  return (
    normalizedError.includes('rate limit') ||
    normalizedError.includes('too many request') ||
    normalizedError.includes('slow down')
  );
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyError = (error: string): string => {
  if (isAlreadyMemberError(error)) {
    return 'User is already a member of this group';
  }
  
  if (isNotFoundError(error)) {
    return 'User not found on Telegram';
  }
  
  if (isPermissionError(error)) {
    return 'No permission to add this user';
  }
  
  if (isRateLimitError(error)) {
    return 'Too many requests. Please wait and try again';
  }
  
  return error;
};

/**
 * Export error list to CSV
 */
export const exportErrorsToCSV = (
  errors: Array<{ identifier: string; error: string }>,
  filename = 'errors.csv'
) => {
  if (errors.length === 0) return;

  const headers = 'Identifier,Error\n';
  const rows = errors
    .map(e => `"${e.identifier}","${getUserFriendlyError(e.error)}"`)
    .join('\n');

  const csv = headers + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};