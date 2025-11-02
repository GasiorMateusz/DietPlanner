/**
 * Formats an ISO timestamp string to a readable date format.
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Formatted date string (e.g., "January 15, 2024")
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Formats an ISO timestamp string to a relative time format.
 *
 * @param isoString - ISO 8601 timestamp string
 * @returns Relative time string (e.g., "2 days ago", "1 week ago")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) {
      return "just now";
    }
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    }
    if (diffWeeks < 4) {
      return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
    }
    if (diffMonths < 12) {
      return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
    }

    return formatDate(isoString);
  } catch {
    return "Invalid date";
  }
}
