# EmailJS Setup Guide - Email Notifications

## Overview
Your sweepstake now sends automated email notifications for draft picks using EmailJS - a free service that requires no backend server.

## 🎯 What Emails Are Sent

### 1. **Your Turn to Pick** 🎯
- Sent when it's a participant's turn in the draft
- Includes pick number and time limit
- Link to make their pick

### 2. **Pick Reminder** ⏰
- Can be sent 2 hours before time expires
- Reminds them to make their pick
- (Optional - needs manual trigger from admin)

### 3. **Auto-Pick Notification** ⚡
- Sent when time expires and auto-pick is made
- Tells them which golfer was selected
- Link to view their team

### 4. **Draft Complete** 🏆
- Sent when entire draft finishes
- Shows complete team roster
- Link to leaderboard

## 🚀 EmailJS Setup (10 minutes)

### Step 1: Create Account (2 minutes)
1. Go to https://www.emailjs.com
2. Click "Sign Up"
3. Use your personal email
4. Verify your email address
5. **Free tier:** 200 emails/month (plenty for sweepstake)

### Step 2: Add Email Service (3 minutes)
1. In EmailJS dashboard, click "Email Services"
2. Click "Add New Service"
3. Choose your email provider:
   - **Gmail** (recommended - easy setup)
   - Outlook
   - Yahoo
   - Or use EmailJS's SMTP
4. Follow connection steps:
   - For Gmail: Just authorize with your Google account
   - For others: Enter SMTP credentials
5. Click "Create Service"
6. **Copy the Service ID** (e.g., "service_abc123")

### Step 3: Create Email Templates (4 minutes)

Click "Email Templates" → "Create New Template"

You need to create **4 templates**:

---

#### **Template 1: Your Turn to Pick**

**Template Name:** `pick_notification`

**Subject:**
```
🎯 Your Turn to Pick - Masters 2026 Sweepstake
```

**Content:**
```
Hi {{to_name}},

It's your turn to pick in the Masters 2026 Sweepstake draft!

📊 Pick {{pick_number}} of {{total_picks}}
⏰ You have {{time_limit}} to make your selection

Click here to make your pick:
{{draft_url}}

Choose wisely! 🏌️‍♂️

Good luck!
Masters 2026 Sweepstake
```

Click "Save" → **Copy the Template ID** (e.g., "template_xyz789")

---

#### **Template 2: Pick Reminder**

**Template Name:** `pick_reminder`

**Subject:**
```
⏰ Pick Reminder - {{hours_remaining}} Hours Left!
```

**Content:**
```
Hi {{to_name}},

Just a friendly reminder that you have {{hours_remaining}} hours left to make your pick in the Masters 2026 Sweepstake!

Click here to pick now:
{{draft_url}}

Don't let your time run out! ⏱️

Masters 2026 Sweepstake
```

Click "Save" → **Copy the Template ID**

---

#### **Template 3: Auto-Pick Notification**

**Template Name:** `auto_pick`

**Subject:**
```
⚡ Auto-Pick Made - Masters 2026 Sweepstake
```

**Content:**
```
Hi {{to_name}},

Your time ran out, so we automatically selected a golfer for you:

🏌️‍♂️ {{golfer_name}}

View your full team:
{{teams_url}}

Better luck next time setting that alarm! ⏰

Masters 2026 Sweepstake
```

Click "Save" → **Copy the Template ID**

---

#### **Template 4: Draft Complete**

**Template Name:** `draft_complete`

**Subject:**
```
🏆 Draft Complete - Your Masters 2026 Team
```

**Content:**
```
Hi {{to_name}},

The draft is complete! Here's your team:

{{golfer_list}}

Total golfers: {{golfer_count}}

Track your team's progress:
{{leaderboard_url}}

May the best golfers win! 🏌️‍♂️🏆

Masters 2026 Sweepstake
```

Click "Save" → **Copy the Template ID**

---

### Step 4: Get Your Public Key (1 minute)
1. Click your account name (top right)
2. Click "Account"
3. Find "API Keys" section
4. **Copy your Public Key** (starts with a letter, ~20 chars)

### Step 5: Add Credentials to Code (2 minutes)

Open `email-config.js` and update:

```javascript
const emailConfig = {
    serviceId: "service_abc123",           // Your Service ID
    publicKey: "YOUR_PUBLIC_KEY_HERE",     // Your Public Key
    templates: {
        yourTurnToPick: "template_xyz789",    // Template 1 ID
        pickReminder: "template_abc456",      // Template 2 ID
        autoPick: "template_def789",          // Template 3 ID
        draftComplete: "template_ghi012"      // Template 4 ID
    }
};
```

**Before:**
```javascript
serviceId: "YOUR_SERVICE_ID",
```

**After:**
```javascript
serviceId: "service_abc123",  // Your actual Service ID
```

Do this for ALL fields!

