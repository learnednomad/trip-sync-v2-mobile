/**
 * Date Utility Functions
 * Epic 2: Story 2.1 - Core Trip Management
 * Date formatting and manipulation utilities
 */

import { format, parseISO } from 'date-fns';

/**
 * Format a date string using date-fns format patterns
 * @param date - ISO date string or Date object
 * @param pattern - date-fns format pattern
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, pattern: string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, pattern);
  } catch (error) {
    console.warn('Invalid date provided to formatDate:', date);
    return 'Invalid Date';
  }
}

/**
 * Format date for display in trip cards and lists
 * @param date - ISO date string or Date object
 * @returns Formatted date string (e.g., "Dec 15, 2024")
 */
export function formatDisplayDate(date: string | Date): string {
  return formatDate(date, 'MMM d, yyyy');
}

/**
 * Format date for short display (e.g., in compact views)
 * @param date - ISO date string or Date object
 * @returns Short formatted date string (e.g., "Dec 15")
 */
export function formatShortDate(date: string | Date): string {
  return formatDate(date, 'MMM d');
}

/**
 * Format date with day of week for detailed views
 * @param date - ISO date string or Date object
 * @returns Full formatted date string (e.g., "Monday, Dec 15, 2024")
 */
export function formatFullDate(date: string | Date): string {
  return formatDate(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Calculate the number of days between two dates
 * @param startDate - Start date (ISO string or Date object)
 * @param endDate - End date (ISO string or Date object)
 * @returns Number of days between the dates
 */
export function getDaysBetween(startDate: string | Date, endDate: string | Date): number {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  } catch (error) {
    console.warn('Invalid dates provided to getDaysBetween:', startDate, endDate);
    return 0;
  }
}

/**
 * Check if a date is in the future
 * @param date - Date to check (ISO string or Date object)
 * @returns True if date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj.getTime() > Date.now();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is today
 * @param date - Date to check (ISO string or Date object)
 * @returns True if date is today
 */
export function isToday(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
}

/**
 * Get relative time description (e.g., "in 3 days", "2 days ago")
 * @param date - Date to compare (ISO string or Date object)
 * @returns Relative time description
 */
export function getRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    
    return formatDisplayDate(date);
  } catch (error) {
    return 'Invalid Date';
  }
}