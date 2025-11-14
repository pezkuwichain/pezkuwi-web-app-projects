import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Web-specific className utility (uses Tailwind merge)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Re-export formatNumber from shared utils
 */
export { formatNumber } from '@pezkuwi/utils/format';
