# Admin Panel Documentation

## Overview
Separate admin page for managing the Masters 2026 sweepstake without exposing management tools to regular users.

## Access
**URL:** `yoursite.com/admin.html`
- Not linked from main site
- Bookmark this URL for easy access
- Users won't find it unless they know the exact URL

## Features

### 📊 Score Management
**Import Scores via CSV**
- Same CSV format as before: `Name, Score, Missed Cut`
- Example data can be loaded for testing
- Status messages show import results

**Actions:**
- Import Scores
- Clear Input
- Load Example Data

### 🔧 Diagnostic Tools
**System Status**
- Run diagnostics to check for data issues
- View all localStorage data
- Export backup of all data (JSON file)

**Actions:**
- Run Diagnostics
- View All Data
- Export Backup

### 👥 Participant Management
**Control Signup**
- Add 6 test participants instantly
- Force open signup (even if closed)
- Clear all participants

**Actions:**
- Add 6 Test Participants
- Force Open Signup
- Clear All Participants

### 🎯 Draft Controls
**Manage Live Draft**
- View current draft status
- Force advance to next pick (resets timer)
- Trigger auto-pick immediately
- Reset draft while keeping participants

**Actions:**
- View Draft Status
- Force Next Pick
- Auto-Pick Now
- Reset Draft Only

### ⚠️ Reset Options
**Data Management**
- Reset signup only (keep everything else)
- Reset draft and scores (keep participants)
- Reset everything (nuclear option)

**Warning:** All reset actions are permanent!

**Actions:**
- Reset Signup Only
- Reset Draft & Scores
- 🚨 Reset Everything

### 📈 Quick Stats
**Live Dashboard**
- Shows participant count
- Shows team count
- Shows current status (Open, Closed, In Progress, Complete)
- Updates every 5 seconds automatically

## Changes to Main Site

### Removed from index.html:
- ❌ CSV score import section (was in Leaderboard tab)
- ❌ Diagnostic tool link (was in Draft tab)

### User-facing tabs remain:
- ✅ Draft
- ✅ Teams
- ✅ Form Guide
- ✅ Live Leaderboard (scores only, no import)
- ✅ Results

## Files

### Keep These:
- `admin.html` - Admin panel (bookmark this!)
- `index.html` - Main site (updated, no admin tools)
- `app.js` - Functionality (unchanged)
- `data.js` - Golfer data
- `formGuide.js` - Form guide data
- `styles.css` - Styling
- `WhatsApp_Image_20260109_at_16_30_10.jpeg` - Header image

### Optional:
- `DIAGNOSTIC.html` - Old diagnostic tool (can delete or keep as backup)

## Usage Examples

### Before Tournament:
1. Share main site link with friends: `yoursite.com`
2. Friends register themselves
3. You go to `yoursite.com/admin.html`
4. Monitor participants joining
5. When ready, close signup from admin panel

### During Draft:
1. Users pick from main site
2. You monitor from admin panel
3. If someone's stuck, use "Force Next Pick"
4. If someone times out, it auto-picks (or you can trigger it)

### During Tournament:
1. Get scores from Masters.com or other source
2. Go to `yoursite.com/admin.html`
3. Paste CSV in Score Management section
4. Click Import Scores
5. Users see updated leaderboard on main site

### If Something Breaks:
1. Go to admin panel
2. Click "Run Diagnostics"
3. See what's wrong
4. Use appropriate reset option
5. Or export data backup first

## Security Notes

**This is "security through obscurity":**
- No password protection (yet)
- Anyone with the URL can access it
- Fine for friends/family sweepstake
- Don't share the admin URL with participants

**To make it more secure later:**
- We can add password protection
- Could use URL parameter: `admin.html?key=yourSecretKey`
- Could integrate with GitHub Pages authentication

## Tips

**Bookmark the Admin URL:**
- Save `yoursite.com/admin.html` to bookmarks
- Name it "Masters Admin" or similar
- Easy access without remembering URL

**Use Export Backup:**
- Before making major changes
- Export data regularly
- Save backups in safe place
- Can restore if needed

**Monitor Quick Stats:**
- Glance at participant count
- Check draft status
- See if everything's running smoothly

**Test Everything First:**
1. Add test participants
2. Run a test draft
3. Import test scores
4. Reset everything
5. Then go live with real people

## Common Tasks

### Add Test Data:
1. Admin Panel → Participant Management
2. Click "Add 6 Test Participants"
3. Go to main site, start draft
4. Test the flow
5. Return to admin, click "Reset Everything"

### Force Restart Draft:
1. Admin Panel → Reset Options
2. Click "Reset Draft & Scores"
3. Participants stay registered
4. Can start draft fresh

### Import Tournament Scores:
1. Copy scores from source
2. Format as CSV (Name, Score, Missed Cut)
3. Admin Panel → Score Management
4. Paste and import

### Fix Broken State:
1. Admin Panel → Diagnostic Tools
2. Click "Run Diagnostics"
3. Review issues
4. Use appropriate fix/reset

## Future Enhancements

**Could add to admin panel:**
- Manual score editing (individual golfers)
- Edit participant details
- View draft pick history
- Email notification triggers
- Manual email sending
- Tournament schedule display
- Automated score fetching
- Data import/export (full backups)

---

**Status:** ✅ Admin panel complete and functional
**Access:** Bookmark `admin.html` - don't share with users!
