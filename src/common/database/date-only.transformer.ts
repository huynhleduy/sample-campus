import { ValueTransformer } from 'typeorm';

/**
 * Transformer to handle date-only values in UTC+7 timezone
 * Stores dates as strings in YYYY-MM-DD format
 */
export class DateOnlyTransformer implements ValueTransformer {
  // From database to entity
  from(value: any): string | null {
    if (!value) return null;

    if (value instanceof Date) {
      // Convert to UTC+7 and format as YYYY-MM-DD
      const date = new Date(value);
      const utcPlus7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return utcPlus7.toISOString().split('T')[0];
    }

    if (typeof value === 'string') {
      return value.split('T')[0]; // Return just the date part
    }

    return value;
  }

  // From entity to database
  to(value: any): string | null {
    if (!value) return null;

    if (typeof value === 'string') {
      // Ensure it's in YYYY-MM-DD format
      return value.split('T')[0];
    }

    if (value instanceof Date) {
      const utcPlus7 = new Date(value.getTime() + 7 * 60 * 60 * 1000);
      return utcPlus7.toISOString().split('T')[0];
    }

    return value;
  }
}
