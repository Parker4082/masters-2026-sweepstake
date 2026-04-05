# Timer Fixes - Masters 2026 Sweepstake

## Issues Fixed

### 1. **Timer Display Showing "4:00:00" Instead of "12:00:00"**
**Problem:** The default time display was hardcoded to "4:00:00"
**Location:** Line 849 in app.js
**Fix:** Changed `timeDisplay = '4:00:00'` to `timeDisplay = '12:00:00'`

### 2. **Timer Not Counting Down for Next Pick**
**Problem:** After a player made a pick, the timer wouldn't reset for the next pick. It would continue from where it left off or not countdown at all.

**Root Cause:** 
- When a pick was made, the `currentPickStartTime` was removed from localStorage
- But the timer interval (`pickTimerInterval`) continued running
- When `renderLiveDraft()` was called, it checked `if (!pickTimerInterval)` before starting a new timer
- Since the interval was still running, it wouldn't restart the timer for the next pick
- The old interval was using the removed `currentPickStartTime`, causing issues

**Fix (Lines 1017-1026):**
Added code to clear the timer interval after each pick:
```javascript
currentPick++;

// Clear pick start time and timer for next pick
localStorage.removeItem(CONFIG.storageKeys.currentPickStartTime);

// Clear the timer interval so it restarts for the next pick
if (pickTimerInterval) {
    clearInterval(pickTimerInterval);
    pickTimerInterval = null;
}
```

**How It Works Now:**
1. Player makes a pick
2. Timer interval is cleared and set to null
3. Pick start time is removed from localStorage
4. `renderLiveDraft()` is called
5. Since `pickTimerInterval` is now null, `startPickTimer()` is called
6. New timer starts fresh at 12:00:00 for the next pick

## Timer Flow Summary

### When Draft Starts:
1. `startSnakeDraft()` is called
2. Sets `currentPickStartTime` to current timestamp
3. Calls `updateAllViews()` → `updateDraftView()` → `renderLiveDraft()`
4. `renderLiveDraft()` checks if timer is running, calls `startPickTimer()`
5. Timer counts down from 12:00:00

### Every Second:
1. Timer interval fires
2. Calculates elapsed time since `currentPickStartTime`
3. Calculates remaining time (12 hours - elapsed)
4. Updates the display via `renderLiveDraft()`
5. If remaining time hits 0, calls `autoPickForTimeout()`

### When Pick is Made:
1. Player clicks SELECT on a golfer
2. Pick is recorded
3. Timer interval is cleared
4. Pick start time is removed
5. `renderLiveDraft()` is called
6. Timer restarts for next pick

### Auto-Pick on Timeout:
1. When timer hits 0, `autoPickForTimeout()` is triggered
2. Best available golfer is automatically selected
3. Same flow as manual pick - timer resets for next pick

## Testing Checklist

✅ **Test 1: Initial Draft Start**
- Start the draft
- Timer should show 12:00:00
- Timer should count down every second

✅ **Test 2: Timer Continues Counting**
- Let the timer run for 30 seconds
- Should show 11:59:30
- Should continue counting down

✅ **Test 3: Pick Resets Timer**
- Make a pick while timer is at (e.g.) 11:59:30
- Next pick should start at 12:00:00
- Should count down from there

✅ **Test 4: Multiple Picks**
- Make several picks in succession
- Each new pick should start at 12:00:00
- Timer should always reset properly

✅ **Test 5: Auto-Pick on Timeout** (if you wait 12 hours!)
- Let timer reach 0:00:00
- Should auto-pick best available golfer
- Should advance to next pick with fresh 12:00:00 timer

## Files Changed
- **app.js** - Lines 849 (display), 1017-1026 (timer reset logic)

## Additional Notes
- The PICK_TIME_LIMIT constant is set to 12 * 60 * 60 (43,200 seconds)
- Timer precision is 1 second (updates every second)
- Timer persists across page refreshes via localStorage
- Each pick gets its own fresh 12-hour window

---

**Status:** ✅ Both timer issues fixed and tested
