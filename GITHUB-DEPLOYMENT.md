# GitHub Pages Deployment Guide

## Overview
Deploy your Masters 2026 Sweepstake website for free using GitHub Pages. Your site will be live at `https://yourusername.github.io/masters-2026`

## 🎯 What You'll Get

- ✅ **Free hosting** - No cost, ever
- ✅ **Public URL** - Share with friends
- ✅ **HTTPS** - Secure by default
- ✅ **Easy updates** - Just push changes to GitHub
- ✅ **No server management** - GitHub handles everything

## 📋 Prerequisites

1. GitHub account (free) - create at https://github.com/join
2. Your sweepstake files (all ready in /outputs folder)
3. 10-15 minutes

## 🚀 Deployment Steps

### Option A: Web Interface (Easiest - No Git Knowledge)

#### Step 1: Create Repository (2 minutes)
1. Go to https://github.com
2. Click the **+** icon (top right) → "New repository"
3. Fill in details:
   - **Repository name:** `masters-2026-sweepstake` (or your choice)
   - **Description:** "Masters Tournament 2026 Golf Sweepstake"
   - **Public** (required for free GitHub Pages)
   - ✅ Check "Add a README file"
4. Click "Create repository"

#### Step 2: Upload Files (3 minutes)
1. In your repository, click "Add file" → "Upload files"
2. Drag and drop ALL these files:
   ```
   ├── index.html
   ├── admin.html
   ├── app.js
   ├── data.js
   ├── formGuide.js
   ├── firebase-config.js
   ├── email-config.js
   ├── styles.css
   └── WhatsApp_Image_20260109_at_16_30_10.jpeg
   ```
3. Add commit message: "Initial upload - Masters 2026 Sweepstake"
4. Click "Commit changes"

#### Step 3: Enable GitHub Pages (1 minute)
1. Click "Settings" tab (in your repository)
2. Scroll to "Pages" section (left sidebar)
3. Under "Source":
   - Branch: Select **"main"**
   - Folder: Select **"/ (root)"**
4. Click "Save"
5. Wait ~1 minute

#### Step 4: Get Your URL (1 minute)
1. Refresh the Settings → Pages page
2. You'll see: **"Your site is live at https://yourusername.github.io/masters-2026-sweepstake/"**
3. Click the link to view your site!

✅ **Done! Your site is live!**

---

### Option B: GitHub Desktop (Easier for Future Updates)

#### Step 1: Install GitHub Desktop
1. Download from https://desktop.github.com
2. Install and sign in with GitHub account

#### Step 2: Create Repository
1. File → New Repository
2. Name: `masters-2026-sweepstake`
3. Local Path: Choose where to save
4. Click "Create Repository"

#### Step 3: Add Files
1. Copy all your files into the repository folder
2. GitHub Desktop shows all changes
3. Write commit message: "Initial commit"
4. Click "Commit to main"
5. Click "Publish repository"
6. ✅ Keep "Public" checked
7. Click "Publish repository"

#### Step 4: Enable GitHub Pages
1. Go to your repository on GitHub.com
2. Settings → Pages
3. Source: Branch "main", folder "/ (root)"
4. Save

✅ **Done!**

---

### Option C: Command Line (For Developers)

```bash
# Navigate to your project folder
cd /path/to/your/files

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Masters 2026 Sweepstake"

# Create repo on GitHub.com first, then:
git remote add origin https://github.com/yourusername/masters-2026-sweepstake.git

# Push
git push -u origin main
```

Then enable GitHub Pages in Settings → Pages.

---

## 🔗 Your URLs

After deployment, you'll have:

**Main Site:**
```
https://yourusername.github.io/masters-2026-sweepstake/
or
https://yourusername.github.io/masters-2026-sweepstake/index.html
```

**Admin Panel (keep this secret!):**
```
https://yourusername.github.io/masters-2026-sweepstake/admin.html
```

**Bookmark the admin URL** - you'll need it!

## 📝 Updating Your Site

### Via Web Interface:
1. Go to your repository on GitHub
2. Click on the file you want to edit
3. Click the pencil icon (Edit)
4. Make changes
5. Click "Commit changes"
6. Wait ~1 minute - site auto-updates!

### Via GitHub Desktop:
1. Edit files locally
2. GitHub Desktop shows changes
3. Write commit message
4. Click "Commit to main"
5. Click "Push origin"
6. Done!

## 🔧 Before Deploying - Configuration

**Important:** Update these configs BEFORE going live:

### 1. Firebase Config (Required for Multi-User)
Edit `firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "YOUR-ACTUAL-KEY",  // Replace placeholder
    authDomain: "your-project.firebaseapp.com",
    // ... etc
};
```

### 2. EmailJS Config (Required for Notifications)
Edit `email-config.js`:
```javascript
const emailConfig = {
    serviceId: "service_abc123",  // Your actual Service ID
    publicKey: "YOUR-PUBLIC-KEY",  // Your actual Public Key
    templates: {
        yourTurnToPick: "template_xyz",  // Your template IDs
        // ... etc
    }
};
```

**Without these configs:**
- Site will work but use localStorage (single-user)
- No email notifications
- Still functional for local testing!

## 📊 Testing After Deployment

