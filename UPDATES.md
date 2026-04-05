# Masters 2026 Sweepstake - Updated Features

## ðŸŽ‰ Major Updates Implemented

### âœ… **1. Self-Registration with Email**
**What Changed:**
- Participants can now add themselves to the draft
- Email address is required and validated
- Each email can only register once
- 6-12 participant limit enforced

**How It Works:**
1. Go to Draft tab
2. Enter name and email
3. Click "Join Draft"
4. See yourself added to the participants list

**Email Storage:**
- Emails are stored with each participant
- Will be used for automated notifications (future feature)
- Displayed in team rosters

---

### âœ… **2. Automatic Player Count Calculation**
**What Changed:**
- No more manual "players per team" setting
- System automatically distributes all 103 golfers evenly
- Adjusts based on number of participants (6-12)

**How It Works:**
- After 2 rounds of snake draft, remaining golfers auto-assigned
- Each team gets equal number of players (or within 1)
- Fair distribution guaranteed

---

### âœ… **3. Live Snake Draft with 4-Hour Timer**
**What Changed:**
- Full live draft interface implemented
- **12 hours per pick** (was 60 seconds)
- Real-time countdown timer
- Visual display of current picker
- Email address shown for current picker

**Draft Flow:**
1. **Signup Phase:** Participants join (6-12 needed)
2. **Close Signup:** Admin locks participants, randomizes draft order
3. **Live Draft:** 2 rounds snake draft (12 hours per pick)
   - Round 1: 1â†’2â†’3â†’4â†’5â†’6
   - Round 2: 6â†’5â†’4â†’3â†’2â†’1 (snake)
4. **Auto-Pick:** Remaining golfers assigned by tier/rank

**Features:**
- Search/filter available golfers
- See draft board with all picks
- Auto-pick if timer expires
- Cannot undo (maintains draft integrity)

---

### âœ… **4. Tier-Based Auto-Pick System**
**What Changed:**
- After 2 manual rounds, system auto-assigns remaining golfers
- Uses OWGR (Official World Golf Ranking) tiers
- Number of tiers = number of participants
- Randomized within each tier for fairness

**How It Works:**
```
Example with 6 participants:
- Manual Picks: 12 golfers (2 rounds Ã— 6 people)
- Remaining: 91 golfers
- Tiers: 15 tiers (91 Ã· 6 = ~15 per team)
- Assignment: Each team gets 1 from each tier, randomized
```

**Benefits:**
- Fair distribution by skill level
- No manual work needed
- Balanced teams
- Uses real golf rankings

---

### âœ… **5. CSV Score Import**
**What Changed:**
- Simple CSV paste for updating scores
- No more manual score entry
- Handles missed cuts automatically

**CSV Format:**
```csv
Rory McIlroy, -11, false
Justin Rose, -11, false
Tiger Woods, 2, true
```

**Fields:**
1. Player Name (fuzzy match)
2. Score (use "E" for even, "-5" for under, "+3" for over)
3. Missed Cut (true/false, yes/no, t/f)

**How to Use:**
1. Go to Leaderboard tab
2. Paste CSV data in text box
3. Click "Import Scores"
4. System finds players and updates scores
5. Leaderboard refreshes automatically

---

## ðŸ“§ Email Integration (Coming Next Session)

**Planned Features:**
- Email sent when it's your pick (4-hour reminder)
- Email when your pick time is running out (1 hour warning)
- Email when draft is complete with your roster
- Email with leaderboard updates

**Current Status:**
- Email addresses collected and stored
- Placeholder functions in code (console.log)
- Ready for email service integration

---

## ðŸŽ¯ How to Use the New System

### **Setup Phase:**
1. Share the website with 6-12 friends
2. Everyone registers with name + email
3. Admin clicks "Close Signup & Start Draft"
4. Draft order is randomized automatically

### **Draft Phase:**
1. Click "Start Live Snake Draft"
2. Each person has 12 hours to pick when it's their turn
3. Search golfers, click SELECT
4. After 2 rounds (12 picks for 6 people), draft continues automatically

### **Auto-Pick Phase:**
1. System automatically assigns remaining golfers
2. Fair distribution by tier
3. Teams complete in seconds

