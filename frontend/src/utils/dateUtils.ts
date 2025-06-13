import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format a date string or Date object to a readable format
 */
export const formatDate = (date: string | Date, formatString = 'MMM d, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatString) : 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format a date to show relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? formatDistanceToNow(dateObj, { addSuffix: true }) : 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format a date for datetime-local input
 */
export const formatDateTimeLocal = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, "yyyy-MM-dd'T'HH:mm") : '';
  } catch {
    return '';
  }
};

/**
 * Check if a date is overdue
 */
export const isOverdue = (dueDate: string | Date): boolean => {
  try {
    const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    return isValid(dateObj) && dateObj < new Date();
  } catch {
    return false;
  }
};

/**
 * Get days until due date
 */
export const getDaysUntilDue = (dueDate: string | Date): number => {
  try {
    const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    if (!isValid(dateObj)) return 0;
    
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};
