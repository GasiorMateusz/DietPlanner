# Browser Cache Implementation Plan

## Overview

Implement a localStorage-based caching system to:
- Save plan creation conversations so users can exit and resume
- Survive connection errors with automatic background sync
- Optimize user preferences saving
- Support both create and edit modes
- Clean up cache after successful plan saves

## Architecture

### 1. Cache Service (`src/lib/cache/conversation-cache.service.ts`)

Create a service to manage conversation state in localStorage:

**Key Functions:**
- `saveConversationState(sessionId, state)` - Save conversation state
- `getConversationState(sessionId)` - Retrieve conversation state
- `getActiveConversation()` - Get the most recent active conversation
- `clearConversationState(sessionId)` - Remove conversation from cache
- `clearAllConversations()` - Clean up all cached conversations
- `markForSync(sessionId)` - Mark conversation as needing sync
- `getPendingSyncs()` - Get list of conversations needing sync

**Storage Structure:**
```typescript
interface CachedConversationState {
  sessionId: string;
  messageHistory: ChatMessage[];
  startupData: MealPlanStartupData | MultiDayStartupFormData | null;
  promptCount: number;
  editMode: boolean;
  existingPlanId?: string;
  existingPlanName?: string;
  lastUpdated: number; // timestamp
  needsSync: boolean; // true if there are unsent messages
  pendingUserMessage?: string; // message that failed to send
}
```

**localStorage Keys:**
- `diet-planner-conversation-{sessionId}` - Individual conversation state
- `diet-planner-active-session` - Current active session ID
- `diet-planner-pending-syncs` - Array of session IDs needing sync

### 2. Preferences Cache Service (`src/lib/cache/preferences-cache.service.ts`)

Create a service to cache and optimize preferences:

**Key Functions:**
- `savePreferences(preferences)` - Save preferences locally
- `getPreferences()` - Get cached preferences
- `markForSync()` - Mark preferences as needing sync
- `clearPreferences()` - Clear cached preferences

**Storage Structure:**
```typescript
interface CachedPreferences {
  language?: string;
  theme?: string;
  ai_model?: string;
  lastUpdated: number;
  needsSync: boolean;
}
```

**localStorage Keys:**
- `diet-planner-preferences` - Cached preferences
- `diet-planner-preferences-sync` - Sync flag

### 3. Sync Service (`src/lib/cache/sync.service.ts`)

Create a service to handle automatic background sync:

**Key Functions:**
- `syncConversation(sessionId)` - Sync a single conversation
- `syncAllPending()` - Sync all pending conversations
- `syncPreferences()` - Sync preferences
- `startSyncListener()` - Start listening for online events
- `stopSyncListener()` - Stop sync listener

**Sync Logic:**
- Listen for `online` event
- When connection restored, automatically sync:
  - All conversations marked `needsSync`
  - Preferences if marked for sync
- Retry failed syncs with exponential backoff
- Update cache after successful sync

### 4. Integration Points

#### A. AIChatInterface Component (`src/components/AIChatInterface.tsx`)

**Changes:**
1. **On Mount:**
   - Check for cached conversation state
   - If found and sessionId matches, restore state
   - If sessionId doesn't match or cache is stale, initialize fresh

2. **On State Changes:**
   - Save conversation state to cache after each message
   - Mark as `needsSync: false` after successful API call
   - Mark as `needsSync: true` if API call fails

3. **On Message Send:**
   - Save user message to cache immediately (optimistic update)
   - If API call fails, keep message in cache with `pendingUserMessage`
   - On retry, use cached message

4. **On Successful Save:**
   - Clear conversation cache after plan is saved
   - Clear active session marker

5. **On Component Unmount:**
   - Save current state to cache
   - Mark as active session

#### B. User Preferences Integration

**Update `src/lib/api/user-preferences.client.ts`:**

1. **On Get:**
   - Check cache first, return cached if available
   - Fall back to API if cache miss or stale
   - Update cache after successful API call

2. **On Update:**
   - Update cache immediately (optimistic update)
   - Mark for sync
   - Call API in background
   - If API fails, keep cache and retry sync later

#### C. Startup Form (`src/components/DashboardView.tsx`)

**Changes:**
- Remove direct `sessionStorage` usage
- Use conversation cache service instead
- Save startup data to cache before navigation

### 5. Error Handling

**Connection Error Scenarios:**
1. **Network Error on Send:**
   - Save message to cache with `pendingUserMessage`
   - Mark conversation as `needsSync: true`
   - Show user-friendly error message
   - Auto-retry when connection restored

2. **Network Error on Load:**
   - Use cached conversation if available
   - Show indicator that using cached data
   - Auto-sync when connection restored

3. **Session Not Found:**
   - Check cache for conversation
   - If found, restore and attempt to sync
   - If not found, show error and redirect to dashboard

### 6. Cache Cleanup

**Cleanup Triggers:**
1. **After Successful Plan Save:**
   - Clear conversation cache for that session
   - Clear active session marker
   - Keep preferences cache

2. **On Navigation Away:**
   - Save current state to cache
   - Don't clear (user might come back)

3. **On Explicit Clear:**
   - Provide option to clear all cache (future: settings page)

### 7. Type Definitions

**Add to `src/types.ts`:**
- `CachedConversationState` interface
- `CachedPreferences` interface
- Cache-related types

### 8. Testing Considerations

**Test Scenarios:**
- Save conversation, close tab, reopen - should restore
- Send message with network error - should cache and retry
- Save plan successfully - should clear cache
- Preferences update with network error - should cache and sync
- Multiple conversations - should handle correctly
- Edit mode conversations - should cache same as create mode

## Implementation Order

1. Create cache service types and interfaces
2. Implement conversation cache service
3. Implement preferences cache service
4. Implement sync service
5. Integrate into AIChatInterface
6. Integrate into preferences API client
7. Update DashboardView to use cache
8. Add error handling and retry logic
9. Test all scenarios

## Files to Create

- `src/lib/cache/conversation-cache.service.ts`
- `src/lib/cache/preferences-cache.service.ts`
- `src/lib/cache/sync.service.ts`
- `src/lib/cache/types.ts` (optional, or add to `src/types.ts`)

## Files to Modify

- `src/components/AIChatInterface.tsx`
- `src/lib/api/user-preferences.client.ts`
- `src/components/DashboardView.tsx`
- `src/types.ts` (add cache-related types)

## Notes

- localStorage has ~5-10MB limit (sufficient for conversations)
- Cache keys use prefix `diet-planner-` for namespacing
- Timestamps used for cache invalidation and sync tracking
- Sync happens automatically in background (no user interaction needed)
- Cache is cleared only after successful plan save (not on navigation)

## User Requirements

Based on user input:
1. **Storage mechanism**: localStorage (simpler, but has size limits)
2. **Caching scope**: Active conversation + user preferences
3. **Sync strategy**: Automatically sync with server in background when connection restored
4. **Cleanup policy**: After successful plan save
5. **Edit mode**: Yes, same as create mode