### Step 6: Test It! (1 minute)
1. Open `index.html` in browser
2. Open browser console (F12)
3. Look for: `✅ EmailJS initialized`
4. Start a test draft
5. Check the first participant's email!

## 📧 Email Flow During Draft

### When Draft Starts:
```
1. Admin clicks "Start Draft"
2. First picker gets "Your Turn to Pick" email
3. Timer starts (12 hours)
```

### After Each Pick:
```
1. Participant selects golfer
2. Next participant gets "Your Turn to Pick" email
3. Timer resets for next pick
```

### If Time Expires:
```
1. Timer hits 0:00:00
2. Best available golfer auto-selected
3. Participant gets "Auto-Pick" email
4. Next participant gets "Your Turn to Pick" email
```

### When Draft Completes:
```
1. All picks made
2. Remaining golfers auto-assigned
3. ALL participants get "Draft Complete" email with roster
```

## 🎛️ Admin Email Controls

In `admin.html`, you can manually trigger emails (future feature):
- Send reminder to current picker
- Resend pick notification
- Test email sending

## 🆓 Free Tier Limits

**EmailJS Free Plan:**
- 200 emails/month
- 2 email services
- Unlimited templates
- No credit card required

**Your Usage:**
- 6-12 participants
- ~2 rounds × 12 people = 24 pick emails
- 24 auto-pick emails (worst case)
- 12 draft complete emails
- **Total: ~60 emails max per sweepstake**
- You can run **3 sweepstakes/month** on free tier!

## 🔧 Troubleshooting

### "EmailJS not initialized"
- Check console for specific error
- Verify Public Key is correct
- Make sure you saved email-config.js

### "Failed to send email"
- Check Service ID is correct
- Verify Template IDs match
- Check email service is connected (in EmailJS dashboard)
- Look for error details in browser console

### Emails not arriving:
- Check spam folder
- Verify email address is correct
- Test template in EmailJS dashboard first
- Check EmailJS dashboard for delivery logs

### Template variables not working:
- Make sure variable names match exactly: `{{to_name}}` not `{{name}}`
- EmailJS dashboard shows which variables are available
- Test templates in dashboard before using

## 📊 Monitoring Emails

**In EmailJS Dashboard:**
1. Click "Email History"
2. See all sent emails
3. Check delivery status
4. View error messages if failed

**Useful for:**
- Confirming emails were sent
- Debugging issues
- Tracking usage against quota

## 🎨 Customizing Email Templates

You can edit templates anytime:
1. Go to EmailJS dashboard
2. Click "Email Templates"
3. Edit any template
4. Save (changes apply immediately)

**Customization ideas:**
- Add your logo/image
- Change colors/formatting
- Add more details
- Include links to rules

**Note:** Keep variable names like `{{to_name}}` unchanged!

## 🔐 Security Notes

**Current Setup:**
- Emails sent from your personal email
- EmailJS handles authentication securely
- Public Key is safe to expose (it's public!)
- Service ID and Template IDs are also safe

**Best Practices:**
- Don't share your EmailJS account password
- Use a dedicated email for the sweepstake
- Monitor your email quota

## ⚙️ Advanced Features (Optional)

### Send Manual Reminder
From browser console:
```javascript
// Get current picker
const currentPicker = draftOrder[0]; // adjust index
sendPickReminder(currentPicker, 2); // 2 hours remaining
```

### Test Email Sending
```javascript
// Test notification
const testParticipant = { name: "Test User", email: "your@email.com" };
sendPickNotification(testParticipant, 1, 24, 12);
```

### Bulk Email All Participants
```javascript
// Custom message to everyone
const message = "Tournament starts tomorrow!";
participants.forEach(p => {
    // Would need custom template for this
});
```

## 📋 Checklist

Before going live:
- [ ] Created EmailJS account
- [ ] Connected email service (Gmail/Outlook)
- [ ] Created all 4 email templates
- [ ] Copied all IDs (Service + 4 Templates + Public Key)
- [ ] Updated email-config.js with real IDs
- [ ] Tested - saw "EmailJS initialized"
- [ ] Sent test email to yourself
- [ ] Checked spam folder
- [ ] Verified emails look good

## 🎉 Benefits

✅ **Automated** - No manual emailing needed
✅ **Reliable** - EmailJS handles delivery
✅ **Free** - 200 emails/month at no cost
✅ **Professional** - Branded email templates
✅ **Simple** - No server/backend required
✅ **Trackable** - Dashboard shows delivery status

## 💡 Tips

1. **Test with yourself first** - Use your email for test participant
2. **Check spam** - First email might land there, mark as "not spam"
3. **Monitor dashboard** - Keep eye on EmailJS delivery logs
4. **Customize templates** - Make them match your style
5. **Set reminder** - You might want to manually remind slow pickers!

---

**Setup Time:** ~10-15 minutes
**Difficulty:** Easy (mostly copy/paste)
**Cost:** Free (for your use case)

**Need help?** Check EmailJS dashboard logs for delivery issues!