### **Scoring Phase:**
1. During tournament, paste CSV scores in Leaderboard tab
2. View team standings
3. Results tab shows final winner

---

## ðŸ”§ Technical Details

### **File Structure:**
- `index.html` (8.4 KB) - Structure & layout
- `app.js` (393 KB) - All functionality
- `data.js` (11 KB) - Golfer data
- `styles.css` (340 KB) - All styling

### **New Functions Added:**
- `addParticipant()` - Self-registration with email
- `removeParticipant()` - Remove before signup closes
- `closeDraftSignup()` - Lock participants, randomize order
- `calculateAutoPickTiers()` - Calculate tier distribution
- `startSnakeDraft()` - Begin live draft
- `renderLiveDraft()` - Display live draft interface
- `selectGolfer()` - Make a pick
- `startPickTimer()` - 4-hour countdown
- `autoPickForTimeout()` - Auto-pick if time expires
- `completeSnakeDraft()` - Transition to auto-pick
- `executeAutoPick()` - Tier-based auto-assignment
- `importScoresFromCSV()` - Parse and update scores
- `filterLiveGolfers()` - Search during draft

### **Data Storage:**
Everything stored in browser localStorage:
- Participant list with emails
- Draft order
- Pick history
- Team rosters
- Scores
- Draft progress state

**Note:** Data persists in browser. To reset, use browser dev tools or refresh button.

---

## ðŸŽ® Testing Instructions

### **Test Self-Registration:**
1. Open website
2. Add 6 different participants with emails
3. Try adding same email twice (should reject)
4. Try adding 13th participant (should reject)
5. Remove a participant

### **Test Draft Signup:**
1. Add 6-8 participants
2. Click "Close Signup"
3. Verify draft order is randomized
4. Verify you CANNOT add more participants

### **Test Live Draft:**
1. Click "Start Live Snake Draft"
2. Verify 4:00:00 timer starts
3. Search for a golfer
4. Click SELECT on Rory McIlroy
5. Verify next picker appears
6. Make several picks
7. Watch snake pattern (reverse on round 2)

### **Test CSV Import:**
1. Complete draft (or use Quick Auto-Draft for testing)
2. Go to Leaderboard tab
3. Paste test CSV:
```
Rory McIlroy, -5, false
Justin Rose, -3, false
Tiger Woods, 5, true
```
4. Click Import Scores
5. Verify scores updated
6. Check team standings recalculated

---

## ðŸš€ Next Session: Email Automation

**To Implement:**
1. Choose email service (SendGrid, AWS SES, or Mailgun)
2. Add email templates
3. Connect to email API
4. Test notification flow
5. Add email preferences (opt-in/opt-out)

**Email Triggers:**
- Your pick is up (immediate)
- 1 hour remaining warning
- You auto-picked (timeout)
- Draft complete (roster summary)
- Daily leaderboard update (optional)
- Tournament winner announcement

---

## ðŸ’¡ Tips

**For Organizers:**
- Test the draft with 6 dummy participants first
- Have CSV ready from official Masters scoring
- Share link early so people can register

**For Participants:**
- Register early to secure your spot
- Check email when draft starts
- Have notifications on during your pick window
- 12 hours is generous but don't wait!

**For Future:**
- Consider adding chat/comments
- Maybe add golfer photos
- Live API feed from Masters (if available)
- Historical statistics

---

## ðŸ“ Known Limitations

1. **Browser-based storage:** Data lost if cache cleared
2. **No user accounts:** Anyone with link can access
3. **No password protection:** Consider adding admin password
4. **Timer accuracy:** Depends on browser staying open
5. **No notifications yet:** Need email service integration

**Workarounds:**
- Export data periodically
- Use private/unlisted URL
- Keep one browser window open as "server"
- Coming in next session!

---

## âœ¨ Summary

You now have a **fully functional** Masters sweepstake system with:
- âœ… Self-registration with email validation
- âœ… Automatic participant limit enforcement  
- âœ… 4-hour pick timer with live countdown
- âœ… 2-round snake draft interface
- âœ… Automated tier-based assignment
- âœ… CSV score import
- âœ… Real-time leaderboard updates
- â³ Email notifications (next session)

**Ready to draft!** ðŸŒï¸â€â™‚ï¸ðŸ†
