# Masters Tournament 2026 - Golf Sweepstake

## File Structure

Your project has been split into organized, maintainable files:

### Main Files:
- **index.html** - The main HTML structure (clean, readable, ~150 lines)
- **styles.css** - All CSS styling (~1,500 lines)
- **app.js** - All JavaScript functionality (~1,800 lines)
- **data.js** - Golfer data array (~110 lines)
- **WhatsApp_Image_20260109_at_16_30_10.jpeg** - Hero header photo

### How It Works:

The `index.html` file links to all other files:
```html
<link rel="stylesheet" href="styles.css">
<script src="data.js"></script>
<script src="app.js"></script>
```

**All files must be in the same folder** for the links to work properly.

## Features

✅ **Draft Tab** - Snake draft with participant management
✅ **Teams Tab** - View all team rosters
✅ **Leaderboard Tab** - Live scoring and standings
✅ **Results Tab** - Final tournament results and statistics

## Making Changes

When you want to edit something, tell Claude what you want to change:

### Style Changes (styles.css):
- "Make the buttons bigger"
- "Change the header color to blue"
- "Make the cards have more spacing"

### Functionality Changes (app.js):
- "Add a timer to the draft"
- "Make the undo button work differently"
- "Add a search filter to the golfer list"

### Content Changes (data.js):
- "Update the golfer scores"
- "Add new golfers to the list"
- "Remove certain players"

### Structure Changes (index.html):
- "Add a new section"
- "Rearrange the tabs"
- "Add a footer"

## Benefits of This Structure

1. **Smaller Files** - Much easier to work with and faster to load
2. **Organization** - Everything has its place
3. **Maintainability** - Easy to find and fix things
4. **Scalability** - Room to add more features
5. **Best Practice** - Industry-standard approach

## Adding New Features

Claude will automatically know which file to edit based on what you're asking for. For example:

- **Visual changes** → styles.css
- **New buttons/behavior** → app.js
- **New golfers** → data.js
- **New sections** → index.html

Just describe what you want, and Claude will handle it!

## Total Size Comparison

**Before:** 1 file (737KB, 3,390 lines)
**After:** 4 files (much more manageable!)
- index.html: ~6KB
- styles.css: ~60KB
- app.js: ~70KB
- data.js: ~7KB

**Total: ~143KB** (plus the image)

The new structure is cleaner, faster, and much easier to work with! 🎉
