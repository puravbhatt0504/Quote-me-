/**
 * Rate Limiter for API calls
 * Implements load shedding to prevent API exhaustion
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimiterConfig {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
}

class RateLimiter {
    private minuteWindow: Map<string, RateLimitEntry> = new Map();
    private hourWindow: Map<string, RateLimitEntry> = new Map();
    private dayWindow: Map<string, RateLimitEntry> = new Map();
    private config: RateLimiterConfig;

    constructor(config: RateLimiterConfig) {
        this.config = config;
    }

    /**
     * Check if request is allowed and update counters
     * @param identifier - Unique identifier for the requester (IP, user ID, etc.)
     * @returns Object with allowed status and remaining limits
     */
    checkLimit(identifier: string = 'global'): {
        allowed: boolean;
        retryAfter?: number;
        remaining: {
            minute: number;
            hour: number;
            day: number;
        };
        message?: string;
    } {
        const now = Date.now();

        // Clean up expired entries
        this.cleanup(now);

        // Check minute limit
        const minuteEntry = this.minuteWindow.get(identifier);
        if (minuteEntry && minuteEntry.count >= this.config.maxRequestsPerMinute) {
            const retryAfter = Math.ceil((minuteEntry.resetTime - now) / 1000);
            return {
                allowed: false,
                retryAfter,
                remaining: {
                    minute: 0,
                    hour: this.getRemainingHour(identifier),
                    day: this.getRemainingDay(identifier),
                },
                message: `Rate limit exceeded. Too many requests per minute. Please wait ${retryAfter} seconds.`,
            };
        }

        // Check hour limit
        const hourEntry = this.hourWindow.get(identifier);
        if (hourEntry && hourEntry.count >= this.config.maxRequestsPerHour) {
            const retryAfter = Math.ceil((hourEntry.resetTime - now) / 1000);
            return {
                allowed: false,
                retryAfter,
                remaining: {
                    minute: this.getRemainingMinute(identifier),
                    hour: 0,
                    day: this.getRemainingDay(identifier),
                },
                message: `Rate limit exceeded. Too many requests this hour. Please wait ${Math.ceil(retryAfter / 60)} minutes.`,
            };
        }

        // Check day limit
        const dayEntry = this.dayWindow.get(identifier);
        if (dayEntry && dayEntry.count >= this.config.maxRequestsPerDay) {
            const retryAfter = Math.ceil((dayEntry.resetTime - now) / 1000);
            return {
                allowed: false,
                retryAfter,
                remaining: {
                    minute: this.getRemainingMinute(identifier),
                    hour: this.getRemainingHour(identifier),
                    day: 0,
                },
                message: `Daily limit reached. Please try again tomorrow. Resets in ${Math.ceil(retryAfter / 3600)} hours.`,
            };
        }

        // Increment counters
        this.incrementCounters(identifier, now);

        return {
            allowed: true,
            remaining: {
                minute: this.getRemainingMinute(identifier),
                hour: this.getRemainingHour(identifier),
                day: this.getRemainingDay(identifier),
            },
        };
    }

    private incrementCounters(identifier: string, now: number): void {
        // Minute counter
        const minuteEntry = this.minuteWindow.get(identifier);
        if (minuteEntry && minuteEntry.resetTime > now) {
            minuteEntry.count++;
        } else {
            this.minuteWindow.set(identifier, {
                count: 1,
                resetTime: now + 60 * 1000, // 1 minute
            });
        }

        // Hour counter
        const hourEntry = this.hourWindow.get(identifier);
        if (hourEntry && hourEntry.resetTime > now) {
            hourEntry.count++;
        } else {
            this.hourWindow.set(identifier, {
                count: 1,
                resetTime: now + 60 * 60 * 1000, // 1 hour
            });
        }

        // Day counter
        const dayEntry = this.dayWindow.get(identifier);
        if (dayEntry && dayEntry.resetTime > now) {
            dayEntry.count++;
        } else {
            this.dayWindow.set(identifier, {
                count: 1,
                resetTime: now + 24 * 60 * 60 * 1000, // 24 hours
            });
        }
    }

    private getRemainingMinute(identifier: string): number {
        const entry = this.minuteWindow.get(identifier);
        if (!entry) return this.config.maxRequestsPerMinute;
        return Math.max(0, this.config.maxRequestsPerMinute - entry.count);
    }

    private getRemainingHour(identifier: string): number {
        const entry = this.hourWindow.get(identifier);
        if (!entry) return this.config.maxRequestsPerHour;
        return Math.max(0, this.config.maxRequestsPerHour - entry.count);
    }

    private getRemainingDay(identifier: string): number {
        const entry = this.dayWindow.get(identifier);
        if (!entry) return this.config.maxRequestsPerDay;
        return Math.max(0, this.config.maxRequestsPerDay - entry.count);
    }

    private cleanup(now: number): void {
        // Clean expired minute entries
        for (const [key, entry] of this.minuteWindow.entries()) {
            if (entry.resetTime <= now) {
                this.minuteWindow.delete(key);
            }
        }

        // Clean expired hour entries
        for (const [key, entry] of this.hourWindow.entries()) {
            if (entry.resetTime <= now) {
                this.hourWindow.delete(key);
            }
        }

        // Clean expired day entries
        for (const [key, entry] of this.dayWindow.entries()) {
            if (entry.resetTime <= now) {
                this.dayWindow.delete(key);
            }
        }
    }

    /**
     * Get current usage statistics
     */
    getUsageStats(identifier: string = 'global'): {
        minute: { used: number; limit: number; remaining: number };
        hour: { used: number; limit: number; remaining: number };
        day: { used: number; limit: number; remaining: number };
    } {
        const minuteEntry = this.minuteWindow.get(identifier);
        const hourEntry = this.hourWindow.get(identifier);
        const dayEntry = this.dayWindow.get(identifier);

        return {
            minute: {
                used: minuteEntry?.count || 0,
                limit: this.config.maxRequestsPerMinute,
                remaining: this.getRemainingMinute(identifier),
            },
            hour: {
                used: hourEntry?.count || 0,
                limit: this.config.maxRequestsPerHour,
                remaining: this.getRemainingHour(identifier),
            },
            day: {
                used: dayEntry?.count || 0,
                limit: this.config.maxRequestsPerDay,
                remaining: this.getRemainingDay(identifier),
            },
        };
    }
}

// Create a singleton rate limiter instance for Gemini API
// Conservative limits to prevent exhaustion:
// - 2 requests per minute (strict free tier limit)
// - 10 requests per hour
// - 50 requests per day
export const geminiRateLimiter = new RateLimiter({
    maxRequestsPerMinute: 2,
    maxRequestsPerHour: 10,
    maxRequestsPerDay: 50,
});

export default RateLimiter;
