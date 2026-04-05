/* ============================================
   EMAIL NOTIFICATIONS - EmailJS Configuration
   Sends automated emails for draft picks and updates
   ============================================ */

// ========================================
// TODO: SETUP EMAILJS (Free - No Backend Required)
// ========================================
// 1. Go to https://www.emailjs.com
// 2. Create free account (200 emails/month free)
// 3. Add email service (Gmail, Outlook, etc.)
// 4. Create email templates (see below)
// 5. Get your credentials and paste here

const emailConfig = {
    serviceId: "service_qkdo4fq",      // EmailJS Service ID
    publicKey: "U6MBRfur3FpKekePp",     // EmailJS Public Key
    templates: {
        yourTurnToPick: "template_6zbg4ki",      // Your Turn to Pick (Welcome template)
        pickReminder: "template_6zbg4ki",        // Reusing same template (not actively used)
        autoPick: "template_m30vefa",            // Reusing Draft Complete template (not actively used)
        draftComplete: "template_m30vefa"        // Draft Complete (Auto-Reply template)
    }
};

// Initialize EmailJS
let emailInitialized = false;

function initializeEmailJS() {
    if (typeof emailjs === 'undefined') {
        console.warn('âš ï¸ EmailJS library not loaded');
        return false;
    }
    
    if (emailConfig.publicKey === "YOUR_PUBLIC_KEY") {
        console.warn('âš ï¸ EmailJS not configured. See email-config.js for setup.');
        return false;
    }
    
    try {
        emailjs.init(emailConfig.publicKey);
        emailInitialized = true;
        console.log('âœ… EmailJS initialized');
        return true;
    } catch (error) {
        console.error('âŒ EmailJS initialization error:', error);
        return false;
    }
}

// ========================================
// EMAIL SENDING FUNCTIONS
// ========================================

/**
 * Send "Your Turn to Pick" email
 */
async function sendPickNotification(participant, pickNumber, totalPicks, timeLimit) {
    if (!emailInitialized) {
        console.log('ðŸ“§ Email not configured - would send: Pick notification to', participant.name);
        return { success: false, reason: 'not_configured' };
    }
    
    const templateParams = {
        to_email: participant.email,
        to_name: participant.name,
        pick_number: pickNumber,
        total_picks: totalPicks,
        time_limit: `${timeLimit} hours`,
        website_url: window.location.origin,
        draft_url: `${window.location.origin}/index.html#draft`
    };
    
    try {
        const response = await emailjs.send(
            emailConfig.serviceId,
            emailConfig.templates.yourTurnToPick,
            templateParams
        );
        console.log('âœ… Pick notification sent to', participant.name);
        return { success: true, response };
    } catch (error) {
        console.error('âŒ Failed to send pick notification:', error);
        return { success: false, error };
    }
}

/**
 * Send pick reminder (e.g., 2 hours before timeout)
 */
async function sendPickReminder(participant, hoursRemaining) {
    if (!emailInitialized) {
        console.log('ðŸ“§ Email not configured - would send: Reminder to', participant.name);
        return { success: false, reason: 'not_configured' };
    }
    
    const templateParams = {
        to_email: participant.email,
        to_name: participant.name,
        hours_remaining: hoursRemaining,
        website_url: window.location.origin,
        draft_url: `${window.location.origin}/index.html#draft`
    };
    
    try {
        const response = await emailjs.send(
            emailConfig.serviceId,
            emailConfig.templates.pickReminder,
            templateParams
        );
        console.log('âœ… Reminder sent to', participant.name);
        return { success: true, response };
    } catch (error) {
        console.error('âŒ Failed to send reminder:', error);
        return { success: false, error };
    }
}

/**
 * Send auto-pick notification (when time runs out)
 */
async function sendAutoPickNotification(participant, golferName) {
    if (!emailInitialized) {
        console.log('ðŸ“§ Email not configured - would send: Auto-pick notice to', participant.name);
        return { success: false, reason: 'not_configured' };
    }
    
    const templateParams = {
        to_email: participant.email,
        to_name: participant.name,
        golfer_name: golferName,
        website_url: window.location.origin,
        teams_url: `${window.location.origin}/index.html#teams`
    };
    
    try {
        const response = await emailjs.send(
            emailConfig.serviceId,
            emailConfig.templates.autoPick,
            templateParams
        );
        console.log('âœ… Auto-pick notification sent to', participant.name);
        return { success: true, response };
    } catch (error) {
        console.error('âŒ Failed to send auto-pick notification:', error);
        return { success: false, error };
    }
}