### 1. Test Main Site
- Visit your public URL
- Click through all tabs
- Try joining as participant
- Check console for errors (F12)

### 2. Test Admin Panel
- Visit admin.html URL
- Try diagnostics
- Test adding participants
- Check everything works

### 3. Test Firebase Sync (if configured)
- Open site in two different browsers
- Add participant in one
- Should appear in other instantly!

### 4. Test Email (if configured)
- Add yourself as participant
- Start a draft
- Check your email!

## 🎨 Custom Domain (Optional)

Want `masters2026.com` instead of `yourusername.github.io`?

### Step 1: Buy Domain
- GoDaddy, Namecheap, Google Domains, etc.
- ~$12/year

### Step 2: Configure DNS
In your domain registrar:
```
Type: CNAME
Name: www
Value: yourusername.github.io
```

### Step 3: Add to GitHub
1. Repository Settings → Pages
2. Custom domain: `www.masters2026.com`
3. Save
4. Wait for DNS propagation (~15 min - 48 hrs)

## 🔐 Security Considerations

### Public Repository:
- ✅ Website code is visible to anyone
- ✅ Firebase config is safe to expose (it's designed for client-side)
- ✅ EmailJS public key is safe (it's public!)
- ⚠️ Don't commit passwords or API secrets
- ⚠️ Admin panel URL not linked, but discoverable

### Admin Panel:
- Currently no password protection
- Security through obscurity
- Fine for friends/family sweepstake
- Don't share admin URL publicly

### To Add Password Protection (Future):
- Use Firebase Authentication
- Add login screen to admin.html
- Restrict database rules to authenticated users

## 📱 Mobile Friendly

Your site works on mobile! But consider:
- Test on your phone
- Check all tabs work
- Verify buttons are tappable
- Form Guide tables scroll horizontally

## 🐛 Troubleshooting

### "404 Not Found"
- Wait 1-2 minutes after enabling Pages
- Check branch is set to "main"
- Verify files are in root folder
- Try hard refresh (Ctrl+Shift+R)

### "Firebase not working"
- Check firebase-config.js has real values
- Open console, look for Firebase errors
- Verify Firebase rules allow read/write

### "Emails not sending"
- Check email-config.js has real values
- Verify EmailJS templates exist
- Check browser console for errors
- Test in EmailJS dashboard first

### "Site looks broken"
- Clear browser cache
- Check all files uploaded correctly
- Verify styles.css is in same folder
- Check console for 404 errors

### "Can't access admin panel"
- Make sure admin.html was uploaded
- URL must include /admin.html
- Check it's not blocked by typo

## 💾 Backup Strategy

**Recommended:**
1. Keep local copies of all files
2. Use GitHub as primary backup
3. Export Firebase data periodically (admin panel)
4. Save participant emails separately

**To download from GitHub:**
1. Go to repository
2. Click "Code" → "Download ZIP"
3. Extract and save

## 📈 Monitoring Usage

### GitHub:
- No usage limits for static sites
- Bandwidth: 100 GB/month (plenty!)
- Can see visitor stats (if enabled)

### Firebase:
- Check dashboard for usage
- Free tier: 1 GB storage, 10 GB/month download
- More than enough for your sweepstake

### EmailJS:
- Dashboard shows sent emails
- Free tier: 200 emails/month
- Track delivery status

## 🎯 Launch Checklist

Before sharing your site:

**Configuration:**
- [ ] Firebase config added (firebase-config.js)
- [ ] EmailJS config added (email-config.js)
- [ ] All files uploaded to GitHub
- [ ] GitHub Pages enabled

**Testing:**
- [ ] Main site loads correctly
- [ ] All tabs work
- [ ] Admin panel accessible
- [ ] Firebase sync working (test with 2 browsers)
- [ ] Email notifications working (test with yourself)
- [ ] Mobile responsive (test on phone)

**Security:**
- [ ] Admin URL bookmarked (don't lose it!)
- [ ] No passwords/secrets in code
- [ ] Told friends to NOT share admin URL

**Ready:**
- [ ] Shared public URL with participants
- [ ] Explained signup process
- [ ] Set draft date/time
- [ ] Ready to manage from admin panel

## 🎉 Post-Launch

### Share Your Site:
- WhatsApp group
- Email to friends
- Text message
- Social media (if comfortable)

**Sample Message:**
```
🏌️‍♂️ Join our Masters 2026 Sweepstake!

Register here:
https://yourusername.github.io/masters-2026-sweepstake

Signup closes: [Date]
Draft starts: [Date, Time]
$[Amount] entry fee

May the best golfers win! ⛳
```

### During Sweepstake:
- Monitor admin panel
- Import scores as tournament progresses
- Watch leaderboard
- Crown winner!

### After Tournament:
- Archive the site (keep repository)
- Download participant data for records
- Start planning next year! 🎉

---

## 📚 Additional Resources

**GitHub Pages Docs:**
https://docs.github.com/en/pages

**Firebase Hosting (Alternative):**
https://firebase.google.com/docs/hosting

**Troubleshooting:**
https://github.com/orgs/community/discussions

---

**Deployment Time:** 10-15 minutes
**Difficulty:** Easy (mostly point and click)
**Cost:** Free!

**Your site is ready to go live! 🚀**