/**
 * Send draft complete notification with team roster
 */
async function sendDraftCompleteNotification(participant, team) {
    if (!emailInitialized) {
        console.log('ðŸ“§ Email not configured - would send: Draft complete to', participant.name);
        return { success: false, reason: 'not_configured' };
    }
    
    const golferList = team.golfers.map(g => g.name).join(', ');
    
    const templateParams = {
        to_email: participant.email,
        to_name: participant.name,
        golfer_count: team.golfers.length,
        golfer_list: golferList,
        website_url: window.location.origin,
        leaderboard_url: `${window.location.origin}/index.html#leaderboard`
    };
    
    try {
        const response = await emailjs.send(
            emailConfig.serviceId,
            emailConfig.templates.draftComplete,
            templateParams
        );
        console.log('âœ… Draft complete notification sent to', participant.name);
        return { success: true, response };
    } catch (error) {
        console.error('âŒ Failed to send draft complete notification:', error);
        return { success: false, error };
    }
}

/**
 * Send email to all participants
 */
async function sendBulkEmail(participants, templateId, templateParamsFn) {
    if (!emailInitialized) {
        console.log('ðŸ“§ Email not configured - would send bulk email to', participants.length, 'people');
        return { success: false, reason: 'not_configured' };
    }
    
    const results = {
        sent: 0,
        failed: 0,
        errors: []
    };
    
    for (const participant of participants) {
        try {
            const params = templateParamsFn(participant);
            await emailjs.send(emailConfig.serviceId, templateId, params);
            results.sent++;
            
            // Rate limiting: wait 1 second between emails
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            results.failed++;
            results.errors.push({ participant: participant.name, error });
        }
    }
    
    console.log(`ðŸ“§ Bulk email complete: ${results.sent} sent, ${results.failed} failed`);
    return results;
}

// ========================================
// EMAIL TEMPLATES (For EmailJS Dashboard)
// ========================================

/*
TEMPLATE 1: Your Turn to Pick
-------------------------------
Subject: ðŸŽ¯ Your Turn to Pick - Masters 2026 Sweepstake

Hi {{to_name}},

It's your turn to pick in the Masters 2026 Sweepstake draft!

ðŸ“Š Pick {{pick_number}} of {{total_picks}}
â° You have {{time_limit}} to make your selection

Click here to make your pick:
{{draft_url}}

Choose wisely! ðŸŒï¸â€â™‚ï¸

Good luck!
Masters 2026 Sweepstake


TEMPLATE 2: Pick Reminder
--------------------------
Subject: â° Pick Reminder - {{hours_remaining}} Hours Left!

Hi {{to_name}},

Just a friendly reminder that you have {{hours_remaining}} hours left to make your pick in the Masters 2026 Sweepstake!

Click here to pick now:
{{draft_url}}

Don't let your time run out! â±ï¸

Masters 2026 Sweepstake


TEMPLATE 3: Auto-Pick Notification
-----------------------------------
Subject: âš¡ Auto-Pick Made - Masters 2026 Sweepstake

Hi {{to_name}},

Your time ran out, so we automatically selected a golfer for you:

ðŸŒï¸â€â™‚ï¸ {{golfer_name}}

View your full team:
{{teams_url}}

Better luck next time setting that alarm! â°

Masters 2026 Sweepstake


TEMPLATE 4: Draft Complete
---------------------------
Subject: ðŸ† Draft Complete - Your Masters 2026 Team

Hi {{to_name}},

The draft is complete! Here's your team:

{{golfer_list}}

Total golfers: {{golfer_count}}

Track your team's progress:
{{leaderboard_url}}

May the best golfers win! ðŸŒï¸â€â™‚ï¸ðŸ†

Masters 2026 Sweepstake
*/

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        emailConfig,
        initializeEmailJS,
        sendPickNotification,
        sendPickReminder,
        sendAutoPickNotification,
        sendDraftCompleteNotification,
        sendBulkEmail
    };
}
