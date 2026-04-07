/* ============================================
   MASTERS TOURNAMENT 2026 - APPLICATION LOGIC
   Main functionality for draft, teams, leaderboard, and results
   ============================================ */

// ===== CONFIGURATION =====
const CONFIG = {
    dataSource: 'local', // Options: 'local', 'sheets', 'api'
    sheetsUrl: '', // Google Sheets CSV URL (set by user)
    apiUrl: '', // Masters API URL (to be added)
    autoSyncInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
    storageKeys: {
        participants: 'masters2026_participants',
        teams: 'masters2026_teams',
        draftComplete: 'masters2026_draft',
        playerScores: 'masters2026_scores',
        signupClosed: 'masters2026_signupClosed',
        draftOrder: 'masters2026_draftOrder',
        draftedPlayers: 'masters2026_draftedPlayers',
        snakeDraftComplete: 'masters2026_snakeDraftComplete',
        draftInProgress: 'masters2026_draftInProgress',
        csvUrl: 'masters2026_csvUrl',
        autoSync: 'masters2026_autoSync',
        lastSyncTime: 'masters2026_lastSyncTime',
        participantEmails: 'masters2026_participantEmails',
        currentPickStartTime: 'masters2026_currentPickStartTime',
        currentPickIndex: 'masters2026_currentPickIndex',
        autoPickComplete: 'masters2026_autoPickComplete',
        tournamentConcluded: 'masters2026_tournamentConcluded'
    }
};

// ===== GLOBAL STATE =====
let participants = [];
let golfers = [];
let autoSyncTimer = null;
let isAutoSyncEnabled = false;
let teams = [];
let draftComplete = false;

// Snake Draft State
let signupClosed = false;
let draftOrder = [];
let draftInProgress = false;
let currentPick = 0;
let currentRound = 1;
let draftedPlayers = [];
let pickTimer = 60;
let pickTimerInterval = null;
let snakeDraftComplete = false;

// Draft Settings
const MIN_PARTICIPANTS = 6;
const MAX_PARTICIPANTS = 12;
const SNAKE_DRAFT_ROUNDS = 2;
const PICK_TIME_LIMIT = 12 * 60 * 60; // 12 hours in seconds
const SCHEDULED_DRAFT_TIME = new Date('2026-04-09T12:00:00-04:00'); // Day before Masters @ 12pm ET

// Auto-pick tiers (post snake draft)
let autoPickTiers = [];


const testNames = ["James", "Sarah", "Mike", "Emma", "David", "Lisa", "Tom", "Rachel", "Chris", "Amy"];

// ===== BULLETPROOF SIGNUP CHECK =====
function isSignupClosed() {
    const storageValue = localStorage.getItem(CONFIG.storageKeys.signupClosed);
    if (storageValue === "true") return true;
    if (storageValue === "\"true\"") return true;
    if (signupClosed === true) return true;
    try { const parsed = JSON.parse(storageValue); if (parsed === true) return true; } catch (e) {}
    return false;
}

// ===== PARTICIPANT MANAGEMENT =====
function addParticipant() {
    console.log('=== ADD PARTICIPANT CALLED ===');
    
    const nameInput = document.getElementById('participantName');
    const emailInput = document.getElementById('participantEmail');
    
    if (isSignupClosed()) {
        alert("Signup is closed! No more participants can join.");
        return;
    }

    // CRITICAL: Check localStorage first as source of truth
    const signupClosedStorage = localStorage.getItem(CONFIG.storageKeys.signupClosed) === 'true';
    if (signupClosedStorage || signupClosed) {
        console.log('Signup is closed - cannot add participants');
        alert('Signup is closed! No more participants can join.');
        return;
    }

    console.log('Name input:', nameInput);
    console.log('Email input:', emailInput);
    
    if (!nameInput || !emailInput) {
        console.error('Input elements not found!');
        alert('Error: Input fields not found. Please refresh the page.');
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    
    console.log('Name value:', name);
    console.log('Email value:', email);
    
    if (!name) {
        console.log('Name is empty');
        alert('Please enter your name');
        return;
    }
    
    if (!email) {
        console.log('Email is empty');
        alert('Please enter your email address');
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('Email failed validation');
        alert('Please enter a valid email address');
        return;
    }
    
    console.log('Validation passed');
    console.log('Current participants:', participants);
    console.log('Signup closed:', signupClosed);
    
    
    // Check if already joined
    if (participants.some(p => p.email.toLowerCase() === email.toLowerCase())) {
        console.log('Email already registered');
        alert('This email is already registered!');
        return;
    }
    
    // Check max participants
    if (participants.length >= MAX_PARTICIPANTS) {
        console.log('Max participants reached');
        alert(`Maximum ${MAX_PARTICIPANTS} participants allowed!`);
        return;
    }
    
    // Add participant
    const participant = {
        id: Date.now(),
        name: name,
        email: email,
        joinedAt: new Date().toISOString()
    };
    
    console.log('Adding participant:', participant);
    participants.push(participant);
    console.log('Participants array now:', participants);
    
    // Clear inputs
    nameInput.value = '';
    emailInput.value = '';
    
    // Save and update
    console.log('Calling saveToStorage...');
    const saved = saveToStorage();
    console.log('Save result:', saved);
    
    console.log('Calling updateParticipantsList...');
    updateParticipantsList();
    console.log('updateParticipantsList complete');
    
    console.log('âœ… Participant added successfully');
    
    // Show success message
    alert(`Welcome ${name}! You've joined the sweepstake.\n\nParticipants: ${participants.length}/${MAX_PARTICIPANTS}`);
    
    console.log('=== ADD PARTICIPANT COMPLETE ===');
}

function removeParticipant(id) {
    if (signupClosed) {
        alert('Cannot remove participants after signup is closed!');
        return;
    }
    
    if (!confirm('Remove this participant?')) {
        return;
    }
    
    participants = participants.filter(p => p.id !== id);
    saveToStorage();
    updateParticipantsList();
}

function updateParticipantsList() {
    const list = document.getElementById('participantsList');
    if (!list) return;
    
    // Hide/show signup form based on signup status
    const signupForm = document.querySelector('.input-group');
    if (signupForm) {
        if (signupClosed) {
            signupForm.style.display = 'none';
        } else {
            signupForm.style.display = 'flex';
        }
    }
    
    if (participants.length === 0) {
        list.innerHTML = '<p style="color: #999; font-style: italic; margin-top: 15px;">No participants yet. Be the first to join!</p>';
        return;
    }
    
    let html = '<div style="margin-top: 20px;">';
    
    // Show different message if signup is closed
    if (signupClosed) {
        html += `<div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); 
                        padding: 20px; border-radius: 12px; margin-bottom: 20px; 
                        border-left: 4px solid #28a745;">
            <h4 style="color: #155724; margin: 0 0 10px 0;">ðŸ”’ Signup Closed</h4>
            <p style="color: #155724; margin: 0 0 10px 0;">
                <strong>${participants.length} participants</strong> are locked in!
            </p>
            <p style="color: #155724; margin: 0; font-size: 0.95em;">
                Draft order has been randomized. Go to the <strong>Draft</strong> tab to see the order and start the draft!
            </p>
        </div>`;
    } else {
        html += `<p style="color: var(--text-light); margin-bottom: 10px;">
            <strong>${participants.length}</strong> participant${participants.length !== 1 ? 's' : ''} 
            (${MIN_PARTICIPANTS}-${MAX_PARTICIPANTS} needed)
        </p>`;
    }
    
    html += '<div style="display: grid; gap: 10px;">';
    participants.forEach(p => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; 
                        padding: 12px; background: #f5f5f5; border-radius: 8px; 
                        border-left: 4px solid var(--augusta-green);">
                <div>
                    <strong>${p.name}</strong>
                    <div style="color: #666; font-size: 0.85em;">${p.email}</div>
                </div>
                ${!signupClosed ? `
                    <button onclick="removeParticipant(${p.id})" 
                            style="padding: 5px 10px; background: #dc3545; color: white; 
                                   border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                        Remove
                    </button>
                ` : ''}
            </div>
        `;
    });
    html += '</div></div>';
    
    list.innerHTML = html;
    
    // Update close signup button
    const closeBtn = document.getElementById('closeSignupBtn');
    if (closeBtn) {
        if (signupClosed) {
            closeBtn.style.display = 'none';
        } else if (participants.length < MIN_PARTICIPANTS) {
            closeBtn.disabled = true;
            closeBtn.style.opacity = '0.5';
            closeBtn.style.cursor = 'not-allowed';
            closeBtn.textContent = `Need ${MIN_PARTICIPANTS - participants.length} more participant${MIN_PARTICIPANTS - participants.length !== 1 ? 's' : ''}`;
        } else {
            closeBtn.disabled = false;
            closeBtn.style.opacity = '1';
            closeBtn.style.cursor = 'pointer';
            closeBtn.textContent = 'Close Signup & Start Draft';
        }
    }
}

async function closeDraftSignup() {
    if (participants.length < MIN_PARTICIPANTS) {
        alert(`Need at least ${MIN_PARTICIPANTS} participants to start the draft!\n\nCurrent: ${participants.length}`);
        return;
    }
    
    if (!confirm(`Close signup and lock in ${participants.length} participants?\n\nThis cannot be undone!`)) {
        return;
    }
    
    signupClosed = true;
    
    // Randomize draft order
    draftOrder = [...participants].sort(() => Math.random() - 0.5);
    
    // Calculate auto-pick tiers based on number of participants
    calculateAutoPickTiers();
    
    console.log('âœ… Signup closed. Draft order:', draftOrder.map(p => p.name));
    
    await saveToStorage();
    updateAllViews();
    
    alert(`Draft signup closed!\n\nDraft order has been randomized.\nCheck the Draft tab to see the order.`);
}

function calculateAutoPickTiers() {
    const numParticipants = participants.length;
    const totalGolfers = golfers.length;
    const manualPicks = numParticipants * SNAKE_DRAFT_ROUNDS; // 2 rounds of manual picks
    const remainingGolfers = totalGolfers - manualPicks;
    
    // Calculate how many tiers we need for remaining golfers
    // Each tier should have enough golfers so each participant gets equal picks
    const golfersPerTier = numParticipants;
    const numTiers = Math.floor(remainingGolfers / golfersPerTier);
    
    autoPickTiers = [];
    for (let i = 0; i < numTiers; i++) {
        autoPickTiers.push({
            tier: i + 1,
            startRank: manualPicks + (i * golfersPerTier) + 1,
            endRank: manualPicks + ((i + 1) * golfersPerTier)
        });
    }
    
    console.log('Auto-pick tiers calculated:', autoPickTiers);
}

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', function() {
    console.log('=== MASTERS 2026 SWEEPSTAKE STARTING ===');
    console.log('JavaScript loaded successfully!');
    console.log('Testing addParticipant function:', typeof addParticipant);
    initializeApp();
});

async function initializeApp() {
    await loadFromStorage();
    initializeGolfers();
    initializeCSVSync();  // Load saved CSV URL and auto-sync setting
    loadPhotoIfMissing();
    
    // Initialize EmailJS
    if (typeof initializeEmailJS === 'function') {
        initializeEmailJS();
    }
    
    // Set up real-time Firebase listeners if configured
    setupRealtimeListeners();
    
    updateParticipantsList();  // Initialize participant display
    updateAllViews();
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ App initialized. Participants:', participants.length, 'Draft:', draftComplete);
}

function initializeGolfers() {
    golfers = masters2026Field.map((g, i) => ({...g, id: i + 1}));
}

function loadPhotoIfMissing() {
    const heroPhoto = document.getElementById('heroPhoto');
    if (heroPhoto && heroPhoto.src.includes('/9j/4Q/+RXhpZgAATU0AKgAAAAgABgESAAMAAAABAAEAAAEaAAUAAAABAAAAVgEbAAUAAAABAAAAXgEoAAMAAAABAAIAAAITAAMAAAABAAEAAIdpAAQAAAABAAAAZgAAAAAAAABIAAAAAQAAAEgAAAABAAeQAAAHAAAABDAyMjGRAQAHAAAABAECAwCgAAAHAAAABDAxMDCgAQADAAAAAQABAACgAgAEAAAAAQAAA7CgAwAEAAAAAQAAAsWkBgADAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9sAhAABAQEBAQECAQECAwICAgMEAwMDAwQFBAQEBAQFBgUFBQUFBQYGBgYGBgYGBwcHBwcHCAgICAgJCQkJCQkJCQkJAQEBAQICAgQCAgQJBgUGCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQn/3QAEADv/wAARCALFA7ADASIAAhEBAxEB/8QBogAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoLEAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+foBAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKCxEAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+myf4v+PG+Odx4ei1q++zRWFzIqfaJNu6KJiDjd64NYvwz/ad8Qa7pWgahqWs3B8uGX7XuncgtvIGefQcV866h44mtvidP4vigkEEmm3KkEfMSYW/TivkPwX4rsfDn7PviLxfqm9EecJDg4Khs9K/AoeK2GxMlLAz5onz1ahUpfEftV4//ak+KVxYgfCTTXu0hTdLO4Lx4HU5BHavIdd/bZ8T3ngyXQviDaX2lyvbs0WoWBaBA2Ply4bPXjFfCPwF/aeuPDfgXStGtr03Esi+YVByWTPQj6Vz3xz+ImqeIPEkk/hKxkvNPurVppbfGUVlHIVe1elnvilhMLh+aXUqk2z7y/Zc+OPxh1fSbxPGvieOe3tphJbyT3ErSvEBnbkvjkcV85T/ALWfxK+Gv7Y9hrWu+IdQuPC+qypZ/ZHu5mtlMj43CMvtGM+lfn3r3xW+IvxI+G8fhX4a2R0+80OYXEmE2Yij+ba/4Cqup+MR8e/hLfa1rqiPXvCDPcLLF8kchtwHC8dyRivkeFPEWeLk4Slr0OurhpJKx+xUnxF+Jel/tZ6r4Q1DxJqaaB4i0xpLB/tchjiklbCeWc8EcfyrovCP7S8/wn0TxB4E+J3iC/m1G03LbzzXMjTMV4G1s9/pXzp+z78TrX4o/Dvwt8Vb+6srvV7WOCx8kDDR4ByxU9Mf0zXz7+1dGvhX43rNY3EE0l3befKlyd4DE4+Xp26V+F8UeLFaPEDwlRuK8j6rC4P9ymz6Q0X9tL4n6D8Bda8YvJqk6CaUQTzzSM64PYhgcV5d8PP2q/jXrHgkaZ438VXem6jqKb7dvtU6SAPyoGWI+7Xivi+Xwl8HPhdaeIfGF9LNpupz5lt/M/djcOcLzgV7/p3jD9nH4qXVpqGoL/pGj6bHd27xELEyY2KDxyVB6V+SeJnE+IhNV6NWd+i55a+W5lQpqTaPdf8AhqPxZ4++JGgfAXwfrOptHBHDLd6ktxKHzt2uXfcMgGu/8Q+OviNa+GNX1Hwp4qu7t7Hcgle8mMQdTggkOOwr87LL9rL9m22i8Q2vh1v7P1maM20VznG09AM4HU/4V4P41/abfwx+zpcfAnVRLDrmuTTyW09thSqych5DyTwDj618nxdh8wz2WEr1sZKk1a9ptafeOpONOLTPuj4QfHb4gyWF7+0N468casmjeHg3nwzX8v2Kdl+Qp5cjlW2swxwecdK9f+CXxX8a/EHxZq/7Zvj/AMa6npnw/tEZrXT2vpo7WTZ+7wYN3kn5jxkdQMc4x+OF1qlz8WdZ0H9mXSnOm+B9A2Xer3bD75mjDOpJGD84A79e1fffhfxF4d+P1vYeCtP0+40X4XeDSyzAYSK7GCGLcbXG8Z+7xntiv9BPDKpg8DgqVDC1ueVl1ueHyya5j234Z/Gb40fto/HK7+L1p4h1bwf8M/D7FiILy4tYbjYDgFQ5jcHg52/QV7RrPx++KH7Z/wAUR8MP2ddQv9L8KaLIq3+tW1xNA8nl84jnV0JJKgHHUEjoa/PvUPiFrv7U2sD4D/s9Rr4U+GWhSH+1dTXMSskR/vp8vOMHjoccV67qf7THhzwh4Ji/Z7/ZCt10vQ7bbFqPiCcBop2fh/s8qchsjA3Acmv6Pw2IpzaUmlocyqyP1C+LX7UGj/CrRR8Ivhlc3PijxLb2zJJJ5jXD2zBOXnZvmHAOMN1xX8oXxP8A20/2vbPx/qNxefEDxAvkS4itLPVb1IgSTgGJZwnGOmK/bz4aeGPD3grww974ouJbQXkEmwTtjVr5sfeSQZ3Rn3AwtfzIfGT+1IPiXrsVtbSafZNMHRJ/9aoBJyx/D0FeTm9Fc0ZwkdtNSaP3K/4JfftLfEf4tfE5dN+IPjbxJqOpStultLjUriWCMLnAMTsyjp71/VSX8iIyyHA6lvYDvX8d3/BGi5j1T4sO+n2sZktlO+fb+8kGD1Pev6vPFHxV8DeHfBVx4l8T3S2VoEIkMhxjKkEfh2rSeYUVT5nLY05ZHqFvfQ3SCW3cOmM5B4/+tS2mo297u+zsG2HacV+ZH7Nvxf8AHXirxDr83hZJNQ0O9uhJZzAbo0hA24Ppmv0e8OWIsLP94uyWU7nHvWODziFehz0w5ZHS7mpcttzTQO1P4C4r1m/dRCkxA5FWF9T2qqoycdKsNgIcGrNRHk42ioNzUzHOadQAZb1pV3ZxmkpyfeoAcu496GDAdacq7aH+7TQEBZgM5pnmNStnbUYGeK0cUBMrN1p+5qjAIGKXmsgHbmpyhjzmmDk4PFTLgcUAGG9acoOetITgZpFk5oAUk9KaQ2ODS8EinCgCICTPNSDI707I7CkoAXJoyai344xTlORQA/JoyaSigBcmjJpKKTAXJoyaSisuZgOU8808sMcVD9KQA+tNSYDjkjFNw3rTqK1EyBtxG3OPpxX46/8ABSb4ueOvA3iLStG8F6/qGks8PmMLK7mgzzjnY4r9i+N3Nfzl/wDBSHXX1j47w2bH5YLYoO/Oa5602tjNSZ856B8fPj9qWu21tL43190LjKtqV2Rj/v5X7f8A7C+seM/E+halq3ibV77Uds2xRd3Ek3btvNfgZ8MtNOoeLBt5VIg35Gv6Pv2OvDX9gfCvd5exrmQyZ+ox+lKi72NHsfAf/BbP4zeO/hP8B9L/AOFZ69qPh/VZ7zaJtNupbWbGAMb4mVsY44I446cV/J5aftx/tsaPMjyfFHxeyY2Mra5qGM/9/q/b3/g4U+Kt3beLPDvw104lrmIR3BUejjqB7Yr+ebT5LR2dNfiJYqDtHr615maSfQ9LL6cT61+Gv7a/7QWoahq8nir4v+L7W9lgVbeN9dv1t1bI6L5x69K/sw/YAtPHl1+y5pTfELX7rXdRudzNfSTvNIVYDGHcs3f1r+AP4d/D6z+MvxZtPArwzRwXbJHG0P31+bFf6Kv7JPwvi+DnwH0LwPayyyR28EbDzWyw3KMj8MVWVuVtTTH+6rItsvjj4e+I7PTNPe41XTbuQ+c8rNI0fBIweg5wOlfREM3n4lT5cjkHimsFPC/KPQVJGoHPoMV7R4qkyVCW4p5UgdagV9hPFWVbNJmpH81MdiFJ9KfM+xOlRNymPXis1JiZy/jG/OneH7uXcUO3arKcEEjjFYWgvqE/w23zTO1wbdzvzhsgcVn/ABXvFTRIrEctJPF+W4CvQLOxig06KyQfIEAP0xWj20IjLU8A/Z18Q61qVlqFhrVzNcvbTlFaVyx9e/Svpjk8Zr41+EGtNYfGvxJ4Uj+WEXDMi+yrX2J5uHK46VjHmLno7IEY7sVNk1WX5TmplORW4x+TSHJGKKUDJxQBGdwGc1HvapHOBiocgdaEJux5Z4+vr6PUtI020neJppzu2nHy7T2rXfxho6yfZFu1Lp8rDOTxxXn/AIt+0ap43uLaAF2sofMVR61+bfiaz+Ldj4huZrWzu8PKx3dsE5rws+y2VWn+7P0PgTg+lmb/AHtVRP0S8W65rUXiWxn0e4klgLYdUbgZB7V67Y3N1LH5ruT7E9MfSvxEb4pfGDw54sea181oIMFkkyc9vSvqfwZ+1drM9sPtsIDL94bcHp2r8lxvDmNgm1Jn6Nmvg/XjBfU5qZ9eeNx4i8O6j/wl2kXdxMo5kty5MSr0O1eg4r1vwd4otPFmlxarYSBkdecdQw6givjlf2pNCewaTUoHAx8wxkY79qufAG+v/Ft3rGteD7hYrGdkMaH+HdyeOMYxXicGUcywmactVvlZ+f5xwVi8JhnUxMeWx90B24IOQfSlZ2ArG0ezubDTktbl97j7xrRr+jqUro/PeREnmNR5jVHRWgciJPMajzGqOigOREnmNSGR8cHFN4pDgDNJhyIa0so43UwSy/3qaTmkrLmYciLAeXH3qaZZV4zSjoKjfrTUmYVNNiZZJOpNP8xqrB8DGKXf7VqZc5Y8xqQyPjg4qDf7Ub/aky41FewryyDjNWopCUqg5zVuH7lZqTOhxRPuajc1NorUyJoSWb6VLK2FwKit+pp83SgTINzUbmptFBlzMQb1B2nmvin/AIKBfHCT4GfszeJPFFhdyWN7JZyw2ksTmN1m28FWXkEe1faxwFJ9B/Kv5mv+Dgr41arZeENF+EGjyfNLIl1Kq/3HHcfhimhqTP56H/bO/bZVptQHxb8Yqt0VkEa67qCoOOyLOFA/Cudu/wBuT9teFv8AkrPjAEdP+J7f/wDx6vj67u9UPiWLQbqQrCYxyD+P4YqTU9JupLz7Lpc3mOCAMn+lTPR2RqfcWgftufts3CpC/wAVfGW9yOf7d1AAfiJ6/sp/4JN6B8Uk/Zyt/F/xU8U6v4jv9Qlc7tVvJ7plHBGDM7Gv4oP2Vvgn4j+OfxW0H4ZQmRJr+cRylf4R69vT+lf6L/wc+HWm/Cr4eaX4H01GRbK3iVvTfsAP8qYmeogt607c1NooMuZn/9D9nvjlL8QU8BzwWGlv+4hfdOoA28fdLeh6V+I15+0p468Q+FL/AOBHiTSWa0edPntUw67Ae49+T7V+lvxe/ak1zX/h2vhLVSbXUHj/AH8KfISzDOT16V80/Bf9mzWB8PNT8Zaw6xT6rG09tO3OGKnCZz3xj8a/xh4PzuWX14xTfL2Nsypxq9Dnvgx4QbTPDe7UXaO7hAW3lzhdvYVteG/jZr3hL4g/2D43nTTAgxDcyZWKYZzgevHHWvGRp/xSSaysbNdl3AQuMHy2weSB9K9K+MUN14w0XR/h/wDF6GDStRvABZzOoXqQFKEdM/8A1q/ovOHRzHBxlU+4+fp0ZQkrnuWrL8SdA8NS+KfB9isba5dLcPPtBjkhYEbR7H0rufAd54C+H8N1a21l9vbXZDNe2UQG9WcAMqA8Ae/6V5ppXjWL4deA4vgN4p1Ix6fYQCHz7gkyl8H5o2AO3rwKqy+GfFekf2TdfDTVbGC9itvPhW9QySXCIcjPI618LnGc4ujBQwz5eVbn1OHpKorSPYvh3rXw61S51XwPJ4W1jwppk282upblSOOTGPn2847cCrfxK8NxfHDwwLLwd4k0/VtZ8Kx+U06hizxRjhCeMtXNWmneL/iLYX3j/wAb6taaJrFnCYpNHlUxpMAM+ZGi9M4wP8ivH/hH4abwXrx1bw1oeoQfa7gS3VxJJ+5K4z8ijoM8c+tfnebcWqk/rlf39O2x7tOajHllsdVqXws8efEXwbpGl+OrY32j6ddCW9ljBCCPbjZz0wcf4V9n237Gfwi8b/B210T4bX0lkBJ5iyB8SeWesZwc4H+RXg2j6jar4uuPCvhm5uJ9KuiZLvbIxRHfrkdMDpit/XtV134D+MdOu7SWa50a+lEJjiLDahXO7Iz+PHSvyHiXjOOd4unhaPubG2Gw1FJykj5S8W/BDwH8PNUi0Hw21u2q28p8yO4XzC+DgHkY5PT0r6Z0qxbX7S21f46eHbW3sbOPZFfpCkZwo+6W7+gqr45/YT+IreLb34+/DjWo9XjvYftFvETJJsJ52EE/h0/CuQ+MnwF+L/xo8BWvgrxj4mi0m70wtO6YkUMCBgbR9a348yGWHlRVavaElZ2Pn61WHM+WJ1vwx1f4UfGlPEHwy8KKLeEjZvTCyt8w2tn0BA49K/Ob9pX9oLxP8JL+1/ZF0JJ7CwtpPMup0LKJkm2yAZHPy4x159O1fLHwu8TePv2e/wBoFNS0SWbU5bGcpMsWfLdFyvK9f04r6A/aW1rw38UPiZL8fdF23cb28Mc9kqkvvRRE2zIAG1uT7Cv23wXr4vJ8xjGniOem46J9Dx6snPpY674iftIX0Xg6x+E/hqdtA8PKIzKbY+U8p4zvKBd4zyQc+lez+FYviLHZQ/Ez4QyWV3p+mxEmx2gxy9AWdAVBIGT93rz2r834PCXiX4iz2niiz0+dbLJ2wOVYnbxgcr/KvsX4P/C3xv4zuoNc8Xa0PCWgWWA0Ss0alQdpEmwEfN0/Gv7C9rmmO/2nCTs0efPRqx+rf7O3xJ1Xxv4aTXvDGnTXOszEwX91qn762tt/Gy3HBVR2xX5n/tb/ALDHxc8B/Fi+1LSNUj8Ry6kjS+XDkhQozghiAOvAzxX2x4K1/wCGPw+FlrXwX1ddQ03SyV1KHeWWeRmwrrkrsxkDGDUf7Un7RXga6il8V6LrKaVrdwCiC4JeNNwGFwOO2K+Ih4u5vUxX9nW95eh9LQox5Ezuf+CUnw08fW/gfULi60OXSvFGnktC4CgMF524B7jiv0H+J3iHSP2h/BkXgD4nSHSL/SbqJLtE+TzNrA9AB1r4v/4Jh/Fr4zNa6p4n+JOoWd1ZwwSGOaJBGGIRtoHvnFfcHg/9pb4A6prd/N4s0WW3vml3ySXO3EjIN2QADgcV99jOJacMOqeIrck5aGUF7zR9f/s6eGPBXgRv7A+HsgjskQFoenOP5V9JaNcfatXnuZGYlW2he1fDWg/HX4ZaV4kh8WeEFa607UwqPJGTtjPTb92vrz/hZ/gXRIoZp5liF2w2FuvPtiv1jgfCPB4FQq1eZvYzq6aHsYTLbfao+fbioF1CCSP7XDkxldwOOMVyOmfEDwjrmqS6Bpt7FJeRjmIHOPyr9ExmZU4NQXY5+VHaebGpyzADt71Y2kqOetfEvw88WfF7xv8AGjV/7UAtvD2nyG2jXby7qD0PGB+FfbIOBz1wOKvB4uVRXehQhTAzTKeWyMUyu5SYCgZOKkCYOaYn3qmrUAooooAaVGMUgTFPoquZgJgelAVaWmtwvFSA18AYFRrkHNNwd2TTgM8CgB5bIxUf0p4Q08JigCJN24ZqxSYFLQAUCkyKXOKAK+cmnoccVGPvbakKHHFADywAp4HGfSq+1h1qUSdqAHUUmRS0nsAUUUVgAUUUhOBmmgFoqPf7UoftW4DHUKNzHAFfy0ftha4niH4861Ij7vs1w8a/TrX9Pniu8Fh4avr0HHkwO/8A3yM1/JB8WtUTVfiRrmrA/eumNceJ0QlBHtv7KHhZ/EeuT3LDKBfK6fjmv6SPhlpCaH4KsNOjX7sI6Drx6V+KX7DnhhB4RbU2Xme72DjsR1r91tN22Hh6LzGCpDFz+AqMJJ2HPex/D9/wXP8AiZqvxJ/a9bQtEgfOl2UaqyY3fuzt2+3+RX4vTeIfE9nor6tb2Uy3Vv8AeWbnOK+4f26vHWq+OP2w/Gd5avmO0vp7YEddqN2rwPxTY+H9M8HW6PL/AKVd8OJDnGfyrz8drKx6+GSjsfZ3/BIZG8c/tX6GbqCJpfOhd1ZOnzZwB07V/oA2sC2tpFAMZXjgY45xxX8jX/BCD9nrX9V8bTfFqSGIafaKmxgo3Fo26Dniv67ejlT2FejgadkcONr3dgqVOlRVNEM8V3HnoiPWrcfTNVXGKtRfcpPY3I7gZUCos5G0en9KluDhQahI2gNWKFLY8S8bL/anjnSdGzwU8wj/AHOcfpXtfkt8y5wu3H6V4fo+7VPi3d3DfN/Z4Mf/AH0pr3Ib2IGa3MqR8x2ujrof7QzXaptS+gaTp6jH9K+m/LPmMTx2ryHx1oGuy6/pviDR03SQYjJ/2CefyFevJjeTjnjn8KDZ6iquafFzxQBsGaajbDmgB5bbT1I61Xc7hjpQmRgUASyDkCqxb5tvapZm54rB1/U10jQ7jVT/AMsY2b06Dp/SgDzH4fg6v4y1TXRgqR5X/fJxXrN1pWmzg+ZCp/CvOvg9aCDw1JeEfPNcSN/wE8ivVW+aq53sVRqSpvmi7HC3nw68HXZLXNhCWbq2wV5F4i/Ze+HmuF7iOIwO3/PP5a+lioPWmsvy4BwPaoqpTVpHt4fibG0f4dR/efBWufshQC0kg0S6OccBz/ntUH7KPwK8ffB3xJqv9uXKyWV0y+WnYbQRwM+9ffYJK+WDSeWEXC9Kx+q0+bm5dT6HGeI2Y4rCfUsTrH0QmeqDjHpSUgPJNLW0YpbHxIUUUUwCmt04p1FJjREA3SnbD61JxSVlzM15ER+XSFMDNS01vu1DE4oardqR+tIn3qV+tXS1RwVtxlFFFbGIUUUoGTik9gjFXG1biOAFqApgU9GII4rFHVzMtUUgORmnAZOK3JJYOKfN0pqfJRMe1AnsQUUUhOBkU0YDJZVgjMzkKqfMSegA6/pX8B//AAVr+L+q/GL9rXVreyunks9KV7H5GyMxPwRx71/af+2V8ULf4T/s4+LPFLyeTNDp84hbOPnCZGK/zrfF/wASda8ReJL7xTeASyXs7zu5HJLY4rTlQ0eMWnh3XNKuJJpW88ddzDJArqdCv5ILlrqWJEbgcjpg9aq6j4+uciTT4f3j8FMZrc0bULy8eJLq3/eOw+VR+lclST5kbM/oF/4IL/AjVviP8XNT+MerIrW2lgGA44LK2OOlf2OfdkwxyxAzjpkV+UX/AAR/+CKfCL9l2ynu7b7Pdaj++IxtJRxkflX6uhFUAL2rYy5mOooooJP/0fcdMt/BmnaXqknxidpNZvWVInjfAAyFAGM9q9/+F/jXwZqHwnuvhVbQ3UyaIyuJRL/c+fuBgYFfL2s/s+eH9KlPjKy1qS+t590luGYt5RPQHr9OlchBH4hlXVbi/wAWunQMsDyr8nmOyYGQMHrgV/kH9cjSnGChtsdTpuL0PsXWfi5oEfhy21vwy8NxHptnJDdIAPM809AGx1xxwK+EvjH4S+MHxS0vRPin4a024gfT1DwLMOcKwPRscfhW/wCD/AuraW+nal4n1eJ9JjuEm8gLhmKsDg88/LxX3vq/7WP7M2paHqEnxOik0+XSk/0WKN/LR4kH3du3qelfS5PVm616kvdOfEwV7ny58FJbX4veBdWsviRcQ23ijeY0gkG1nJXAIP8AhXH6X4c8J/Dv4/8AhtrHxH5c1vbR2+ppO7skfzgMqg5HA9K+OJf2mdK8ffFq58Z6Lp02neHbS9jeFww3YXoCQAeuO3SvV/HnxNh1XxxbePbNVvoCn2hPJVV+dSMLJwcj8q9Pi/EU6tH6vSfkTl+OcZWkj9lPixHJ4x8LXWo/De6t9RaCNkN5FH8zQAjCnIJ49f0r4Y+Fen3em+OzHH4iS4N/aC3mtAz5Ri3XDYAx6AV6f+zJ+3TZaDosk/jKxistQuSYwPLHk+WeFwgHHpXW/ti+CfDLTeGvjv4XuI0mv2SPFsAql8Z24XH0r+Y8yxDymUsPUV4yPq6nLOlzI4jxB8TdL/ZC8QW/hPR3jnutcm/ftIPMAUjI/wDrV9MePvjRJceBbS+8f+GJjPYkXdvPCAIpISNo4X69M1+bX7YP7OXxK8bfGPwxeS3JtbC/sbeZpE42bl3HP0xj/Cvfrn4vX/7PnhCHwRoc0eu6XYrunuZl83nHKkMWwB2r6HMshyrEZfGvT/iW6afkeWsZUS5eh7f8L/28Jrb4l6L4o0/R7q08P3Ui2tzHOxaJtnUIo27OnvX3b4xk+GHiyP8A4STT9Mu7ptSyPkm2mOPtxyeeAK/N34a/tGaRqXhV/EfxN0q103TLWTzNPXyY1zKRkfLt6Ee1eD/Gr42/FTw3r0PxWj1+BtFul2wpbReXtTqAyKTjHAr4PLqs8c/7NxULQW1xwxdKOttT6hHjP9nj9mWPU9c8QaF9nvdQ3pEl6qTSud3VSFJHHavlK6/aM+H1tpOr654NsbSBWXcbCWJGePzCFLNx3J4AHFc1+yx430j4ufFPU9U8TanAZBHutRdQmVdzH5htk4Hy5Ar0v9r/AMP/AAw0LRINItUghnu2ZsRxqvmttycbVzgemTX6bwrwthcNmKVGbvbzOKuvarmjofJHwI+PHiPT/G1za3drbzaPYEyzZiQbBIDjbxxtJH4V9p/Bz4zfsnW2ryxWN9LrniTWjKscCyf6PFnOcxMuzgZx71+TfhTwZ4Wtnu9YuL9orJpB5sIYqzY42f5FXvE+g6RdWK6t4c0mWO0tRgXMDCNwMj+IAGv6O4c4xrZY3RueR9X6SPpu70Lxjb/G/X/DJw9nhpY7e2wmRjPRTjjr+FbPhDxXon9n3+hpbRa5PcN+9snVXuIShwMM3A557cV4L4I+CXj660a7+J/gDWJl+zAFjPLvdwRz/ECAOlfS/wCxNr3wc1y8v4NNuo5/Gk8UxkhGAZygOdobgbSP0r5OGdVI5jLF2OujBxskfpv/AME9PA7a7q97p+u6kmk6Lb/KlpPyfMdDtwQuMBscYp/jFPjD8D/FXi+78c2ltqWjXF15NndQQqFRHG0E9W7joK+PdSk+Ket3WjRRxzaVNpRa4uYYHMbSrE285KEDlRjpX6lyftOfDr4l/CiysbO1a3spZ4o72K4UNNtyEfDFdx+oFft2V5hlmfYSMZQ99Pc71Hsfc37Hb/DGb4O6Xb3sltLIF8xkjj+Usec9K+xbvwV4e8Q6zDraLDKkSD5MccDjAxXyJ8Evif4D07Z4b8HaaINDso1ihkKjOMZy3yjoa+Af2nP2pf2svBHxEuLv4cXkK6DCTJ/qRhgh/wBWG3Dr/kV+31M8wmW4WnGpq4kfVm3ufc/7Zvxg+P3h/wAQW/wq+BOjyXbX9lva5VAyR8425GMHFeZ/sc/CHxv8P/CU+vfF6SZPFl9dHChusZ7becfnVr9kL9sTwV8Vvh5cX2sp5fiOMOzQSH96ZO4UnAx6V4B4L/a/+IvwS+K1zZ/G2wfytavf9ADciOJjhecHp1xxXDjPFPJIYmnVnLR2RjVoODsfqRrXxQ1b4aPHLrmhTLpxYeZcIBtT1ZuOa+ifD2v6Z4p0qHXdKffBOuUP+fasPT5NH+Ing+C6vYkktb6Pcyt78fqPyqj8O/Aw8CaZLpEcm+IyGSNeyqeAPwHFfr2Fre1lCtSfuMyno7Ho5UAdabSc04DtXuSj1iA5B3qWmLhRjNKWAFRzMBu/HGKUNk4qKnJ96mpMCaiiitQCiiigBjAbaiibLdKnIyMVGkWw5zQBNkdhSUVHvxxigCSmv92hTkUN92gCOME8+lTCoozjj1qWgBMDOaUUUUADYIwBioAufap6rsdoIoAcBt5zUjNtqsTtxmpc7iBSewEinIp1Rj5V5pQ/asUA+mt92lyKRvu1ryoTIaAM8CilHBz6VRlzM8p+OGsp4f8AhZrl9IcAWU3PT+Gv5KdcvG1Ka9uh0nLN+YNf05/tp6//AGF8CdUlJwZleIf8CFfy+Wsct6ba26+d8v58V5OLm72Oilqj9uv2PNNFh4G0Kx2/NLslP5V+n/xW1GPw98M9Z1hm2pbWjv6dFr4s/ZR8GPbado/mJkQ2Ct6civXP27vEp8K/sn+N9X80QeVpku1vfA4/pXVhIrlNo005K5/AR8SLuy1z4u+MfFuoSbfN1i5Ce4LA5z+nSvkz4leK/K8SJCri4tkAbHI24/A17R8P5IPEfiPUtT1ibfHI8kqjHVjivIdV8P8AiXxF4/Og+Ebb7ZNNINsYAzj0/KvOlrU1PTlFKLsf2xf8ECfCelWn7Mp8Z6PLLtu55IikpJ5XB3Dpj6V++w6V+d//AAS8+G2p/Cz9kjQvD+tWYsryT99LGAB99QR0+lfojXsUHZWPBrrUKkjbacVHSg4Oa1M0TY5B9Ken3qiDZOKkBwc0G4TruT6VRupfKtZJP7iE/kK0ZOYz9K4vxpqK6T4Yu7lv4kaMe25aSghPY88+E6HUNV1fXsfLcyDB9dvFe3bAOa84+Elgtj4ItB/E4LHjHWvR2btRPR2RjDTRDt5I2pxQEwQfQYpifeqambjW+7Vdvu1Yb7tVWb+GmgI6cnDCm0oODmtHFCZPIvmLnpXlfxYuRa+BLu3J+e4Qov1r1aNhjnpXh/xTdL7XdC0AH784Lr/s1kZqTPS/CdpFYeHLK3hHSFM/VlB/TGK6OoYIUt0FvH0QYH4cVNQahRRRQJQQU1vu06mt92g35UQAYpaKKCgooopMaCiiisuZmvKgoooqSgprfdp1Nb7tJ7CexGn3qJDjmhPvUSDPFXR2POrbiAcZ9KSlBwMUlbGIUoODmkpQMnFJ7DROKkCAiohwMVOn3axRuKBgYp6feptOT71bgTU2b71PAycU2Yd6BPYhUZOKaF3HaeORS9OlR3EkSL50xComCc9OKaMD+f7/AIL2ftA2vgT4FWvw0hkMd1qkw34/55SjHT2/ziv44NR8c+FNItDDPFubGUA+gFfrR/wWJ/aT0340ftSX+kTsfsXh1HsQD93fE+On0NfjYvhzwdr0c19cW8j/ANwhsD+Vay2OilBNFrw34l0vxDNvt9OeMlsDkfn0r7U/Y/8AhTY/Fj9oTw94Kt7KaZp7lTOM5ULg4z+VfDvgjw9aaFqT+ZuET/cUHOM8fpX9SX/BBL9nzQtf8V6t8atVs9wt4xFbSNziVG7fhXFuzSUVY/qa8GeG7Pwh4T07w3YRLDFZ28cIUdtigYrp6Unn2pK3OMKKKKAP/9L9FNS+Jnwi+E/wu0xtUtvL1CdFCrIhILYHbaR+teUWP7OmiftUaHresWGqfY703kTw2g3RA/L94cqGx6cV6+/i74MfGjwVHN4xePU10vai3satGg6fMUUEDH6+1es+GPiR4LfTdP8AC/w3vBdXViQSYrcx+YoPfKn+HjrX+L+aZ1jMLR5+U+jqYeL1R+WviP8AZ4174J+PY7H4hmeGzVcRTOzSRlgOG2qzAY9K5D9pL4a+HdQu9CsdNuY5Li+2Nv28PuIAYDBAH+ya/a34k6vpXiTRrm71vU7aaygjLXNgI137QPmQt94cdwB9K/M34jfD34f/ABV+EsvxE+EG3RI9NfbBLJOWKnrja2M9OK3yTFYjMI+67M4a1KK1sfP95+zQ3w70uPw1rtmg/teFrpAQg/eY2jb069a6D4cfAGDT9UtfCsckUYugstzHJyUToVXn8e3piue8Xalr3xq+Flp9p1lbrxJ4Y27mBI3Qx4JbjGOBjHNeAfD34ifFUeO9O1/TtSDCJwJA+FyinpyenGK+hoYOqnyPVnl1JRT0PrC6+AknhXUtQvtCH2m2WRzFG5G8KvHAJ/HpX2L4Wt4tV+COlS3NwJk0PUFu54ZFLbVUZxzjH4A15R8JdN0v4++OtWvtVke0mhBVL3diFWI/uL1C+3X2rvtJ1W90vUtT8B+Mp116K4hMUE9uPJQkfKBsHzdO/Ffm+cc9fE+yrxXu/gevhMS+SyL/AIz8eQfEHximqG+2/wCipBbKqnAABIx6elcxoP7O9r458T6lY6jqq2dnHbCUqVJErk/MvUAcfWvNvHmk22l+IdLh8JwjRZbXakkzyeYOOMbSRgfnX6gT+DpvDPg6317Wr+3aCa3RnnVRzlc+wHp1r5KGIx2FxP8As9Pmiy1Nv3Wj8cPif4eXxr4n0fTY4JUm0a78lgMiJoUUhGxgLXOeG08V30N94u1m3zp9q0kKJgNGNjYB24xjFfqp8NdX0Lx5qep/DGfQvtFjMm5tVRk+VGPGMDIwcZ56V8RfFD4L/ET4V+C/GN54Vvlu9KkDx2ajjHzgEc9SfbpX0GWcTYXG45YLFrkaM6mVJvmiiH4G/Hr4ReEGvNf1PTo9XukUAW1uqxHOcDB2n7vU+wqpdfEj4YeOPCl/q3xFuRZanatI+nmUbxH5jgY4HZSR/hXxb4O+DHiLwp4LFt4slMN3eq0uSpBHRscH/CvPNc8babqPgPVPCDsbC+0wDYsiMPOBcDIJA7c1+75BkFDDYlTo9UcNeUqe6PsLRfAHwk17R7q91jWYZpbNfMkdFKodw4+WvMLfXvhxaeDr/wAJKwmF4xW1uEyArEgKCP06188eA9OuvGPhyOLRrSaNsotw/nEZXIXoSOtN+IvwA8aWXj+HR/h7asIUt/NKNMGwQu4n72OMeldeOwj9tds4J4lPofRfgX4ewfBjSdKbxrduLq9Rg0ay/utjtjcR04U9K4rTP2d9O8EfEm/+IPha9MGlxSDyrqH7qCTkq2055PHWvNvgbYeKvH/jUeHfiZPLPp+lbo3yCTjB6H246V+guhaJ8J77Wb34V+FdfXS9KuAHlM6lyWUZ287dvIFerGlCdJxi9T2aWHvBMu/A7x3d+DviVZ+KvEfiGO304yBfPuI2mR19PbPToa/aX4jftGfATwLbaP8AEXXrK2ubL7MYoGtoUSKaV/uttVSeCRX5meAPDfg3TrFPhv4ssxf6TKrfZ7jhOe2Gx3OO9ddrvhzxB8NfBt54M1cxp4URwYBIUlKk4ZfmILDnHQivzbhTirMcvzKdOjol5I2VKNrM+pNa/wCCoHw48M6SZPAfhs+IL5m8u5itgECBh0+6RkD6V9B6b8QPh9+2L+zbrfh/VPDx8K37ws9lHK4eQvj5fmQLj5gD7V+Y+i+Mv2etB8L2UGhaSv268niNzcBgAc9T05AAr7J+C2seFbTVb3wt8HtXgvodThdp7dNv7mUggfO+OnXAx0xX9I5d4h1K9GSzWF429LfcdmGyRP377H54/sieA/HXhjxFqOofEXU/tNl4YuvLNtCCjuyHOWYH5hjoMV6jp/x3tP2gPGGv/DfxMkloyzPcaTczKcpjhFHcc1+h118OtA+HUlj4t8JSRy3Cyp/ahAVgZBwdytx+Wa+XdI+MXgjx9+0Pf+F5o7aBnBEEsccaAH8FH86/ljxT4hpNQ+oLmipL5HTUwS+G5+gPhr9pfxp+zT+zrpZ8dq11cGZbWKVVLdselfav7MH7TGlfH3QFm8s217EpEkbdSB0boMZr81vgtq3jDx74X1fwR8XBBdw6LqshspJAMLHHwq+5xz+FfVPw7ksPhZ4oPibSrRRJc22140wq9eD+Nf374W+JUJ5PQpVdGkjGXDU56wP0xbCCmneMAqRn8q/PPVP209W8P+G7zxBqvh91+yzMNgcH5B0I4/pXB+A/+CqvwB166S08Y3cukSvwqSQSkZHbKpgV+14XjPA1IWjLU5MTw5iqK5pR0P0d8TeOPC3g6NJPEl5HaiQ7V3cZPpW/p2oWmqWkd9ZSCSKVdykd17V/L/8AtwftWyeLPj9a6Toeq/bdA8tZbdYWwA59e/6V+uX/AAT2+Oc3xN+HraVqdyHns22rEfvBBwK68DnEKs+VHhVoSi7NWP0dI2j5+Kcinr2pMbm2PyKUt5Yx2r2gF344xShsnFV1kR2IUg4/u81KvHPp2quZkKoiaimBsnFPo5mWFFFFHMwCo9lSUUc4CKuOKVlBGAaMfhRjHO6q9ogGKmD1qXC+tR5HY0n41PMwJcL60YX1qEkgdaQFicUc9gJjtA61AybuhpW3D5aaUZRlxx0q4yUttBM4rx54vt/BGhSa3cJ5giBJGcf0r4jsf24PDsniq00rUXEMUxbzl6mIAHGcL/SvYv2tfCHi3xT8NZ08JapFp81qjOwkGd+OfUdMV/MvofxRivfG/iJ5rgy6i22KXAO0CP5Ttx0z1r5niDPvqasZczP6tPBvx4+Ffj2SO38L6zDdzHI2LkHjrXsI+Zdw6dq/n6/Yc+EWh6BIvxYi1J9zMfLtpJiNzPx3OOM+lfut4a8TxatCltdMBeYyyA5GMdiOK7ckzSni6fNF6hznZhdrDJpzEbaZneu77opuG69q9wr2iCjjHPFFIenFBmfmx/wUx8RRWHwbt9KDbWnnU/huUV+D3w50o6v460fTIvmVrtEx7Zr9Z/8Agqrrp8zRfD+7HmR+YR/wICvzv/ZU0A678aNLtgm5YZElI/3TXi4zc6qOx/R98F/DC6NpUSFNvlxiP9RX5o/8Fx/i5L8Lf2O7myhdhJrk7WW1R08yM/njHTiv2C8OW6W9o8FvwN2fpxmv5gv+Dir4qa7YWnhX4a2CCSGS4iuGU467WHT6V3x92nodEN0fzjfDXTdQTwhJqV8ioslvkDgHIx/hXinwUu9Z1r9pXRPD9pIbc6hepCX5O0HPOBivTfHYuNP8FborjypCvCg7ce1av/BNfztc/bE8G6De6b9ulm1GMNMegGG7YPT61wYVc09TtqSfKz/SG+B2jJ4c+FGgaQrbttjDk9cnb/8AWr1msPw/b/YdHtdPCmPyYkXb2wARW5XsxilseE5XCiiimSOT71TVADg5qQP2oLUmSMcps9RivF/jXeCPwylmPvTTwgD23qK9kc/I230NeCfEX/icePtG8OfwlWkP1j5HFBqez6FaLYaPb2aDGxBkfhWgetJGHjQb+vT8hRQyeVCg4OasquarAZOKtIcHFBRBI21aqE5OaszfdqrTQBRRRW4nsPBGMV4dII9a+NbLnK2MCSD2PpXuHCLvPQV4f8KYhqOuar4mfkyStED7KazlFWMUe6/d465JP0zS1HH3qSuZSZuFFFFagMLYOKaWyMUj8NSAZOKC1JiUU8pgZplBqFFFFJ7DQUUUvFYG4lFLxSUAFNb7tOpCMjFAnsRJ96lfrTgmDmmv1pw00R51bcZRRRW5gwqRVxzUdTj7tJ7F0tULUyfdqGpk+7WKNh1OT71NpQcHNbgWU+9STdKbG2XAokO7gCkxPYhUbiBXzF+1/wDEwfCn9nbxP4vDCOWKycQsTjDlTjH0xX02x2rvT+Hk/hX8/X/Be34xJoHwItPhRbStDJqkyFyr7S0Z46Y9feqpbamKP5CfGvjLSvFPiTVfGGvp9qm1a5kuH3Hcdzeh/wDrVT8K6nocVu6takQhchcj/CuMg8P6DZobG0hJ8rAIZsk4/lW3bWFjb6aWuLNlLNgc8AVnWrdEdENNEdL4dGl6vqsOiWlq/nXUu1Dn1r/QH/4Jz/ATTPgN+zToui2MKxPqEUV8524JMqdPw/yK/i3/AOCfHwag+MH7SHhrw3Z23nCC7innXGcR5r/Qf8N6PH4b0Gz0C3TbHaRJCvsqg4/LGKilqhVZPY3aKKK2OcKKKKAP/9P6c/Zk+D+r3Pw6HhXwFaq2q38fnTRzSnO1BlgAxA+6DXtf/CTfFTwZJF4Y8BeH0tb6zjMc5LpuEmPlXn19f0r5GXw3+0Z8GvizL431wS6daWU/looB2PGWwFHbkHHSv0X8dzeE/iNosHxR8P2jT6ikPnX1o37oO0YyHBGCdoGQAO1f4n5xin9Uhc+hpYVwWpzml/s63Xj7SLnW7PVf7O8U3MDPews25GJHKj7oHHHevyZ/aM/Y++OvgL4dz+Ib3zm0JpoyYreRgM89k7H1xX6F6He+MfHvjLQ/EOgaoYNO+xuJ7dv3cnJxnBweOldX8efizYeEfhy3hXTtb+0axIRHDaSrgEAbRjJIJ59KzyjMMZhcTH2cdGLGULQufgF4H1qL4Y38GrWNnNMWgaO4G5+QfUHP06V5bqF3f+MPGl5qsd39ktWz5UEZIPHReMd6/XP4QeCvhfpngDWNX+OUYXxFcbytuw6Ieh44B9AK/OG7+Gt5/wAJwmpfD6zkuYYp/P8ALC8BAc4PHpX69CdZUXV5bXPncfQcUuU+/Ph98S/hl8LPgatlqtuTfTx7Ft1dxKzleJCVweD2/wD1V7bp3iy9+LMnh3xj8L9KOlSp5NhqE0pb95HjBJ3gc/SvAfFvwV8W+Ldb8NePPBmhrd3BMUMkO8AGTIOCuMLgcV9A+JNV+LL35XxRJDbaPosX+rtzHmO5Uj5CEIJwPavyvH5Z+/8AawWp6uUU7K8zV/aT+HfgjR9ObxNrFlJNIVaOKZXZeV7lR0HvmqnhD4wXHxH+FFv4GhWSHSoibee9DtIUCYGdvPHSvd/gn8PH/aY+Fmv+IdfvftUlxC2nQROuzZ33DnrxjtXHf8E/fgbrXwavvE2i/EREt/s4lkhhmKspj3gDqe49uleLVeF5HOvUtKPY96fL9ko/s4TXfwX8d3Pww8HX7a7pl1Gtwt0y/Nluo/2QPrX1Brngn4h/E60stKu7WPUdLgnkEVsrqhUtxliB830IrF+J+j+HfAvhzVPj98GGgu76UGC+shIu1FTn916fl0ryrw98Zrr9nTTLDxv8T2Jh1H/SEjTMilXwcHaflPOBxX57X4fxmOxyr4Nad/IujiOVrsfTnjr9nLSZdLl+M+q2gv8Aw9o0AL2kGDzt2lflP8L4r8B/2ovH9t8YoU17wb4EbS10mciO6BILx52YZdvPX3r9BvCv7ees+ENTk0DwuWsNF1mZgbSYeZtDEuCd46N6Y4rlP2yvF/hHUPDC2Wg61Dp92FRxZrGirM8uAfmXGOD6Gv2rI+LcVhMVDBTp7dTgzOvTqbH5Par4zh8N2Nvq9h/ouplQojTlXb+Q/Kut8E698QLrW4dd16eVLe4ljhnu/LzHAr8HkdeuO1HxQ+HOj2nhi00TRf8ATryYK0Nwn99vvDv93p1/Kv02/Z2utO+Ef7MN18PPjdplvJBra5FyGV5I+m08Anrj0r77PM6pU4KpFani4PDKU7SR9QfD74NeH/hTaJPDeReJtLvoTN5ojTK4AI+6M8+me1fD/wAQNF+GHirw/qPxH8K6RNpepxSpwu9s5bnGQBwB+tfQ37OGoWum/BzXtP07xKXhjng+xtOArCPptVS2ef0r1345aJ4j+HvgOCPRWjureeMu8JjCb+Bg556E1+dYfjTmzGFGnDse+6Vo+7sj5D8GfHjQPFfhC0+G/wAS3FiyWUv2O6xgiQAlM42/xAd6+PPH37QGp3vw1uvAMlzLNLaz7ZLrJYnBGNq579Ku+NfAmofEbSovFmmwTLBpsbrPJErMiEn7vyj06Vy9p4GntfAkOtppgtryP97bXDsC8qpzzGee35V+61uFJ1XGta2h4UsU3PY9A8K+J/Ctx8ONO8F+ONHlvreYRub9S8Rix6gD6fxCvd9IHgf4d6cL7wDful9JKrW8Kyli4Axg88Z+hxXzrd+Pfin46+Hg054oofkIe3QKPM7buAMewrtfC3wx+GGk/Ca28Vre3FxrihFkg2MxicjJHB/hxjoKWKwtTlVKq0aRxcro/S/4Y/FzUdRu9P0a5tZdPiuWBvFDNKjvjnLMOMj0xXy7+078PNa+AvxN/wCEs0JiltqDGazmXkKW6A+uD9K9d/ZG+JmseHNMl0XxZafbknUtFDtG7kYHOCf0r6v/AGhfhiPiv8IFje22NFGTCmctG+QQM4H8q/N4+HVB5nzR+Hex6lOXVnI3F9r2p/sR3us6RrDWWutdyXIulO0mZo87evTjFfQ37Efxy8S/Gn4USwfE+2c65oMYj+0YwJhGuB2xz171+WOreK9XsvhHovwQkJS5OpokmevzDZ09Me9ftP8ADTwrZ/BT4BRaug8qaRTNLhdzbSuOg7cda/auHMvnCfK/hR9LlubRhY9MfU7p7CPUJUQ27tt+4h+fHQgriuE8SaN4W1pCmq6XbyKwwSqKmM9MbQO9eU6Z8QrxDHA1x/oszi6VHG3Cuu3+vpXZaDqmvatr01npoS9sniDoYju2HcBggV7lFpVW6L2P1fCZlQr4dKZ+Znxm/Yev21JfiH4b1dkea5IWI4OwDpg5zj8q/Y//AIJ4fADxJ8KLf/hIdVuRctfQBXUHkd87RnivmP4qH+zl0211COSC3klYysUOFC9a0m/ax8KfA/UbDxbpGqm5hYCCSIfdaNBwMBuOcc1+z+H3EbhL/aNj8z4m4dhWfPR6H7+BySABjIwM5H9K8m+M/j+1+HHgi71y4l8mQLiNjjHJA7ketflRpH/BY34farrUOknS0CyPjcHJxx9MV91eIfGHwN/aH+FLWnxCXGn3q8oxMfcMMEe4FfuOFznC19ISPz3F5PXpRvKJ8d/DL9pzxdD4gkstO1FL9b6RS7KwIhG7pxnOenav130m5W806C8Gd0sak5GM8elfk/4R/YP+Fv8AbKX/AMFdRbTYLOSN2jbc3mjIbuwr9Y7OAWOmQ287BmhiVWOODtA/wr0JxUY8zloeDh6clO0kaCsAc9hUgkBG4dO2K/H74g/8FDtZ8OftPr8IfD1kj2UcqxSySEJjd8vAIPev11sZ2vLKG727RIqnHbkVVOpTZ1zdnaxc3+1G/wBqZjjkd8CnbMYB4qZq/wAIDg2Tigk5wBUY+U1MJF6Yp0oNrUBPm9MUhUkYzTyy44FMVsnHStPZRAjZGUZFJg4zmpWZV61CSCeCAKzBCcgZqG4aYWzPAPmx8tZWq+ItI0m6t7G6nVZbh9qCvAfid4k8Z+GtL1XXNUdo7RYybcRrnBDADuKipPkjzdjKrVS2O6134saJ4C0d7jxdOqSpyEJHPOK+Q/Hv/BRz4SeE3NlZyRz3GPug/KPXkD0r8kPjp+1fc+IhN4c1aL7ROdyjcdpPtX4reNfFXia18Rrp+jsRHNKxMbN0OD8uT6V+dV+LZe2cbaEwU5bH9Un7X/xz8OfGP9nf/hJfAXiBtPubaNi8cPJO4dxkV/OP8MvE2p6PpM+qyy/v5ZWVpSBl8nHSuq+H3xu8QaN4Y1eznszKHjSJlkOFHRcrxz+lcjDZM8Ub3Cqu/wCdIl4HP+FfOcR4t4mJ6GHw0ftH3V8OtW8V634Um0i/vzEsoDWqI23YVIbsR6e1fpH+y3+1e3grVbbwf8QZzELeJh5rnLMFRiOv0HevwfvvihpXgfTxDJO0k67SgXsQR2r1n4T+Jp/H/ja18YeL/wB2hxGADgFSNvT6Gvlclz2eArKN9CMVhdPcP6qfgX8Wm+J2rX2oQ3Ynsc4gXGOlfT2eOMYr8bPgh+0x4C+EWr23g/T0je3nUsGzhhgc8YNfqj4B+Jnhf4k6b/a3hubzok4Jxjn6e1f0FlWd0cXSUoS1PKhFr4j0KlDbSCKrpdW0kphicMR6VYDBDuPQV6yfmdCP5/f+Cl3iAa18W7HT1OfJtiv0wa4f/gnn4ebU/i7PqYAZLe1P5iuE/bP8Rf258e9T2OGW1dox+efwr6u/4Ji+GA0+sa7tztJhzjjkZz/TFeZjFeSsdtOK5T9tNJiVdODEYMi5r+Mv/gvp4507Wf2ndK0a0kG6xsY2KnsU+X9c1/Z7BhLFCq5Crz+HNfwLf8Fk/E+keO/22NQtbWTymsVktnbryj49sdK662lLQ1o6n5OfFjU4L21hTVHY5AIA4Wv1w/4IUeFrLxJ+09p13YaMLpbJ45vtO5f3eMj3r8ofiD/ZMOhm2vikipHjIwT+WK/o+/4NwPgt4Ih8Rar8TPDmttcuIPLa0KgbWRxnnP8AQYrDBUupVebtY/sEMmZCG64GP1paTHPHQADH0pa9Q8oKKKKACiinMu2gaGgdia8E0jzdY+M1xcMONO3oO/31z+HTFe53TmK1kkH8KE/kK8U+DyTXWp61r84z9pmwp9l4oNz3lssPxqMIakLBeop5ZduQKBMrj5TUyN3qCnoe1JmakxzDNMkjwtSNwKeV8wY6YqIy1NSht+bbS+We1StHtbNHPRa62J7HN+Lb/wDsjw1d6j2hTd6dxXH/AAisGsfCSFhjz5GnH+6/Iqn8ZrxovDcWnIcfbSYQPXvXonhq1+xeHbC16GO3RfyHSsXJ2MUbaLjinlQB1ptJzXOjcWiiitwIX+99KE+9Tv46koAQjIxUZTAzUtIRkYoLUmQUUpGDimngUGoj5C8VX3sKnzngikaMEYHFQ4otSYJk1JTFG1ttScVkaiUhOBmlqNz2poB46VG/WlVu1KVzWvKjjrQVyMDJxT/LpVTBqTimzBUmRqu05pGOGpxJHQVG2Tzis1I3VNJaEo6VOn3agHQVOn3avlRmOoooqgJYR8wNI/GMU+GmPjjNCQnsQyYCe3f3xX8MP/BbD9oN/iz+1XP4KmcyW3hwNbBVPy7lYH04r+0n44eMY/AXwi8QeLmkEb2NlNKvP8SrwK/zh/jZ8U4/iR8UfEHj7WVaaS/upJN+O7N0/SrkkouxijxyBNPluDJJakBickN7cdu1b2l3NvLcNCsg8pABgj/69UdN1aVIHmW181T0B4/pXa+C/DMfiLX7XQdP07fe3zqibD0LcV5j1OhH9JX/AAQS/Z7muNc1L446jbbYVU20Tle8TDGD7/Sv6pMnv6AflXxV+wL8HF+Cn7NeheHPswtZbqNLqVAMENInIP0xX2pXVR2IrbhRRRWxiFFFFAH/1PvD9p/41/E/4l/BPTdZ2x6bNZSgrCcb5QGG3PAI/Wus+F/xO8X/ABH8H6VFBpNt/bUcIiKLIFB7c/KOo9q579sy++E/iD4X6frujloNV4KLDyuQRkfKfTjpXhH7Hfi/S/DepC48Y2TXbXTKYGKuBs6E56fLX+E/FeJnPDxi1oj6erjf3ivsfW3hH9njWfEHjK48ZeJdVMGsaU3kC1Rl2BTyUXBUDjjoa8j/AG0fgHc6/wCJfDmpeG7TzprOaK4uWlPkqqowO3J+8OOor691vx74Rt7zUdU8KaejfYrhHuVY4O8LkdM9ua+P/wBsH9qTVfi/o+meEtI04vAhTzrgZWRE3DKqqqM8DHWvGy3N8XHERinokdmNqU+RHxD+2p4Z07wZobeK9K8S755ZFl/s2Hb5MRxxh92SM9sV5l+yf4z8RadpV5az30Mt3qMTSI7bPlZhgDbnpX2d4m+GfwE+O37N+q2dtaHS/EGjLI8cjD55BGmejEYzjHfFfluvwc0PwB4Y06Xwx4kkl1u8KrLCyhBGre4J+7+Ga/ozJ80jicIqdY+Rxs3ddkfrD8Dfin4f8PMmg6pqclt4lnukPkSR4Upnb5qZOMZ4xj8a6XUPAPwg8Opq/wDwkV/mTVLiWWK7c/fu26ptzhRj3/CvDvA+o+CvGkmk6l8QbYT+IdEtEgthaASF4ozkFwpGMsAfavzi+Knjnx/d+MtS0HUblv7M+3NILYtgoSeOv/1q8zEYNTvToOx6EMXT5FZH7zeCfGlsfCxNlrsPhGHT4RGVt3Rw8ijAk52dfTH414JceCfjd8cI7fUNM8WLcWF7etaXV8Nsbrb4PRVPPOO4r4Q1z4Y3/wARfDenX3gKRjo9vCpupJH2EzDG5Qu47q/SjwN+yV4+0v4aaZq8mpp4W0ExCQXfmgMzEdArMoyenXpXxdfJI4R/vI3uepgf7+x6sfh38IvhRfXPwceCbV7PVbGIWt3h/nvG65GTwQPWvBP2uY9QMWiaJ4QsFj0NG8meVfnCOq4blhxgjGK9c+InxGub2PTdO03VoI5tESP7NfiSMs4iQr90eueuTXwn4++JXjjV/hqvw6My30kV5NczuWA8xZDnr2r2sNGFKKjTVrixtSjFaI8l+L3wv+InhS2ePxjEtwIIxPDd2pEjlGHyBgvTC+9fSPwy+Bnwq+Kf7NWo/FP4irLc6jZ7Ft2HWM+YIwTz+mK+T/H37VPiTRVb4R+GNERtSurVIrq4aTmGMD765U5+UYxx1619Lfsg/tDaD4Y+Aer6HcWsWrWFzvF2ZyEaN1lyu0c/xkelfTZ1wbWk6eIou2h5FOMZtWPB/C3wr1X4PeJZNO8eIlzplntlskL/ADSLcc9D0wDnv0r7c8JfAC38S+ItI8U+D2TU9C1ZJJGt5ZdjRCEchVO/dk8dBgVl/s8eDfAXxX8D6h8U/ireJq18HkSztppFHlIrbRgg/wAKZAG3mvoP4YfCXSLbxZZ+P/D2oz22haMT9ghWMhJTKfnU/PgAHjvX5/xhm9TDUOVx1SPaw2Cine55N8dvBfwr8GfDi91T/kHXjyINNERy37rgkqMY5+XpXn3h/wDaK16DwXDqXx91JEstPtpIbRzg+d5i4X5R028DqfX2r6j/AGv/AIc/Df4rmx1Hw/qEFnrmlKwksC4VHQjecHI549K/PT9on4cfDLxt8LvDwOdLXSlYX0SA7pD03Bc/Nj2+vtXN4V4iGMl9arR95PsXi6jpe6mfZP7CH7Zf7Nvgz4U614D+KVtGtlrUsbpld7fKrjAPH3jj09K8I/bI+FngXxLreh/ET4UXjaV4dlRDNHGo2oHP3Tls5x6Yrz79jb4Q/APxl8Vn0LXYrq50m0DS2imB8MUAZT+DDpX0L8YNK+Guuz6p8C4pZLaxvZVvvtCoVNs0AysJXP8AGQB1Hpiv6YzfimXs40k7LY8iyvc5r4CfBD4fXbyeJJb0XsCyIIog3zbcgA4Hv2rtv+EH8WfCP4l6/Z6fbxz2mv2c8tqjABVdx+74IOCpH/6q8A+E/wCyh+0t4r+1+JvhHewWUOjTgQ7phE8iKM52Nx7H2r3zx1bftH61a2k3iaK2RNKjzfX1vcpJIhXrhVUfln8q/BeI8xlTx3LTq3vsg5T1f9mr4YePNK0sfEXxLbxLeW/+jvIxABb/AGQcY4r7m134xeCPDmgxaNM8dxeXyeW8KkMys3GcCvlD/he3hqX4eaR4e0RItUW6KA72Eci3BwuZFXdgY561V8KaZ8PvAevw6h8SdOhtNWurnZDPvzHkjjyyTz+Ve7k+Y4+lNTrRO2DgoPmOU+PHwXuIviF4Z+LNhGIoIbmE3MA5xCpGWI+ntX9DHw38O+G/FvwhbWXtgEurQQAN08oD5SOOM/T2r8Gdc+I0mr/GgRwTfbNHiCx3SsNo2g4IUcjmv6MfhBrHhjVfh5Y2HhvBtvs64AwMDgAfgK/qTg+th50JwquzcX+Rxxl/z7PxLv8AXvhv4r1e+sNcQxnTJmt2MYOViTgDjHfHavSP2bNa+Ev7Oer6z4nk1ma4069h3LvjLeX8wPQscAV8a+NTrMHxu1G38KyusV7qdxBNHjACgn5s4/TFdt4Z8Jy3/ijVfB/iy+MmnajEIDGmHAG4Z5GMZr8nyfNKtDHSjLVXt8j6ZY2pGmo3PtPwV8QND+PkH/CLa1f218mo3D+V5JQmOJmyu7HTIHT8Ksa7+xz8EtL1XU9I1DQI7+G3t1eMyMcFm68j7tXf2N/2NPhB8E9CbxF4SddQvZZnZp+d0eGyFxvYDC8f0rA/a5/aX/4RLTrnwV4GmzfSJsmuFA+QYxjvX7NPMKdOknHS59VkmHlUxEafNZHkM/7CX7OsVwNb0KIWt5Z7Znto8unsM8fyrf8AiRr9/wCOvB0Hwz8FRpo11bYjSSV/KI2kHI3bR0FfPX7JPxH+Iuo6hfNearJN5WCGkA+hH5dK968ZaLD441qTV/Eigtnapb5enfoBU5DjMVTrOo9j6riXJFRhFTldHq3wE8MftB+ALs6hqXiGC7jCAKvnRt/Dt7Mf5V7V4z+L3xZ0v4g6B4JTURJLqDFpYUIyBGQcce3P4V8Qx/Dx7MGXR717XYjEMMkDCnHSsn9jez8eePP2k9f+IPjC6klXSpUitRIrAFWGw7c+3tX3uO4sxTpKJ+S5nhqUJ+4e+ftU/CP4MH4w6X4wv7UprMu2ZpUBHzJzyB16V+hvhr9oL4eaF4Dhu9dv41ljh5DY52jgYz7V+Wv7cfjPxhpXxptZtA0/7Vb28ZBI6DI9NtfOVtr6fESykTxFoSKYwQfnYHAGc8AV2YXxA+qUbTWp9PguCqOLocylZn64/DP9rzVfHfxKlF5DbweG1BCTeapY8HHycHriveNd/aj+Gfgq5km8aXkNnBIwSBlYMz/ReK/B4fslXdx4Cl+LXhf4k3PhezgAd7VY49kYxk/M7g8Y9q8QtP2cfib+1Na22pfDnxuPFSaUd/MsaHKHoQjMecV9Rl3iDz0eZo8PHcJ4eh7vPdn9OPh79o74XeKdVTS9IvC7PCZ8kYARef5CvULXxh4avrD+0rK9hlgDiPejAjeRkD8q/mQ1Ww/aw0fRYtP1bRG0oWEbWclzASzNEflPARf4fevUf2ePjn40uJ08HOn/ABJtNmVmM0mx5ZV4yQenpiu7LuPabups8Opw3L7DP6PFuYDCk+8BZPu54FSmWNCMnGeK/P7/AIWx8UfEl3BD4fsrRbS3IZf9JTPsMYrM8afEn44trdjZalGNMgaZQJYJBJ14xgAV6a42w5j/AKvVUrM+/dc1iy0HTpdT1RxHFCNzfSvINQ+OngXT9l39sje3IHIYHkjpivzL+J/xI+ObeN9X+FmoXzXtreWJltt52guWCiP+uf0r4s+GnjfT/DUj2HjxXa+02czy2z52FU4K7s/0pR4so31eh52PyupRifqz8QPjh8J/EHxt8P2eia+I76RonMKsuAGz/tcdMYxW1+3V+0lafB74KyeJNHtU1YTGSF2Bzs246AA1+CviHVPhP4H/AGiE+LdpB9ssLiJSq5YCKXk8ckEAHGOPX2r1T4sfF608aaF/wry2vRJYb2vLnacrFHIuVbB98DGRXbhM+o1k43PAad7SR+X3j3W9X+LbP46gddOvN+9I2bY2085x9OOlfL3jyDxBb6vBqM774mx8x4wehP5Vf+IHia21z4lXOr2V/wCVa6cQilB8rBDtxgHjP41Y1LxMnxQ0+7h0fzp5IFA2eWQnGOh/+tXyGKwtFzlJHt4RJWOy0jxPpnh9YvD+qv8AbLO5Cs0o6r3AwM98V33xB1/QdNi0zWPCl3LLbINs8ZXaE44yee9eC+BvC4gtY9a1KQwQwMFKycfMD0Gf8K9h1Z9Lv7OS20O43wXhUTqMNtAIPH5V8/Xre7y9D05Uub4TO8N6bc+NtYvtQ+zPJAgURN7n04r6t8CzRaR4fFo2Z7mJlwPu7OR9c4/Cn/CzwgfA2g3uoafd/boLyPMa4B8s4x+FHg69hbTbm1uVH2zcTHjn8/TivzbMqLdR8pr7Cy5Wd5osurXvxR0q5sJvtCrEWmY/IFC8kd+o4r7x8N/8FBLD4Sajqnws8OEJNKGEJH8L4A9Pf2r8z9W1DxF4Hjs5NMw9zIGLgdcHtXzNY6n4h8Y/FTUPEa2oNxHu2wE9yMdcf0r0spzCtRilRnY8evgLO5/U7+wf+0ydRin0P4oaiZtXvZSYl9FJ4/Sv1i125Wy0S7vc/wCqiZuPQLX87/8AwTa+E889wfiR8RZWtLe0kEKpJ/fPI646HFfvV8S9eg074Yarq1vIrqbOXYw6H5Div6A4Xxc54e9RnDKKUkkfy8fGq9j1n4neINURt2Lhvxzmv1U/YBTxJ4N+HzXVvbLMl7cKeuONv0Nfj5rckmo6te3bNzPIzfnmv6Av2RvD5034a6NCE2GWNJD37Y6V6lGo3Uszp2Vkfceq6vHpGhT6td/KsMJkYdAABX+dL+2prlt46/a48ceJpGV4Bql0kf03tX+gh+0NqEel/BPxVqBkERh06XDHgcL+lf50vjCfQNT8R+JNSv2M81xfXDL6cvnOfxxXfiZrlsjTDnx3490vU5tT2aNtCyDje4Uc8Yr+3H/g39/Z2tPhR+zo/i25iQajqU0vmyIwZSDggDFfwlfFFtUl1KOCGM4J2KEB/Div9Ez/AIIm+DNS8HfsPaGmrRss07mT58g7XUHvmngpOwYjY/XyikJwQBS13HmBRRRQAU4tnFNooA5nxhqCaZ4bu7ljj92yg/UYrmPhHYta+DLd5OsrFsYrN+Ml6IPCq2B+9NLGPwLrXpPhy0jsNGtbRf4YxigtSZtum4Y6VFyPlqxUTLjmg0ew3Hy5pU+9SZ+XFCZ3UnsYomIyMVIhwcUylBwc1ijchlOBmow5Ub1HTtUzjjNQbTuyK6eZgeD/ABNb+0vGGjaKnPkS+aR7EdK94MYjOE4UYwPTjpXgmktFrvxlvJlO+K2txj2YHGK98JL54qSeVCx/OobpTymBmo48ooX0qQtkYqeVFDKQ8CnAdqdtX1qgIduGBp9SvtI4qKgAooooAYUyc0nl1JRQVzMjKACo6sUUBzsqlcnNJgjnrVukIyMVDii1VZV3H0qMnNTyAAYFQYPpWRv7RADg5p+/2pmD6UYPpVczM3qOL8YpuTShT0p3l01ICVMHANOdBtpFG1Q1KWyMVfKhPYjHAxU6fdqGpk+7VGA6iigDPApMCaI45psisVITrjA/HilGFX5eaQOCQMdxWcZaiex+Nv8AwWg/aFk+Dn7MF3oOjsEv9ZkSIrnB8txtOK/hzudVvIlSJ4FKld+MDkmv3v8A+C8Hx6g17476d8OYNjx6XbMky7uN8TjBI7ZB/Cvwaj16K/X7WLGPegwozxj8v6VrXqJKyHSgmiOw1eK8/wBHuYgmO3QV+qn/AASn+C7fFP8Aak0d7ex8y10+4huZjjeoRW6dsV+T9tqlkdQ+0XVht2YfC55x26V/Yz/wQk+BX/CN/CXUPi5qEAiuNQuHhhLLz5eMr/n2rjpRTNXFJH9AFrBFZ262tuu2NAVVewCnAA/Cp6KK64xS2ORyuFFFFMkKKKKAP//V53wz4D+O7JL9rl1HUdOtgx8iSBjGQo5OQoPA5GPSvVvBvxZ8aaFHaaVd6EdLslQvaTyq6sVXqi7lx8x7/pX6nfAn4+XPjR7zw8lslhptrBIrTz4iXGw9CeOfrXyT+118bvDSeBdF8GW0NjqU6k+VcwOrSRgSAjhSfSv8YMxwLrR5JxPpa2DjTgrHlOo/tEah4pv08LeBbBdKv9UdVu3b92ry42qTkc/pVb4l/BL49/BzR4vibNfWlxuby2iedAyt67Pm4/CvnTwtbf8ACS/ETTf+Er1P7F9qIVDHjzYyflDFO1bHxx1fxd4W+I//AAhnj7WRqeh2yZilRw0jKBxuwOtebgOF505e3l0MKk4uNmec2fxQ1bRNQ1KXXIjdPet8/wDCDvXkrjt2xXnHjf4cz61HB408Iyho4sRywMdhOPmOBzwFr7HPxY/ZuvtNtbPw1pUd7OlgYJHulC7XP8W7PYcAV86zanovh7wVfrp0iS+INTdorO2jIIUMNqcAn+Ve7galWU+VKyPIrOOx2nw3udX+Fty3iv4W6dDFqktiftPmtsQfQtuBPtgV7t8Bv2c/Cn7TvgPxF8X/AB6BYX9krsXjCtulHfGRj8q+IfhFL8QNWivPhX8Q5JNNu5P9JE0w8t8AbNiAjkZxX0f+zx8R/FnwM1HVLDw7cXOtaLLm3u7KZBgn+JwFUk49OPrX1eVZa4TctzswtNSag46H0v8ACn4G+GfBfwxvL3xbqzz6fHumtYUCsZZeyqFIJx6eleu/Ev8AaU+CP7Yfgiy+Cvhu7OkRaCsUk0c37ojavlPwSuee1dZ8CX+G/i7SLXXfDmmy3dzPflntmjbZbAKeVB4H04r5f1L4X/Av4afF/XcRQXurTeZcv/aX7oIrtnZEQSD7DFVndShVtGUdj6SrSjCNktDPl/Z9+HQtbTxv4Kvv7Q8LtusbhicvDLDy7YB6ce1fFVn8R/C3hbxHfR3mni4tobh40jkztKA4T3ORyPSvfvhU/iiHXtW8D6BBLpGjeJJWgiWXKRb2Od8WeO3txXQ2vgr4MeD/AB9F8MviwytrJ2t9ogAdeQRycgDAFeZPD4RKL7HzuJoKbtscroeifBXx5fX3xc8X2f8AZj2sAEdtAm95gBtUBcqTzjtwK8F+GFv4J1PQm8L2Gm3lh/at1IWaOFsKhkyvb1A4xX2yNE+FXw8+N1zaho7+0itle0ec7YM46b846dse1eb6F+0bous+PrjwBbaXbac1pJI1vPb55Zgec+gr9GwmP56MW+hlGjyPliYsPwkj/Zfm06PVtUlvdL1tiTCFDHGc8qmSuPqK+mf2l/iL8Svh58INP1f4PMsHhm/2oY5mEbwg4BIU8nLYx0r5m0z41WXhWSzk1y3m8eaw08hmiu48x2qhvl2mPGR35FfZnjPwnY/tI+B/D/izx3eP4c066R1WzsAroCvyp94DHOD04xX5VmWY4T2rljHpfQ9anSfKfNfh/wCE3gmPwdafErx7rE9zq18Emihl3LyPUhsbcV9ieFPDX7Pfxu8DS6brFwi+ILCB3iikHl20gRdxVZNwB+UH0/pXz5Z/Cz/hGNHvPhR4lnj155EYaXfb98qx4yQ+0hV2qD/9avkTTPhZ4m8LeA5bzxd4kNvZRMxhjglViMnCrjOeTgfjX33DWWU40XUwtuQ5nRZ92/Aj+3NTuG8b6ZLbeG4/D8F1HbQwSKzzSD/V/LkZGQB0NfJvwr8W/Hr4w/tAy6DrulLDda1eC4kluP3ahI2wQCVAxgZr234EfBDUNU8CWPxb1uScAII444uWCseGdBjGOua0vGOh+I7f4seG/Dmh+JvtWqahYyCOTeuYA5IA6fLxxzXyOf46o5+xpu/QzUD6E+J/wx8c+A/izZ6N4C1pVS7jEFwsTqU3scEgA9hXGarpfg/4GavP8PPGOp3k2qa5E8rxxR+ZHljt2MwPy7s+nHpXLeF/2f8A4mfDXxkdX+KPi1Ptlo++wE86eVOqncPm9c8V7vc2MfiaO6+IHiS4slu7W6WYqsivK6qMkIO49OlfnOZ4OrTxsFNFT5eXQ/Ja3/sO3+PsvhTR9Qm0K1hLCaeEEh5QcBfm4Jwa9n+JvxeW4+yaB8SLq6vbXSbhVs5JYdowpGGBAH86wPil4Q0r4l/Fe+134TxCSSMveT211+6Td1wMfxDH3ar+CvCvxB/a58Sj4e+IoYtEudIhMkUPmbCwHAPPUGv1LH5yqFOEF0R5ronqHgHxBdWCT+PdCujqFndv5P2QHc+T/EVGSBX7Xf8ABPH41ePdQ0I6Z4ytmsFiu9sJfKnyccAAivw6+G/w58T/AAU+KE6SPFBqHFqLe1bcjgcbiDkZ/Cv1A8CX3xU8NxWb+dFLO0vnyiZgpSPOAg45NcWH4xxU8dCFPqdmGptH0D8IvhynjH9s/wAV+HtbBeySBruJdvyrufrmvPx8O7fwP8RNQPjS7i00T3cq2z7/AJSueMnt7V9Aah8e/hP+zpDqXxV8T6hDHq17phhQZGXYENtA9q/OT4p/GP4c/tieD9c8R2WoyaV9ktlKE4jfzDgfIuRn17V+syqwoQgre9Jq51Vca7q59jeJPiPqP7LthH4L0HUGvovE0kiGWRlRIW4O4ljjaR05FfK2ifEHwW19qegeKzFfXu15JJEO8D0OemO9fIGqeIPiD+0ho9j8K/EOoW1laaXEEivhIDO0WAo3Arjdx+FfLP7cfjax/Yn0uDwF4Q1L+2NV1y3WGa6mYGSCLbkFdoxyRjp0r9SfCNfHToxpPTQ7qGfOFRVEer63+0sngaGQ+EtSNg5u3DlTwqq3H512vin/AIKG/DvR7CwvvHHii4ubh1CeVbrvjJ6Ddt6flX86Xhjx1rXxF1OXQhdO8TOHdj2wMmrmt6H4d0Z5LnUr6SztQ+1duCW9cAnv/Kv6NyXgihQw6p1InZmfFVbFJU5vQ/pw8K/8FRPgzFo40O9uZ57mcoqeUm4KNw6kH0+lfXXwp/4Ke/s/+EPiRFaeI4YLKGTafPiOW4Xqc4Ffxd618U/DukWf2PwNDFZhV5uR8rP7nOa+YfEHxsvLqaSC61B5XGRlT/WrxnBmFmuWLPH5nuf6LWtftR/Af4veNbrU9H8SWpjnYeUs0kaZz25Ne8fBnwloHiLxOBHaQ3FtNGx3RsrA8Ecbc1/m5+APiRDpVrDqWp3j+bkeWoduueO/9K/ar/gn1/wU7+KHwe8ZxaXr+qXV1pTxugGAyx8EAE4B447ivmc38M70bxPoMrzRwVrn9NX7cvxI/Z4+FXgSb4Q+LvPjGrDynFpEXEa4IyenTOfwr4l/4J2a7+yj+x7cavffD3xLc3L6zcB1+1J5axqQVIG4kDGc9umK7G1/ac+BXxrha88Y2GnahPIcmVnJbB9RnivP/HP7Pfwd+JeoW/8AZ+mR6RorgBJ7TcW3HocZA6/pXx2GrwoQlhK8LWR9DicH7eHPc/YPxR+3B4ImvLLTPDFzb6slzDmUBo2w546DPavDvijd/BnxHBat4P0rZqczhrma3T5Qx6jjivFfhz/wTz0bwZ4ZbU/At8l2JmErTyOP3aKvI/yR6V5z4o+PuveHIY/Bvwx0u1vJ7S9WylGfvsePMbA4Ar89hVtiWo7HHhcK4NHvMOgatopfU9L1Ge2MI3YVeQAOvIxXAeIvj38TfD3iSCG91WVtPyPKlkCjc2O3H4YzXvlqmpeIfBzWcslp/a0lsRPDbyFgp9Dzx+VfNXxs2Hw94Y0+50cyRWd6kfmIucMBk7j6DFezyTkvd0O3EVnF2Z6b8VvGHxL8W3Gj+Jo7NI7/AE5VuEkzhni7dufpX5q/tJ/Ee9+yz6L4gP2W/wBRZnEsfBCOfunA9ea/VL4meOPDekeHbaETrPdpCr4iILKMcD2HtXgl3+zx8H/iPo8Xiv4jXLrZzNv+0JgNE5GcHLAAD6189nvE08MlSscuNUHBXR+ROo+GfG+m6St1cXM97ocECPMpB2jOFzn8arfFnVtKu7KWx8B6jJBPLYxeZGv3ZEGCFJB7EZ/Cv0E1XRdHsNK1bwR4R8QWt74WKmEztNHvK55UAbun1r83PiJaeAtNeZvDIe1toYvLheMZEpQ4IJz+Ne/wdnznoz4vMcDF6xR8q+Grrw74mluLLXbcacYmC7k5y6jnPTrXqfhvxXqnhlWXRJPs62fK7cZcdOePSvLW8Ovq2oImmSIgfDMpPJYnFejn4f6zaX0en3XFyo3FQeSuODivvlimcNHDaGx4m8S6f8QtAhlvj5HlyZcDg7jxk4x/KtP4U+ErKfxHNpek3QYQxmR8njGPrRZ+BIby3lCqwmZf3gIwox0q78L/AAreS6pPb2P7g/dYk4JA/wDrVlKSloethsPJH2X8Jrv+0tNntrMLDaxsY5GJwD24H1rjfGdnpHwtvpJdKvBM1yC2c52nGRiuc+IHinTvCXgv+x9A8yGWP/Wnbj0/OvlrSNXn1OdTr0xNs53xGU7T8vPv6V5GLy3RnZUoX3PtbQPFNjaaVB4l8QK15c3q7QmOBjp9KzPBfhaeTx9ceNHhS0t7ceezHjO0ZwB+lfPWkeNfEFxeraaWVNozjBPZV5OPyr3+28Sf8JIV025JWBGC/u+Sc8e1fLqhHDzUkzz54FWP0v8AAPx51zxHZadp8SLFpOq3sEYWA5fcWCdABjHWv2f/AGgbq38C/svG1ikO3yPK5zkmRfp2r8BfhJp9h8KdZ07xgI/tNrDIjm3OcIB1YfTr2r7B/bB/bQ0P4kaZonwc8EvGLa6h+0zSBjvTySM5XPGfrX7ZwfxLhpUXGT1R4GIwslJWPhfR7aS71GytZFBM8qrgHnk46V/TF8B9KWy8N6PZquPLtVH0I4r+aj4B67oHj7402Hgrw04uZba4jeV/4AFYZ5/Cv6ovhzpiWKtErL+5IQY9MV9llmMp1qnukzg4rU+ZP+CjfiJPDX7JPiu4aURtNZSRLzjllz+mK/z3zFfWWnS3VwCTMS3t83Of0r+4v/gtVrFxo37HFxHbOFluJ/JHvlDiv4KvGGqeM7TR0e8SWBY0UHYM9Bj2r18Wo7IqjKyucr4Qm8R698adI0extPthmu1jVccc8ehr/UB/Zb0FfDnwA8K6f5C27f2dAWjXjDbOa/zXP+Ccfhfx78VP2xvBul6d572ranE8rFOAoJr/AE9PD8Vl4W0LTvD97cKJIYkiAJxnsOKrCuEVZuxjWqufwI6tV206mB0K8HJx29uPalywwNvau9VIbI4neOjQ6ikDKenSnYPbpTGJRjPA9KOO/FPXIOQM4oLTieC/FH/iZeMNG0BeRJuLf8A56V7wkaW8ap12AKK8Fj/4nHxmkP3hpoYfTev+RXvxAZcHvzQXyoUN8230pSMjFR5AfJ6U8njI6UmUIExTsCkLBetAPZhj0rLmZPKh1FFFSUIRkYqnPOlrbvdSfdjG4/hVyuE+It8um+DNQlzhvKO368cVakwPOvghZfaZ9Y8QSdZLyWMf7oPFfQG1UU9682+F+mnTPCNsQMG4Bmbju+P5Yr0VsjitQEJGMYptFFABSc0tJzQAc0tAyeKUqQKAEpCcDNKM0jY2j3oAAcjNBOBmm5CDGRSnBHHIPQigBVO4ZpaaoKjFOoAKKKKAGFMnNGwUu75ttOqeRAM2CjYKfRRyIrmZCQBxTalKZOaTy6OVBzMcn3adSAYGKWqDmYhGRigDAxS0D0oJCnoO4pjfKQKkT7vFJ7CZEV/ecHArmfHGvHwn4T1HxEpX/Qbd5iW4A2LmupUqTuHOP8ivzk/4Kf8Axyt/gj+ypq2sJMBPqO6yQZwT5y4z07dMUqcVa5nF62P4fP21fiDrPxo/aE8U+Nbm0E3najIYzksPKPvgelfOVlaLFskWMwBuMqOld7J4hvru3MsxzLKSW+mfSpYr+eztvMmt/MhGOAuevFctaa2PRp00keh/A/4XeJfiz8U9D8D6ORMNQniidfRWYDNf6F/7Ofwm0z4KfCHRPh/YxLC1lbRLKFHWQIQT7Zr+Vf8A4IifAwePfjpJ8RrizzZafCHUuvSVDkD9K/sZGN3Jy3BOBxxxWtGKscdWT2JKKKK3OcKKKKACiiigD//W+5PgV4D8UnQtOm8V6rpF5oOtWr5EN0rvE/3VD49Tj6V+bPxr+Evhf4P+Mr99N1NLm9W7ESrC6uqJIw5Bzxj6V71o6eGvBulNodlHqNqgIwtpECnB9aij+HPwz8Zvc3k1peNPK28yTQj0xyRj8K/ibN/AqrDSB6VWtJxR8ZfETwN4i+FHiXT9f8Qz3M76hGHt7mD5sqeRk8Y9AK3L7xJYzzQWurad9qYEo0lwD5vUc4r7M1rwro13Po3h3xHdy3aaa8bWqXQ42qwO3HHHFaPxM+Enh7xV4vufGjSi3mYHFpEQFxt6fp6V8hifC6pCPIpbdDiqYrlVmfAOveJ/h/dCSOGxFubZtg8hchvTI4A/XFe3/BLT/wBnfUnN617qUviWBfNK28SPDBjkZbI+717dK7C2+E3w/wDFdk2j26myuUOZdy7S3055r2mP4XfD3w/4Hj0DwXaQWd/t2z3kXEj56qfqOK82Hh7iK8HTw0UnYijWp35mZ3xEi+DPxo1DR59PutQvde0NEExt4wyuoYHqCMkkdMcV89/s/WfxO0742a7feFreXUrBFffbTrhom3fekX+EY/z2r0Twf8Pfid8PfE9nr3hJ7e2iilDSFJNrMg9sGvrKbxL4b+Hep3Pj/wCGgml17VExqEcy4im9VJ7j8KrK/CjO8LFucbn1OBxFKSvsWvA3jL4k+ANJk8afDnT0+w3NywuxHuZxKB83lrzlB68fSvSPCn7KHhf9o3xLN4i8bSSRTww/aovNyjs7n8OB2FfNep/ErxTBd6Zd+F7pbGPUJ86hbRttSBf9gY6e3FfoLcftZ/Az4ew2WuPdvf34hW2dIVDKNo4Jxjv7cV8ln/BeYUHzzhY7JYynzK5+XPxAsPjFp3x70L4Y6y6/2Tb3gWxlz+6jAOPmbAr5A+Omu6pZ/Fm7sb5oDcWSK10yvuGMsMBsDOOMV956l43134i6DrOjahf6fJ9uvZrixuppR9pt9/ICYUYwOMZr82tA+EXivxB4hm1LVpEuZBO9vKLhvkkiToSf1rpwvBledBOULnkZpTjJ3pkeufEvRr9bHVdBkn1uFGC3ENwDiMdP3eOw/lX0Nb6b4C0K61nTbG1RNQ+z287TRj5od5VuPw4PtWj8Of2TdN+KHjG70D4dajFpq2UO+cyyCKEnHKxtj5vSvLtK+Avxcn8W6yGvGdtHfZcSK3yzojDYOnTov0r158L4ylh+RLSxjhKkoKzR+oHw00b4X638MNO1Tw1pawXwz590VAaQgdAfc9favXPCnjn4Y6PY6la3drJJq1moWKzkTbACwx8vX19K/IbUf2qfEngYDw1PbRacuVRobf7vykfNjHXiv068FfEK0+IPg7Q77R7C0lh1Fd93dx/8farEMsAMcZC4PtmvwLizw8xdSj7SKejPRp1ubbQ2fAnwk8V+NNUtPGVtHHo+kWiTJd3CnbIS4Pyx5BB/u/j2r4C+KPhXwP8AATxy9p49e81GyvLkfYLYorO2xx5juo+6E3DHWv1DSNvi7q733hDXpdO8N6EUjj023cJJdOP76Yyfmxn25r5E/aZ+BXxpl8X638X9X0yC5trNSlpbXJKtFHKnztGuO/Gfavs8oweMpYeGFqwaTVjZU4vS59leEfjN8IvB/wCzleJoV/bC6ntWjjQFfN5UqAV5xjNfAX7L/wCy9efEnxFcfFFPEH2XVrXdIqXEgRiiZbaobI5HtX8/HxP+JnizQvGbWenX8lnFuJcIxVQ3pjmu88CftVfFTQLyH+ydWlnnB4yx4wOBwK/duFvBOjHDfWZy+Iqrg/dep+7t74A0j9qPx7qvh/X/ABa9lfaBcBba31CVYLZgBnYH46sK4zVfG3i/U/GzfD3wxoVnHqui27Wi3Nod1vMF/wCWhfnkYwDivNfhXf8Agbxj4di8T/E9JybqAi4kgXdJ57fxr06elfYvwc/ZQuNP+Dt98S/hX4le71BbpfsllLIolksnGWyuCcj0r898ReFKWE1hvE8OUOX4jxXwJ8Avih8JvFmm/Em9uR4gnv71PtenQneNp6/KB2r3r9ob4lnwn8ZNI8ReDPDtnp2sagyWYZgYgiNxhjg4Ptiuo8T+E/HmsazoninwXrH9i6raWflXtmXEc3u4THUDpWl8Uv2d9B+L3hf/AITu21a+fVIYvs8i3HCmQY/eLzy34V8PQyijjKHtpr3kgc42M/wd4SkTxjB8RL+CJruxuhLfOzfuV29gx4Ix9K97+KOgT/G3wze658O9XtrQW7O8dxDMo/f9fKGPb/DFfDHjHxZ4i/4V5YfArTpZ5L0ukU/kgFynAy/Hevpf9iPW/gt8PfDg+H3iGeec218zMJEBX7R0Kkj0XNePVzb6g1WpU9Y/odVCN9D4Y0n9mn43/HWw1aD4rRP5+lKTbNOWwwBxvX7oxjtXc/DG20bwfqVh4Zt/Dqa2LQhdQ8tWkVQox298V91ftd6l8R4TpniD4XzPNomo3bW1wYcbo4wv3QAO34UeAfB/hb4deHdQ8S+HdSEdv9nE12CwWYkYJ3Ic4Ge9dNHxIePrUl1utAq4BRd30Oc+P/ww+Dvg2xufiL4X0/8Ase0ezWRHiXbiUr83U8Y6Yr+Rf9ozxpqvxV+It94m8TzyXUk0n2e38w9I4zx9Mgelf0xftAfGLxLqn7L2seGfFt3pl0rvKtpLbSb51UsrJuwBjiv5lPiFpsdvrc2olgzrDGwTspAwceua/wBGfCmiquDVea6HFXcfso84+JPjXwr8CLK107SYWe/uFRpCF+XDdc/hXyv8ZvjJc+OZNN/seIiKHltgxzivWfjboM+uX8WsXLth1jUL26Yr134R/sxafquiJf38Ry3PPTFfq8swVNansZdkksRHmhofnxc6xrOqxvDMzLCijC1zVhawwsZ5Bt+tfqn4z/Za0h4CNHULIB0FfDvjn4CeJtFuiwjbykPIHes6Gc0noduNyGvTh8J5Zp+r2NtOrzOfkIIHbivor4ceOb+G+kvWuTb6ekTA4O3cccH+VfM2s6NcaYVBjCleoNWdFuptVX7HfS+VCp6L04r1I4mE1ZHjxw86btNH6+fAf4mR+H9T07UEmc2F7InmNzxzX9nPwZ03Sbr4RaRfQRrNDdxoyMOeDiv4DvB/xd8OeHNGt/DkPzMSqg44HI/Kv7Bv+CR3xr1H4lfDE+CNZn+0f2bt+zc5IVecfpX5hx1kEasOfsfU5LmTv7Jn178Y/jXrvhXQZfhl4NnNlbPEzXDrwwHcV8j+H/AXi7QPAd/8UfC8k093cSbOOQEx9/6j6V2Hx4lkbx7qN3pAMiwB0uFI4X1H4CvoP4Wf2xqv7Oeo2Hhpo45b6Ai33HAUuhx/KvwjBYLlr8z6H1ObUYwpKcdz8Y/2P/G3xum/a8bRX16Z4ZLz99buxwyhxzj09u1fsL+138bfEnw4nOl+H4Yp4Ef99C/97IywGPSviH9m39mb4hfD79q6y8feJwhxZ+ZKyNkby49q+uP2xvCOgaubbxprc0+6e/8AICxj5NpHUkH8OlfUZjVhKlzU9GeRl9RSTUzyzwD8c7CZbPQPFPhh/t+puHglWJmDI3QHpwK+/NQ02zk8OL4Q1myh8q8I8y1tsuiKVwGfgY7cV+Y3xh+Ilj4P+IGkRaTdk6dbafHGrxkZRh6cda+rfE48Y6B8FrP4g+B9TvNQ1C/bMzzEDbCRxtAz09K/Ms3lGonzI1+pe062PiyX4AQeHf2g7/Svh/Glz4fniy9tn92s2fmAAzg1896jYw+C/HWpfDfx5pEqWlzIVstqEmMsc/l2r7f/AGX/AAH4j1TU7x9K1SWS6upDLdMT88WTnI/lXrxtvC3xK126s9Vi+13/AIckPlySD97M+dhXoM8HPtivkMh4peHxPsktDzsVgOXTc/G/wV8C5dT+L1roV7NFp6LIXJlbafLwduOPXHFdV4l8OeK77x/fWdrOYngARJSANyA4wnrwPbivub4lfsreLIvEdv46vrj7NLbk3G3OFEXVVb9OK+efF3jKTxT4yu/GFjZxwHT4Uj8m3/1bGJSuenGc5r9yy/H+2p897HBSy7VJI8bFubaOfSNTvJVlUZHYfLycn6CvKIPiRcaTePJZL5nlHBI4x2FN+KGreJr+21fU7NR9oj2NIo6KrY6gdK6iD4d+K7zwjLf+GbWyu3v1RhCpzL8gG4bfpz+FbVcWqavKR6uJwsaUVZHX+AdGuPiz4c1J9OvFu71XVmhkPKKrAtx/ug1117ovgawtHt7O1+3TGPy2BXiIjqRXqXwv0vTvF2j2fgLwdpKeG9V09P8AT7zb5UzZU5yT1GOKw/EHh2f4f6q/2CRL6EON7A5LevQfn7V5NXNXOLcZHCcd8MPhWZbKRYyJopW/d7PmxnsOlfTngD4Iag2pTX9jEscGnOol83I6DJ/SrPgO0vNSceKPAdtGBGu+e2AwAVGflFe0/wDCdWnii+j0vSmvYZ73a1xDCnyCQDG1unFfn3EucuEV7N6ia6Hinx8a80bw2PE/hbWGisyRHNb7wCHyAFAGev4V8LW3w/8AiGvjq2+Iel3byJqNjPCyyE5RZOPu9sV+njfDC9+J2stYrZxW0FjIEvwo2qSP+WhzxkDtWp4t+HnhvwDqFtofhScXtuiY83IbOeePp6V7PAiliXzJ2Z5eJoJe9bY5b/gmv8Atb0L43WztNsiNsZZGJ+Ynk1/UxpniPQPCa3em/ah9oij87a/VlC9cfpX46/8ABOrQhq3xQutXlXK2kZj7Y6E+nFfR19Bp2h/tLahdeKNaMr6jZPbW9s0mUUsePpge1fv/APalPK6cZzZ5Dw3tlzH53/8ABcj4wQ+JPhh4e8M6dctCZruKXa3CspRu3tX8pfxt8RXa+Fja2TfvkOCF5BUDFftn/wAFfvEiz/HPSPAcU/2y107TkU7eQJFP6cV/PV8f9TltZLUacSC7bGXp7CvucLmCxNFYiBxyhGK5T9Tf+CAEfinX/wBsFLia1YWGnW6TFmXIypJPpiv63/iJ8fLeXx1rutX90sMGkQlbOEk5eVD0GMdR+Vfyq/8ABE/43+GvglpOveKviyf7Jj1CF7W2ncAfODxg8V+vviTwT4Z/aN8U6Z478GeJZFsbWZZZkSQBHwMHPrn0r8o4x4mxFGV46JH2mQZXQnDmmdH4N/4KP/tEaB4olg1jQI9Vs0lZ0EW+SXyj0+T24r7V8Hf8FdfhyybPHnh7V9Octj5bUhOB7mvI/wBmX4T6fpni7U9d164hWN1MUbOwAZA4Ix/Kvr3xje/Duw8V2HhjxV4OtdW0m+UIl1HAsiqQM5bPHauvgfjuNf3KsjizrB0Iv3Ynb+Cf+CjP7M3jOVYYNSewZv4bwLETx7mvqDwx8bPhb4xCDw9rlnOz/wACyoW/AAmvy7+L/wAK/wBhmD4paL8PrHw5aTazqbjHkQI3lgjOW2429MYr6Pn/AGb/AIJeAta03RvC1sdOv5g2DbqAV+U8+1frVTN40o80mmj5Z4aO3KfoPlOOhDdKiuJmhgeReiqTXj/wz0K/8D6PLba5qs96S5wLhvurjjFdV4q8XaTYeH7mfzQDtKD6lf8AIrPC8Q4evLlgzleXyWqOG+En/Ez8R6z4lIyLtsA/7hxXu5PzgntXhvw2v4PCPwuTW7mJ5AC8jKgy20nPFfJXjD/gqJ8APBP2/wDt3T9Xj+xBs5teGI4+X5q92pWgo3BUmfpL1bDcA9PemZO4KOM9FPBr8LT/AMFkvg38Qoo9O8LXaaPJOxjjbUcQEN269BXv/hrx94gurSw13QfFp1rUb9ftAFtMsloIwefmBPTpjFeVVzehT0nM6lgZtXSP1Y3o6hhyPbt9fSgN/e5x0rwDwr8dPDt/bWdnr8yRahOMbE+6xBxweM/kK96hdZVyOPbuPwrWhj6dT4bHNOlKO6LAbJxT6gyqH5iBUpZQcV0OSfwsyFrw/wCNM7Pp+n6In3rq58rHqCM5x7V7aXUjAPXivBvFySa38U7DTU+YWoW4x6AcfrWiA9l0i1NppFtacARRhfT7vFaTOGQsoJ2+lZWs6iNJsJLp0aTy8kIgyT7D6V8S2H7QHxe8X+LLnw54b0dIIYX2+bMNjbR3HHpW1vMTPu3HT6UAVnaVLdnTIBf7TcFBvweM1aku7e2XzLlgij1rnlXUdJGaky2iH7x6dqfgeleReHviJpmu+Nb7QNLuUuUtACQjZxnivWw3OKqNS/ws1HgAdqU7SMYqPdzinZFPmY0Nbaq5qEMV2gjFTPtK4Nec/EL4ieHPhvon9ueJ32xbgqgDuSFX9SKOciq7bHgXxb/as0H4a+LofCtlbPdzE/vhGu7YM4J6V7P4W+MfgHxNJDZ6beJ9oePzPJOAw4zyO3Svy0+IX7Rfwfm+LJ1zxUI7CKNGRpFAy2fyxXyPBqF7pfxMu/iP8N9aDRa1MIraOSTGEc7eOuOvpXnYjMow0uTSldH9KFlqVhqfmfYJFfyiA2OxxVnG5Tnivkn9lb4eeMfh7pV6/jLVPt1zqcgn2GTd5Y2/dH+RX1zKuXDDj2r0MPXjOCkjQiCYOafRSgZOK3AZt5zS81MExQwG2gCKlx8uaSpFGVxQBHRUnl0eXQBHRR04pCcDNAC0q9aaDkZpwODmgAfls+lPT7vFR1IpAWgBq7UPyiv5Rf8AgvF8c7/VPHGh/BfTXH2SGEzzJngSROB09wfwr+qLXdTj0vR7zVDjbawvIxbgDapP6Yr/ADyv2+vjrqXxb/ak8Va5qLo9vDePFbMDwE9B+VRPSLsKMVc+N9ZS4fURdW5UbeMA9O1a+jy+Pby/ttL02NcXMghTP+1wDjFYul6bfapMZNKAkY9PSvt79gb4ReO/iv8AtTaL4Y1+3j+xWVysjY9Iz6YFeYtWrnS5tLQ/sB/4Ja/s72vwR/Zz0vUtRt1i1LWokuJMdQSpBH9a/TZfkTYtY3hvRLbw1oVp4esgBDaQpGgHT5eK2q9WlFWOFyuFFFFMkKKKKACiiigD/9fwbTviH4htLbZceI5APTf8v8q9B0D4xajo4MtvriXBI+4zj+WK/OC/13w7eWo+zX3Hpu/+tXlms6rqdhdJd6LMJApztJ/pX5+88pTWjPUkoWP0z+JfxeuPFWs2V3qk8lm1vjEn3V/MVeP7Ql7pOlTMu66JG2O4UZGe3Pavz70/4pvr2lNpWvqUOMbm4xjpitz4d/FOPQJW8IX7I8bNuVpB69hX4txLhl7Z1oHhYug5PQ+5vBv7QGmXbzweKLhItQSEvuPUYGQOgr0/4c/HnRr6ZYI5RJ5hHzHoWPFfCsGj6JqP2vxV9heYq3ljaOOeD+GK9i+G1z8Pp9MtYI5oo7yCYbo1PIANfmbzavlNX6xF3T6HFFOD1Pu6P4taS9y1pqyR2+77pPHAOM1t/wBsafqUIP235c8bWHSvB/EVx4K1ojUNTZbeOFPKTdxu9/avJtQ8V3Wg61DB4YtJ7q12BnZVymPzr9pybxYwlXDXrbo9WlWSVz7Lm0Dwx5L381w7gjnB61882/jnwrb65eQadaRy2IGwtt+cOK4zxl4s1nzYptPuESOSMNsBxtJ4wa6P4e+HfDVnpM3iXUyqNdcAScAyd+PTFflXF2ezzmuqeGdkaL2k3eJ6p8Jrf4daxNLLeWp+VtwJXaM19C/2f4GSDyIrWMxEc4HPXP8A9avlux1Swso/IW5tIQ/QKcHFPm1q5lJ+x6rbADopbn8q/Tcjo0qGFjRqyTaPpsAlb3j6cg1DwnoSNLptqsCp/dH+FZWieJ7zXp57HQ0VLafiYEgE459PavnFtR8SyRhre6tz6YOa88vb74ieHtbGo/aI/IY8hTwO3avbk8JKydj1HBH1Pqfwb+G13Jc6j4jsVuJmU7CAPvV434E0fVPBN9Jd+GdRuLZbUsHgBwhVjjCrTdM+LviC6lOnpd2QXGPmPNZniK78d/2nbS2T2QU7vmQ9ipHNbRwWXTjySSsc0qLe57B4O+KP/CN+MINU0C6EeowZfrjLN7dOBmvpm8/aL+JXjG7lPjSZb1JI/LIOG+U8cDA7cV+ROsaJ4xHjNdUssMydfL5Br6I8O+Ldc0+IKVwduG3/AErtlkOWVWpOK0OOph2nod94r/ZY/Zt+IN3Lqmv2TRSk7sqoABP41xWl/wDBPT4EX1ydT8K3jxSQgvyccqOB1/CuotfizHYbVvLbzsfeCLnP4V1OmfG/wbdSm0htp4J16hBtr26WIwdFezjsEY1E9jm9Oi0v4B+JLbwF43ijl0zUzttLnqFm4EYY9snH8q+xdWvtW8N+AZ/DfwuzpviZ2TE33YkXaQMHn72fTjpX5iftufEnR9W+CQ1Swhdb+zvoJUlK8r5alh+oB/Cvevhz8VtY8efC3wzr+u3kscrWKNIYWAZugznH6VzYzw/ynH/vZRV2efj6j7Hpnw5+FPxF8P8AjQ+L/jD4lbUtXuItrtDLvIz0Xt0+lfo18Pfin4b8L6fcfCHxrH5ttqERdL848yHIzwex/n04r81tB8XaBck61o07TJFJsZ5OSJB13fyrur3xQ2tFdQmaK4MWMpD6dgfpXkVvBTLvZuNNJaHiKrUPTPGmi2OjfFKCf4MhZraJFWe8uuHkIOSc849AK7Tw+vwV+B39qL4v0rVdTku1bUS9jFv/AHrdQOf8+lfPX/CZya5cG20uSKF4xt2R/eHavUdC8a6vpV+k14ftOyMRqk3KEjpn29q+Of0csvlo6h0Qx1SLPWNO8ST6R4FtNc8Mm5utEvbzzore5XEq70OQyc7dv1qj411rQ0+HvibVrZLD+19XtPs88Bb5hACCoRf7xIx+lfNvi/WfiVNrhufD8i29pO2ZIUOIvM7kL2GOK+hfh3qmja5piXvjDS7Lz7UbXk2clQOp5r88y76JuBwmOljKdbzsdsK1Ws+VdT8hfjta6NonwN0i9skktNX1K/ubee127AY4yoRyuTwR0r8svjTBHNfQ+FrP5biKMSSMB2xjFfoR+1Tq+q+JtKvvHNycGxurgWiKcHaH29Ppz07V+VfgHTPFXxS8axWV07NdXr7Wb0TtX9R8J5esHhlQ7HvVsklSnGLR6D8FvgRrnxh8WKt5mW2tSpHHHAx0r9LdX8BWHgq0i0yOLyxEoXH0FfSPwO+D2l/CfwzFZRxD7WVAkIHPTOa84+L3mzXsiOp+U5Pt6VGbVGj7jhmlyvlZ8p63Z28GWjx836V5dqOiWGoZtb2FXDcdK7/xHLOlzGuDs7+1YXmQzSq0J6da+XWLcWrI/VlglOlaR8cfEn9mmHxBI0+mQ4z6CvjfXf2e/Gvhi8dUtWaL1Ar9t7NVmt/LxluK9R8JfDrTfFbLZajEpV8LyK+nwWZOx8HnPD13zR6H87mh+GLS0ukTUMrIG/i4Ar99/wDgn98dJ/hX4hsdF8LXqwTXJRGOeOeOteBftw/se6P8O9GsfGmkIIo7iSNGx0HmfjX2D/wTC/ZZ07x/rKyXVp5/2Iq6tj+6Mj+VdPEWJh9Tba6H51P9xUdz9P8Axm2s6TfarqWu3kf/ABMQWbB+9uWvrvwdeW/gL9lKLW7QCaeBY2gI53naSF9q534vfBXxPLoZ0+30qN5cjy3dOABj+leceNPh/wDH3xV+z5P4Q8P2SwXumL5tuIlIV2iQgDHvX8wQz7DUcRLmR24zNYzpJHTfCD47+MvHEq2niLRJLa6W1JM0UfCjPf8ACuE+KX7QVzpfiT/hUvjHT4prPUMPBIBmQcdRxx/hXtHwotfiBpngDRrrx/af2brsmnLbXEartDN3P5V5PrXw68E+KLybV55Ptmp2LbAmcyDHoP8APFaQzelXb5XZEZdioL4j4r+NHgfxB4c8RWFro2l3d1az4ZG2Z3M3T6V9b/D74j61qXgT/hTPhdbmTW48XR85fkQcJs9sdK+wtJ1TRIvhOdZvIUOpabGTAZR91l6Z+leE+G9P8G6Br03j7RruO41K6s9zRW7Zbzn5I/8Ardq+VzXHUIu0WddevFy909r+GWhT+HdLv9SjtRZa49kIZfIA2+YCM+g6V8jeLt+sfEe11PwWl/ZXWiuLi5lA2wyyEFGXd3656V9J/DTXPEw+GPiPxo4adbJ5Zdrj5mKYGPzOK+YfCnxM8d+NoJ9Qe0jsYjKwB27V4x0Hr7V8flNGMsVJpbnRSqK2p79498VaTr+sR6R4z1Fg9zErGAHsVzlhxxx0rjtK+FfwmvfBWov4ZTDA7XZP4eRz+PTFUtMk8EG1Xx94wiWTxHqRa1iicZQJGMZxx1XOPSqHhP4n/B3STqfhmC7eC6P+siU/u3J9B7H3r77N8yqYLDrkWxpTlyy5pbHBeOv2Q/Amm3N3rp1X7LBrsESSiVgvKjI29e4FeV6L8DPhnoHj61m+Huu3Qvo/mnjdsA8ceX69Pyr6R8UeLrjxx4StNHuNGn+zs5xPMn3Vj7ofwqLTvgboeny6V8ZNIna70yTEJSJt0iyg7QB+OM8dK8TA5risWr1NjLHYlVDjvi74I8fWvh7VPE/hGyEmsag0MUTFfmZdyq3TGPlJ7dK5DT/g/wDEzwp4hsPAXxLit7e1uE3m5Tqp27hz9cCvsvxr4oMFp4f0xEvRdbX3FQMZzlP1AFeOfG671nXNUgtdbS8i1m/kX923CKnH3R9BXLSjjKU3y/CefFanq3hz4I+H/C2npqWkakI/LZWkIbiQccfj0qh5/hXUfG/kWWdLeaRUDcDdg+gr5++P/jbQvBXhnQdK06+uY/soV7nY2MMrDhuvFM8AeJ7343LcfECSEW1npSjyWjG1ZGTpn1OcV4GZYTF1G6h1Omkj6c1nTPDep+LJfCWj6xJazp888CttEpHdvUe1eb+JLSS31N7WVI45LY4+T7uwegrG8LeJdO+IuuxT3duNO1KKNo3uJV2bvoRXT+IIIbdHiz5pjUrvHf3r9a8KsBUtzTPIxcnZn6K/8E5tITT9D8QeKPLyY5GwfbaTXwn8WfE/xK0X42ap490GOO9hDtszywIPQDtX6Yfsr6Vf+G/2Wtd1fTwFnuraV4cdSwTAr+dzRf2m/GXw6+Lt8vjq0mubLzvLYbcguT2r6/xHpSqVaNKO2h5VGTsfHX7QvjfVPGvxovbzV4zNezCQycZVSGA2mvyZ/aJ16bSvGyQiCCTZjbGR37HHtX3R8YPjTpmt/GLxN4ojgFlCbqcR4G3A3L1r4c0fxpD4j+MOnz6vZRajDdXYjQFd3HY1+rYJrD5VFR00PLetTU/dj4O6N4f1r9kDSJ/iD4UiMkLC7Rooj9wLj5sYxmvqD4ZfFTXvhfoGm6ZovhiOLSL2Y+U6RncVA6e1er6X8bvBs3wXsvhdoWmQadqd5ZizAnQCPtjb/hXy7fa74+Sex8IXmqWcUdrKyqkbcq3t+VfyNnvFGJxOIqU5LRHvYaoorQ+sPA/xbu4Y9astXeaCe2LSxqeNsb9MfSvqr4N/tL+JtK0VPCLNHqlwWEjeZ8wWJhwfavgLUdJttbtY4pvtEeoy4guJV6NH7GvQvEM2nfD7w1p1z4PE39uWz4eL/nrFt2qvTnk18tDNa1F3p6HpRlFrU+0tM+IEXi/4hJ8TvCGmWMV1YMY5JY1+bKcELmuisv2mL+71y8u72aQanv2o0g+Vee38q/Lzwl8R9e+HguJ/FofTpdTJkMH3fLJOc47Z6V1dnfWPiDxU+uzamfs8QjPDYBLdMj64r6nA8b41L97J2Rg6VLsfu38MP2nl8WaXB4d1K3e51ST5SQoI4P8AhS/FPx9od9p40Oa4W11GSSNmtWba6gHPQf7Ir80PAniTxP4S8U6fqGmGFIVPzzNk8EcH25xSX3wx+IGq+MfHnxdn16Ce51OGFdMBl3RxNsKkZ7ZBOOK/Q+AuLqdas6k+gsTSgoWiftNY/Gf4eab4Ki020v4ZPLhEeMjlu4x7VwV78Ov2d/jH4XePVtP066mQbpHxuK89O1fzs/Cb4ZfGv4JTWutfEbWJtTjcytKqybkHmE7SPpkDGK940H43alpviPUNN0WaeEp83mcLB93dhvy498V9hj/GmlSm6TV0eD9SlCSdz6Y+Pf7MX7Dvh+5sLnxR4UsiLsEeZFHl1IOARzjr+lcD8HvClp8H/Ew1vwRhPC0OYrWHgII26gjBxz715b8QvFng/wCIng6w1n4sX01heWhxGYztVl3Dn39K+UfHn7cUGhwzeAfBNvJJYW6lHlK8EDuDivz3iTiqWY03PDOzPraeLhClqfpxrXjOT4ifGa01HwpqdrYRWiiMxu+xFP8AeX39q96t/wBoj49eE9cudAieLXSkLyWwgPmMwVTgOPT09K/nf0DxPqD+FLn4g6fqKrtmwqM2JWz6Dt6V90eFv2vPF3h/w/olloem/Z78QLuvHjw7DIO0t6Y4z+lfM8L8WZvg58tV3R4WNqxqbH6Aw/t//tHeF79LDx14UAMsiqiRx5cKe9dqv/BWz4Z+Gro2PxH0PUrMrJ5TSeQFQe+SeBXyR8PPHHiy+8dQfE74nSmWzn2qE65yew9q+p9FsfhZ4+1O/wBOHg9NaF45lH2mESKq9MdRX75wbxzWxFXlryR8/U5IStyn0h4D/wCClf7InjkKbPxTZ2shfYI55VVvyFep+C/iV4H1bxhfeLv7VtvK8ny48vyyZyCvtXyR4o/4J3/sg674NOvah4XttFubdfN228axnd+Fc94w+FfhLwN8OLPxtoVtdTybBZRIg3Dyl6NjI9K/W8Zm/Lg5Vom2EwarztHQ9/8AiR+13oVz4K1PU/CUj+dpcjoxxwdvofpXNfsmfti+Dfjvu0WfT2i1OJdskgTHH97PFfL2uxfB7wp4Al8VG5WWCWE/arKRvmEgGSWA6V89fA74k+ELXT9R8XeHXg0u3uJmtraWP927FMHaK8TA5xVqVoR6Dx+BVDRn9AcHic6OhNwmYAT857Kp4z6Zr8C/2/f20/iJ4b8bXj+Gze2+iwjy0mjGImYcYDV9qfFX9rvwZ/wzVqnivw9e7L6zttgVz95kwrk8f0r+fXQ/E1/8WdIu/wDhO7+6ubVpGmWLOY1BI5A7da6eJcfKlDQ8bDR5526H7Nf8E4PjU88tzrPjaURG+RWEsnBYMMj9a/cUeIdHEP2v7RH5ZxghuxGfwr+PXwl8QNTtrKfwzoVytrbRKqxyk7Sqp0Gce39K9t8MftQfEi409/C51K5kW4ZIlfd8qhCCTn3Ar53J+LnSjyuJ6ksKkj+q2K5hukE1qyuhAIKnIqZjsba38q/NL9l39rrwtqN9YfBoRXMt9Ag3zMMqcr612P7XH7cfgb9njTZNHjuozrLELHA3JOSO2PT8q/RMFj41aXtDgno9D9ADG/QY/pX5Lf8ABS741+BfhL4ct7/xjfFPkIgt0bLM/Y7fY4P4V7j8Of2vfDC/Cifxv41vrdZLVGkcqeAQAyqfqK/jl/bi/a48UftSftA3Go3Uc13pdrcZtYVH/LND82Bx/CDXLmWcQhT2E1c9ikj174+X632paqttbXUb3CeY+04Xkfniu1+AsHj+y8dwWnnx3drp0qlGVtyKqn17dK8p+Ffxl03wzavZ6losLS3UDQWKSx/OA4wK9p+H2qJ8LLFrm/KNdXZ3PFD/AA5OQrCvzvNcfGynA6aOGVj+mP8AZC8c3vivUJG1SV3kYFgeqbQMcGvvxbuK4cxwFWKnHWv57P2Zvjvf+D7mDWbi8SK5niKC1HAWMjrt7YFfpbp/xnuoVt9XsrmMvcAYiJ5YHv8A/WxX3PD+bQnRijOpFLY+8NnHX8qcEwc1h+HL241PR7bUbldrSpuI6Y/Ct+vq5T/lMxCcDNR7t3AFSEZGKaq7Tmp5mAwIakUbRin5HYUlHMwChvlbbRQ3LZpqQFaToahAycVb2UeXWzlECIDAxS0dOKTIAyay9ogHAZOKmUbelQwsjnripSRuC+4qeZgfCX/BQ/4sz/B/9l7W/ENpOIZrhTaqemfOXH6dK/z5/EWsSa3qU1xqEKySzyEt3yScZr+q7/gvb8aprDQ9B+FmlXQMc6iSeIH+NHBHH0r+Wiwgn1PVkt4YwJFbk4p4moowOilBNHQeHfCWv6bpUuoadtiK9AO1f0lf8ELv2edV1C5vvjj4vh8wEvHETyNx/Kv5538Oa/aX1ppMEheW+mWPYvTk1/eH+wF8JrH4Sfsy+HNJtoxFJdWyzSrjB3nrXmYL35EVtNEfaQ4AUcCloor2FpscQUUUUAFFFFABRRRQB//Q/DrxFfeAbuKTW/CiXAtFHB7M3bHHrXGawNU0zRrfX33g3WMxfxYzgYFeofD/AEzwrqPg2+8LyyiCWyYlkkOGyhzwO2MflXE+Kv7f8P6GPHz6vp19FA/kpZ9ZCp+XgewNfyBhsVV+FGXsmjrfDehWWp6MupeYzLkCTJBKDv8AlX05ZfBLw94gn0EeGRJCt6q+fd3Z/dJ8wGc8Yx1/SvhvwJ4r8TT75PD9qm24IMiFcgA8H9K/RnS/G8nj74Ty6BbbNPuNOICY4wFHTtkV4nE+a1aMUovYieL5FqU/G/h64+Gvipfhn4S1eC/t7mFpZplfdFv6YX/9deF+HV0nQPGE9lr2oRQssfmoIztywPSuutPDMlzp9t4j1e8Bmt3X93CeCucdK1tZ+GkXijxVYa/oOgXWpaexEdxPAAdgz82fTAr4yeK9pD2lVHC6vtNTvfEniK28axafpOnXQ8/aMnOF/wDr8V2Wg+IfFXhydo47UzW8aCNzjjA6kev0rI8WeD/h3J4r03wn8LRPBO6r5kcjgyBumBwMU/4leIvEvg7Qz4Q8JxK2oAEzi5G99i8EjGMegr5qdJc92Cb2R7V4H8G6H8Q9PuNevb2O1iRsPCW2lUH8TDBx7V7nN+xZc+NPDqz+BPF1vdXkfz/Y1my6Qlcr8vH0r4t/Z6+NGvWulN8NNR06AXOpt5ZkWL94Vb1OOK/R/wAdR/ED9mfw7pPxFaG2i0y4ZLd2RMSuFXOC3fH0rnwucVMLVfs2fVZVyxh7x8ReMfgD4w+DviiTQPEF3Fd3iRrMEzkBSO/uPStSPw3oPjPwW3iSC6Wx1K2JRoi20Pjj5R3rC8f/ALQPiz4xQXPhS8tUlMDtdQXkC4laNjkIz98dMV5pr7fFy60610zxFoM+lWGlgSPcPHsJBGQdw6jH+Fe8s9xCj7RzsRVxslNKnoL4t1LX/hnbQy3t6sonIEYU+tfSlt8EvjxqnwntfidpqJLZXobEZXLgowABGe+fSvTvij8PfhefgCdS1qWG98SQQrLBFD124Ugkeu3J/Cut8Gal8Q/if/wj3hzRdTXTtN05ARC25F3eXkmXb1HoPXFfMYzjzG0qfNGWt/I96hVm43Z8mWfwB+K8vhg+OdU+y6WkXMnnKVKjp/nirnw+0vx94puLjSfCU9vdxQpkzH5oyR1A6dK+y31X4jeKrjXtL137Lf6Pp8SpcSW6NgK3yjknA+bA6V8yeMtZ1v4QaMujeFNIuPshcPALQASyA8nB6ex9q9PL+N8yklfqEcRJbmPc/Df4n2+k6j4jjnt5xprATR2/J54/yK45ta+IFtLaWj6XJI94rugCc7Y8f0/IV9aeDfj74Xt/ARs9B0mez1DVSvmLebSpxgMWA/u9fwqr8QPDHi/w1r2l3/hC/tX0G6t7mS/v35SKQjISNhnbk8Y/Cvq8B4g4v+HNWsbrF021ofF8fx18KeF9Rm/4S4NA6HaUPGD0rX0b45fDqe9bU9LXzpXzgAZzxxXwj8TXsdd8RalFDtuEWbCydcnPUH/61ej/AAG0PT01aGwdAQzjOa/WcBXnWjGSejR7VH3lc9M+N3iLxD8bdMtvhv4O02Yo1zFLeyqvypGvDDP0713UfibUPD9jY+C/AFpPcxabEFIAzgJ1x6ivrnxx4Kh0zwzpkmhlNPtrudIbyWDCsYmIDEn6Vzf7QX/Cm/AfinwxpX7L962v38kCW8628gmXeWHEgwO9fL47xEqYGt7FPY+YxtZe05TwbwV8U/EUzy2NlpMhMmZZY4kxgg45FdK3x28PpdfZfPOnXaHay/cyewIxX2hL4u1D4b+O9AsPHNrouk6hNaL5qtDtBY9mwTk1k/ti/shaH8Sns/Fvgi50+zs7xFmubm2GFSY4yeOcfhTpeNmMpy99aHI0rHzpoHxg0i03ajqQCdV85OMnHrXe2Hxxs5rYy2t2JY198nHTp+lc98NfgLpnwhsoIv8AhKtD8Xaakgluooy0k0AH3slsdO/HSvLQ/wAAtM+K+s6bfa5aRxz258iGNiqqztkY4x0r0cD4zVJz9+OhheHY91i/aF819wkAVBtyT8uB2+taml/G7/hKPttjazGNUh+YJxzX5rRXXhfwvdat4U8RXklwJy8unzRN8q88Bvw/wr2P9nz4dnx1HLb+H5rubVoPnuQG+VouxxivrMJ4t4eo1T6vTY9XIMRTWIjGXdHAeGvFviD4vfEq+8ImNfsCyNHsPJGOM9utRfsz/C03nxhurq2g2mzmPykYwBkACvpD4beE/D/gr4vw3+nRrHdb8XMb/wARDduBX6L+GvDvw+0iW61bRLKOG9VcyEKBk5z/AFr9TyXF88Pan6bxYqftafsjxT4weNJfBWkfZtAVTqLDndyBj/61fkb8QvjT8W9N1mS/1y186Fm5MS/wivu34x3EniLW5T5pjZmIznhRX5ufGnw74o0W6Sy8PXf22KQjfk5Qc9xW2KqQluZUKM4RUoo3NB+O/g3xzN9hlf7PN91lkGCCP/1V18tnGFLWDhlboRXwprNrBY6xFbXUIEhxueIbBn9a+uvBGgeIItFXUGYtblcqTXh4ikm9D7XLMVLk/eHoWl/bICG5bHtX1n8I4bu+ZSVxtIOPpzX5x6n8d7Hwlem2njMqoedv/wCqvvb9lr4+fCzxzEunpexw3sp2LET827HA6CujDYfl2OLMsypp2Rc/bwvjd/s+rFffMYJoHVj2weBX7P8A/BvNo/h3xv8ADq88TXEEcklsnkvkD7xQj9K/C7/gpPqc3gz4TWXhi4x9ovp4kjj6lvmCggfjn8K9o/Yf/a01/wDYt+Flv4V8GS+Tf6pELidJOQGHbHHWvWzPMsNRopYt6H4vn2IU6zSP7kvF3g/wLb6ap1mMOzjaiptz+WeKy9H8FfD3UtF+wCN7VY1x1VTz3r+TiX/grT8Yb2zuru/eCO9XKoJFOM7c8Y/KtT4ef8FaPijoel/adYuoLpnIZ0ZTvx3C59K/NamGyLE1OZWPFUHoj+h74xfsn6L4jvrfWtJ1KcBGD7XkA4Ax8tfFV1+xN8PbHxJc+Jo9a1C0vJ5MuHmAhb8B+lfBPi3/AILHa/dfDa4bR0Qag24IJANyrjoK828C/wDBSadrCz1Lxhdq8xVco+CMnk459K6KWXZLD4eX7zpjzI/cv4V/stlfCV7oUtxbX0d45K+b82Ae1fIXxX/YP8aeGBeWmgWN9587GSKbTR8iDHQ89v8A61YHgv8A4LE/Bzw19mtr5GhIxuwVHtkcV926D/wV5/Zt1G0ieRpEDKOXZQDXPHhnIqs+ZtFTr1re6fnH/btl8LvAcnwpNvf6fqE6kTNf8rIzEFuMD0z1rzfx/e+Gdd/sTQvCEsNrbacxmu1T75lddrEjj5a/SHxx+2/+xF8cNKutO8R2MMcpyqTts80e6kcj06V+L3xD8a/D3Sm1PU/D7N9mtmZYiD8zx9AGOOfyr18JwzkybSaJp5lXjufYOtaT4I8RfE/SBJc266Q8aB5Q2FjITBye2T/hXyBrPwesbX4v21tpV9YJpxnlMc85+VsNnn8Olcj4d+II1LQ0hCbIJRxjGV4zz9K0vsvhi/sgbi5naIcg7xlT/s8ev6VwZrwPl2IjyqqrG0s6rNcrWh9i6n4oufDUVzpepfZ9Ug0eINata/NGSxAwR6c1c/ZmsfirqGg614ofS2ktp9zRWqJ/o8RzndtzxwK/PDUfEeq6XqItNEvZY7fo5dvlYdsivrz4Q/tmfFb4I6YmkeG0sbizlIMwmTeWQcsBz3FceE4AwtKFlNG9LGytseia38RdS1ayi8OCxf8AtGF+JY1xj5gTj6AV87a3P4uTx7O2j3V1qF06FZJJzvEIK4OP7uB0r6uh+MOj+N/HSfGPwNpe5pQEm06FQF3t8pIQ/d65r9KvDHiL4FfCv4aWnxA8baLZPf8AiKQCK02L5rZYKeOfu5z24FdK4Rwz050X/aElrY/mk1CzuvHPxJs/AjQXH2DTwTdy3IP70nJJyccDsK+idKhtvC+pyeG9Hvk0/wAPWqNKmHCh2VS20/UgCv6c4vhp8HvE+nWer6b4f023SeIM8hiTcoI6Z/TpWnN+zN8ANW0lrWTRrKSJhjIiT/4mnU4Dwk1ZzRLzmbVuU/mY+H/xp+E3xa1ZdJ1S0ubLULA4je2xHHIR03dd1eqa0Z57poQfmZtuG67TwK6P44/Df9mf4Q/tMX3hDwI0s2q+TLP5auvlxFByMKvp7iuH8IeIE8Wa3YxlCszXkacjOVLge1cuByujg6vJTOirO9Pmkj9S9a8UeIPBX7K1taaRBJDbNp5LMq4csR/D+X5V+G/w6+E//C0dE17x34zaWOHS5WuI4pOJCVGc49K/og/aR8OeL4/2f9J8J+BVikvFjVfLlG7jp90Y9a/Erxtp3xr+G3hTW4tN8M3V1d6jbvDI0Ef7vO3BwD0rmzXAzr5jHmeiPIpRnulofzVfGDxjol54p8QzR28ZH2qbaAOoPOPwxXRfsC2Ph/xj8eFtrzTFujax+bbjblUdDjkVn/E7wlrfhOC7ufFekyWk0ztK8bphv8K+rv8AglXp9v4i+IHiC88OWRt1e1cPPKAAhDL0r7bNFyYPkXY85XU2pI+yvHXgLxh8PfHNn8RInXUXa7y8BG+KJeyqueMVxfiGy17UfEzeL7u3eBL6Y+SoGFLn2r9DdVWw8MQmz1J4byJlBGxfm3k8nqa+Yf2gtB8RN4dsLv4dKbgq5lkX73l/QcV+FZ9gKEYa/kddObvZHmsOueJPCPiRj4kurvyIEWUjPABIGB69a9a8XfGDQNfs7GXS2ljuX4jkJwQB3JxXwTe+I/HFvps/iL4pK6hy0Vuv3Q20dKoeGtXn1ALp1urteykCPHRUPPTtxXz0OH8NKPNc9OnV5dJH1J8XrvVbm70vVfFF29xathROT97H8JPfFevWnhdviD4rg0/SbuPTYESI8nYpAXIY/jXkt5oWqa54Vt7C4vrV7Ow+9AfmdZDx7f8A1qraX4c8ea54gt9N8OyeX9q2x+b1Cqo6cewqK2TRa5EjsVSny7H6RaV4m0j4c2zeH/Ety19KwCRspG1x7degr0vx9rzWvwGtpPDsUlomoMoRsYclTtGPz/KvzX1nwB8V/CdxFceILiKS3t2h8sPuLnc2Dg8Y9OnevuP9pjxmvg7wr4Y+HVsy/aIkBK9xvUHI9MV0cO8JVMLRqVn1PIr4ptq2x4lqE3xYsfDq+FZZjJczr8jy8/K3X8hXJeGvAfxH8K6gui+Kbi0j03UJEO9/vkDqFbP9K9Q0TXtGn17TtH1HUPNvlG1W3cDcpBB/DgV87/tMeKfEfh3xyPBvwk02/wBXv9hebzB5kMeBnMfTb0rwcdw7OSlyaXMKtST1ie6/tLXngODwIlshcz6eAsKk5DDgcV+ePwVmm+JHi6SK8it4NNsTvmEi4YqnzEds5x6VvaJ8O/ir8Q7yHU/HE8qooO9M/LGccAj64FcfLNrXg/xNc+GLpBDFBOitPCMF1PTn64B9q4ME4UKfseqNZ1XyJSPrq88JfBjx54z0uLwwlxaWLR/vYycQlg3DdB37VuyWPg68udV8H3uqSLLZuYrVt/ycjCgccelfKHjLx54Y0HWrW78FNPLYKnl3RB+dZ+vy+2a77wBeeEIb2OTxFLPMt9IJd6EZjB6kn2rix+OqxSaIjKB2+g/Eb4mab40tPD8V6txb6YVhJk+aLKnIXtzwOf0r7N8CftBa3pOv339makltNCpLRKxAaXGdq+o9u36V8p+DNY+Cv/CYzfCvw0s85v5PP+0ytuYSE8fNjivUvDPw68J+AfGNx4W8WXAmtDN5kd512yEfdLe3/wBavkFnNWlW5r2O6lClLSx93eHPiZ8ZPiVPu8dT3CQxwiVY7c4BX0atGz/am8Q/F74fax8PLKwksZdNleCKV0Knaq4yDxXSfD7QdJ0O3Pia21MX1vMVtsRtkYxkce3pXPPJba1rt42i2y28SBs4AXeRwc1+/ZRxsqGFhhsRLVnTgMvh7TQ/Mr9pTUz4Q8BDwil5MJ5fmuZkb72RzuPt6V5JJ478DeF/BukQC9eSO0P2iEBsKJWUZLDHpX23+2V4U8JXXw+GrazNb2b2PztCeHlG3pivwovLzUfGt1qGqLttrJEEdtDjG7A6gV+rZBxFGTUtzgzvANPc+yvjZ+0l4L8X+F30e0vhZ27QhWhDY3kkZ4A9ea+gfhtf6Fpf7L9/40t4oxc+ScK/UqCuMflX5KfA+zs7PXrmbxxYrqIDYhh25cf7v/6q/XbwX4O8JWnhCebxP9ogt9Yh8uysXP3CvzHK4xjAr08z4gi/ckjmwuSNU+eJlfsq+JrDxi10mu2UXkorBn2egyMZ/CqFv4tsIdJ1+TRIXhZ5jHHMw6YcAlOO44p/w48OXHxe+J918JPCqvpws03fuPlwCP4iOvSvrD9lj4ceDYby68D+PF+1SaFK7PECCx3EgZ4r38po4WdHU8jGSlT0SPoP/gn94nn8A48SazpL31vMEQXTpl0JOAd3Yfh0r9EvjB+xT8Ofj94mT4ia6yzXDxlowSMHcpGMewNfBuufH/wt8Lobrw94OtUSGXK7ZQCq/wB3gY74xXyda/tofFt9WSw8RXj6db2s/wC5KExptP8AeGemPevqsHhqNONovQ8Opip3GftafskftDfBrwzP4d8EXUUumX8kctxvDFdsTZxyRjjivlLw74U+G/h/TofFlro8c1yyeRdzuv7mNm+Qj9eK9n/4KS/tv618Zr7SvDPgm9eGO2tpPMNqzKHZlGAexwV//VX50/Cjx18UPH9pbfC9fLhVMs7up2u4+YbvckAD3xXi51hJV9Kex6FCul8R9h6h4P8Ahy9oPEESo0tvhDnoqk4yn06/hWR4r1PT9butC8LeAoDNb3Dpm8nGSX3AHDDGQK5+DwVrXjjxDdfDPVryLTL/AEfOYW+UzFV3AD69K6dfEWmeCptH0TVI2XUIGWHyV4EbbxzjBxxXxdXJq0GuboerUxMIw0P0gvP2S9A+Fnw1tviN4h1WS48UasqLDaxP8pjcYGF9h9K9t/Ya+HPjzxF43l/4WRFL5Fgf3AkGMADgdea5n4meHNXvfgHo+u6lqUaX8cMU1vM3ZRyB7elfrd+yxbRT/BfQNcvhDNfXNsrSzRjkkcda/RcmyuPs1NxsebKpzPRn0hAqRoEX5cADA9BU9QA4YtUitk46V9NFJbFD6KazBeKbv9qYElFMVsnHSpCBj5eaAEoqMvg7cZPpQZFBI9KAJKKr+eu8oMYXv2rO1LxBo2jxCfVLhLdD3c7en/1qANPALYPFZ2qahbaTp8+pXpCQ26F2YkAYUZrxXXv2o/2fPCrt/wAJD4s0602feWSXBH6V8E/taf8ABVL9mH4bfDq90/Stbt9UvbyJoI4oHD58z5CduD0Bz0rWnSjYD7O/Z3/ay+En7UNxrUfwquhdLoUiRSuGBB8zdjGPdSK+jdY1S20XSrnUrpsLaxPI2eg2Ln+lfnD/AMEsvAPwd8J/s42XiD4axwLc6t+8vjHt3F9zOgOBnoxrqf8AgpT+0Rpn7Pv7N+r6rPcKl3eo9vFGCNzCQBc49s0OKSGj+Sv/AIKIfFHXv2gP2itf1sT77C1udlseyADGM/8A1q+ItIvtN8LJJcGZbq7AJ2L14ry648T+KvF99daze3IhE8xPlA4c5OM1794I8GaTbWaTXR/ev952wTg8V4OOr30O6jFH0X+wn8J9c+OP7SOk6ZqsErRGdbop2WNCK/vn8O6NZ+G9FtvD9guILRFiT6AfpX86H/BE/wCAk1zqep/GnVYDsgLW1uSONkinBB9sYxiv6SeRwvA9K9DLIJRuceKdmLRRRXonIFFFFABRRRQAUUUUAf/R/nHsruTRry6tjK0ss+fuHOT9eK7bQtBtvHlnci7uYbaSJGaODGCzKhr0OT4CLceOdOtPHk50CLWhuimlyIlXjB+UVh/GL4Q61+z54pZ9O1218T6Q5A8+zUgID/eyCRX8j4bFU37nU6ORqLubHws8Da7daD9u8PsYLyDPnmThNo9vpXsWoTTX3htfscm2Uny5Wi4zXiUXjLwxceBZIPCOsD7ZNjzYs/MORwBxWlHq2jeGPDlvZalfGKdkD7cHv+GP8BXl4/LXNq63PKq4eM9GexaPotz4a1JN9w/lGHd8zZGcV7B4P+PXjnwpcnRvh/EsysN0qAfKSK+Mp/HN1qViLe0v4igGOeST2AxXrvw78T3+mTxWoTy47pRHJNjGM9f8/hXl47h9ygotLQ4Z0nSfLE61vibriatc+L9ciWPXVkbyzCMKMHK5A9DX0P8AAbxL41stel+Kfi/Tor77XH5Q85N/OckLn865r4X/AA98beNPiDB4H8HaKbuxnYNJdOofIJxx0xX3J4j+FN58GdLm8DDQb7UpL5iLNkYbYrk8bcH+WRXwOZSw0Jexe534LBVG7yKetftC/CjwjoEniPwD4di/taRsXCvEN6SZHKccD2x0pvxL/af+KH7TPga28C+F9LXVrbTYhcG3hjzJG+NrMfT0+leW/C/4D3Hi6/vrDxlot/b69GhKT71SNWzjcyZP0xXr3wU8RfD79na71TU/Bd0kXiK5BtZ4Z8kFkPI246cZzntXyeIqUqUtEfQUIOOjIPgTo/wX1p7L4N/EbV7PSr+chppl/dtGz/8ALJ/p6Z9uK9vfxCsa+IPhj8YbYWoeD7Lp03AE8SHEZxzkFFzmvC/D3wO8CftXeONN0nwtI1r4qa/8+6uc4RnbPyqABgfnXJftF/Bf4py/tLx+CNd8SwSXOk2cUbNGGCCONWGDk43DpXsZrhlVw0ZR0PXhhab1Z3nj3XdUk+F11LounxNc2OElnKDasKFQvORngYx7167qPx2+HfjD4T2HiPw/YNo2vIhhnKfJG+0KmcADqOa+CNd8NXWoWWtWHifUZYoLQCOFInIWXkAkjgHjp6V7L8erTwF4G8MeGb/wUjvaXiYcB87XWMbs8fjXzGPylSw/LTZsrRjZM86+E3jXWPh54su5ZdZD2OsAm6gkdmVgmSOpx1wRxxivd/hb+054EbWI7Ay212Fd4/34D+WCccA+3Arx34O6v8NRrFtr9s8GrNbbvNgwG2/724f0r6GuPDHwXWC1+OHjbS47fQLmVklWyVIjHg4BOAehx2rz1i6tCEaUlc5edGF+0h4y8G/CvQf7e+GWnPKNWjdh5gV1jJ4IX5QcE/SuC/Zq8Z6lefs/61o/jGF4xfsHtnl5iXH3tqnpmuX/AGgh4QF1Y638INdg13Q7nCR2m5neMOwHJwAMfSvW/F/ge58A6Bo/g0yJeQizn2rECAWIBUnGementX3GAyLF4uMNNBxnG5+SfizT103xbcaeCHTcSrKOPwHavT/g+/ka3hB8wYYOKwvCfwk8feNfifcaGtu5UM2GwQBwTj9K+sPhh+z/AKnp3xRXw1qWV2fNK2MKBg96/pfL8grQhTgux9DhMTFQsj6e8f8AiKew8AWEZt2uBldyrjnkcDgjnp7V4FD+07ZfB1/tWleE4ZIIXCEiBBcox53bgowPevtS+tPh5HaS+CGY6jMuY0iiYBkJGN2eenX8K+Lfif8AC2PUNJuNE8Z3sNgY5f3c+cbo1/hZh1OBXwtbwjx2aY9+yW58JnWOVOpeKH3Xj7TPi9cw+K9UuhFDdHANyQZY8n+E9sfyr3r4ZftIeGPBUU3w2NvPqOmW7HzLiZg0bjHOw4H5V+Wnif4kfDb4bWn/AAjvh2X7cIu4ORmvmbW9dt/iRcPbxrqCRNyVtZTGqfTGP/1V+78OfRDnKip42dvI+blxRzS9mkfX3x3m8A2X7SY1Lwt4lbQvDOqbTdr5hj2q3Dr6c9Ku/Ej4s/s0av4v07/hHb2wl0/RgoZ4sedNsOOXx/d/SvxK+Ntz8EfA2+ys77U9V1XJ3hrlpEjz0BBr5b/4S3XPEcM00SGy0yLr/e4GMZGK9yP0fsBhn7NyvY66OYtn9NPjz4nfsDeHfCNr4iTxDFJrdxKzvBJJnER/hAAPSuj+Fn/BW/4GfDvx7ZD4M+E572TTolW7uAIzAwxgbujEfh+VfzFfDjw94Z1+SXXfEe54I+I1Y8kf0r6pvvG3hjQvhzdad4Is4rOR4sPIEXecY/iwD+tfQYT6O+WUo/WZO/ZGf16Uaysf1QfD/ULX9rO0T9qPUI49Jubm7miS1gURxkRtjIQeoP4V7nLqh024eOHPmSjBHSvgj/gmT4q/tr9ljSLS9bIjvJiOehxX1V421W5tdQmuI2/1a/L/ACrxcxyynhZeyp6JdD9soXqSpSfkeG/FW2jt76a45DHkY+tfG3ia2fU2kUHZ7DofrXtfj7xFr105lmBK+teAWep3+o6ubSGIyAH5j2r5h4mU6vKlofq2Gp0nSTZx1j8Fn8RalHIFZssMk9Pyr6X/ALDe1sX8G26/6uB/u8YwhP8ASu98HyxtMlmQmEGSwGMYFek/s/8AhzTvGvj7X575wYYEIDHnHGK9mlQ0HU5eV8h+EeveEvEI16W2CGUrP0cds19hfBv4QXd94l09XsWs3aRGimgXYNy/MM/lX0342+FGg3viCe80zZIm8YKdsk/4V99/szeDtOGgy2WuRLm1QyRsw5+Rd39K7ac6cF7x8Hj8E03KWx+dP7UPhvX/AIq/H3wn4B1CXz4/DKA3jt03IwcE+nAxivrz4deHPAPiL4h/2v4nsAbPTSqLKqDymA6Z7YzivKPEaX2peNPHHjUwmEz36pbNj5ym0Age3GK9e+Hfizxlpc1tod5pix6NNBtdnQFsuNvXj8OK/kvxs4zdSt9VpS0PyjMdKtz6+8d+J4dd0KPw34Q8LaZcJc3SbJVtkMm0YAwQM4967zxB+wR4bs77QPHmgJBezXFssV/bxpxBMzA7mB4GOmMV4R8HLTxLofxUiv8AxA27T7YqLONeE2/w7sHqDivpfVPjhaWfiHVdK0JbptSvpzHJJubyo9wxlQMjGK/mmfFGKoxnTpt7HRhpRa1PIPjH8O/2fPhXosvhbVbeBdS1WQwrIUUhZGGAwwvCiu68Lfs5fBGy+H9ifG9hBdQMqobuBF2lvY469q2fH50mbT7TUfG2mLq8tlAEguIUwA45Bc8/Q13ng74k23izwEPhjcxxTQ3SloLyBQIoJj/yzII69s/oK4KGPzGSjWhVeh0pwPGdK/ZQ/Zj8R6vda3Bo95b2VqhQecY28wgdUAHArtvih+wj8I/+EUXxj8OluBHHbBmt3ZTtOM56D+VN+Hl18bfh3eavo/xLtEms7GFhbvAiqjRjlS3XnpXoFv8AtAaL488Oz6JZxTW91eMbDIOFBAA3Yx+lepjOKc0liILDzaPSozjax88fC39h74beLbCDW47i7+0vK0MgZgBlRn5cV2/jH9g3wJIrWw1aa185jEiyucbgM5KjtgcV1t54wvPAet/8IHZuYTDaJdwz5+TzXIBGcc8Crt94z+I/ibQotR1e6guA/wC5e5iQjy1HQcHr2zX01binNcPT55TD2MW7tHC33/BPH4c2PhGK9s/GSfamYB0SR8fKPu4pfEH7AcXhrT7K5g8TxTRXG4Iqs+cgY5/OvQdR+CXjePQr7W/BV02pRWVus/lhycs+AT144NJ4N8ceKLjxLpOhw20l7NCd13B/dDj7o57Y618ZV8SM1dVRp1WbujG1rHm8H/BOqLWrL7aPFcKQx8ySMX2rgevfnipdF/4JweLdX0GDV7TxXai3uGZE3M/G3/EdK9q+MnxJhTwHaeD9GjfSre0uHa9LkhiDICuDnkZwPpXvGk/EO18PeH3l0RHvgtqktlHGSVLKmW9u1fpWE8Rczi403PdGCwyXQ+MtZ/4JyfGjwR4TXxF4f8bW9vHKNy7GkVuGA5Pt9K8Pl/Y0/a/8TeIbHTofEMl7b2sTvay7pCqAqSxHpmvuLwT+1T4v/aM8KafoviTTpdO8hplwnyBljb8PSvb7P44a3ong06R4IIbUWjcpC2Wm+zxf67HT/lmGr6OhxjjlG0pXY1CK6H5wy/s3/t4aZ4aez03xjcSW0bAOUkl+UbgMAg9qwtZi/aw+D3gefWNT+I/70QmSO1aeXe3ynpuOCeK/Yf4UfGqz+JHw80zSPhuqLdXok86OYszRlTh93T+HJ7Yr5a/4KKfBP4Yn9mpdWuJpRq2lSRL58T4SQH5unPAPGMmvOynj/HTxPspSJwtaEqvLyn4tfsKXvibx78Y/EfxH8aXkt7dSLNHJJOSx3Op4GemMV+vHwU8Ppr3xM0WwgRQRLG7AD7u1xXwF+yF4Xk0Lwpq2tggvczJuAGPlI4Ir73+Geqan4Z1+TW9Jx5y2zorH+EkHn8K/d+F8753erqdudxSge3ft8ft02nwq+KVh8NtCSS4lW0bzZYc7EkHAXIH49favxe8WfttfGDUvHP2HS5phaScMsjPjce+PSv3Z8H/APTvHng4eJdc0YareXz75ZXALbT94An26elfnd/wUE+Cvwm/Z3+HrfE7TNFuNLvln+zq1wwKMuMjC4H0r5ql4iSq5pLD01rsRhcRRVJJnzhp/7TGpXN0bbxR4c0vVY1Gxmntlkb/x6vavh58dPhX4Nhu7uz8IpZC9DCYWMMcXDkEYwOxFfkgv7Q3wm8QWlkt/DPb3cqjzH37Y93qcL+VfZui/s2/HPxB4Li8efDiyn1TTJyAnlgHIIz/E2K/Rcdx5DBUV9bRhVwtKbufXUfiT9mzxnfpc6nfXGlOO003yj6hQa7/UfhT4Q8X2TH4eeNdPZdo2xAsGJHbtX5ean4d+MXgxmk8X+F54lHDF0Xjt1XmvOdS1Twu900Ect9pDyAbnErRhT7Y/KojxhkWZ0Wp2Whyf2Sr3ifp54n/ZN+MXxL+EMvh7W7eymudPneSznjjxuH13c8V8PaZ8FvHqeIJPEXiqwbTL7To/IVQNqN5Yxvx05HasrSviX448G6bbW/h3xBqE8MJ3I0tw7j07n+letaR+2F8a9NlMv2W01EMoUmeFZCf++jit6WX5ZUpJUZpGVfL5nznbfEWzi8UNpU6STO7kSRw427gOpHfFe+eFPE/jCDwHc32lTRwPLIVhB/1i4YDI5Fd3pH7Vvgya4M/xM+HInbq0tlDDF/LJqc+Ov2JviH+4eDUPDkykkLLcYRWPqFXP5VFfhNSSdKR51XD1UrJHNfDLxP4t+M3xV0bwbdl5p45N0mSxXAIP3c4+XGa9o/4KAaDro+Of/CSeG7oXSwQwILeE/dJjwc/THpXsf7KfgH9mXwF8QbHx3pnjO0L2+/h2YM2VYAdPfHSvoDUfgQ3iPx9d+PNBvrbVY7nLBFx83BwBuIr345VWoYb2fLoc0KEo6SR+eHg34e+Mrfw5D8TtfQRFCuOMdSF/rXf2fiOR9YfxFO4N20bKDHwwBUryfpx0r6l+Ingbxhd/D+bR9Z0uazgiJcLlR90gr07ZAr4KsvFHhLT9Zii8V77bjy5FHy5xwDwD3xXxuY5TUmtIm0XZbHfeGfFfijw3pmqWttZx3nmtgttzt3+v0r4k+JHxV8VX93c+FH0RnKSAmSOMDGPf9K/QdbWHxF4B1668IxMyRxtJuTuI1z7elfj78PvjvHdeIL3RjgSxlvMSTl/l64Ptivy98LVKVaU3E5q9S9lY7nxJ4n0vTPBVvpVjbFNXvJREEI/ichR/Ou6l0nxb8NfCLX/jGOO3ma3aJVKn7xHHr/8AWryTwzL/AMLM+KVnp3h+yaW4gulldh2VHXkdO1fq54y1X4f+JbaPwZNYu8643GUBmDfdO04GK8fNqNSnKCsa08PdH57fC3ULTQNKgW9Q2+tX8qyx3XRUQ8Af5+lfqh/Zd5B8MrfVreNNbEXzSmFQSZO+cn0/Kvzwn8L6prXjl9Cg02RYNMfHmDAxEvP4cCvpm28aXngyax+F3hK4L6fq8is4blwX4IyK+axPC1bG1eaIODgfXWseJH8PfCDTIbbNnql7drNDbDjcCMBcd64/wj4w8W+DNHlXx5G8V3cStsToVzyM89qyf2rddl0a68IeAtCtibiNI280DmM8CrHjPxV4i1H+zvDt5aie0hi3XV5tBZMdSzc5+mK5uL4QjiqSi/hVjpwspp3Rzvxh+Ivhb4sQnwCkBuNWu4hGu/DJn2A9hX4/fE3Qh8ONTuPDc0Mttdn5CJF4UqcAoff9BX7BfDTTte8J/FMa3dJa3emALJA4jTcfbPbjmug+OfhjwV8ebb7VpWiiOa3d2nmcDJ56DAGK++4R4vVCrHDvY9Z4B11eR+HPwURpPFM3iTVebfTx9dzdMDpX6G+M/wBoRL74YWPhfSdOL3t1I4hlxl1+U8Z+g9q+FprHw7b/ABEk+H+n7rewjuSMdDv759q/Q3wX8ONA0Dwp/bUFqdUmtsvBGvO1h8v0/lX7PhoyxjUkj0MPRjSpNTZ5Z+yh8QfGX7ON/rnxAvZIjqd6m11uOZMD+76V3/gj45ane+ONR8a7vscviHAyOOUU59PrXlR+CP7RHxOu77xTBos8EMxOxSq42j0GRXlN78PPj3oV99t8Q6TPbW+n8I4XA/u9s4r6HEZbWhBWR8pXxUJtxWx9paVdak/ia58R3VxHqJhVm8nJccKcEjjpX5yfEL4y+JvGfj27tNOR1Z5fLdD91R04Fe/33xJl8NeB5vPuo4mukbeyjawwOn6V+cOneJNc1Sf+2dAQhp5X/fH0zjP5V62V4904WkeRUwilsj9k/wBkz4PfDz4j6zP4TVze6nDAxYMdxVihwB+NdXY/A7Uvhd4gkVHWPUUV7uRFAzGsDbthPqVHpXkf7Df/AAlHhuxuPif4TnSGXTZIjcu6/M+70/livs34w+Ibn4j6uvibWNKn0qLV4zIZcbd5AxkYH3Se1folGtFYb2iR5Dwj57Hwxb/Ebxd4+8dX/jey0p4hqk/n+dsw3kxEAnPsV9qt6b8U/hnJ8XbbUNXlL2iXCC4MhzKT0POOPSvcvh98ZdB+Humanoo+xXt5p6PbwJsB/duCcY+vP4V1/wCzn+yD4d+NrN8S9UktorySQyfZsALxz93PNfKYfMac695v0Ncwws1Ssj9tdK8JeBv2pvgRD4c8LE29pZwhbaTow2rnngZr6a/ZN+GPjf4WeEofDGv3YubWCPbHnqB2rivg/wCKNE+E3h2y8JRaWu1Yv3k8YCoAB6YNfRVx8Yvh3p+lNqT6lHEiR+ZsJAOB7V+i4jOcLSormaR4mChOLXMj2Zn2++B2oMmwZIxggH24r8fte/4K0/Cdda1LwXYxtZ3kRaG2ml5SRugIG0cfjXzf4v8A+CrvjmfRh4N8Hx2//CT+cYzIygxEY+X0r5LH8ZYWl8Due5zM/frUdd0jTEEuoXCRKTj5iB+leJ+N/wBpj4T/AA98Qw+HfEmpRQzTKGUk4XB4HOOK/nI+IP7TfxN8a63p0HxMvpo13BLy7tW8uCL1BCk9K7rxDF+yVok6eI/FXiyTWp9SjENvGblmbjpt3Egc+1fP1fEKnb3UJcx/S74V8X6J4v0xdX0OZZYGOFYEYPofpXVZdevBFfzSfs6/Hvxrp/xZ0/w/Et1BpsU3lQq7/KYQpK+x6Cv6OIfEulHR11a4mVEIBJJHpX0fD3FOHxkNZWaNm7I2LuQxW0k6rvZEJAHfA6dq/Fz4s/8ABQz42+HfiFJ8P/C/ht7JllaNXuY1IZVySwxnjAr9nXvbf7IbneBHt3bgQflx1r8o/ibJofjLxvc6nHbRptyAQo6q2OuO49MV9LiMRBU+amYfWOlj58bxf+2h8f4kaw1+x0+O7LxwxwAxum0c5w3PAPpXZL/wT++OXjTS7xvG/jO833JiaILcSfJsxuAycYIFWoPDLafcLc6bdPbtHkqsJ2DPXt+Vc1rP7a+k/DvxkfAOr+KIYdTQLuikZmKjGenPYVwvM1ShzVUexlWW1sbLkw8btHqF3/wTb+Huj6ZqXifxlqL3MTRLK3nOHCiBct165xX5taH+wJ4Q/a2+OWqfHDR9JZPCmjGS3060RVHnlgEL8BeFPbHTvxivtfXv2pJvip4Zfwna+JrSa2nOZVX5TgMPlB4649uK+hPhd+0TB4D0ePwlpWjqNMtQphMG1RjHzcjOcn2rnwvEdKd1E7cx4ax2FV61Kx+L2n2n7Un7BPxkl8Q/C8T6jo15Oon0gcrtBxmNSdowv6flXyv/AMFY/wBtrxB+1JqGjaZpOmTacNOi8u5glx/revIBGMV/S18bfij8EvEXw81PxfrUC6dcWsTMkkgAUSBcrnjnnAr+LT4k+Jf+E8+IepancSoReTM29AAvB4x6V6M8Q5U7xPFh2aPAfD/h6/uIoZNQRg+QMIMV7JpHwn8Sa/4itLS0upVN1IsSRZ5+bgVjrY6hoPnaqs6tHACQD7Cvr79gey8U/Gr9pfQtPnVRY2s8c7sV3fLGwznpivmsRX/eKLPTpU+WOp/Zh+wZ8HYfgn+zf4e8MbdtxLaxyT5GDuAxz+dfZ1Z+mR2UFjBb2O3y44wFwMfKMAYrQHOfUV9ZgYJR0PIru7CiiiuwwCiiigAopQMnFAHGfSgBKKKKAP/S+cfBXinwNZ/s4yeBP2hNBkHjLQytrplzIw+ZH/5aAAHgA9M9q/OP4h3E/hX4i6b4cV11WGWPdMeSse4H3I6cVz+ta/4v1KWKXxE88d5B8rbi2GXp1PHTitO6nmh0qZtM2MwZV5GX+b/a9vpX8PZbhXTrOpI68ynyxueWWfwbisfi5ceLdORV02Q7ljP3c4/xr7a/4Wd4R/4Vk/wwbw6stxeNiS+dFYgN/d+UFR+NeN+EpdNgkNtr0h80RnaoOMEjHHrXoGgaDfXet2GpanB5Wkl1j87k9+4HSnxPn0mopdD5mljuafIen/sY/Bb4Cab4jvLLxIr6jqN3G0VrDu4jduFPzDHBxX0v8R/2CPiR8PzB408PyLqNheGPcoXIjlY/6vr+GQPwFeufHP8AZY8N/Cv4WaD+0NpN5Hqtv9mR0S1PlvFOTuQMR1/Kvkh/23viX8SrPS/BV/PJHaWTJKyplW3IeuRjtX5rmObZhzc9CZ7lL2UNJq594/AT4F+N/gBp1t8Y/ijqiaBNBN5lpbTKQZwvIRfmx+YrA+Mf7SkPxL+KFlp3hW7SxmtJf7SBYkgzn+HoAfpXlMH7Unw6+LmiT/Cz4oLculq+Y7sysBGPod3pgc16B8MtW/Zo8bvJb6hpkx1jQU2W9ykgQXMK/dGCvDerZPHavlsfRlJe3qr3j3sJOE0ktDh/Fv7S/wARp/jba+LPE2mS2jQKII4oU8tJyOpbC4OevtXn/jz4nXXxV+LI1x9JW0RI9rpEoG5s9+Bz719m6f8AtYfDLXPAU/w+13RrVr7T7hnt0VAbhAOm+TB3/ktfDevS6r4f8Sf23HACH/0hUC44J479v5VosFNyUmtLGeMgl1PXfA/xy1aHxTovgz4YWX9ia/8Aa/3F2w6vggBgAp+nNQN4G+NF/wDEzWvDGsXIvtbUfa5rodTnO5Rl+ma4X4Ya14dl8XR/EmXUYZdbs5S6wxqQIcd+eCfwr0Lxhoui+OviFP8AEuz1W4sJpLdEeNZGVpCD1GMcE9vSvTzbHKOGUGh4dJRu2eSXcereMY77wprFwsd3bExyL90g+vv9K5H4maL4v8EyWPhPVWe8tbtgbY9gzgducYxX0bpfgXS9Z8K6prszm0vETckx6MQ4XB6ZqvBYePry5iTWLD+1ordVYMgBACrxg54r43L/AG0pWvoeQ8wbqWjseefGrw54a+AvgHw9PY6dM/iHUQJLpo2CgRnvgD0rQ8RafoPxG8AaVoPwW+1XjJj+07YyFkDPyTsOOntXjvxH+IvxB8eeOo7jTtImuxo0kaY2712bgu3GMcA1976n8TdD+HGmx+KdcNtpc19AoFrFEiuGC4+8oH8q/fOB/D149KpVjoevShzq6Kvwq+Fus6Jodv4Y1iwi8uIfJIFRfLGOQeO31qTXfjzZ/CPxCNCntxqccaEJLIoPY5A64/OvlDxl+0L4ouLV9QstQWOOTPA449+a/MX4n/GzX/EXiiTS4bxtwBKN6Gv6cyrhXD4WjGmom9LCN7n72fB346eHrnVL3xIumRwtKxLZAGOOMcVU+L/7SujaPo0tzYJBDNLyZQBuPtmvwIs/jX490nQI9Is7tmlB/eEKQcenWuH8XeNviXr08Wl6estxJMuViGSeBk/TgV9NHBRTTXQ9CnSlHY+4/Efxs1XTPiZZ+M/C98Qz7TImeCehH5V9y6pr/g744+D2m8QyG0u5V27Y3+UNjggbfWv55rYePzq8NlqIe1ljcE59Bzivt/wv8XNY8BRR3NzunjXaxVeuB78/yr6DL8WsHacVqefjcDGo/eRw/wAYfgP4+8EalJq+oWjzaYh+SZRxtz1NfJ/xX+NMvg/wp/wjmgr5U90vLLw2O3TpX7m6R480745fD57rS5EuIdmJrZvvoPr/APWr+c79pjwbqugfGS80iWMpG3+oDdNueAK/Wsp43lWpKij5PEZHCnLnR8tDS9Q8RaqIZszTvzI7clc+/FbHjmSz0q2h8M6aB5UQyxHHzetep3NpZ/D3w9JcXWPt1yufcD0r5tne41OU3UrffOTWWY0uSXNfVjoQVjorDVWWWKOOTCooUgcDivWpNRN9oclsp2bk2188EiK72IdtehaRqO6PyHPAFKlieSm0OUU5q5/Sr/wSz8ZW/wDwzxa23mcx3cvHp2r9J/Ecn9rxSPHxkLj8xX85n/BNb4txeGjqvgW9udig7ok9CzV+7Pg3x9b6poTQM26YfoARX4Vn+Hn9ZcmfsWCgnQjKLOb+KYisNOgsvlQTDB4rg4bG08O+HIprOEeY2Txgnniu7+KWhz6+lnfO2yCLlx/KvnHx94Yu7jTnv/C986GJfuE5UdO3FeAoqDPusnp88OW5UufF/ibw9cvNYRFRJng85r6h/Za+IPiHw/HqWptY+YLlHDgrj+E1+Zmm+MfHtndi1vYPtW1iOF54r9Af2fPij4XuLgaXrED6fOqHIbIDZU8DgCu2nN8p7WOoOjS0Zwui+LLp/Fl9CwMa+aDs9ME9q/SPwBqepWuhW11DEd8uAVBH+rbgt26DtivmG1+FeiLq9/48u2EWnQq1w0nTKxDeRn3AxX4+/F3/AIKH3mp/HV7rwldtaaRpsqwxKpOGj+6emAeK9GHD9TF0Zcumh+U8WcWeyp+zjufuJ4n0fwZZ/EGytLO9N/PqAaWS3U5WJgcDIGR/KvetX8P+Eb2G20BYp18RQ3ESxhJMRshIOduPTtX5tfBb9qDwf4w00TeAbUNr94RvLYb910bAIHbJFfcnhS08VeGbKTxbNq0U93cxtd2ism6RPLHCnLDHPFf55+J/D+Ly/MXTxG7f4H5c8wdZOTOL+NnxK8W/CG7/AOEKhk8xb9/nXb+9SQnAQGvqey8XfEDwB8MbDVPCtrb3mpXdgZHiaMGYJ03Ek8EH2r4h+EOpeMPil4h1nxn8SJIYdUi1BZbczx70jK/d9MjNN+O9/wDGHSvHFl8X49djk0i1YW15Hbp5cfXLIE3dCOa8OvluH+rvTVovD4xxjY+8/CXx08cwwaNo/wASNLAtNRRNoRVQs5Pf2/pXT2WlpofhPWbnQLlby5lupJLe3iHzQt2A7D8q+IfFPxI8J/GPWvDPhrVdJvJrmaaJrBrWXYqISNpYDORn6V9n/s/w/FHRf2hZfC/jex36Hp8PmNtQZUg/xH3FfKY+nSwlFPY9TC17rU5O6+JfirwH8MLvxD411eM6ldZgWGZSWPH1xx0rD+CPiRm8T6L4Z8e7Ip9Svlu4Z4xsAWUdMc5x9eenFeA/tL/Gvw94j8S69pltLGbWy1CdI4CgOSjDGDwOn8q+kP2dvFesfEqz0+yu/B051rR0W5gvAyeX5IGE4x+ldleVKnhY4inu1Y3oYxqdj2/xjpGr+C9Tfxz4rIlspbl7Qpt6Qxk4cemeuK7vSPibfeHPCz6P4d0kRaJrhMdvI+18Sfez0BwQOKb4v+InjvxGDpHiXT0MSH/SHAUqFxjGB0J6V86eBp7PxZaXWreIHmgvIZ3S2UErCkScKyx9AccV83i6v1lRpt7HrU67k9D68+EV78RvCkfiO61W5xp2pQJBGo6KVI9OlefaRow0/wAV3tzpgbzLlFZ71T8ke32yPp1rv/AtjY23ws1XVpNSIubtPKtlJ3ZcEZIHbI4xXQaV4AsdP+CNh4g1BjBqqyTY+YHeAQo3KD0IOeemKrL8v+rVPaON0d6b2PiXxsutfEHwJa+Lr8+XbabdTRTdR5qh9oJ9PXvX0x4f1saH+zHFpfhu9judTm4hIGG8tnXIBz/CufwrlPiBpuv6R4Z1DTrpoG0yIK7pEgG8OMnoTjnHrWVpGieEL/4SXlj4LjuLjUbJVa0WN+ckBnG3HQLmvuMLh6uJmqvLZI6G0ovmZyvjr4vfC74e/DGG58Plo9TsgDbzgnbvJAlDIBzyT3rn/hJ+0H8SPEMZ8XaVpuL3VB5NpJtBRUI2ONvHUEnt6ViWPwy8beLrEapa2MN9ptgu2ezWMB0LjBZmYjOGwfu9qu/DLwFYXXi3SfCegX/9nXQLSeXJkjC5ZtuCAOBX0rxkaEdrtGVCdN2ufbXwQ+JWs/BTVLjwdrGjf6TqxLPcxgKiFx82Bg4z061P+0jdeFvFXgHTfBXi28NppSlTcuzfd/eAZPrwelV/iR400PxX4WvPC/hiVRqWgyokzqMNIARkg+w+tdD4D/Z9+Gn7R/hOSw1PWwtxKOI3flCFxjHfnnpX2XAfAOIzKo8XTjZHBLGUqVY+ePAfhPw14ftNRtfBk32jSTMjWsvZkUYr6F+Hnge5vPtMly6Qo7bBI5AADL1xntXh37Vuv+Ff+Cbnw0kbxxMl0ltCV09UwGmJHy8HOOcDvX8gf7SP/BUj9qX4tXdzeaZezaVZzyf6Pb226N1XHG4oR29q/oDhPw8qxnJ1tjkzLN/a+5FH+hfp37Rv7O3wY0q28I+IvH1hDcwRhXiJIGfwzX5af8Ft/in4A+LHwF8P6Z4I1SDVoZb5Ji0WW4447V/A34n+N/xXmtl/ta+1BrqQFneWZ2yT6E16J8K/20vGHh7Hhrx9qFzd2RKmNZZGfZ24zx+letlvg1gsFjHmMJXb6HjYqpOEUrH6nWHg/Tb7XIoLySK1tgoQsRgKPWv7cP2Gvhb4b0r9lHQLVriS5SaKKZGU4UhkB6c/Sv4wP2bYPh58cdW0m80bU1BmuUjnjc5wvfj+mK/vf+G+jaV4L+EPhrwvoKhYbPTbbayY5UR7fwzjpzX88fSOxHsUotWR24PEx5dTmdU+Etr/AGQ0KPaM0r5UXESvgenI54ryL4j/ALMPwz8WWFvp+teEor5XXbLJaxRxFvodvHNfVb6rb36KA374D5V4P+Harsms6g9uIr2M7U6Y4/lX8hQxygrUqlmenSxa5T8fPHP/AASx+EmtwLH4YS50ctnaLiQyBCfZQK+OfGP/AASd+JmjeZH4W8TxXMa8oqRtnr05bAr+jE6oyw+eYmAH3WJqeLVbXUbXyLpFjcdAv8WK9TB8dY7C2hGrc7sPmNlZH8pvib9hn9qbwZGIn0mXUIx0kjVeR+Jr5g8W/DHx94ZvG/4SnQ3tXXrmMZ/Nea/tLT+z8xTPAZdueD8w6en/ANasfVPC/hLxWv2a+0uxTH3g8CFiPrgV+iZR475hhko1NipY+5/D1aNr+nX32pZTHDnsHUjFdTb/ABA8azanBe6Vr97AsJ+VUncLx6rmv69PGn7Hv7PHi+3bOgCVyMHydqDJ/wCA18DfEj/gjt8Htc1X+1vCFzLpdxnOxpSV/wC+QK/Scu+kgpRtVQ41Kclqj8odM/ay+NfhJYNRutWF0jjYBcgygDGOh/wr6N8M/ttWNygb4g+FrfXI1UA/ZoIomP0JQ9PrXq/jL/gkx8TdFCz+FPEdpdkDiF4mP82Ar5U8V/sMfteeCVknGjHU4k/54qFBHQfxV+hZP475dVj+8Z3UMupVF2PpyL9qL9kLxDZz6PqXh6+0H7XGySEXIVeR6KnFfDWqfsl/sg6zrT+I/AnxHsNHeV9xguA7O2T0yCK8D8X+Bfiz4TnKeMfD8ti6HkugZfTkKK5BNTtoXCXOI26YEW0/hlf619BhfELKsa/iHU4cpS+E/Sr4XfsU3mh+K18feEfEdpqqMCsItF8sPuxgHc3NewRfCf4y6L4zF5rHhp5FPypJ8pyx6d6/KQeMdVs7WKPR9UubbysFNszBQR/sgivSNN/as+M/g0QyR6xLd4wUWZmkAYd+v6VriMDl+L97mWhi8i9nsfsndfsPfETU/Dz+IoVa31HViV8tflK7uOgPYfStHSP2GtZ+F2pab458RWrOtgiq7vyCy9/avyf0L/gqB+1P4e1P7Q+rwSDcCqGE8Adhlq+u/DH/AAWY8U6pbx6P8UdFm1G1B/eeVtQH8xVZflNCEnySPNxGUSetj6Ou/DF/8TPigvihUaSG0kC7MdUB7Gvmz4q+MtT+Fvja70OziEtrfzMjQOPnKN1UN06e1fU3g/8A4Kffsk3+jy6Nc6Q2kzzf8tXdfl74wq13NvrP7CHx00E3mu+JLf8AtBfmjBJQ7uoHGT7V+b5x4XPFYl1YvchYXkjrE+IPg98RvAmtXxttc36bFbOdyyuegOAF4H0r1jW7ax8MeGbzVvh0zXHmO78vuXae/wDTGK+Lfif4Cu/CesahdprEKafAzmyiVfmlX/e+nrX506V+0r8WI/HB0vwrquxBN5flMC4AHbt/Ku/JfC+pSqqo+h62R4jmvFqx9NweFb/x38VbvxHDYtZ/Zv3lx8n4Fh0r9uv2X9B1e3+HNhBp1pHMLmaUPvRWYqhBU89M18D6/wDEPXj+ybL4k1XTVj8QX26PzY4ShdVI28Af56V7R+yr+0pYXPwt0yL4mWc+n6jAfkaJigZSAMbdufev6E4XpU8LD34ny3FNflnZH3H8b/j1afDjXIvh7faWZJDGMi2Cps+Xdzhfb2rC+C3jTwh8UPttlrdik0NqCHiYfOQ3HX2+lfBv7UFv4h+J3jVfEPw98QQK86KrROp3AAf7wz+lfQH7N3g3xN8PfAdw0I8/WJVy0ykYY/7vP86+vq8R4H4ZI+Mp86kcP8ff2HPgx4s8O6t4xkSW3sI84gV9vzbhwOn8q/J3XvhJ4a8M+ItF8IeHIGsNPRmTc53b+R34r9Qvj54x+J2qeKdM+H3jPUobK1ndsxRJsLbecnBr508T6T4Abx/FZ+LbwPaxgm02n7rcDn16V+CeJ3Frw9/qsT6jAK+jPe9I+F2qfDT4fx2ulXkUNrdNC7nYMOFI4ODXtvjH42eDdA0Sz0O+WNprS2aHIGUKupzwQeg968MPjTwvqPw5urK9uiE00p5ZY8up5wB7AV86+Mv2pfBj+EZ0k0d70MjRxKmA64GOu3/CvyvhvxczTEy+qctkehUymPxI+XfiRB4T03xPfeKtFn86C+fdtUkBe3XH9K+vv2ZPijaaalna6NqrWp6Hk7eRjpxXzvYaLda94Ht9d1Cx22d2pFrbABXJbjk8559q9u8D2Pw30jRrHwfqenSaL4hGJI0lcEzxD77ABRjHSv0TM8xl9XU7+8efyQn7nY/U3Uv2tta8B2Uul3tp5qxwErdHG1vl7V8TfGH9pDRfjDqNs/g3WBp18bQwTRuxCbyMfdGK5fx5oGjeLLG2TxDf+TZW5AihJIc4988/lX56fFnwX4d0Hx79msbiWwiu8LbzLkqC3AzxXweCzXFYyt7OrV0OHEYS3Q2vH3jmLQfFK6RrSpeeIUg8n7VGAIlXttTnB9818peF/GNn4h+KU0ni28nsobJtiyo5U+YP4s+/TFeKahfP4P1vW5vFV3Nql5aTvHFcox2jA4yOax9P+J0Wr3NtpemWDXF3OAc7eXduAOlfr1DJFToKUWeJOVnsff1t44D6w1v/AGqRpNtP58rOTmQY9zg/T0ryPxrfN8bvHVtd+ArnMbTiBbZDgBVH30Axg8VkF9PtdPa0+LVk6r9n4ihfYUPTBIU5/IV8q6P8SbHwp45S6+F8EkMdlJueRzlcDoOg5rtw2Re0ptIp1UftF4f/AGhvFvwLGm/D/wAQafPJe2ZElrM75kBHBDNg5GK+9vGP7bHxk+KXwlj/AOEZkb7fZ/6yCL5C4H3QOa/ma8T/ALSnim9lvNd1yYTSzZVJ2GSOcgL/AHcV1Hw7/bM8Z+FfCpkhcPqYJMHGQOwYjvj0ryI8J4yjPnoOxpSmmf0V/Cb/AIKh/tC/Ey20z4NTWrW2pTSras4XlIxwScdcY6cV+t1pp93FZwLdYe4MMbSNjvjB/wAa/AD/AIJF+PvE/wAffiTf+I9YtoPJ0eMXM0giVfnJ2sBwMZJ9eK/cTX/Gd3a+KU8PWAZg7ZB7BBmv2fhTCV/Y/vmRVqrZHUatcw6XpF1q16VjhgjfcxHC4U4PHviv5l/iX4CufiV8XvEnxI8N+I4dZ/tBtkKQqyldnB5JGMdK/af9vL4oP8Of2e9QtLebyr7VNkUPOM/vEyR0/hz6V+IGm/D2+utK0zw1orO1xfmPaYpcFTIQz9DXs57TVSmqR9JwVxxVySs69JbeSOGuvhf8aPBvhhfsFnezNHkt5U2CcnjB3EV9RfsWT/HzVfi7pHw/kmvIo4M+fJdN5gK53EY3YHHFfoNe/saa94T+GGnW8TyG6WMO5Zy5IbHavdv2Xvgd418D68/jTxPc29vphV3CtEBIFUZPzcHjFeFguGOR3pn6DxR481M1o+zqUVrpsj4j/wCC2XxkufCvgnS/hD4JkWC7vgZbjyx0ELLx2+9jPtX8+Pw+unh06K+vL6OW4PSLHNfY/wDwUg+OPhr4v/HvxJq2m3f2mCyuBDbYPy7ZOCBx2xXzf8PLHwnpWmQqkod1AaTI4FfSzj7OHLfY/MKd6j5+hxHjPxtrc9vLp9lZs2wknbxkDt044r9m/wDgl/4GHwl8Py/HvxVfRwXszMbawf70kRG7jnHGMdP8K/JzwZ4a/wCFp/FSPw/p12La3mlXeSMgRbsE4yO1f0//ALBv7JPg7xTrh0TXpZJ9M0pPIiZn+WTvuXIwvpjnivzbNM5pzxMaKetzvxC/d3PuL4a/tqfGv4o3ttpPgTwzMIduFnIVlx9MDOAK/UPwBdeL7nQI5PGarHdnqAu3P4VL4M+H3hLwPpMGl+F7SGCCBQikIucD3GK7PcmCV6bu1fqGT4eVKnq9D5ytuLRSds9qeoBr2jEbRSgcZ9KQY+lADl60nT5a4/xP4z0jwskBvm5um8uIDqzeldG10P7M+3Mu1dm4+qjFAFrLBN7jFZ2q6tYaLbm61KRYowM5JxXj/wAOvj34M8f+IrzwbZy7NQsHw8T+nQEZAz9K8X/b71i+0H9nvVNb09ZA9uB80Z2kEkHHT0Fc9Wo47Af/0/xq0j4geOPGunJaePYIYfD8kX7iWOPazbPu5br1ArxG78fX0fixtD0WDEZlXY5A6Dg+navZfE+vXPg69n0H4zP/AGfoFu0v9nuE3B92do/d5Awcda+M/iLc+BNN0Ntfstb+3XF3IEgto1ZCuWAHJ4/l/Sv5hyrJFiFz20PZxmCvHU/QrRfhV4h+JWqJoGk2glvtnmoqemM9R9K1/GeleNPAFvZaBfMLRoRvmh3BslTyAQeOPavlLwD+0J8UPhJ4Pgk0p/slzMBC9ySGIRsDAxk4wcZFfUfiHxp4N8caN4b1PQ9HmFxax7tVnkcnzpdwYqAR3XpXx+e5DDnakeHDK4pcxNY/F3x/a+Hh4dumnu9Plw32cyMQMZAOC2OAfSt3UNM8PXHhZtf8KRLHfRxFpk9ABzyOOlXfD8/w/m0zVvEniPSHu7a5DJb2wcxtCNuF6A7sHBxgdK+e57/XvBOkS6ToV6EtNWjaNkIyVVuxyeCBXxlDAQjP2djO/LoeuaakUulwDw2qzandINwXndu/zivXvgRpWkWug6kfi2zaeIpWjhl3HdG3907cHH/6q8U+AGteCPDkjWXiDU0sZ7QAwXEnzLuA4yOMc1zl/wCL9Y1HxNrFtNqAvYbpy+9VKo59VGeOKqvk/wDMror2rWp7f4T0Hwx4G8Qan458F68uqalcsQ0DK21EHR8nIP04rYbxbf69IPCvjC4819Qbek6DATPbAPQAdM1836Xqd3pdlJDpOI3lXY+49F/P+ldxp+n6fbX1jqcUr3OxQeuBuH54pY7DLkTscWJx9+p9I+Db1dIhufIgEsVuhRRsBZ9h+92x0969i8I/EjSbLX4fEuoSJNBIvkmzKdNmOd3/ANavF7W8u9O0e61G32cxbmHXjPI7dq+nPhf4V8PftBfB2+8d+GNO/s9/Ccb3F5DjJmViFzjAxz9a+dngaWJdp9D0ssqcyszD0/XNV+K3iC8+HumBYbVd8mFITCEbh+WK800D4weIvA/xVf4ajTZZtIX91PMW5wEPT9OlfHOj+Pr/AEn4oy6roupSacJZHBlUZ2qnAUg4HJ4rtJvj54y8Q+PdN8W2tzDBeadMQjCJcSKBtYsNuD8pPGKvLOF06vMj2IYOMXdH6UfDb4s2nhyy1a50XSktNC+b93NGrSyNnA+Y4I+bB6GviL4yeI4/EuotrV4xC/ejtzhuP0xxX6F/H7xJ4R8ZfBfRJ9FlSfVGQfaniiEO5mAP3VHGD781+VnxB0y08LaaZ7+1e6vXQbMZ5yRxjtX9jcA5b7LBK6OmC1R8zePtZ0mf99E7wFQR5O7j09K+ZL/wt4y8S36aj4Yt97xnBAGf1r6R8PfCj4hfEvxMLa4tXt4ncYX0BNfsv8Fv2SfCvgbQk+3WwN64G7PPb0r6ut7q0Ptsqyz2qWh+FHh74beNr/UI7nWLR7ZlK5YdMD2x+Fe8alc6Z4VtZDoWnm6vGX5pCP5DHH51+zOt/DXRLK48pLRFB4+6K8X8bfCnQWhLLbheOcAAV5UsbGPxH1dLhFyjdH4SeJtT8QancfaJ4GtXY8nt+VWNFvPHNhGzQlbqEj5kI5xjtmvuzx18EtIjzdQR5mBO3sBXyvrngDxlp9243Exj7oAwOK7aOaQaSPEx3C1SKukeqfA/xToPh/WIde0mWSwlm+S5tWPD+pHQCvqX44/Aj4S/tA+B5/EPhiOMeJtPj8wJ1ZlHTGMV+cCa/fBBpGt2hx90OMRge/evXPCGs+NvhabXxLFrKm3lcKgK4+TuDyc8e4r6nLc0jT1ifB5jlUo6NH4z/FrTPF1r4tuND8SQNb3MB2sG/u5wOOK8vktxATuXbs+Ue9f0XftO/shy/tQ/C6T47fCezSTXLCF3u4IyMyqgzlcY6+mOK/n18XaTcaPeNpV5C8dzBlXVhggrjOR2r7DCY9143vsfL1qPs9Dy+6JW+B7GtuGR4GyDnpWFfssciM3XNamGX5mHbivQpO+551Vs9Z+FvxAuvAvj211qBtiOwEmDjp0r94Phn8Zp40t9Vgl3xNGGbHfd/hX85KK7fUcj8K/Sf9nP4izS+H4bW7fPlDYfpXxHFeWTv7SOx+hcOZrTlT9jI/d6b4qad4g8PrJEQUKjP4V5OdQ/tq3khhYR7uK+Q7DxRqNqu/SpTJE3/LPoBXQaB8SRa3bf2kjx4PocfoK/OcTDm0W5+hZPiHRfNLY9v8P/AAu1t9a+1A7o92fbFffFh8NrXxn4Wt9E0m3jS8gK/MuAeozk/SviXwl8ZrBf3dvIu8YGG+XHboa0vi1+3r4e/Z28AT3uhSC78RXaNHFAgHyk8E55zhc9hXvZRk9apa6M+I+MaXwJmV/wUw/ap034HfB6D9n3wPdI2s3kZjunjPKKcbhx/s5FfzM6fFuzPLmTBz83Neh/EXx94m+KXia58beNZnnv75jI2/jaCeFA5rziW8FjGyL/ABDH58V+nZZhHQVmj8bxuMdaq5S2Pq39lXxhq3h349+G721vGhiW5gjOSQmC46j+lf2G/H3Q/EOr6c8VrozebcSwPZ3SOAqoyjcu1BwGr+L39n1v+Kw0WeU4ZbiNmPfaHGf0r+174Pv5fw/iPhp3+16sEcvKS+2IAD5d3A49MV+Q+IXg9TzjMoYuqtEcicW7HnnhX4QeOrPwnJo+v61D4dluZRIxZBIzIOwIbI/KvZfD/wAOfhWYINM8X+JI7q1XHnKY2wzdN3Qjpx0qDVLfSfDbqttunuP43clgT9D0/Cubn1a41G5C3EarCOuB1FcD8GcocVFrY7oYCLWx6HN8HLWy8S2fif4U6taFoplS3leIYhhHTA+Xp+FfVvw01TVPCPhzWn8TTR3us6rcNA0y/wAaFcbgMnH0r4UV/DombyhIgGMbZWAA+nStmHULmyxNpOqMhHQPkgV8pxZ9GvLMyppUpJFww84/Ceq6v+zH8LtU8H6zaTaf5OorcPf+eSDuLY+XGP8APpXlmqftM6N8OZP+Fe+BH8u7tdMXbIsWGM2QPL4A4A9/wrSX4iePNPbmRrxD1I4GPesS48eeEXvDf6zoafaf+em0H+lfnGI+in7Gm406voCw80ez/D34WaxFoOn+NfEmu/ZLnVGE0lk+XMjsM9SwAHtivooarpHgjxDBp9zoy6p9uiWPy4gEKc7s5w2enPA4r5mvf2j/AAtqdtZreIQbLGwbcKABjHSuiuP2gPDfiFYZrG5EMsR+YleSPQdMV+WV/oxZpCs5J3R6uDqci1Pfdf8AFD+GPEGj6rpWhyT6PcTFJEUjETYxjAH+FVPDXgm2vdY17wjYXUlldXCRzxrKxZCr5Y4B4XAHY9q5TwT8VPA2iI2jTXifZm/fbpMv8zEE4GeOK2Na+JPhfxRqGpalbyp5PkQwxIjbWlEZ6Bvl2+v4Yrwq/hNn+EqWdK8Uen9bRxWj+Nvhn4A1GLR/GNw+pXO90lj+Yq4HHoRxXmcNrq/hL4uXPxQ8NXyw+Hp8Ktkqljl/kXocDBIzx0qvfSac8EMNjogSSJ3+Z5w+d/GefQGup+EVl8RPBV3qUekzwm1uR9258uXr/dDcLivpMJwpnEqXLKhY5KuIi3Y9ksrX4s3/AIkk0e3sBqFi6h7qeAiMGNvmA2rnkdK4TxP8Q9P0q8uvB3g3SWsbrT3WOO5kUZckg4BIGPTrzXhlv+0X8fvhd8Ur22kHm6ROy9AmPl7ZXtmvpXxX4t8X+PvD9t4l0PQEaaJN8kibAc5B3EYPT6V6+TeE2OqP2lSNkelh50lHmsdwYdSsvAUzeL9Bk07V7p0ZbtJEHmjA6qBkcfWvPtDub3whqUfi+0uzZSWZ81inyptj5bPboK4mL4geKtcukl8cXMlx5rDYGTHl7R90BQfSvzU/4KM/tV/EH4d+FJPAfg+2NoL9SrSMOWXg44HHAr+xPD/h6llmCUZrU+HxlKtWquUVofEP/BVf9rn4kft6fHCz8B6feC7tNMb7LHhMKwLY3YBHIHSvQvhb+xF8Ofh34Fht/E0Bur1trSGU5PA6c5/+tTv2I/2cdE0PwlD8YfiGPP1C/wD3sEb/AHgD9f8ACvpr4neIpLpHFs4V+uOOAOgr2MwxUYpunofY8O5ZeP7w/P8A+OPwZ+HOv2LaTYafHDsBCMAARX4e/Gj4Ra98MtdZpk8yzkOFcDoM8V+7niHxAb+5ZL3gocema8c8c+BtB8eWD6TeRo4lXapPY9q+VwWe8tRqR9vmvCsamH54o/Ob9lL4oa58MPGtprfg64aC6splm2n51YjtjgCv9GL9gD9sHTv2q/gzp+sWEqrrWmRRw3Vux5yi4LAYHynoBiv8+1P2YvEnwS8bWWs6ijHSLtwEkA4z6HnpX73/APBIbxf4vj/bHHhrw/M8VkLMLcIn+raMSDD8cV+FfSg4bwuIyF5g94pv7kfkWIwkqNTlZ/W+PEWupeG4aHA5YfgcYrXf4jXRj8u5tiwGMkHHH5VxOt+K5NI8RXMGoc2T7vKdRwDuxjisqHUL2INeWx+0RHnbwP8AP5V/izDjqMK8ot9SU5pWR7Ta+ONG1BFiiQpGnrXWrd6DrluDAwQrx1//AFV88f2vf3Vu8v2YCNVB2rjj24/wpYWtXVHtrg2rkZKEH/61fVYfjGjLVM7aFRqOp9DJZ/2UDFpoJ39GznFZ8tzqET7nQFz1Nee6Xq/iOGP7T5g2R/dB/j/wrfutfuLt/Ou4iAVBPoPyr1KXFPN8LH7fsdVaanq9tGfs2Y17jqDXX6d4l1nUJI/scIdlOHU4BA/KvK7TxDppOxmEUi84wT0H4Vo6h4u0/wAN6Xe+KNZuEtrOyjMkrnptC59vpX3XD+ZTxeKjhqELmtHGcm57hb7NSuZLq4QIBwVJwBj0PSvN/HvxO+CPw4YXPxA1m3tmfhI96t146Zx+lfyi/tzf8FtviRf61eeEfg1qH9naBau8YdVDNKV9/lK8j3r+a/4z/tvfGj4nanLd+INZupXLHZ+8bAr+8OCfo8e1oRr43aS22sdssZOesD/R0+KH7YX7Cfgw21p491vS3F4MrugRzj6gGqmi/DT9gn9qPTUvfBi2eqCTvBth/Tbx+df5lsHx5+JniGJdO8RXNxdqBtRnJOPTtmvuH9k39s3xJ+z54mh1K9v7q3hZkDYkk2r2B29OuOK+6xP0e8LSpf7HO0jowuLxKtof3L+Ov+CRn7N2uRtLokUumSk4BeQkfkBXxj8RP+CKGvGLzPh74rg29VjZHJ+mc/0rc/ZA/wCCxupePfE+k/DvxZLFqFvqeyO3vgAgyeApXk/jur95ZfFdtZS+Xcr5RcZPOQfTvX8u8Z/2jkGJ9jVk7I76PEUoS5ZH8jvjr/gkl+134Z82bS7ZdXiXoyDZ+pOK+R/Fn7Ln7R/ga38vXfCksbR/ebO7GPpxX9zf/Ca+GtScadKpV+g+Y4P4Hir66T4eu0fdBbsEHIeNHznjutZZZ4t+zVuY9Knn8Jbo/wA9zU9O1/RH2atp01tIPWLjj6LmrGn+KGtR5Vq8sMhGdygoc+gyFxX95fiz4CfBzxsnl+I9CtJkfskMaH81XNfGfxM/4JQfsmfEIlhoJt5Wy3mJMygcZxgV9jk/jZHn5EzsjmdGpo0fx6eL/iPruleHZ1TUJmkjQyYZy34ckiuF+CHxRv8AwBeReJri1jlu1m89WlQMDkHjBr7r/wCCmX7HPgH4BfEVvh18LL790IAzK3OARn1PTpXxB8B/hH8SfjB4stvhz4DsW1HU2KxIi4HOP9rjpzX9CZPxtbC+2lomdSwFKMOc/VHwb/wVp8UeHNCj0bxn4et9RsM42GKLAB6Y64r23w/+3X+x54si/tLxx4PnspeoYTDav0CqMV+VPxH/AGFP2sfAOpeX408K3CpCfm2lWx1xwoNfOviG28a+Dp/sur6PcqBxtMJx+i19FlviNgbKm5I8DF5LSran9E+hfEv9hP4gS/2no+pvpLHgF5WIH4V7XpvhvwBaacJfhj8RoWaTGA4Y4/DcO1fycQa1dTSMtlZS2w9eUx+grr9N8deINKARdQnULztEjdvxFfT08zy2urpo8Srw1GOx/T145+C3idfFFh8RvGHiiz1K358tVXkBhg9z2r598Z+Evh7Z+PE1nzN8MIOAeQS3HAxX4s6J+0p46tNkZvbjC8LvlZgMe2T/ACr2/RP2wfEAMLaxi6eL7vygDpivn8+4Qw+NjelJHM8DKn8J+hXiKPS2tW0a4Qi2uJImEhwRtTtgY7V8MfF3VdFuviLD4c8DRBIFljikxnB3EKeOMV0iftP+FfEDrNq9qbeUDCvnheMdh6e1dJ8MvAXwM8feMP8AhJpfHsFnducrbNE2dyjI5yPT0r83yLwwqYTFTqLqGIxE1SahHoe8LDJZHw14DsXxHaWhkmA5wwcNn2wB61826Z8Z9PtP2uZ/FGpgS6bYiW0VWOVCyYx2PQjgCvtK6+E3jbS9O1PW/Ck8GrTSxN5TLNGDjbgAbjkZ+lflXYeC/HHhzxHKPGFp9inkl8xnJDgMDnHH0r1cZwpjJ3jyaHzmQZfWnXvPQ++dd+IFj4j+IjanY2z3Ni3zr/AFxxgDBr0nwr8ZPCmqzXGj+NdOhuVjbbAPKXdHjphsdvwr5m+H3xCt/EF/deF47EyX8EDBLxV2oDjPTGO2OtY/ww8GfE7VrrULK4RZbqKUuCcLuX0GTjpX5fmfDOIwk/aRVj67MML7J8rPHP2kPgH4n09dQ1f4fact5YXsjXMj8fKT7c18KfBvxZq/hPxQmpXWli4lgkwiYxgr+FfsNqug/tAxaReSR6SFt1UqI0mibIHf736Yr8s/EPwp/aLm1+8uxoEkcUmZBs2kbf8AgJyD7Yr9F4VzyDpezxMj5jHQS0SOL+N/xC8a6H4xmk1BVjutRXzYYiN/3jx7cV4vJJdapafZLiQWQx5kpVcbpD1/DFWvFC+N9Ov3TxHpt295APlkeJ2wB0UAAniuI/tTWNXhaXUbS4VgNysInXJ6cgqMV+q4LF4GFNckz5+rBrRI3PHPhqz8O6TY2ek3w1NJX/eRr/BkZ9/6Vl6Za+INO0ua5sLczTKPliUZbb2Ht+Vdl4Z+FHxu8fQR6p4Y0dlgkcIvKgkgY5BxxX6VfsYfs3eLfDHxUs5PHQjttSvQoMD7ZQoHRiOnPTGK6HxRh01SpvU0o03bY/UH/gnd4htP2R/2cNJjvNDbUvEniyRvPhjKo6wnDqW+9x+A6V986L+2P8I7vV4Y/Fdk+jXpzCN/zcjqAcDtXyv4e8W2mo/EjWPiDfyxNb2dnDZ2qJGqoZLc7X2/LgGpviFqdj40+IvhrweYrc2loZrq8IjjDbfLZkLEYIy2B1r9FyqtUVNNJBPkWkkeIf8ABSXxHY/HD9oDw38AdKuHfT9OHn3gjONsUsIeNiR7sOPb34/Nb41eDo/glZprXw81eeK/MsS2kTuz5ctswOR0+le5/CTxmfHfxO8Y/G3VpszXh+w2xJBwtp+5wP8AvkdqxPC/h1f2gv21vCvgady+maNLJPeEfdX5cpkY9RXiYjEVp13aOiOinTg1sfbGoXn/AAUA+F/hnw+V8ZW+qXOoxBvsfk/MqqFIyTIexz0HSv0Z8T/G7x94B/Ybn+JvxcZY/EE0KxrGoCjEwKnH06dO/tXj/jKz0Xx18T7S48L6j9qAlihhtk4+WP5Hwfw9K+KP+Cuf7QKnXNI/Zm8DbjaaHAxvXH9/gqCPY+9e/hMQlEFg1fY/GC+0T/hKfFZjuidoLtK3TeScg47da3vGGk6fo3hldO0lysrAnrzgdulXtJ1m6ttPk1y5s8K+BknnqB6e1cZrmv6d4r8RWekxP9leeWOEDr/rGCDoPf0r5jNMdGlzVJHtUaOiR9c/sI/Dbw5o8WrfEnxjer51p/o1vG38YdTg/gTjGK/YH4a/toeIPhvFFpbyfYreNMRxqgLvxgHIr5A8JfAnSPhJ4U0+01+4N0bpBnywV2sSACeD/SvctJtNE8POLzwBZrd3luM3DTANwBn7rg44r+V844vSzFyh0OyVByXKfpv4L/4KIfGLxRLYaZ4RtGMNuFadmC/MByRjjHFfbNn/AMFDvBDaeftNlI19GP3sKngYHJ4Wv58tB+MWp/ZNQm1dFj8/IUwR7ce3yqD+VfQPgC68R32kxX3g+1ULLBtmeQgHJ4zh9pFfsHCHizFx9nitjxMblk46qR+60X7bvwjtvDlv4g8QyfYvtMgRVPUZ79P6V7l4S+Pnwq8YWf2/QdWikjH94hT09M1/PNJ4V8WeKoFtdchWKFGCxtvQhWxjPWsweAdT8PP9qmWSdYm2kRT7OB3O08V+m0fEXLJaKZ4k5Sjof0e2Xxt+Gd/Ibe11OMtv8vHT5h2rS+IXxL8M/DfwLe/EDWpk+xWURkY7l5HTjmv51NL8O6LrV9HeaTHc6ekTbyTK7fOOvfp+Ffn1/wAFIv2rPiLoemWvwC8DavcXz6gCsqKjAKh6DJyD09q918VYBU+bnCjKcuh+2Hgn9u+5/ag+Mkh8AaI+paN4dQXDAOoABOwt09+lfoN4C/a08BeMrj+y9ZhOk3LsU8qQjIA4Hp1+lfy3f8E7/Gvj/wDZw+EEuj6pcJFretsYHbyxlIfvLng56e1faXxB+MM9/pe27v4f7RO0edGqoMY9hn361EOLcE48yZc4VEz9e/j7pvhG88RWWu/C7Uray8U6cRMY4yqfaE6YODzxmvM/2r/iZrfxV/Yy1S98IqLi8CpDdIMZWRfvHHpkYr8htB0/xHqL22uWl3cX12jZe6MmML/CoHpnA61vWnxx8bfDLxff6VrViyaR4gjW3ki37o1Ealt3TqzAHp7VjS4joVdYoV59j//U/I34zeDfFXxE8f8AiPwNoe3UdD02dxZR4CLGnUfNwGxjvX5ZfHH4PePPAOp6bbajAsMN4pZCJVYgg4xtycfXtX7K/DW0+IHgnw7Ne6lcm60zUpUMjBQ8gDELk4yeM5/CvAPjv8Gfhn4Y8SW/ipta/t+O5gd/Lf5Bbt1298Y/Cv5dyDP5U37Oe3Q+mx2J5otRPP8A4NfCzwNc6HYeKvHuvx3ENhJGs9oxAynePj8s9vTtX2n4l8T/AAZ8a39p4u+DOgRaXpeigRyATEmaVSMHa2Bjt0r882+G3guHwLeeJ9O1OVpbq6iK2ighGRxyQ3sPaqx+Gvi7QNIPiPQGlitCuVcHhfTjoefaubHxp1q12zwqbUdz7Cun8e/ar/xlr8cVhplw5ltSsiH95jhdg5AJxXF2C23iu5nudZtdjNET8p+US4xnp09q8z8JeEvFWs+HU1PxfdNqC7fMiwQu1u3yivoP4KjxDeJNayW4YfcUn16enpX59n8Y4eV4nj4xtzTieD/8KZ12+F7F4ZuluHs4TczkkJsUc4Gc5wPavIf+E61D7Rb6Bfysq27Ahscsv4Yr7V8RaJ4etdZ1HSNP3wX9xEYnZTgbiOmeBXyJ40+Evj7+0tP1SWKOKEyLbiVXX+H1xXv8O4mGJoWmjVQbjqe26VH4VvI5fEMVyYUjjBwc9a9o8KazocvgC4u9OvRPNjITHJ5GAPTFfH3ivxZZ+G4pPC95IMrFyEx1BAxmuy/Z90LxLqdpfeIYstaWqbkRjt9iPyq8VknXoeVLCo+qfCWoz3fhyKwZXlnlYtIp6beoFe+fDP49+Pvh9ot7oXw0uVhi1gGzvYyoI2jt+lfAniLx942S8ZvCEIhBQebD95hg9un8q+mvAekNL4WsfF2hW5t7rl54ycktjDHt1HtX5bnGWPDTdSB3YSXJ8J0/jz4DtPpJ1zQJt1/ue4mUDCvuwQg9MEdf0r5j8GeGfF03jiLw7gxXBlUIMA5/ib06AYr7zl+IGos8V05P2awUGWLbgtlcAfnisH9lvTb/AOJ3x1i1TVNOcafaPK0s+w7IxsbGTx7Cvc8PqtfEYhKp8J6eFr16rtTifWXxP8RXfg3wNZwX0apJ5SDovJAA6Yr578E+A9T+JOvDWNbi/wBGjTcM9OnA/lXX/HPxh4O8W/FQeFre5jSOJtqqXGAq8ZycenSvoTwbpXg7RbT7FBrNuHKjZtkTB9sbuOK/tbLKUaeHike7Tm9Lxsxvwu+EmnWOotqaWyySbwVwMYAr6U1q5j02RWfG/t2/CnWPxd+DnwY+G914o8Z33mrAFLKFB+97g18k2X7aP7O/xd11U8O6lHavJny45fk5H+0SB09qWJpN/CfpXDuZU4pc2h6N411CYzrPHyorzPWNTtr+1xJ071u6/wCOPAzztp0upW7NjnZIrfTpXlWq21hNLs0u8STdyAGFfF5phqi6H6/k2Lw8l7sjhvEWi2FxL5g+ZT2rzvWfC1lewNFJCpX6V6FcWuoRp8wyAav2Ni1zhJFynevBWKlBo+o/sulVi2fn38UPgr/bzD7HalfTacdK8E1HRPH8NovgfV2J0yFs/d6KO2e3Sv2ci0PTLkiF127fbrUp+DHh/Wra9hitfmljIBx14/SvpcBmkj4DibhiChdI+EfhR8Q/GXwHSx1b4XTG90+OVBd2sp4KdwGweO33a+Z/+ClnwB8I+IdEtv2kfhNZCKDUxjUYk/guANztx/D26Cvrb4u/CjW9KghtdGuG02wi/wBZhdxYgYK9VrqvCtj4U+IHw21j4c6jIPOu7UxRQvyCcY3Dpg191lmaSVkmfgOe5QoPVH8lepWrCYqeqbWB9Qf84rpVK3Fksr4BA6eld18YvA958P8AxjfeHL9BH9lkaJVBB4Q15jYOJ7lrQjIK5r9MwtROlc+ExFK0kXLaa2MgUsBivd/hXrkOjagypIAsn8OcYr5e1CxdJ2SMHj3xUthHceZ5sDtx1HSli17an7OexWFl7GftIH7QeFtcuZbWNrRgy8c5Ar6dHjPwv4E8GzeKNfltxfxxFoYiy9cY9+mfSv5/4/iR4utLVdM0m5aPZw2MnGOncVHdah4p8SzKdcvZWK8DLHp9M18ZhOFUq3NLY+wxHFLlSUY7nt+qfFfx/wCN/iHL4gj1JkWeYj938qqB0HHFejfGiITaRZ6hqM63EpVc7jn0r5f1SG58P6JFDphw4O7fXDTa3reogC7uHfy/71fomDjSpQtFHx2KU6k+ZnohkLo4Rhhh0HoK4+XfcXWHGFQ5/LmtPT7nyrDfIfnPSqGJZCVj6tWdRubNYxSVkfQ/7OSyT+Mo9Zvv9Vanao7c1/av+z1r9rrPwt0K8sRvNvY7G29vl4r+Ln4VSw6LCBnH94/yr+u3/gnjr8V7+zSNZJDyRhU/76H9MV6OZ0bUoyOejN856zrF7K9z6AjkEelUDrkeTDt6jFS67dvcXQkIAyPSuWc7iSR0r86qaVj7SgvcTNSaaNQDGcfSpbW/KDZvJ/L/AArELjgkdKeqK6+bGcAVhCT535HV7NnULfGPG45qE3Sk5wh/CuVkuG78Ad6jSd1YEcito45JWaMammiOjuFtpW27FAPtWTNa6UX/AHkQX3Xj9KinuvKZT1H/ANasSW9edsRKfwrvoylNaI5KlSEdzbisdNuz5cobYOOp6fhis86FpTXXkLvVU+6vmOP613XhT4beOvGSsuk2zRxLj52+T8s17dovwA0DSWU+KdYLTtz5QX9Mhq7aGTSqbni1s1hF8qPmBdJsGcqzTHb3V2/of6VsWsN1bEf2fczp6HLZH58fpX1B4iuPhL8OtN8yw0VdRcj5mZiDn8BXmsfxu+G6ToNW8Jx/MOB5jAAflUVssoU/jsa4eU6jWhyVlrniCEjz9STA6BowT+ZXFeueEPiP450W7RtP1xQp42+UuACMfTp7V5Vq3jr4L63dvHo9s1jKoyVViwGOe9bXhvRh4msP7W8L3C4h5KuQvA9D34ryqsaMrpWsj2486Vkj7I0P4s6nHorLJq8TyROHlBtU4AIPGBn2r8hv2hfAV9+0r8eZr6OERaTGweaUjYG2fNgKfUjFfqD8JNV0m98SIsk1uryRtGY9yHLFSK+J9d1ZvDXxU8T6VrkokitpsJxt255wMcV85jHN+iPocmlFr2dtTwn4ueMrzwVocOleGox5Foohjx0wuOMAcV+Wfjr46atZ+L/stzI0EkvU9V+g6V9/fG/xroWraVLFYyCNzu9sV8beDfgvo/xYuPIvXL/ZgX3hc8Lz1yPSvHq1uZWifX4XKVI0b+3kv/DkHiPUnAVxlW6Zz7VkeF7SDWdWGnW06lhyOf6Vr/GbQ9c0rwFJF4XXda6cfJHHt1/+tXwp8NPEfjWDWlubuGSNoW3GVeRge1eTUw1NSvY9yvi5UaXskfvV4T8F+FvFnwn1vw98SY1a3srRmidhhkOOo9K+m/8AghF8CrmxvvF3xj1eIvp0aT6fZXJ6tEsismPyr4V8f+Lru/8AgForaduXUPE8selDHylnmTKnHpxX9N37J3hrwn+z3+zJ4d+GGiXUMN79kga6XKgmdVw/HuT09q/B/pA5fVzDJ3l+HnaTR+e4/Ia2KftKcT3u08RaX5Zs25jZsjcvzL+dc1cz6bJq2LYkRL95vb6cV2M954e17TtklzFHeKgBdSuGPpgYwa4pPDkSoLmylW5RiVfDYKn0289K/wAbeLfBDNsHXm/Z3R4eM4fxdOKfKbcWraIj+ToFx9ncHJY/MPp2q7qv9tG/iu5JEuIlQcjArk38K2wsHW0gd2Y4J+7j0PeqQt9Q0YbZ2cvgAJ1AH1+ntX5hDA16EnSkrNHzkqklLkkj0Vdb/tOM2zr+5j6gHaRWp/wkejaDH9sNydu0LsK9Ow5yf5V5RcS3cG3UdrJGfQfh0q1a+JNMidI71dvpletJ5vXoPXYtI9Ik1u9m2XNpiUydzgDGPSvx5/4LGfta3/wx8HQ/B7w/IwutV+W5SLqQgDAce4FfrnYa1o1+XgvrYbzgRlfr+Hav56f+Co2geE9D/bF0q91pTMbwk28Wdy5Cjr6ce1f3Z9CypRzLOr1dbbDUE2rn4LaX8BPiH8T1Op6jpz2FqRlC+RknvjirMX7G+gaSxfVW8xz+n61+zfjpV1CJHdo7ZY0AVBhR04GBXxj4laRdQdBhyD25H51/sFmM3GC5eh+ncM5fRlFcx8taf8GfCnh1PL062ViO5x/hXYad8NPCuqMbLVbWPy3wDwPw7V6HqWmv5QeNkjL+vFP8OaFNNfKWkEgUg7V74rxaeMq3R9lWy/Dxpux8xeFppfgr8cdPs9Clkjigf7RAecKytuAHPtX96H7InxoX9oH4E6b4r3+dd2SrbXLjkl8Zz2x9K/jN8TeBND1Dxgmmakm27lj/AHMmMbd3Sv2u/wCCf/xs8f8A7Png9PhbHYfbrW9vU8yRvlXnjpg9OvWv5s+lHkMa+VRxEVaSPxTOOVVnY/oQ+wyxE/aZNm/G35ef51ZFp4j8rzbO7C4OD7+nGa4WPXNZvUhvdsUYK7jGrggYx09f0xVk3t3PJ/aCShVHJQfSv8xq+bxo1JQ5tThhXkj0HRtd8SWKeVqJJYfdPau40rXri2V9Tu5PMhgG9x0+UdfWvI7DxRe3MSRXCHax29Olcl8WvFEXgn4L+JvEs0vkMlrIsZ98Y/lX2HA9aeJx9OnDyPQy+vOc7dD+V/8Abu+IM3j/AOOPiTxBdSebHFdT2cfsscmF/l0r6y/4IjfDSHU/ixqPxGvLfctjGJYyem5eMV+Vvxk119S1O7vpRk39092PoxJxX9L/APwSa+Gtj4A/Zv8A+El1iHD6hK0an7pZeGB/+tX9ncf57/Z2RxitHb9D63NMSqeHSP1ru9b0G+uGbWrWCZm6h1TBxnvj0rgdc+D37PHxPUprOhWc2AQQI1H6gCq11pXhPWrQQSyG2YdT/wDXyKwIPBbpldCvDs+uD/Ov5SwviFVctzwcNmjXU+ZviL/wSt/Yo+IyyNHokWn3f95JG6/QH+lfEHjv/ggb8NL8GXwH4iNq45CbTgf99HFfrtLp3iXTh9p0+AyyR9WL9fwFamjfEbxOhd76w8pOAW5J4+vFfcZd4n4iivdkdjzVM/ma+JX/AARG/aX8MJnwLL/a0QzjaI1/XNfn748/4J9/td+AbhpPEfhGUImcOjhvb+EGv7j4fiTcrM6WsPmKwGQ3Tjk+3StWL4geFNYKm7WJNvHl+WrHPtxX3WXeOWLhFKRrSx0Hqz/O18R+CviZ4PuPs2t6NeRHoB5cg6e+K4/+1NWhZmbzIcdiXjP58V/ot6/8N/gr8SojD4w0K1uuMIu1Uz+QFfInxB/4Jc/sZeP8y3fhxdOmkz88bsefoBX6bk30g4Sioylqd8MRSs3Y/hzt/jT418ObY9M1u5g+rMw9uv8AjXrXhH9pXx0jCPWb4TA/xOikn+tf0i/Eb/ggh8NPEtsW+HPiZ7Eg5EZj6YP+0QK+FviN/wAEI/2itHke68GTDWIoh8vMaZ/I1+l5R4z4KesphTVF62Pz6sP2wLzwpK9olqkiT/eYKoOPrXuemftafCfxVoMWgeI5v7IHe4TczH6iMZ/n+VeK/Er/AIJt/tM+A53/AOEs8GSuF43Rsz4HTPyrXzDrX7P3iHwtGYrvTL212/8ALOSCQD82Ar6iHGeVY1c02mYYnBwnqfp5aa5Y6hYg/CT42mwO3iCWxyM/WRf61rQ/FP8Ab08G6dFb+A9cs/E1pnLSNDZpv/MbgPYV+LF1oEljcblieIf7xj6fiMV1ugfFHW9ClS00zflOhMmQOPXmu6lluV4mPMmjxK2S83vI/UzXf26v2sPDMH2H4hfDq0vJA2GljhgbI/4BHn8jXH6d/wAFEvhDPMtp8VPheLNro+VK/ktyPUARjFfM+g/tc/ETw5tEEqzIAAyNGrbce/U/lXpsf7XngjxfaJB8T/DsGp+WcgbfKHt91c8fUVsuFcNOm1TkefVyud9j7Z8G/FP/AIJ7eIPHEFy0n9kSpAjiLEoTB7YAABr3Wz+L/wCwH8FPHq+LH8SrJfX67Eby53CDqMfI3SvzG0vxr+wJ4zk/sjxP4f8A7IeTkyrJI+G/w9BW1rv7Gn7J3xAMF98LfiI1oRyIZIxgH0+civEp8Ack1UpzOWrhakFoj9GNOT4PX+i3OrfC/wCJ63GlQytdm2lt2QhpDlh8/qTWNqfiHwDZaB4hktvHsP8AwlHie0htLHCpiLyiGZsnA+6Dxx0xX5ka1/wT4+Mek2t3B8L9bh1lblMOouI4wR2xhu1fDvxL/Zs/aF+HMDyeKdJuIpuMPDK8+AOPl2ZxX1uHpZhSjyQmeFiaU3uj9hPhp+zRcQeHLnQdJ8aWstypllePMSDfIQ2Qd394V9H/ALEH7ON78MJfG3xL8e61aR6zepFHaHz422hPkz94fez04xX8s9uvjfSl8uSTULUg4fd5yk/jgV0Fr8QvEmiXDppurXccQUb1aVySR/vHA59q4prNqd5I5qMuXRo/s7+CHhp/hW2tfGvxW8L2GhwTSQnzEILToSDwezYr+bL4i/G66+LvxI1fxzqI8281a4bOeBtRiBz7j+VZngT9p/4j+JPgpqvw4utakulv/KUJggKqEAgsPbn9K8ft9EtxMba2hw9tt+YHj0x278191keKqypL2x7dGK6nteua79i0wW90ioIELcduPSut/ZV8NeHvG3xOXxPr2nNqNnpToz4+UCRRuQcfQGvCtdtrQ6aiTxGaR8Ixzt68e9fqv8EfGngb4H/DXRPCCaKtnrXiH9/cXB+Zsxsqr8uOMrx1r47xAr8mBk09TvU0tj6v1j472vhbxBpepXeh+fYX8ZIgbLeUQ20ckY6c9BXW+LLHwJ4i0+fxd4c1GPT7qZSWt93DZGMcY6VS+N/jX4f+G/h5ZpPbx3N3fBV442BsDpg49a/Pfx2xtn06z0K/eJX/AHgUd8HoeeK/nfh3h72tZ15snGV+SneJ7h43/bC+GHwFa08NeL4V1i/e1MsCkFRE4OByoOf0rwBP+ChPxA1XwfqfiDUdVCXFxuis7GNFHlr/AAndjPHXp2r86f2jvE9x4i8beXdHP2RDC78cenOK8q8NT6NPYSyMxZ4l2A9Rn19q+yfD0FJzlE+AxObVZT5WfX+s/wDBQT9pbw7aRWn9qso2Bh8qn5s9f/rV5rpn/BR39qjTNUl1O+8QytHO21l8tSMdOmOK+SNTKywkXUoMrsURs9B9Kd9i/s7RkGkk3FznZuxgA+vevocNw1hXSu42O7BzbR+xmm/8Fj/jRounWUVrEmoGKEQyxeWkfy/723r+VdvY/wDBUn9nPxfZ+d8YPACXOtKci4LkkDtjap6H0r8SIdLFhEtp4xKNcXS8H19BipbWzFu6xarbiFMeXGgw2fckAH8Kxq8O09FDb1PboQZ/R18Jf2tf2OviJqUlrYXf9jXsqBSrLKQhPoSMe3Su78YeBXntRrPhbxAuoaBv/wCPuMrlWHJUpu3Y9/0r+bDwzHfWl9LBaRsyygIRGWVgDx25NfrR8HL+H4KfDQaPqd5Jcvqq7jbyAsVU8jk5IrhwWFqxrezjLQ39nHdo++PBfjfxdJ4pi0Tw4ftdkkS5bONwHf8A+tXZfFL7eNPe68snf3brnjoM8Yr5b+CXiPxJL4ytm062ItcAtzxtxkDp2r6/v9f0vXNRvpvEkaPFGQqIp6fhX6Dk2P8AYPlmiZxv8J//1fxXb47eLvCUFy/h+yis7V12fZ9xO/tkjHH4V45401/wR4h8ISWfiWGW2vtRlWQCMO4A4yvUfX+lfUOg/sQ/tMa74hGteINLjcyjAEUhYKMdSAmBxX0npH/BPz4ualqVubKO1d4sYW4mSLH/AH0DX8w4bIatOySPZoYGs+h8GWKeFbT4faF4OtdRmvlWIEpPGEKbDwAa6P4heJpYvB8PhDSJDbpJGFxtDZzjtkdBX6eeG/2CtS07WVh+M7fYrYcb7UCbAzkY2gDritq1/wCCbWhLqt94jXxAdQ06Rj9mgmwsgXoCAM/lxXFi+DsROp7ROxtLJJvc/JzwDp2n+GdNsrG71ESNkblHPGfTPFfTeg/2NpGrrYaLc7bfUXCpNwBHI3QHnjnvX3xp/wCw3+zDLdW82rXF1p2p264IMRCMR3yXAxXZ6t+yn8NNM8q6TToLqxHUxtuZu2cL0P8AKvLxvA1aoy4cNya2Py78Y+ErjSfFcGmarqCESziH7QpQjee+ScYAr5P+KGmeMfDvxCbwdpurrqlhGpu2aEq0WQ2NoZe+Ofav6A7v9mz9l7x5p6aU1kqNEQFiuSY/n/3iRnFfNvxa/YS+FnhvTZtO+H9z/ZwvScwxneglP+2WGBXtZdwm6FJo0/1eqRi00fz66jo8F7q8moecxKMW2P8A55xXtdv4o8ZalE6eCA1tY21sglWPnLAjJ4x+Ve2fED9jD4n+CtJ/tm9sPt1vExQSWTecTjudo4/OuX+HGky+HrR7/R2xNIwWaM8/KPUdsV4uc1KlCCiz4zMoSoy5Gj3v4OfDkQeDZPiN42nKXl5Hst8rhOO5JOBx2rd+Gvxh06wt54dRkG4zNF8gBHy+nbHFaN94suLj4XS/DrVY1eO7LSRK/AGfQgce1cP+zN8PfAFjb6rpfxDZ4Lgrtsogu5Dznk5Havi84oU6tDmsZU5Ll0PqbSfGGr+NPHEVnpmkf6C6pmRVJDADHZQP1r7g0LxJ4g0nVtR+EPwtsUtdOMCtqd8AFYbhlVXI4+fA61+cXgD4z6z4N1pfDOhXjx+XIV2BRyhO3HI9K+5/jP8AHjw/8JrltE0C3S7uZoLea5aT5S5YA7TgHp2r6fw8wk4JTasj+hfBbKKWJjN1Y30PCfDv7KuheG9e1XxR8UbZ9QlXf5DMSMpIcZ4J9a7j9mH9jPw14+8aX3ieztn/ALPs33YMj49gMnHXFfd/wEgl/aa+HjXYg8iSWPywBwABz1x7V9k/DX4U2/wd+Hj+FbLmaTJkbpX9L4Oo50U30LzfKKccZKMo6Hwj8Xfg/wCBPEHw91P4bw2cSytF+7lL4KmNTgf5+lfx/eOgPCni+60nXyJrewd1ZYWwRyQv3eTg4r+rr9p+61bwja6lqAciMROxOa/mF+Ilr+zh4hmg1nT9Tns9RjZvtn7vO9lJOR8469MV6WXYm8tT43iXCrDpSgrI+NL/AOM3jHQfELz+F9Ql+yg8LuYkD3Br6p+E/wC1X4x+2qJb+bnHbdjHJzzxxXMxWf7MXjDUIZtJvJ/tKMEljMOFbsP4q/TrR/g5+yF8LPAdl4vijW4e7VRdh12mLOAcDJz19q+j+oUMQveR4lDiiphHFwPoX4J/HLTvHUENhqBzIVAD4HcfpX2Re6XY6FoaSQD55O2Ov+FfixpHjD4efDXxRdeNPC8k0+jpcKsXloT8h7bQT0r9ONJ+PXgXxX4PHiLT7xDDsBEc+EYcf3TzX5hn+S8lVqlsf0Nw3xip0FOpoepaNY3l+UfyiBuHOK+x/DHgWdvCY1TywpU4/KvzF8D/ALXHhvTr1LeVUMXmY3DHAr99f2bfGnws+PHwvF54Zljlkt1/ex8bgQQM4FLLstnbWJ6GdcR4erFKLPyQ/aa8AungtteaP5Yw7iMeoHf69OnFfHh8EaB4W8MWnjnUxidm2DHAAwCOe/6V+3/x38DweMND1Xw1okQaR7SRM4wFPT8K/Jj9qMeG/hd+z9BpPiGdt1juklIwcNgfL+GK9TKISdfksfjvF04OPNE/lw/bIshF8ZLtTD5TzlptxOcq3Rh/Kvk3RZP+Jscdhtr2n4+/Eeb4lfEGbxOB/o8UKwQn+8nY9Bj6V4Lo0/l35uJOBmv2LCw5YJM/IcTJyeh0V8VW6ZZay7vVIZCLaBNrHgY//VRrOoW91cb7VuTx0qe00slBdORgCu9wVjA1Zbebw3ax3IAaSbnOK17fU7e7KXEvLnjA7VlWU0t/YzWMh3hema5myL2lzsdtu08H0pRg0riSSPZ9WghlsEEhHTjmvML6EQyZkwvp2r9jv2Xv2SPhz+0t+xz4s8c6bK58Z+FVjljt4l3eaHdQwwCOiZ7GvSf2N/8AgmloHjf4e6j8Y/2hC9hawW05gt5gQd0aNjOdvpxVc8Uk2jTnZ+FkLHYsbHPp6VsafKBN8oyV6e9XviZcaVpHi/VLLw3j7FHM6W4H91TgHNcTp+rutsHf/WZ6V24fkQKTPc9B1GY3sMFv1dhlR/Kv6lv+CUfi9734U+IvCc0hcWEyLtxwuENfyrfD9vKu21a4yPLBZePQV/S1/wAEdWW6+FPjTxS0oMlzfpwTjjbit82rSdHQeCgnU1P0p1K5PnbDzxxxjHNZDLj8a0r1ZHkBxkHjIHpVSSJwu7jjt3r88lvzM+yoTVkkim8fy9adENzASc+mOKn8pmTOMD14pqoUO4Kx+i8VhCtBO5pKdR7IqyQlX2g8elVi7FgiDPOAoHzE9sCvRvCfw38W+P8AU/7O0C3+6Mu7nYAMfSvqDw18M/h58N7Rppv9P1SIbjv+6jex5r6XLsljXXtJbHz+Z5woNRitT5n0H4N+OfEUIvmhNpaY/wBa52n3AB9q+h/Anwl8CaSP7T1AC8+zLvaZxtwemO4rQh8Qa78QtU+zTnybGE8InyjivPPjX8R7OwtU8B+FyAox5xTj3/pXswoQo6RPBxGLq1dD07WfHw1jda6OqR2aYRQny7sdOlcpreq2fhaw+3ai+bh1JRCenHpXP6D/AGd4T8Ijxhr37q2hizEh/jbpmvlXW/H2reMRc+KronbI2yIY4Azjj8PavNzDPIwXJE3wOVaptHfeNr+efwhY3833rqeTvxhcD+teRXssKObubBITbH/Ku/8Aikv9k+GtBsd2GyzsP+ugB/TFeLeIboyTrHF8oVeBX5zm2Z80rH6JleHSjsZ8EVgumXfnti6kx93rjI/pVLxF8Vr/AEvw3beGNIzH/Cu04difUV2mk6Jp+geF7zxXrPAKbl3dyOgryLwz4butfvI/GWrJ897IFtU6YGcfy9q5oScYrzPTqKMYt2PVv2d/A2sXmtv4r1+Zs2+ZG3MQBtBI4z64rR+O/iyy1NbnV9IhEf2lwZdpyWK8dcV7L8V0svhN8HLW2gOy+1XaWI4O3evH5V8fzXh1rw55I+byjXRmWI5aPItxZTgU26q0PiXxy/23VYU1felvK4VmUcKD9K9HTxdp3wXsJRoIzHdRbMuMBsjGa9u1Lw7oVroPnzpuDg/NgZB7fka+Mdc+JNrc3jeFvGmnJcwWz+XBIPvYJxnAFfOK1OFz7HAqWjWx13jT476Zc/DGPQoLERTyyB5XAyGGR34xXV/snfDvwP401+e41vb9nZctGccr3H4ivlXxj4c8QzzrY2kKRaXKm+N+QRg9OlfoR/wT2+APxC8c+Jft/h/TmvbCwIe5cg7SqjJA2g5rycdiWoM6cRi6UXqj680L4P6HqXiC01rWMJYaGFNjbsPl3x58uTrwR06V7lqV5qMs0F8Lp0fzfOTaxwOOn0zz+lfYOs+Kf2ajqf8AwiXinS7rTLq3gGZWt3SI8Y2hm2jrWPF4U/ZR8RWMd9pHiM26THyEOF4lHVfv9Md6/n7iejiMTiudvyPuclzXC0qOkD5fs9a8ZJABYapIsrXBmyNx+bH16e1dHp/xN+KXhe1lvNN1N57gvuwcjc3pt5r6b/4Z38BM/kaP4pQsiAkFkGF9fvVZ0r9l3yprS+tdVt5o0l3585DuXoMAE8+1fKf2D7VunVVzqzbHUK1H4LaH6OeGNc8XL8OdI1zVLQB7m2iFwQC2cruzgLnrxVO88fW/mR2g0/8AdjuylT+qjFfBz+If2zPB2ul9AuY7mwtt32eEyceWPlGcKccdsV1L/tg/E3TGUfErwPbXMoA8y4UyMQOnAEeK/CuNPoqVcXWeLwc0m+h/PmZZBP20p2PuA6jpmtqsEMaxso+ROoPFcrf+FNRIFvf2qMTyhHGcc+nFeVeDv2lfgr4nSI3QvdGus8xravj6jO3ivdbXxz4JMB1S018TRwnOJSiED/dLZr8C4k+i5ndB35bpHzGJwNWD0R5z4xvbL4baa/ifXf3NgmBuxkk46Dp9K/mG/bw+LV18Zv24vDus2NsItHsY7iYyDnYqxkDI4+9X9PnxJi8JfE+x0xdX1AXOl2xkaSFSNsjYJGcdO1fzp/H34feBpfj744tfDMQll077OkSEYUx7cuBzxx/Kv64+h94eyyfESqYmlaR24HLZVLO1j8iPjX+0HqXirxTff2PqUtnZxylEZVLfdO3gcCvH/BvxV+MPiq8fQfC05u4oI5JGZuMeWCcd+wr2v4seHfBcs0ui6RbyW7JuBjCcbyeua9C+DXwWg8BeCr3xBfL5dzqTJ5S9CFOFI/I5r/Q+soSWqPtsvyWr3PkS5+Jvi/Wbb7J4r1F7eZsqqRjJ4/KvTvhjqnirTNXXVrHU3nW3j3BJPl3EDpjNcv8AEv4fw6B48+13EJaGXG105C/UdvSvU/Bmi2HiK5j0DToGknL7fu4BXHP6V5/tKUHsezUyerGLdz7g0iNvib8Fz8TPGEH9neIrWQG3CDKSRDkc/KOg44r9Af2QTqnxn1DTNJ0q8j+wvEsc4LbXilPGffHXtXEp4C0mz/ZYVL1/JbSYo5CoH8KKSc/gK0f+CV/hnSdcuNb+Lerym10uzlZkKnCtIAdqgZHWv57+kvj4rInbc+Ix+TKVB1pbn7ZfDnw/qvgzUL/4d+J42uYLd/MguSTuKAY6f/Xr177NeSW4XSrxo4z91Avp6814iv7S3hRbaPUCPPnlkEAdRn5SeOnpUWv/ABd8MSXa2+j3q+e2BIuQBn068V/i9nuRZjVxEq1KNj5SNDW1z6G0PVvFml5TX5RLCSNhXB49/Sviz/goT8Txo/wLt/DlnKyvqc5jcEYyrqT/AEr6D+H3i6w11J18QyR2KwNhCTwR61+Ov7ff7Q/hL4nfET/hX/g+8W4XQ4FMhjIKK6fL29c1+3fRwyXM6ucp4yOkfI9vJMKlU30PyjvdLufE3jC30OzXKsVgUdefSv7C/hJoVv4E+CHh/wALWbqpS1im8scYd0yR+G2v5iP2NfANx8Rf2h9JinizDb3Czy8Zzzj2xX9NuvxWOnIsOlS4eyPlsrcfKvA+nWv0v6TniXRwVaOD6HVxHU+ydQupajd7V1JCuB/Dzn2raj1GdAqSoyL7cV51YeJNRkSKBtpBPyvn0HTpT/EXxA8W6ei29hZRXanALbhx+hr+Vso8SMHU+JHxkZSR7KmuwWsZt7afbIcFfw/GpIfGiy5gu3WQt8pBAAPpXh0viQJDDPqNkI2f75UE4/lWhaazoU9yq20Qx+Rr63C8VYWvtKxops9cvWtrSMxSQIkbYJIOcj9MVZ0/TvDupcwM0P8AsheB+NeRX14HvwGuGQf3ByB6c/8A1q3LHXPFEE0qqc2wXjp6cV9BhsXQn8MzdVWtj1U+FtSt7VnsXFxC33WJwas2OpfEa2j8iaPIi+4FPGPyry2y8favaWqR3Y2KhOB/nFdBp/xCzF9st7hju6A8Diu6mpxf7to9DDY5JWZ3M/jjxLaSNBqdswLDkrnt7VqaJ8SNLktPIv0EQJ+9znj8RiuFi+JOoCREu0RxOODwcCqF/e22WjWzDqece/4CtIxxqd09DsWN0se62fjLQbq5WC3eOZTxiRR/UmuA8f8Aw5+CXxDzZeKNJtrpj8uwKFU/U81xtrpWj6lGovrbyH6Dbn/61bGn+HobeR2sL7ei/KUb5QMfnX2eU8QYqguXnHHFuK0Plbx7/wAEwv2Q/HSS/b/D6WQccPEd20/QCvz2+In/AAQU+F+rTNdfDTxdcae7ZMcfkADPplmAr94LGz1tLCV7OYNkcDr+tcmupeIdPge21WEEtyDk8YNfWZf4l4yheNzSGauOx/Lt4/8A+CIX7UHhff8A8IzcR6sMcFmRSR24FfAPj/8AYV/ap+GdzJb+JvDUxVOphDScD/dWv7cNK8eapa6x/piMsQPLdRjFdVqvjvS55tqFLtCOUdBj/Gvtsr8bMdSjrsaxznVXP863XPh54v0W9J1bRryJ1Y8tC6+2OQP51lQrqO9gPMt16bd239M1/oW+Ivgz8CviRbE+KPDttJvXkYwuT+HavkHxX/wSw/Y58cSyu+nx6bOeQ8S7sfQZAr9FyHxyUre0OuWawlo0fxgaX478UeFoMaHfNHOnP+sJI/8AHsV7X4f/AGzPjjpdkmn32rA244IdI24+vWv6CfiF/wAEMfhtevJd+B9fuY5H+4vlooPt1Pavz2+Kf/BE/wDaA8PB7vwvGmqQx9nkVTjoOimv1LAeNeFbULnPehLRo+L7X9q3wZ4hDaf478P22qr6n5P1ArNm0j9ivxZfRarq2j/2bNvVm8rc3API6gdOOlcn4/8A2Ff2jPh5I9vq+gXEYTqYlZx+i1846j4G+IfhkMt7p88ZTrvjcY/Na+5y7xBw2J9xSuzVcPUKq5kftJof7OX7GPxW0u3l+EfioeH7jy9jW0oSMO2PVnWuK8Rf8E3PjLpUMl14Cn0vWbNfm3G9j3kHpwu41+MO3xDCRcLHMvQ8nbz046V3XhT4/fE/wBqiQ6JqtxbFOW+cnHHGK+qwnEkeXXRHNUyJR0ifoV4D/Zd+LM/xZ0nw9498MtHaeaJJGRXdNsZyeQvPSv0H/aI+G/ghfGUfjfwNDIkliBFHE8TqFGACBkduvSvy7+HP/BTn9pzwZAsB8QPexLwFlVcgZ9cZ4r6I8Nf8FOtcvJnk8Z6Pa6q0x+bzWK9euMLXyvEGAeYR5YS0POq5RKOx9iX3w08Falodh4g1LUpb2+uAskkMi7I1wR8oJOP5fSsDXfhz4R1HXIdWs7cNHb7YpFDDHrwR0/Krvgn9uL9ljx3ZDRPiTpY0mPGFe3UuUPY84HXHavrfwl4K/Yw+LWlf2X4F+I9xpcsrLId8UUYLAdMtJx0r4WHDFahNM5KuEnKNmj+V/wDad8PTf8LT1jRfDKO1o1yWJ2n5fRcjOa8z8NeE/EkWjS6B4c06a7uGyZfLUkD8a/rvi/4JWWOutdXsfiu11K1um3LKJIS5Hbhcn9a92+G/7Efw2+C/hmfR9N0YajeSAh7rYWPPHGFPbivF4z8QKmVxjH2HMeMsjTleSP4g9Q+E9xqfiO08JWUhOoNGryx4xsJPTrX3/wDA/wDYt+Kuv+GZdGh01THy8ckp2sSO3Sv6GNU/Ye/Zi/4TG18beKdKNhqMTqxRk2K+w5+Ykr/KvU77wX4IsLa5vdLvnggtcywpZoJAydlwrcV+WZ5474mUFHDUmn6HR/Z8Kb91H8sXxc/Y68b+A4rae90mW61CJ9+xckYHvjtU3if9m/xDrHhtNT0NVj1uytlu7uB/k8uI4HHGCfbAr+jS2+Lfgu5fyNWt2eW7byYEuIwJQR3ZSOBxXlmr/s2+FvHPiC41cavJFNe/uZLaMDZIBztPIwKOF/HKtUm6GPoteZ6FKMLH4VfBj4LeNdH8X2+reL7eS38hVnKuBh0YfL1xwa9w8ZeL28X+I7q/l2xfZ8QoF+6FX8AK+p/2j9d8Y6fa3mia5otsmqabELTzkYDNpF/qjwOvAr4u8G6TcafpkGt6+ji2Eu6eNlO1kI4Pfviv6aynEZe4Rr0ZatbHNVSR+jn7OXhrVNb0WK2tH8vKb2lOBlcfpWb4+u9T+Hvi1be9cPDcsQCDnoOvSvJLT4w+JdN0AT+HbFYLG7Ihh2nBCLj2HpXvOiWngHxStlqHiXVpmlt03PblNysSMY69uv4V7tNc3woVOpGOx//W9G8P/tC+GdaT7V4I1eXTpm4NsFAjz6HNee+If2pvDUXiE+HfHWjQPdL0uFYsTjoRtCivy08KeK/7M8V6hYmR8b/y5q98YvEnlXWm6lZBzl0y/pyBX5V9YV+Zn7kqEFsj9HvF/wC0d4i8G6auv+D72W+09x89tKNoA/u/xHFZWkftAx+LtPGo6baf2PezJuSS3LOpI7EHAr5AOp63rfga+kTGdhwPbFeWfBzxB4gSJLbznGG8vA525OD+lRVxnPsgdGPY+19A/ar8c6xrM/g7xqiX/knBEmOUHPZe2PWuN+IPxY8Q/D7xJaaz4X1R7OwvHUeSrdCeOM54/Cvke/Sew+Kk0s1848zOFJ59K6f43/YZtA0+7GWeJlyfoR+VRCbuTD3dj6e+JHxOl8Z+DpNRvbrN3ZEuHQYJwOPu4rE+G3xht9c8NnR9Td7uKZBHIj5ILHv68dua8T0HUNNuPCk4J3PLCT+YxWH8EdZuPOMFsgTbcY5HYcUqsrO5pKqnufbP7HHjrWx8WH+GbTyrpNxNs+zsNyFCehzXwF8dPDSeDvjXrdhbB7a0lvZURQuFILkgZ/Cvr/8AZs8Svo37VFrGyZMsqnH49OlUv2w9V0jU/FeoadY2WLm1uJJF4zkhu5x718PxtRU6XNyn5txRlzrO6R8z3XhDUbrS7TWSjyQIdu/HAHpXX22iNeQDULZGRLUZEgHU/wBK5P4a/FHx00cmhajZMbTbgRkcZ9en6V7nZy6lqOhSw6diHys70OFr84weW1Ky5aUfkfEfVfZq0jhPAfgvSrbxRaeI9Rm895GOUdcL+P0r74+Pn7Ldl8R7K9+LPhq98r7PbQFYBzHNgBdqnIzj6V+V3xQ/aP8Ahh8EtMsU8T3TXV6swZoYxuGM42nFfvF+zho3iX43fst6N8ULGFrSxdZPJtWGMgEYOOP4Tn8K/YOHeGsdSpKVeFkfsnhLxJPBzce57/8A8E4ftw+EG3VbL7FJa5BVh17ccDNfTfjjxQtjDNI7AMwIAzgV51+zxqo0z4VyyXUflvvZcYxjaccV554y1qXU7lkkX5RnvxX3UsTCNPlXQ/R61L61ifanyR8cdR0/xZpdxo+rRbhco8ZwM8EV/Jf+1h+yz41+F/ie61XQLSS70mctJGYgWK/gM1/W54ys47uQydl7Cvl3xvpOm39tLb3FpFKrDaVYcYryqWfqi7pHu5twVSx+HSsfxh6H4k1Lw/qYmMTRSIwb5kZeQen3a9ys/Evxl+MF+dG0tLl7dzjAVggOOucAV+3fxD/Zx+Ct7ffbtR0OBcdduev5ivqT4W/BTwdY+HbOPwXo8FtuH+tdSoP8xX0L4pi6Z8HHwm5JpvY+Rf2WPgLqHh/TdK07xMnmSyyxb0foc8dDnrXzt+3x4N1zwN+0JH4c8AQvhLOQyW6ZABDDnj27Yr9zvA3w+u9O8c6NFqHlBnuImOw5AAcD0FfiL/wWF8YeLfhp+3VBd6BcSWqJHIZMYwyblBA49KnLKzryubcfZYsDhIKkrHxx8KvBv7RPi7WFGlWrzeY25k+ZSqqeuK/aH9knxr+0d+yH4lt/HBtGutJc/wCmJblpSI/4iUAOMV+X/wAAv22r/wCHGr33i2e585Zd0YjYDkEdMYrqPCn/AAUf+Jei/EzU9Ts4AdKv4j/o0mQnIx2FfoMFRjRUYrU/EJ5rXUk1sf2XWXxw+GHjDwP/AMLL8Nzw3LatAVa2VhvilPO1l4OcdsCv5VP+Cznx6h0aGz+EHh7CXV8gvJgvURyjBB+leJ/DD9pvXPAfxVl8aaVqs0OlTML64sjxF5o/u5ycY47f0r80v2rfjZdfHT436h43Nw06ldiZ5CjOeOnGOMU8nymLqcyFmmaurDsfMc6bLFYoyflx1PQelZz4ji2R9TVq5ZA+SefSs2IF5M9q+qnFKyZ86qj2LFpbgNu/pWm8jiIFWxVdcKnFRb+ielWaG3o1x5ErhO9Zmox7pGz1YcD/AD6U20BWQsp69qnmj3AvLz6VbrJLQD78/YO/bL8YfspeNLrXvDdrHfQ3YYTWcjbUk+TAzx26161+0p/wU6+Ovxm07UfDtvapoGn3pO+K0k3LsznbtULjpX5h+EPCuveI9eTRvCsby3cpATau4bj0Bx/hX9EX7Jv7HH7Mvwb+HOt6v+2VPdQa5eWbmGFYQY1Z4z5ZDEjPzEdhXwHFPHmHwTjTvdvSwKMtkj+awBtUufKifpliTXaaLoz2swnkUS9h2A7VpfEnR9G8J/EzVtE0WQ3Fik7GBhxmNvu/THFZWn3N4SUs2+X/AGuK+2yivHEQjO9roNYuzR1817qcso0CwAR3+U7ewP8A9av6bP8AgjzZ21r4B1/wqPmkMqPyMDhK/nB+HulWtk8l9eHzLmQHGR04r9r/ANg24+IekaLrHiDwx5qWcQxNMo+QHYRivR4hr0sPhG79D1MkwFSda7Wh+8GqWeh6Irf21fRW+OQFYE/lxXhPiL4+fDTw4zQw5vWTjBXAr89tf+I9/ext9ounkdycOWz+GK8putdurwnzzkD9a/A8bxNPaB+14Lh2l7K8lqfpPpf7UlpfyNDp2jxbexJ/+tXpujfGye/i3fYo4D2Knp+lfkZpfiC8s7tBbDb9K+i9L8ay6fpfmXbH7vSuKGb1bFSyulBWP1x+A/xk1G/8V3vh69uMZh+RVwOo6cDmvcfEGYYPIB4fr61+C3gn9oQeEviRp2tPKyRtIElPbaK/XTWPiPb6rpsOqQS70ucTRsP7pHSv0zI+IrUEpn5NnWTxde8T0LWvGtj4D8MyNakfaGU/L618qeAba98feMGubnOC3mSsfuhfSuc8c6/da5db4SWRP0ra0rxtY/DX4f3GrzcT3SlV4weKwr53Kc/IeHwEbctix+0h8URfXUfhTTX22NmREoU8cYzWX4G07/hJ73S/DViC8JO5zjgcZ/pXyf4ag1v4v6497ki0ifc79v6V+kngTRtH+G/hGTxP/HsCRbuMnocfhXPTV06jLnJUpKmjyP4wXdvf+MRbwndFZoFA7Ar8tedaRpcmvaytqq53nA9qvavI93LLfSffuGLfgWzXqngnTYdH0h9anGXC8ZHTPFeFKm5S5pbH0eErKK5Tx74j3L+LPFNh8I9G4t7X5rpu2EG/H5qK9A0zw8l34ksLXT1xbW5RUUdMr1/lXATeGptR8Qya7YSeXOzHkd/avbfh99s09n1nVF2RwYLN2ArLmbn6Gk6y+GR4L+3f4+MPxK8OeEkf93FA4K5/uD0rw/wJ4iQx3FvOcBuRXmv7c+vyX/xv0bxnYOXsZo5djdsnjFcPZ+OLOztBPvCkr2rlxVdSd5H2GBwKlQXKjvPiL8RU0e0NhvyOw9M14r4LhsPF2tLOkJ37wCzLx16/lWDJqUfijWDeXmTErDjGeK6Txx8VtI8B6fb2OiwD7TeEQwqg+Ys2FBxjtXn1E6miOym/YU3c+3fhL+yZrH7QPjK30iC++xaZZJ/pEm4DgNnAHuBX9Mf7Lfij4KfsleF7fwH4d0uKyjJAe/CYM5A5znP86/IX9j3wX4i+En7L/wDwmmr/APIa1xlm/eHmNGHTP/1vavpTwl8QdH8YeD5PDfxGkiVdh8qcn5oz13Dp0xXo1+GlUoXi9T4LFZi6lWz2P0v+IniL4IfGjSr608S6ZHdWrs2yTaQ5z6cdPav5cfjP4GsvC3xH1bRvD0Mlvp0NwxtlO9MehGeK+wfi/wCM/jr+x0sXiPUbz/hJ/Dd6ubSUtuCEjIX5R8vHbNc1pn7b/wAE/HWix6r8VPDFu1wSBlVYk5HWvyDOuH69Od4n6Xw/mlBU0l0PkEat4rsZRPZahNFJJEEdskjjp3P8q09H+JXxS0VbdLLWbnFlN5qgcfN9fT2r7Ae1/Zp8eKuraTftpDSjdFGgC9e2Ca47xN+z1q2n6auo+Hr+K9hlbcNzjeR2G2vm/wCyq6fNY+mnmNGsrbHmOnftYfHrS5bzytclBnX+I/cbOcj24xiujX9tv49/ZbKOa5M8ceRKxIw4xx/DxXk3iPwB4g0CSW41fTZmMmAvlruHb6VzslpZi2itSjx7Ml09OOM0ozq0XzWPOqYenPY9w/4bX+LdvBJdXku6UPmJvRf7uMeldr4O+Mln8YdbvG8TWQtJYYl/0hCxycZyVBQDOMV8Y3VvDdgRRL8p4UY5HvX3J+yr8Jb/AF3wxqvihYEmtpEAuN3XahA+Ud6yzXiT2FFzlDZHzGfwo0FzWO98J/F29sC3h/Qr8m3jPCod449fSvDfi/qif2pc+PtHBSW4XbcyDqxUYGfT0r6C8d/CD4feD/Aln8Q/Dl2bZ7jzPMs4eZN68KCuc8nFfIX2Xxl4l8Hzax4j2aervhLWT5XkXIH3SF+tcPAPHUa2I5aUbX8jwKGaYeS93Q/P/WfGl9498fDT4gEitzueQKPyPArt9e+JV1pmrx6dqLCS2twNiqQQMevAxVPUPgtq134lub/wvcfZJCcsvTgehrzTxBbLoN7JDrEAnnQYJAJJPSv6Ypu9PmZ9Dl1dyXum1408RW3jWQ3dlbhSF5Cjg4r0f4DeL9Ki1GNTaLHcRMFdsfr0ryK00vxLqOh50qzW0Dfx9wPpXvXwP8DizRby7+aeVsZA614WMjea5T0K+LnGLufpN4yuNV174VQeFdPR1bWHjgcxjpE3yFuPUHpitLxZ4t8B/svfDO1+Eegx281oYv377trGfHUgZPtivafBPxX8FfBqLTE8baMmoCeJUQMpynHXg9vwr59+MPwK+Cvxl8VS+LNN1e6shLJ532cABS3XHJyB2r8a8TuG62YxjSqfCfmuc+1qQcYbHyv4c/bL8QeDVudNsoy1jOxERXna2Meh6V9YeAdUuRpVn401+2WRboiVmuGKAZ/jz/TFfF/x3g8Lr48sPB3w/wBBW0t7aFVnniXCySj1Pqa5zVvi78TPEXh6fwBFaSS2en5i3bSEQY6Zxzjt0r+fsz8MoxfIoHxkMLWj8SP09vvF158YVvRFr6+HdMs4WzJvEauF4wmSM5FfhLrfjHQ/hj8VdR0zRrw6lFcyMpuHPzsCeo6gj8aofHD436p4q8O2vgO1j+zW+mgAhSQW29ckY61z/wAFfCHhrXryGXWZQ88rLtiPJx2UCvruG+H45cuaUNjfL8VKFU/oG/4JUeGxqfjLU/iBgC3islMZYYy24flX7Ia1piXUn9os6yvMCSqn3r4J/YtvfBfw0+G1p4blsTb3GoMYVZVz155I+lfemreF/scbNAzom0ZOPx4/Cv8ANr6SmHq4zN5VEttjvx9fnl7xRa0ubaOFbZEZf7h7VJpkNteXcy+U9sRjp/Sqf+hyadDNZZm2/wB8beRU1++sxW8F6Zth5+SP7oGO9fzhLIZKnzRjZnl1VbRFDxJrD23/ABK3v3SLvgDd+FUtJv7GNP8AR03uP+W78Hng8fSqdzpt3dL/AGtPbecp6M/ArQ0eOaSPdNDCEUEZB9RjpXLSw2JhsZ8qLqafd35lih5jTBDhqdNca5p6Kthd8jt349qxoIRayNb2dzgvnKg9ahsr9rSU/wBtbVZfuY6ntXfDMsbTdoOwS2IJ9d8bXMiyuPPh6MhP+Aon8XmG3ewurVVaMfKRn8f0q3Y6rZC5ZV8xVYHkduKit9Lj1DT5N826Q5xvIH9K7ocXY6lpJs5eV3ubC+PNLl02ztbSNg67dzBfcflXrtj4m8Oz3kVpb67YrdEDETToG+mDXyR4m8PfE+DR5IfBEcX2ho2jXc2ANwxnOPTpX4+X/wAAf2jvhp8QbzxX4ms3vbm53GGWIs5VuxC9K/qbwn4gwuKof7fU2N4zaZ/TPcz6hdSYF7G4hOCqOrEn0G2p7a5h0+BpGgmcucn5ePzr+au00f8AbG8FvL4t0rX7zfIjTyW6kfLgdMY4r3j9n/8AbM/axk1vT9K8elZrKeVFdp2xiPOCfu9R1xX6Lm+Dy2nhXi6OJTt00OuGI1R/QDp93Jqlor6W/wBmliILxs3aug07ULzV1kimiExRsfgB9K8jb4kaV+6v4rWEwNGDvU4JHTIGP0r0DTvG2k3s1vJpb+UpUZ421+a5Xx7hMRVlQ2aPYpOLRavLHStRiNs6mCQcEY4rz24+Hm6VZbeTb83AB6/4V9AXljpWrsJnkWJ2XAOfl6etczN4f0+y1MQqZA0K7jxwf93mvqcPiqdT4JlvDxtojxTUdA8W2QOnpuXnPtj61DDpt9pUBuru4bzWxsx2/wAivom21G5v4vO8sFA2w7uCQK3LDTdB1Dz7aGKPcEyA2ODX1uAy+8bqZj7E8UtfH9/FaxRTxiRk4XdwP5VKPG8xmHAEp7Ia6O+8CrqG+Nk2HnGOFGK84n8Hx2oEMkvlSqc7v93kD26VniqdSm7xZjPCy3idH4k8S2Gr24s9ZthLgYO6MDr05xX893/BXz4qeCvhvqmjfD3wToNsurXIBmmQYcDG70I6DFf0Cazfa3punXV1cxwTWdlAZJZWI/hQsOPYgd6/h/8A2vf2nW+Nv7Q2t+M9Yt/9Cs5XgjIO4AxHbgcDtX9K/R/4exGMxH1mb9xGP1ipT3Z5tqXxGjiITxL4fhuUCj73/wBYVY0Ww+GPxF1618J6fpJgur9xHEsMZPzb1Xr6c15RB8QtM8QStOUURH5FyM9eOlfsJ/wSs+Evgf4gfEG5+JOuSSPa6IMCNFDL5jqSP++SBX7r4n5nRyjLZV/tdD0KOczjHQ+fvih/wSA+PHhO1TWNDginhlQMojf5huHQqM9q+FvE/wCyL8ZvBEjQa/p93Hs6lY3I/lX9wFv8RNEOoMgkkWHcAcjn0FbWr+Jvh5rscuma3ZQ3iR4UtIigHPToP61/EmQ/SWxtCpJV9UvQ5ln2qbR/AXqfhnxf4VjE129zGo/voV/nVOy8X+J7b99BGZFHViWX+Vf2/wDjv9nr9lXxJFs8WeErUrKD86IWI9+uP0r87vid+wD+yLqqSXOma1JoluGOVhCqR9AzY4/lX6vw99KLB4qoqNRavQ9SlnsJaNH4B+A/2rPjf4J+XwvrV5ZKvTZISF+mSfp0r7z+Dn/BXb9qb4e4Opa9LqSL/wAspSBx6E7TXpnxD/4JZ6DbafHqHwp8Y2eqRSL5g8+eFTtHqAfSvgHxj+xZ8VPDmrSXcX2a8t4wSTbSiQenQGv3j/W/KsZRjObj+B306+HkrWP2k8L/APBafwV45iFt8dfBFjqAcbWkLMWC9zwoFfZXwi/4KBfsIT2qWPhOSfQLmc8o0PyBT6Fmr+SOf4ZeKdGkJa2dOcHeCBVWKHxBBIReplV4GcjC+gxWtGrkFZ6xg2ctXL6Utj+tT4u/CvwB+0Lr0Hiv4S+J9Ngul+ZJp7mOFifcZwKwfDv7LP7UGi3Ml8bixvjBhoja3KSCXsTx04r+WLS/Eeu20m7TfNtzG3Xc+eO4HSvobwP+2z+0h8Np0g8NeLb+1WHG1BtP4fMDU4/gnJsb8cYx9Dllk1tYH9HPxq8PfCPwroMZ+MvhS6l1e7hCXE0FrLNtAx/EgOfyrmPgt+x54N/bW8JBfh3LPo66fIRtki8otGvygbWK4r82/hx/wWR+PWhhYPiHZw+KY8jK3bbcr6fItfoz+zx/wWw+DXg9WuNc8DwaBI5PmfYI3YMD67uuK9/hzgzB0p3hU2PMxGWVEemeJf8AgkR8XNBiuXiEV/a28I8iFnzlh3+X/Irznwh/wTu+Jh8KyXer2Umm6kr4QRAsAM468dvav1o+GP8AwWC/ZL+JaWsFvqUljLJwyzBY1HHfNffnhv4+/BbxlYJd6F4g06ZGAOBNF+vNfrmFy3DcloS1PEq4aqtkf//X/Ja/1XT4PiXOkKbfOzxjHaun+LV1czeC7GSwiw6uvJ6cMK4r4kWcVp8QI74Ns3en0rufE0C33gV0eQ4hIHT2zX5AqMpL3T92Veml7xqeFL7VLnR5IWOA8fbp0ryf4d6zdWmrXVkjNE0dx1XrjNemfC28RrVF5kjWPaePauH8PaRqVl4w1HVLiMW9j5hbzJMLxXs5dlVaquVRPJxmbU6aumRePAkXjyzvpC83mYQE9yT6V6D8SY5L3wLIqRxr5XHXDDFfO3xN+LXha516BLBJpmtXGCi5XINdDqnxltdZ8NPolhbQNPP1Nx8uMivpaHAldtXPm6vF9JaI9K+HNqz6JD5/8VvjgiovhlqFrpfiO6sQJDsmyMDr7V8mXPjD9o/SVS18Habp0sapsUqWPH0CntXn9joH7Sd1rLajr922mB23MLZ2H5AoP517VPw5nLc82rxpTR+0XwUFvZ/tN6TNeoYkUo7PjoD+XSvqHxevw11HxjqGqXiC/MlxKrbV3Yw3Ga/nR1/xr8WfDGoDUNG8R3slyAELs2NuKwbr4wfHnRot+n6peeZdNvDxtkbsdzRivDWNRKFQ86txcpqyR/Qv40+OPwJ+EipLLodtcSOgCxFARkf3q/Ir42ftfL4i8VXcXhO2TTEkJ/dxDC4r43174yeM7K2K/EC5W71SRc7t2cA+tfI+reLr1Nfa+Zv9a3Ne3l/BuEwkbRiro8HE4v2r2PQvFN9H4i+KFnLrsrPFNMpdm5A5/pX9wf7Nfxysbr4DaV4e0CREtLSBFREwMcAHGB3xX8Huv6kLyzjuo+ZEYNuH1H8q/oz/AOCa/wAXY/E3gOy0u7uNxRMYz/d4ryeKaacUj9F8PHDn94/o38MahLB4Ph0+M/I7M3p1OelcF4skZPkUgcdar6L4ktF0+z2PhRxt/CqfjCaKTBByGHavyfGU3Rbcj9gyrExeIsfPviW6VQ0cfU18xeK7iWyDM/Oa+gPF+ow2ETE9BXyv4g8X2EjP50byquSSB0Ar5uuuZq597/aHs1yo8R8Q2qa+7RbgvbBql4os9e17wxZeGrXxFdaTHYlWUWrfe2kNjt6Yrd/4TD4Zawpa1naCUnaVcbSDXQaD4Y068eW6trhZ/KRmC5z0U17GGw94mbxVSS06HVX/AIs8TeA/DekeKIjdak1myIXC5duQQSPavkP/AIKQfs2eIf2qNO0v4y+GYt2qw2x8yNuHO5lP6AV+t37Pmg2/iTSVtvE8GEu2Hlhx8vAxjFeg+KvA0Phbx7DpEa4tmj3AADb9MV7OW1vq75pnjZnQhmUPY1Nz+Fi3+CPi/RdcOmeLLK5s3VsZKlV49K+5fhH+yf4v+K+oWHhvwfp8t7O7qryKMoiHuzdq/tI8Jfsy/Azx3pTzeM/DdlqExGVaWME/TjFdz4s8HfB79nH4S61feD9DstC+y2zs91AgVwoXJAJ9uK+nlmyqxXstz8mxXBKoVHz/AAn8Tn7f37MHiT9kHwZZLqxieTU1VMo2Su78Ogr8WZPJsYgYn3Ejmvvr/goN+1l4k/aP+KMmnjUp7rR9KxBAJCMMFJw1fnm6joea/Rcjw8o0udH5PxHSpxrctPZCuDMd5qxCgRaq8hdo4qWJsHFe57Jy96R4VtdC6Dxiq75zxQHLg8Yxz+ArpfCnhnW/GOrQ6F4Zs5dRupiAkUCF2OenHFZVpR5brobuUTn7cOjDn73Sva/hv8EfiT8Syk+jaZcNZkNm4VD5Xy+j1+z37NP/AAQp+PHiR9L8WfGpLfR7HUtsltBI7pPgjOGQqMZr9r/hX+yTp/wiitPgPHbSR2jiZXnRR5UQ2Mck9skYr+cuP/HbCZbjlgaEW29NjTB0vay5Ys/Gz9ha6/Zc+G3hu38H6toUt74vadWM6QF2JRgSqNn0Bz7V/Q18YLX4H/tI/Bv/AIRn4q+DrXQ5kSNbe/KMl3tG3oCQOnX24r4z8DfBH4GfsftqHie/SHUtZ8yR7d2wwiYtjK9cZUmvkD4wfthal4q8Qta6pdT3c0zAQW0XOeflUIMV8ngsi+vVVmVd79D9PwWTQo0VKoj83/28P2TvhHpPxF0/SfhDKUR0PmyONoYoO5ya+YfDn7E3xI1i4U2T2rxHoWfFfff7Qml+MLG40TXvFtmti1yhMcTjEuCf4l7cV1nga/eNrdomwBjjtX6fiOJ6uEpxj2PewXC+ExOvKcN8Cf8AgncZNUjm+IGpmCLcMxwNuGP0r94tE8AeBvhj+zjrXg/wfaxwWwheQyhfncqnU4+lfIngCcTzpnKdPf8Awr7wtLeDVvhdqelW/wB42sqg/wDADk/lXnLiKtj/AHaj0PcxGQ0cHBcqPwOh1W3ktYsn92Ax/WrcGo2cih1cZ9AVP9a+q/hj+zb4c1KUXHiO8mEGWGIMNjn34H5V9yeDv2bP2ddJg80WrXr8ZE6L/SuzC8PSlLmlseBLPJJuKPyIsm1a7m8vRbOS6YdDENwr2HRPgr8dfHyrHYac9vEeP3wKcflX7K+H/DPwq8MRj/hH9EtbfHQrHiuyufEnkJm1lIToEGNo/SvbhkUNjzK2aSktT8irL/gnp8RtWiSbX76O02EHKS4b8PT0r6rufhx4w+Gfguz0tbhtSWAbd3UqvpX1nPraSRgFs+uRnNQC9imhCyZZT/D2r3KOUwitD5qvL3uZnxLp+s6vEokNrJhjyCvWvH/jLr+sa7rdh4ZnilgswdzDGM8dB0r9bvAnh7RPEniCKO7tY/IgbO3HtXkf7Q3g3RNZ8ZQXtjYxKbF+No/Cuh5JNe9HZnhVs1am7M+Z/hD4Q8Y+JtYgsLDT10vw1pyq08jqY5JvTavf5sd+lfQHj/xK+sXX9k2v7vT7P5Yh6nGOleiafqepDw0ILqRhEq8Jxx6DgDpXg80d3q+okQIcdCeg4rPNKCjTUEb4Stz/ALxlfQdDbWNQEzcooxjHTFeieI7oWlgmnWowAMYrpdD0+LRdMJVRux19K861i+ea63OeK8vERjCkonv4X3mmZGm2z/eA5BzXsl7prWvwwvIZflN6vy+o5HFeX6JBLd3aQxc7mAxXuniW3+S20YdIQG2/TnFY4GlCCcpIvnjKrZn5eftV+ELEfAbRL2OL/SrAgE45+dxX5u/b5kcJJwqqCc1+tX7auq2ug/CyHSbtfKlmkj2p3IVx0FfEnwi/Zc+LPxovvtmlaa+n6dtH7+7Hlq3pivlcfQlWq+6j9TyzE06VFXZ89XPi+4srUxWKFZCOBjk/Svqj9jn9lHxD8XviPa+OPHcbfYoZFkiWTvt5GB0FfWXw5/YSsfDeo+f40ki1GVXwEzuQfjxX6rfCvwrofg21aeCOOK2tYSMJgAbV9PavUweAcY80uh4md5nGfu0TlP2j/GFh4f8ADml+AtJYRpbxRo4QYAC18p2Vprnj/VItE0tvKtYcLJPnaig9fm/Ssbxn4hm+J/xHvJhPiwsnKyydF9lHrxXX2GoXF+Y9O8ORMNNg4XYMeYR2b1FdtGa5kfM1sPaPNY+7fDvh3wF8QvhVqn7O+qXYvTNbNLbTScp9pxtXY3t6V/PJ4v8AD154B1288A67lbvTLqW2bH/TI4B6cZHav3e+B3ws1afXrPU9SnS3KndBDE/CnqM+lfjJ+1A+o237SHiPTNYkzcLqdx5mMFcBsA/pXl8XU+SKaK4dm1VcUeatqFyPEFrHbTFfs8YZTnofSvV9A+MvjXRdSuLtr1pgi4RWOFFeIQNZv4kleXJWNe306VNEyxadNcxYKvIeD6emK+AjUZ9e0tz7z8Fftj6voulLP45tY7xAflXG4e3avaJPjZ+zR4ys47rxHpS2N3fKB+4Tp/Kvyrmab+yLdDwZDgDtVq6E8V/aBF+4P4Tz0rqWGhV0khrHezXMnsfppf8AwY+FfiGH7d4P18Ryj5lt3cISD2xz2r72/Z9s9C8GfAG/8G6Rcr/aSKxSSUgIWJBALV+Ffw18PX+pavceNddums9LshkzAnc56bY+g+vtXC/FX9srxPpsreGfBs7xaYGxHMfvNivssv8ADOjiqL+sK0WfnXEvFEqj5D7i+IB8c+FdQvfiH421CC3s1fc4ilyI9vA2cYyWx2r438U/H21s/iadV1W8udcnufkt0vFwqIRt3IF7AH07V8N/HD4x+NdauLLwjqWoTPZXRLMhbhimGyfy6e1eb+AviJf+LfjGNc1WTzI4IXit0J4XCFeOP6V6eR+FuU5apTgldHx1LEyUkz9ffC/jfRb3Szq28qZF3OewzxgfSvmz4g3ekahrf2vTrjO49K9D+APgyHx98ENR0S6kaK8jb93IDgjJJr5C1z4N/E+z8RtpyXZZYjtBLYPH4VyY32fy6H6fkWZVOW8T6k0ATarHHYl8RcZPtX1V8P7bStCMd6UD2tth3yOmK+YvhZ8PNV0qxVvEdy7ccjORTPj78VrbwJ4Ems9Ll2zTxmJAD/e+WvKw0ouqoo+hxlaU6XM2fQ/g79ovRPiv8Rtd0nXXMdhp4YW8o6LtB6flXc+H/i14YtdRjsb6eKfjKYbOR2r8KdO8a6h4N8E3UkbFLy6t5A5U4OWHWvqT4CaR4c+N/wCznd317qEmm+JNMu0jtpYzhiAvf2zwfavoM44TWMpXhufAf2zKnO1tD9ULHxF4X8R6lN9q8uDY2UIwMe5rh/H2lxaF4T1C/wDC+oEw4eWUAgbjivg74a+N/GGg62PAHxTREv5v3NvfE/uH/unfx+PFfpFD+xp8W5fDyXXiV1/s+6i3JLC5KOpHUdPl96/nDivAYnLq3LOF0epSzSjUjqj8dfEHgrU9Z0y68QSTkiTJUdznpxivcP2Y/hD4jtvGujeLPEMKfYo9pJDcgdDxiup+JXgLxP4S1uPREiIjt5RuA/55AYHavUPDHja8sbN7DTYZJYYFywC5CgD1FcuDxNKcffX4HVDJKU1z3sft14Z8c/Dy30uOz8N6t9neJ9wZyI2Q7f4ev/6q+zPhF8ZbGS7l0Xxpqlve28kQ+zyiQM2/3wBjiv5fB42hkvRFPuySCpXtkfpXd2njzU7GRX0W8eKTOPkbAAHSvguJPCPJc4vJpKTOKvw7C+kz+sibTpLvTXvdAe2mRBk/MBkHpxXN6V9gttPkj1Ti5YfKvG1ef8Pav5e9H/bG+KGja9/Ymn67ceZB9+Pfwce2K+0/BH/BQPxLpTx3fiS3jnyoVy/zMfTAr+cuKvokznL/AGCr6Hh47JqsfhP2XlnuYQE1R82qnhUPGDx0rk1fQT4mk0SPzgJV3RsFwgxz1z6Cvmfwd+378Gdf077Br0LwXEg6rHxxz7Yr6T8IfHn4GeJrRGs7+OJtuCZSB24+lfg/EP0es+y58rpcx5cKFRfEjXTRL60dzZCCVR/ePzc8dKuX3gh9WtkGoxxwzpyrKf8APat3w7pWl60st9p99BKjEFTG3IAIqTxDqd9pGpIgtbu7SQbAyx5QA8HnPYV+TZn4e46g7Vqbi/Q09m+x52PDhhhZ4mkEcRAYkYHUDj1pbnQpbq8WPS5PlYcN0Of6V6xDYabaWhtrmVnR8NGp/hPXms86RZxzIbSVTJNxx29PpXyWcZNVpQ5VCz9BexOe0jwt43sLoJqlyjQt91t+Ppxj6Vp3Xhvxjpdw97cSJdqRnt09BxWheaHfSSrpEdy80sPzOY+QBWX/AMJFfmN7VpWGw7Np6n6CvlKWHxdJ6RaIdKNjlY7PTbi6kF5pyj7Su3eV+T05rh9U+B+itALKewt1t9+/zIx83rx6fSvXWuZbW2Xw/fO3mTEOmO3ep1stTsbIpNch/m+4T2rvo4rE0l7NN2ZkoLoefW/g670gW1ppMsklvFFhVfk7M54549K71tbt7ZluJC0MMSDGRxkVoXdjryWaav5sZZ12KYzlQo7H0rirye+VBZazGtzEfm+XkY9CMdq8mLqRrc1ztp11Dc7jTfH8GuobaC+I3fKmOOe1d3F4s8VaW1vpd9cvOyY+8cjb9cV41Dp+k3UG/T7aG3MI3AKcNj1FXdF8YWY82xuElcoP4lw34etfX4DjGtQ91M7qWMT3PpjRfiHPNbs7Jb/upMBc81cj+Juk3+tiMweS5G392M9PfivnXw/e3EF158VrmOQ8Aj5j+FaHxH8R+Cfh7oUXjvW70WpBx5OQGyPQd6/XOEOIs0zHFRwmCiejSr0nufSknia0XUGEjzKqDJTGeP0refV/Bes2uxFUvIOORgY559OlfmAP2xLnxvpd6fh5aNc3CJwkowWAI6cc8V3nwE+LviDxTpt7N4v06LTjpq+a5YFHYdCAvev6mxHh5m9DCwqS+J9DfSCbb0Mr/gq/+0HoX7OP7Ll7Yabcpb6z4iRYrVQcE4Klv/HAa/iYv9aGuxyaVFaRv9pYTyOo/iIy1fo//wAFM/2r7P8AaX+Oc1tfyudC8PNtt4m4Clf3Z4981+bmnN4VgtXl0iWRX5yW4GCeAP5V/d/g1w+sDk0Y8tpPc+MxON5qumxW/s3SYrNNMgtvIOceYg+YE+lf2M/8EjP2ePh/8PP2UoNZl82O818q8nmrgkx9/wAf0r+Sr4RrYeJPiXo3huSCW4M95BmNV3Mw3gkAfQV/Zp/wkM/g3RdI0TwxbTWVjpluqCBk2HcV5JA6cV/JH0zuP3gaMMLT6noUcTG1rHt+sfCLR7vW2WzjkCjliB8uMVYsPgLBe27RwTgR7sqXOK8u0j9oTxM0E1rZbNiAAbjyex7elekeHvjJcXFp9luBG3rj3r/OnKOLsHGV6yOmMqXwzQ7UfgVq+nXIubi7Qw9MFvlA6V5pr/7K/g7xD50Wp2QuIWBO4Dhs9q9cf4hWhH2PxHHKbPIMexf/AK9dNZfHDw3N5drpMMoWFwpRkGPTk5r6vD53ldZ89LRmscLh1oj47T9kT4TRW62Gn6atvKikYC9vTP8A9asnUf2OPCls0UWnRC0jdRxGBz+lfed78UvAc9zJZ3q/Z5G48wKPTj6VpW+q/DnXoorOW/aK4jHynI59PpXuUp1aqUaGKa8jWNCktEflf4n/AOCfnh3XbjzNWVhEPugLj9K851n/AIJ2fDzU9FltUtnhlj+UPsr9bp11y41poW1O3a3g5XMgzgfhVTS7mHXJLm6klkYQscIvRsenFcePx+d4dr6vX1XmdUKaWzP58vHX/BLtoIUbwzds7MvKzHAFfIPi/wD4J0/GO0dhpNjDdxx9WjJb+lf1SjTNSutbk1TUIGFiFAAwCfSumm8I6Bqdml7bXRsoicOEwOg9K+oyDxv4ly23tVex0KtKK0P4lPFn7L3xe8JRyXF/oM5SLo0cbGvGH03xVEzx3MFxb7RyrjZg+lf23eJ/BOnzXyRaTO97Apw0bBec8dMV5prn7KXgjxLaG417wlaZZjukMeWA7enU1+08PfS3r0l/tNM53jpvdH8demabr8Lb9zHGGODyPbHSvavDPxQ+IPhiUNo+ozWoUfdQ47Yr97PiJ/wT3+GuowhvDdvcadcu53qI9qY9vm6V+dHxz/ZOHwWZLvUJDNDOSEcHIGPX0r+iuBfpEZfmNuV8rM5ZhC9pI//Q/I74rwFbuwv2G37uWfiuB8YfHnw54f0m40HaZ5pfu4GUGBjmvmr4hfH74l/F+c2fhDTPJsIfkErp1HYjpXlEXwi1ks194t1M73A+WF/6dq0yPgn2aXtkfS5lxTGStA9Rsv2o/FPhweRoBtlwf4uD+WK4rxp+0r8SfF9qbO6lt0hzllQ9f0Feeaz4P8M6WHMbSMePvHmvMtQsbKNiLdm+navuqOX06EfdPjquLqTe525+JXiG02zQ+T/u1qwfH+4tnVde06Pd/wA9IlyfavCXtkWVn3Z9Fqm0PVCx2ntRGvJGPs0z660/9oW/EYfw7e3MH+xwF/LrWoP2lPFN7EdN12dyvTdnn2r4dcz6W/mxcDrx1xXr/gbwzcfEDUF0+2kUSMoI3HsfarlnMaS1F9Qi3sezvr/9qTma5uA6sOBnn8q5h/H3iXwXdvaktcaZP91hzj/Cvvf4bf8ABOS78daGkunaiYL4j5Ed8IWx0xUFz/wTD/ai0/xCPD+vWP8AoLkYlUYUr2rxcZxVRaumehSymo/hR+SXjfWbvxDrYvbVGIIwTjAH4964bWzdxqqT4zjgCv29+NP/AATX+L/w58AW7eFdOF7Jv3MI13sa+Ebj9gL9qbXtBn8VWvhW82QAsyeV82F645FeRSz+k9T0YYCUVblPhu11VxC0Mh/Cv0+/4JqfFkeFPE9xoE8uFABQfU5/lX5o33hPWLWO8tL60kt7y0bZJGynK4ODn0r1r9mW91nw/wDEzTNXCtHa3QdckYyVVq4s/cKtFSiz1uFq06WIsj+y3w38Y7W6sUUzcLivYrb4jWmr2g2y7iBxX4f6D8TL6zKxmQ46/hivbfDvxqnjKRwu2096/OsZGFSKgfqNDEyoy9ofbvxE1m8nV0thurwmwitiCb04JP3T0q7oXxT0m/i+zXzZcjjNcvrDJfXge0PBzgDvXzOJy5wlex9tk2axqxuzB8b+DPhjqkgujCLa5bjfHwM/0rmPBvwd8XzX3nfD3WYjKp+5NJgH2/Kuh8RfC3xVqWmrqemsCBzsY/0rvfhb8J/Gfh94dYuRLGr/ADFl+59K6KGJ5fdaPo6WacuiPRvAnxt8T+CNX/4QL4lJ9ju4QPLkH3CRyMHA9K+zIfGA8UW9pd3P7yeNMbhzkdfwr5t+JXh7QfFeixPeW6z3sQBEh5cYx34r0H4a29zaaBBBL/rFHU9/QYqsTW5tGeXhWvrDnE++fhT4klwqJwF4z6Cvwy/4Lr/t8aZ8PvBc3wG8D6msurakP9KSNuFibAwcd8dq+6/2lfj+f2aP2a9b+JkBxdiLyrYekrLn36fSv4Dfib8UfFfxk8eaj498c3b3V7qDmVmck4yeAvtX3XCmU83vy2PzDxG4idNuhBnnvmQsd4yzeppfvH0qNZFL+WflH0q3BYX9y5S2gd/TA61+qYauqUeQ/CakZvUrNheKD8hwcj8K7PSfh14t1aYLDaunoSMV9C+DvgRNbul5rwDN2FKpmFtEaYenZWkeS/D/AOEHiTx/eRRxRiG2JwzudvGK/oD/AGGPCnwP/Zzmh142MWr60dv7+5XcYsD+Ajpivz10rQ001I4LZAiDsOnFeqeHfEN7pLFkk2begH5VlRx0ISuTUwzkrRP67fCH7UejfFrRo9H8Y3rK6qEt7mM/voF9EPQccdOlVvi/4b8c+CPher/C+6l8QWhDvcXDnzLkBumcdgcV/OT8OPjnqWhPDtuGGOvPt6Yr9W/2f/2xLzTZFiu7hZIXAWSNvuOPpXzWZcCZJmOI+sOC531OXL6dTB1faM/OL9oH4pXU1lcyXEpSSPkpzuRh8uGH1rjf2V/g14e1aws/jv4hkN1qEsrGBesabHKc/gOOODiv10/ah/Y++HX7Xvhd/HvwTaPTPFPy+bagiOGbLAN8vf5cke9Ynin4N/D/APZ2/Zg8N/Cq8srmy8WyJK1zJjEJO8yfy6V+Q8ZZfXymvClTV43R+iYzi116Cp7H5Y/treIbHxrq1mZ5mlu7JeMD+HPQ/QV458Pb61V7Zj/Fj8Kk8Ua2nijxTLBDby3s9tDMJRGuduAQP8a8Y+HHiS4i1j+z7+N4jG/AcYr0MxpOcIt9j9A4Jr80FdH6x+EpvOuo1gO1So6D2r9BPBuky/8ACJ3SwsW32cmR/wAANfmt8LNVF5PECQFOB+lfrB8Mlgk8MXUUnQWzqD9UNeJl+lR2P0DN6EfZ7H5geAtbvdJ1i9sgfkhmKCMcD15r7K8PXtld2qzRfu5COgr4B028mtviHrtrEciO624/A19O+EteKxiLdyK/ScLi+Wkj8hxMbVWon0tBPMuFJytOlv3i4Y5FcnYakZYwvU0+5vAUDtxk4ANd9Ou5bI56jjFe8b0uqYXLYX0rV0V9R1m5TTdPiaWVjj5Og/H/AOtWr4O+EXibxbJFPfK1payH5S3ysw9q+7fBvw68KfDixW20u38y7lX55pByPpX3ORZLKrHnqR0Ph85zSELqDPNdC0OHwibXR5sG6cBpWx0zXifieWyvPE8sMfz+Yx/DHFe2TXD3Pii5l/1gi+XP0rwW+0ww65JOvzBXJOPc19DXwslHlXQ+SjX5tZGPfq8CvZIOBxmsHRtNbz9hG1c81seInu7eZlThX5rOtJ5ok3TjA9q+HzKlaV5nvZdWsuVGr4huoLG0+zRnGRXjUxMsvHPNaHijXHnuhFEDjpVnwtoOoardKojOCfSvlat6tTltofZUakadLQ9L+G2h+ZONRZf3cOTnHtWV4ll1y+1W4vtPb5fuhv0r0vxBd23hHw8NLtMCV1GccdxXjsXiH7BC0NzyrdqjHVowShErB0Lvmkc5q3g7w3q7W2q+KrRdYmtuVS5XdGD9P5e9d6fi74i0zTF0nTbaG3tk+5CoG0AdulcRNrCbS0RYj+72rDn33A8xh0/CvMjWktj21GVuU5r4o+PvG3imxgTTpF0/7K4kzF8u7aQcHA9q6/SP2hdU8U/DmTw9bKV1TPlTOBtTYeG5/wB3NcsfAmo+JB9quZDb2sZyX+7x3rAvLHRHEukeH9sFjaAm7uD1OBkqDx1WuSE6rbjclYaMfeKnhy0iv4fItz5WlW7fvnPBlmHQ+47V9A6JqU8JSOyBt4G4XZ1ry74X6afG2NUaMxaNa/JaLjBkx3PSveLTTbd7wKBtjJAJ9APavZwGCkrSmc+MxnuNI+6/2bpRJHJc3EZkdIC6sVyBjjmv5pvjfr7a3+0h4yu5zvYanc/h8/T8M/pX9BGv/F/T/wBnX4Cal41u8wJLb/Z4i/BMrfMMcHsK/mbh1q41TxRqnjO8yW1cy3RBHzfvWGDivM4zd5xp9C+GdZNs6S3wk091GcgjqO1VFuZ10nagOTJwcVB4bkjutKundvn7DvVmKSMQQqr42jlT618I8JZXufWVW/hRem1G8d7SOTgKfT2rrrB4rqe68QSR+ZBpoV5P7uMgYrj57qS41VLWNRwB9OeP5V6H45udG8NfD4+C9AkzJfLunfv67f0r7vg7h/6zJTa0R8rxHmPsafs4bsz/AI0fGSTxDb2ug+HALOx8tcRRjCHI+9jivgDxVPLrkVtbWwxN5rLge1d54h126Fkku75rHAx/sj5cV5PoXieCHx1ZCbDJy2Pcg1+t4zkUFTXQ/O277nnfxP1d5/iZ9mZ2KadByB0BZf8A61dp+zJ4dGv3P/CWSIzR27t5f+1zjFeVTXV94o8X65p1vDvlufIQPjBwu7P5/wBK/Q74D/DVPBXgvT9EYfvlkUuR33OO3tXh5m+TB1Zrflf5GNS0XofXvwF1648H+NNe8DT/ALv5Y/JB43ALuJx2rodS1Wzn1yUzBXnDEEYrk/2qfDd/8IvFGgfGDRlb7KUWO7288ygKp/UVwev/ABA0+HUxqqYYTqGG0d2X9K/AcHxA8bhnUh9l2P0bhnHL2Wp7BrPiSPTdMd5cLkcY4xX5sfFLWL3xd4sMlwf9Ft/ur1HH5V9a6xrzat4eudaZh9ntmEZPuwx7dDxXyNrNt8xmYAGRuK+94Pypy/esxzfN583LF6Hgvje5nW3W3iOGlYA/TPSuz8Ka3rPgfSEXQrhrYyDLgHAYnj+XFcNrUseoeNbbQ4+WxvPoMdq9C1jT2lvbe1hHUD5foa/R6eBnGLszxfbQPe/h/wCNNP8AiLp//CE+MzmaM7rSXujjkYPHp/Sv6Fv+CVf7ef8AZ32z9lr9qKNNQigjK6Td3ShymeFQNgbV6YHNfzGafYCC7SeH9zNbyB/b5ef6V9T/AA91bW/GOox+ILaRbfVrAZUodu5RyDXBi8hoYtJV43OKtVcVakf0gfHv9n/wZ401i7vru1W1lLNGrRjAKHlSPaqP7Mf/AAT7/wCEh0fXIPDzQSGeExg3BwoPr/8AWrlP2dv2hG+KHw/jj8Ulm1zToxEysPvov3SPrX6Tfs5/tTfs2+EPDUnh7V5pzqkkuJ1jwNp/u/hXzdXhHKacuWutDjzGtmVehyUOh+Uvx1/4Jj/Fq1sF/sDToGniXAa0ydxHGa+DLf8AZP8AjLYxXVj4v0e8sbi0HDbCqvjv2r+3HwV8YP2d9Qs4FtPEEUDT4+SWVcrn8K73xD4T+EGvRCa4Wy1JSPk8zDls/lXz2I8Mspqzbw1Sx8hSznM8J/FTP897wP8AB/xH4y8ZvpGjiGPVvNaLbcNtZtoPt6CvWPEnwY+O3ge4e28X+F7txB0kgiJQrjghq/sp1b9iv9lrxBrQ1xdEi0rUEk3me1QIRnuDn/Irvdd/Zg8DanpUmmTap9phCAReY4PTHB/Cvgcz8OM5w8+bBPmifWZT4hwt++X4H8JceppZTyjVRLaOB0fK7fatiz8Z39rEDoV1vVum0nd+Ff1pfFP/AIJ/fCvxEq/8SrTZcDDFFy7Y/Kvz08d/8EnvDdzLc6vp6Xen26glEtSBXk43A5tQh++oc3yPp6HFmXVmlzH5I+EP2lPix4Oi+y2Wr3EKEjHzV9YeDf8Agod8ZNDhW11K9NxCuMb+vp6Vx/in/gnJ8QNxXwpexfuycLeORJx9K+XfiR+zn+0D8N4VbxLo80kMf3ZoU3IR0r5PE4bL6vu46hyv0PUc8LU0hJH7D/Dr/gpH4V1dl0fxlbpGx4MgTpX3T4cfwL8VLeLWvhn4tt1eaPcbbzh1x0x7V/HTrt9q+nXhi1SGWwduMSAqP84r0vwF498S+EVS+8JatdWZH/PF8Cvgs48FuHsx96KszOeWxt7jP7GE8M+KtCtIWvUuSwQq0sIyj8dSa4++vNQt4vtotd21SAcAtmv5/Ph3/wAFHf2mvAFt5dlq39qWiYzHfNuAHpjFfbPw/wD+C0cdzAmlfFHwvabB8rPaQ8/nX5fnP0TcPXi/q1RI82tlslsfpPpd1qYsU17VI98smFQYyR2rm9YeSzjmubu6SKbOSC2DtPHFeUeFP+Chv7E/jfFlqM2o6M8g4MgCRqxH8q9m0zVvgN8Q4Vfwx4t0u6wPlSWbLnPrx6V/P3GX0WcywetFcx5U8NUi9jn9C1jWLiz8nR7vzYmOPLVuP/r1lzDW7dQtncGM+biRZDjj2r0C8+F+sWxSTwbaMyJyJoANh/WuU8QWF7GVs/ESOsqD5mUYNfg3EPg/mOE1q0nH0OKrGV9jHitNXtLua/uCEfou77u2rlj4vgi3POYp5duEMfJBFQweFrC1P2u6lvJ4JkHDnKis698I6XCj3ujSxBIhkBOG545FfmuO4aeH0kmvkZS546I6bS/jDLdSfalh2G2+WRVHz4Xuv+FfnT+1Ff8AxM+OvjuObSoJIdBt+Ckg2vnuwFfeUtjpOnWi3UigXEyfIvcketeDa/4b1nXYpv7Pmkh1GclfLkOIxjkED8K++8Lc8qZJifb0rtvyMZYycFufEmiWfxU8N+A08QeEbmDS3tJnWVrpvLcRpxxx0Nct4s/bP8Ti0PgTUJZ5Uvo/Jn1Cx+YAEZ+RwB3GPpWL+1pZeKfh94T1m48ca2kKXkCJBah/mZwy5AX9T7Cvxws/2gde8LtD/ZybrfAEiEZAxxla/wBZ/BnMJZhg1iMXH0uXLiGDhySZ9TaRpHw28Ma7P4R8T2jahb3bM63dyMzHcd3J9q8Y/aU8P/C/wZaaePhoZJbq8dVZMcckfoK8a8a/HS88SXR/s+EqXAw2Oc+3pXq/w0+Fnj74xG3vfDiC4ubblFcZGQP8K/Zc948wmVYe1ZqKObLq9KdU/T3/AIJ//D6y8Ry27+BdAtn8TWhRpby/XEaepR/XGccV/S/bfDLxBrGmQW2rSxXM6IpnaFt2T09uK/lH8NP+0L8PrnS4tBSSw1NyfNjhG1D5fTj8K/Uz9m/9oLx1rniBB8QdYu7XWUjJ8hGxC2wHhunbp71/EPjthco4jw7r+1vZH2tL6vY/RLXvBPha0upLW3Q2/lnaxrzbW/AqWtxBJod3MCxx/s88V9H+DfiP4W+JWg/ZPE1kbW7iYAOy7Q/OOT3rvv7J0yG4XRdMWCRuPQ4r/PChwRg54uVJVNuhhUwUJ7HycfDfxAaL+z7iUvDH0YnAAFZem6dfWSu9uz+aJPmLfdr6T8U22oT+b4fXEbg4XHFedaV4C18yvHqNynmD5UjU9c98V9A+C3SjakjjllE/iizibB3WWW51m2+0ANwVGR7VSl8TtFqAlhshG44BIx2rUvvAOr6A8rzak0ciuW8otwfwqjd6tYzXEdnIVkkjUMy9T9O1fO1sLisLNJHLL2kN0ZK/E2K3v209kXz34csMYHtXoWn/ABI1vRdr2IVbXgZ/w9Kovc+FZ/LvrnS0im4BZkwcdMiuIv8ATV1CGfUoJ0SKOQhIe3HfFefPMMXTqc1mXHHzv8J6dZ/FfU9Ye5sWkaER8gv8q1TsviTfxaH9lEP2rbIckDdn+VeTI/iSTUYruQWksEiBPLTqMdzU66VHLdNY3NxJaw53ExcAeld8eJKyVpHV/alRHtXhT4jfaL/be6TJZtHhlZo9ufpWrr/xh14XH3mWEPjDLwfSvCxaeIEhOq219LLbg+XGZGyeO+MVrst95UNlrk8T3bfvIlJ4K9s152Jz11Pd5TWGbzkrHqOpfG3ASa4gVsAK28fy+vSuF+Jvwx+FH7QOkxaZrlpcWsWNzGNcAH2rGstR1JfEX9neLNPjkjABiaJPT/61aUE7XUkmo6LeSRxFiDbueVwcYAq8JmeLw+uElZmEpOb1P//R/nV1z4taFp9uNO8IaTMscYwGVRtr598T/EfXLnm4gW3B77cGvPNW8ceKNXLfdtl7LCNo/KvPdQnuiMzSMx77q/Sq+IPM+rm/qPiW8upyXfIrnbjUXk/irKWVR1FNyGbgVwOUWdCppK0S2s69+fpUwUN856Co4bdGkCk46f56V+g3wD/Yg8UfFPwzH461WRdL07zQim4+UyL0yvP6V5uNzGnQWrOzCYJyWp8R+GPCmpeM9Vh0vRrWS9kkIXy4lJbnjAr9c/2Mf+CYnxv1vxda+MtVt/7LsYnEjx3abGMQ/hHP9K/Y39jj9mL4B/s4+FP+FofFaG0tYUOLaW7AHmbRjcP6Vq/F/wDbJ+HFlpN1rfwvlursZdWEDBk29to2jFfn+bcSOr7kD6LCZRezaN7W/FvwO+AsMmhQ5mvISGLcEBgMYH412Ok/tKeHviT4Uh+y6i/2yNsGPeM47ADFfjXrdx4n+PEEniiKKWATHaqHiXIPXPH8qm8P/CH4x+FNPg1XwnBPDl/3jyf05r5V0m92fTYXAShqkf0N23xE+Hmi+GrC38Z38LXcnS3yA68dWFeF+Ofin4at/EEQ8M3JnkYj/Q4jneDwRtHtX5CfE3WfiVrWnrodtLHHeiIb7l/vqf8AeFdN+x/4ssfgvr8us+P5m1fVG4WeQ740ODjg9K7KVCHLubV4yfQ/RePwb+wx8UtSu9I+LHgxvD+raggRt0Sxea24D5SM5PftXxR+0P8A8EVDo+lw+Lf2eL2NbW0kM620zZlKu3RVHoDXp198afhR/wAJb/wk/jaQ3dzayNcW6xn5PMbpkHPA7Cvc5v20NZvorHVWhnlWVsbLfA2oo4H6e1TWxslHkT0M8LguV89j8ztY/Za+Kfgjw7b654p0y4hhwsbNsYdwM9K8i8V+FdY8H3iNpLObedQR3APpX7N6f+1n4p8c+MVsb3TI59Fj+WSG4UtJtxg7eccdelZ/xL8H/CbxvaTa/wCBLZVjtif9HbghjweMflXg+3cZ8x7kZuceRo/FG48Xa1YyhPMKS8Y9P84rudG+MurabIkGpliB0cdK734t/s/a6Z18RxJ5SS52xY5H4V86SaLrOlqNP1GFn5ABxxXf7R1diqVSVB6H3N4Z+ONprQhhkm+RCuQOOlfoz8LfjPoc+lLpMoWSD/aAP4V/PB4ivPDvgiE6hrt2bFz92Hdtdvw7V9L/AA28StqPha21bRL6XyZ1B+/09q0x2VOlTVSaPbwWfRqvkufr74r1Twq+pm5sJI4Ubkrkfyqpa/EDQbFVg091kmLfKOw//VX5mxahqF7cDzLqRwcAnPSvpX4Z2UUt8qnJCkHJr5KreUvdPoqFZpFT9uG2l+If7P8AcaT4jZvKnmjwqHHVSOK/BA/s8/AHTNDN1qEE/wDo64O5h95e2e9fsV/wUM+IsXg/wLY+HS+2WSRH2/7K8dPpX8//AMQfHmr+MrxNO0o/Z7GM5OOpbuc1+ycLv2dBH4Pxc1UxjKCfDnwPq+rNeWVssdoGxGD97j8q9R07wT4ciCrY26pjvj0rzfQb2KFDGcqVHU9K9g8O6jFIuWyoQZJIOM+gr36+KifNqidDYeG4B88Axj24re/sW3iXAFXtOt5710SD5FYZ5711Fh4f1vUZhaWNjNNLu2LtU8n24rzK2MRp9XRw0thHIQiDb71F9gKZlEZ29A3av06+Bv7BnxS8c21vrmvWo0qykbb5lyMDpyOo/DivsDxl/wAE4fC+oeGo9Cg1KG2ubZt4Vmx5gPcYrmlmMEjdYfSyPwOjuZ4OIuort/C/j7W9FuAI5CQvpX6CN/wTN+M+r+MX8NeGlQ2Srv8AtBQ7cDnHOMdK8B1X9kn4k6N4iudEt9PklktWKNJGvy5B28VyvOuVXij2cHg6MklUR9Kfs/8A7VWv+H9StPtdwyqGAQL9/j3/APrV+rHxv+K3wH+JvwgsLzx/PcvrsabYmQjeu4j+nFfkh4V+AqfBnQ18S+JoGudVmH7tSCUjJ+XkfjXOeLf+E9u57e71ezljWbC52kKV7Yrzs2zZV6P7yNz26PDGGqtSWh6Nr3xP+FXgvSLrw38NdDja/vW/f3M6Bn24xgHjr/8AWr558L/CbT9d1BtXvYBG0hydowK9Dg+GOoteLciJkDAEEivorwZ8PmgtwL9tuBxmvi8RjZVbX0sfq+T5bRwtNWRJ8PPhfY2TxT2+F9q/QTwfd6fb6W2kw480RkN/3zXyZpIsrdms45BHs/jJ4Fd9oHi7TfCXhjWtbv5d7w28pST+FsIelcOCTdT3T0M4mnR5k7H5e6pqN3ovxt8TOr7oTeYGPpX1F4a1BXZJom+XAzX5v6Z8T9U8ReIdT1m60i5eO9nMilR2BwO1fRXhT4jf2ekSXNlcxgkff6Y/KvvqKUaaR+YVIwb5j9BtK1bKH5tuBxivvH9m74MWWuR/8Jp40h+0RqM28Jx6dSM1+SWi/FLwjGP7S1a8jtbSBS0jyHaBtH07daZ8XP29br9nz+zvHfhzxNa3ulzKvkWivkyJ67R/kdfavueHYRTTqrQ+K4ixTcXGmfvxojX+t63ffaYBDBDlLdWH3cDsKwG8R3OiXJtNYYurHG4+g9PSvAv2Lv22/hr+2P8ADz/hIvC0i22qJ8lxbEgHcB2HHHvXufjLSL37LK94nOPkIFfslPF0/Ye4j8mxGFlKS5i3YX/gR55A1wkbyn155Fc5rlh4X0tDa6QyTtLyxHUd6+XpvCWuajdOQ2Bk89CKlt/D/jbw+fPtJDKo5bPJI9q+cxeOadrHoUcE7bmj8QrVY5IZk4FedX96XtRBF8ztwMVp/EPxgJ9Jt7SSJlmRiWPTt0xivGNOuPF2pXCyaQm/YeAw4r5DMoOpLRH0OAw6irs9o8MfC3VNVk+0XisqdctgD+dexrpem+CrH7VK4yBxz+FeY6F4c+LWqFbnWZ1tLeMZ9BgD6ivPfGviK5vL37DZzecqfL16EV8xj8VHDKyWp9JhYSqtX2JNd8TSazrjTTklFOBWFfSxSHDD6VjLLMsvlBCzH0rttC8J6rfD7Rqi+VD1y3pXycq3tpc70PrKcacVy2Maxtp5yI4V5PTFenQaBpmi2a6jrrBcDOw9/Ss698WeFPBkB/s7a7qPvdeenSvmrxb8S77xNOXuX2xJn2wBQ5xjoaTnZHeeOvHFx4hk/szTNsNqnDY+VVQfeJP0Fed+C9Gf426//wAINoaOuh2DA3txGMebKvKgHjjA96+SPFnxevPGHi+3+Engq4WN7h1jupf4fKY/N06ZHFfuT8FPAGhfDj4fWmg6cI1aOMBnQcyHHBP0r6Dh7KfaSdWoeLjsUoxXKYDeGovDukppWhQpBBbLsUEYwAK2vhb4cuNS8SR29xF9pTIY7RkY/u//AF6teLrme6Igi4wNvTg17X+zx4R1KXXLSy0dhI8syiT0UZr3Fy8/KjzMQ3yXMn9uzUfh34R+HWh/BvxRaR3iapJHMyYBZFxt3e2AcV/Mt8Z/Cdj4G+I1z4c8OO32JYy0OTlhH2BNfcH7enxe8Sy/tmX/AIT8RXR8jQvMtU2cZEcuA3U46dK/Ljx74+ufFHjK/ubibLITBGR3T/61fCcW1Kc5eaPouHoOMOZHW6Bq8unBFkxhm59cVp6oVi1eL7QCqsd4Ud1xx+teENqdyrQyRsTsITjvXo665c6lYvdtiWeEbUTHzYHQV8Q6KjHnXQ92dWVj1vwlNps2p3a3Tj9yu89SQMdOB2rzzUfEP2+OVd/zpIeOuU7Htiv3O/Yf/ZL+DfjX9nKe98duRrmtF0CxsBIijBVumfw9BX5x/tafsA/F34K6jL4p8CJ/bOlBSGMClyiA8bicAflXfwR4x4OliXgpx5Xsj8czTPKtbEuhyWsfmd4pvIzNM9v8uR8w9a+b1vpf+Ess1L7f3vb0r1PXtSnd2M6GN14ZG45HbivCrO7gufH8XlnckR3N7cHiv2dYv269rE7IUbQTkdtexz6Ffahq2nuY3KIVb3wRXsHwu+KfxJg8Mw3QuVcxTJ5xbk7N4/pXm2v2U6+E7rUX6SMipx1CGvTPhPpqHTXtyn3tpOPz6Vv9UlXpPDyfxKxnXopxZ++H7Tc3gvxx+yDNrsOoW9x54tSoiYb42UJ+XzV+PHws8QL4s8Q23grWZPKkh2v5jcL5ackk/QVqeKNV+yeHYtEluJlSdcSQq2EOOR8vtivlyXQ59T+03mn3ktu0HyIY2wxTPT6Y/Svz3hzw0jlmHqYeX2pXNcsxU6cOVM7T9qr41rqev/8ACvvhpO0OlaP8txNFwk8mRgg+xxxXifhXxZ44ksxLeS+aoI2hvY1Y/wCEIE4NzdL+4XoT3NdTY6BOkMKWyfIGH5CvuMFl31eKgTiK0pPU5zwlZX1940l12+bEgyBjpz2r6sg0UjXLO5Zf9XCC3868I0SOKC+vWxjybhV3fX2r6N1zxPYaRpNmCQ1xIAOOuDx0r3qEdjBSH6ho8Ooao15bfJB1PHX2qzY3t9oV+bqyfySeOP7uOlWNFivbmyE96cKT8q9KoXAjaUiQdOlbOlyO8TfnWyP0k/Y6+K9xpXjC3k1Ni/mOgY/7PpX2T8Vv2c5Lbx0fE/gPxAmmPrcPmKJpCB5sp3YAHooIr8m/gfqUltrkCE7QWVR7e/4V+rv7WrXl3+zboHiSyleO6t7mPEsZ2kII2GOOa+c4kytVaV2jbIcbUw2I1PDLK3/ac+E+oXllGDrU8WSHiVn47FSeK3vB/wC3L8ZPCc8svi651C2lgUBI5GwgcH7vtxXyR4U/ax8d+GLi3t9NuJZnPylpct9cgn0r6b8H/tV/CmQy2HxT0m21A3J6xIN4b1GQRX4jiMPiaU2qZ+wU/q9eCdamj7l+FP8AwU78V4bWfEmqKsUYHyO3zN2wBX6NfCb/AIKK6B8QdPl1DUrq2gtLZQXH3WPYY/HHavxD8P8AwV/ZJ+Mnh+7ktdWm8OXhcyQ/bpVWHLdBtVAQPTB9K5C1/Yh+PMPhqfWvhpqEevWdqxDDTyWyg6HJIzXnz4zzfCWVtEVU4JyfFrl0Vz+o7wP+0j4B8ZbtQ05JEtkA3zkjyweg544r6X8MePPBXiuJ47K4julUfOQQU/piv4gdQ8U/tN/D3w7/AGRcwahptqzFZGbIAx0zj3xXdeEv26vjT4M8Fp4QsbuFY5PvTKG80456/hivWw/jJV5bYqjc+cxXgVg5yth6lj+0U6b4G1RnhtLKxmI64Rdw/GuP1j4N+APE8clr4js3aCRSEVsAD6Cv5g/DH/BVDx74E8CxaHDbPJfXPElwVzjBB6n6Yr748N/8FWPAui/DbSLK0ma78QaiQLlp3DrD36dhXtYbjzI8YrYigj4zM/B3NMHL/Z53R9neM/8AgmV8EfFmm3AhhtHupvuG6x8vNfBPjr/gjnrcsn2TSUh2HJU2owBgZHQmvvfSP28fg5aaLo+l65rVne6xqy5CwN8sTE8KwI9K+wz8SNN8P2elfatSAutUUNHBG4BwTgYwf8K2WVcPYpfuWonkfVs+y/4qd0j+Z/xp/wAEdPjZoum/2l4dvYhIc7o5t3zY6DFfCPjH9kT9oL4c3Mtp4h8N3Eyp0kiiO047g5r+6m+vFsorb/hK/LX7SB5Yb74ycDq39KS/8HeCNTjjh8R2gYTD5TNgjGcV59TgKnJ/uKh20eL8Ql+9pn+e7qPhjVdMfyddtntmzjE4IP4DpVO01m60KYromoy2hRsKIH2nNf3l+If2I/2efiXdrLf6VbKF5+UKD1xxkV8b/Ev/AII7fs1eMLyeXS7S9t5MnHlsijPthRXn4rg3FJcujR6FDiqNRe/A/l/8FftpftM/DFo4dJ8TXN1EmCsE8hYYHbGK+7vht/wWh8Z2rLp3xV8P2OprjaxghBkwB3zivePi1/wQ38TWLyT/AA81NfkBZVuGLM2OgwK/Onxl/wAE1v2k/ANxJc3Giy3uR8z20R25HbB/nXyWY8J0vhq0lL5HoUsXh632bH69eHf+Cm37Jnj+O3Gr2F/o0gADBikcQP054r6R8Nal8CPivK+q/D7xfpiO68QNMu5j6bR6V/J14n+F/jrwfftB4l0q4tWXg+dH0/8AHa5ew1TW9AvluNCvpbORTn/RzswffCg1+U8Q+EuQ4x8uLoqLfkRVy2k9Ys/r81b4JePLeYeIp7WTULSFc77deNo6EZNfld+0d+3gnwcnvNH0HwxfC5RyhnuIgyKR0Oe3tX5seEv23P2qvhywGl+J7meDjKXUryR4HbbmvqXw3/wVZ167dNM+MPgXQdZt1X/XLYgu/ryzYz+FeBkH0cOGKFRyjv8AM+ex2RTqP3Gflh8YPiV4m+PusTeJvF+tJMPvJb7vuMT02jpXiUPhS/ELRSIsoC5+Qc47DpX7oX/xw/4Jg/GiCX/hLPCGp+Fr6T78lmYreLd+EZIGfT6VwehfAn9i278WWmpeH/G8UOks486G4uMzbRyAPlHfHbpX6tjclpZZg/ZYJaJbI+aqcIVFK5+cPwH/AGTtf+LniW1tm026ttPdj5k5G1QNpPB/Cv6KvgV+zt8OfhB4Sgs/CkPMJ2tJJyWYjFfa3w38KfDG1+HkGl/CO0g1ewdAIWh2s+f97j+VaN/oOuaVpSaTqGnJbODwjoAefoa/z+8ZMr4ozfENUov2a6HdhMklSex8N/EbwZ410Mx6z4N0h76W2+aRtgbhj2/OvlHV9f8AiJF4lttf1HwldWkkAKxyiDYjk/jzX6tW+r6pa3k3h2X93Io6EfIfT6irNzaeN3t449Ts7e8hBBIKfKF/2Bk4r8DWYYzAYZ0cRB322O2WH5dj498N/Fvx1Mll/bERtRJ8oDjHavqjTPiD400e7tZNNiaVcbi+32/kK5/W9O8IeKNTZbmNYDBgKg+UKc46VK2n3+l3C2KavEZV/wBTGh6/7J+vSvxrM4VoYh4mldP0N6VWcXoz6n0T436Je6UY/FVuZrt+kkA6fjivTNHi8La3Z2+s6FfRR3ZIG2U89f8ACvhO1aTT9Q+03NuwuG4kjH+qH0FfQemal4S8SaXb6frMUun/AGYgrLB+6/M819Zwvx9iKf7rErT0PosHjraM9Y13QwurySa1FHLJnO6Mdsf57ViP8MPAOtXC6pZS+VKFO/5sdumK6/R/+EZulTUbHUldUIi/fNuY9s9sflUupeCdQ+0RXOlyRQ25kyzP3HsM1+v5XPAY1XlY9qNOnP4zhD8OdO1G5mNixMaQ7MSnJz221wM3wwt/sT2OxnnAPEfBz2Of88V9Y3WjnTY0XT089z/Gv8gKxLZ59Pu5IpbBwZODJj+navuP+IeYLE0lZo7VldGa90+SNG8HXVtqQ03UbdreQDBlI+UitjXPDeoafB52gpG7btpVxkHHevf9YPiGwaC6u7ZEiM2E8wdR2roL57C8ktrnUIkt2zgKV2gkDrXyOK8Ioc/ua2OSfDKl8LPjy60vVoYkGrKsRm42qMKv0FW7bw6um+XeziN5CQglkHCgdB/Svp+Hw8+sGVvEMKyWquSjIuMDtWA/giPa9sWjGSWjSTpjsa+fxvhi4/ZOGrkDpaHmrkkK1v5Ut1Ecj+7zxioE0LTfDmljxNruPPJbekf3cHp8td/4I+GF/bXtxPqEsc07n5Vj6D8K8X/aa1u08BeGhZ3DASE/vF7jkYr7Lwp8CI5pmfspv3TzMxw6oxTR/9L+NjVfHNpv8jTItvYE/wD6q4+W/kuSXm5JrBO41MN+3ivs+dvc5zVQ7jit7T7G4vZo7SzUySyEKqqOSewrOs7bIQ9ckV94fsRfs2eJfjv8S0bSFVINM/0ifcu4BU5x1HpXBm2JVCnzI68PSUpKx9YfAj/gn6q+F9P8efGO4GnLchXihchWIPb3/Kvvqbw5Jqltp/hTwu7R2tkv+jWsPymUr0J9c1Jq3he61bxNBZa3eyXGn6bKuyIN8oCfwj0r2v4Y2OmeFNTvPGzo1w07tDYxvz5R/hI9cH6V+P5rmE607pn3+FyuKinYtftMfC74kfFj4M6bZaxIbOz0mNY3tkG0lgASCO+Me1fDfwk+F2reGoPLubfdbS8RwuOoHc//AKq/dfwzo2r6p8Phba6/2i+vZfOmRh0GMcD6VxGo/By2F0LiOFcABRhdu0elecudH1GBwMex8RaB4BvFhM0doLdQAVVRha8v+JmnfFjUrN7LTLmRII+gj4x2r9YLnwLb2emxxKoJUf54rx7xZo9taxtFFCqKwO6uKtVktj6vC5SpbI/Huz0fxv4UKazqu+fkiTd824CvQrr4jeCpdKLtpiWs+zk7Op6V9R694Xs9Z0mWxdABG2U9q8E1D4VWFzIGnRfl+UUU8RNLc7Z8M3Wp8E6zpOsaz4rOtux8hWJVE4U+mRWroy+ONV8V+b4gv3t9Oi+5FAxXgDivuK0+DmnB9lqu1q7zR/2b5LtCwXdnuRWUsYzGHDNtjgfhXq8eiRXOsRx3EwiTKAnd0FfYP7Lvxc+EmtX89xr0UlvPcuUkiYgKSBwQMeteTH9nTxHJa/2XYyvEj8ELxmsWf9nrxB8OoRqENhLMY/nLrwa5XVlN6IyxGV+yR+j3j/4c+F7vTzqejhZ4rk/K0nIQflxxX5j/ALYuq/Dr9lb4Z3njbXooJ9QlUi0gIyGZuFbAz0znHtX0f8B/2sdE+2TfCr4g20lpbTYQSSkZXPAwceuK+Ef+Cq/w7u9Q8D39v4VlOrxWbiSKdsSL5eAcL6elfR5HTvP3j4jP6jhD3T8Hdd+IGufE7To/H/i4l7q5Yjb0jVWO1QB+Nffn7KevXdx4SvdDmfctm6qoA7HmvzP0HU7m68A2dhqUfk7JQCCMYIYcfhX6Ifsq31nBPcWHSW8PmD6IK/RuJMNGWCVl0PieF8xf1zlkffekNCkart5NfY/wgsY5wmzhzwPx4FfHlqriJcdR2+lfXfwc1H7Gsc7DlRvx9K/GIU7VPI/fIQXsbn4M/wDBVr4geLfGHx+/4QbTJWih06IxMR/eQj8s1+cvhD/hLJrn+w2UzBTtzjkt6Cv6Yv2if2FE+OHxnm+KemurR3EDGSIcEO3frzjHpXhXwk/Y5m8N/Gm1lutP83TtNdWCsMiSUA8V99hs1jSppI/FcywF8TKUkeefA/8A4Jp+PPipoGn+MNdT+y7WWNcrKNpI9evH5V97eF/+CdWl2Jj+Hfh+H7X5jbnuj8ypkdM+1feNlrVwusx+Eop/LuHQSsF4SGL7vlgdMj14+lfQ+n3zaLpbaNoFxHAqjc9y2NzewPapq5y5bHB9TXY+CPDH/BOnwd4E8QRaczLeS5AbcQw6dh2r6z8KfA/4IfCLVyFt4ru9XEgV8MqnH9KoeKfirB4P0J9P0ef7ZeXBISXqdx4618sf8JjqUmoR6LDK0l9cMDdP1IyfuiuR5k3ujajhE9z6h8a+N7zx945s9EFytpolg2+RYfkHTjj64rL8c+IYPEuuC58MyyeXABCHLdAvcEAelfPHjW6n0TxBHpd1MkUEyD5R97jnr+HSnXvxF0/S9EfTtO/dRkbfMPr3qVieiR2fUYHv/hX4xCxvZrKbUJBJCu0srkcYxj0qC6+KvhPwZ4fmv5IBP5ZLtKQN53Gvzw134q2elvHYWGxhli759j1+lfKet/E7W/FGvS2dzqaNYQsMhDgNzwP5V30lJmNamkrRP2i8H/tYfDyx8C6v8R/ifo1s1hb4FtDLGpMh3BRjOO5FeYx/tj/AL45Wf2bxnoIsrNB/owgVUZcdOR9Pyr83PEfhzxz8WNMstN1e2k0fw5ancss+FSUDkBee5AA4q3YaP8QdFm+xfDdbSysoQBu1CJZCcdSuO34V6cYKUOWRzUatSDTTP0qtNH+G/j7RJbv4b3C3DWgJNuCDLgD29B7V88+ItbvVtPstsjQdstwVx69MV1fwB8YX/hHV11vUPEuj2t4MAwxwFFfswIC+nvX3r8RvgV8F/wBp3Qk1ux1aLR9dCj5YjsSZuOAowOfrXy2YZLNvQ++yniSyUKp+Us/iAaNp/wBs1Cf9xg72XrjFfLlj+0Dc/Gj4gt8KfC67NHtvkldudxxnqMdxX6+Qfs4Xvg3R5fCHjrTWv9Ok/dNKgBKq3Gc+3Wvzn1z9gPWvgV4ku/G3w0vFvNBu7jzSyZZoBnnfzn26UsBlCp6nVmmO9t/D2PePB/wUtdOVYYoIjtAUbRxivXB8MrVF8qSyhkwvHye1c34Ht9a0eGPULS+S7S5AKgdQOnSuZ+Mv7W3hr4U6XNo0pS81qdSkdvEcujY4YgA9OuK+tw+DU0kz5DF4rkVlufl//wAFGf2i9O0OOT4DfD3TYfts7BrmWGMZRSu0px0P/wCrFfjfcfDb4ra9bRreCe5WAbIopeQiAdFHGK/Rmbwp4W1PxZd+OvE0hm1O/lNxLubox7dx+Fdi2s6OE2WyCLHQtjmvpsJRUUotnx+J55SvY+MP2dPjj8cv2MPiFD8QPD0MsNu21buIglWjHHA6Dr1r+yL9lL/goR8LP2lvA8OpzSoszIvnRnAMbY6fn7V/KL481W2vIXi1eJXjAxuA4xXzR4a8eeKPgb4tXxd8Mbt1iDbpbZW+VwOoA6dPaveo5xKlaPQ8bE4ONtj/AECpfD/hbxLZfbvDd1GVfnAYA5+lcjL4R1hcGV+B0wcV/Or+zV+2xoPxls4zo3iFtD1tMb7a4kPzNjGFAA/lX39H+0Z+0J4WCwXkJ1OIDIMW3G31yTn9K9CpndOW6OajgXbQ/RK88A6bqJ8vVYlbPfFYesXngD4Z2RndE3KMhR1z0HFfC837fPifTbfZqugXO7BGfkxXhmu/tnQa1dfada0W4k54B215WZ53RjC8Eevg8pnu2fYHib4teMviE5stIjeO3B2gKMZH6VBpfgi8jh83VdtsnUs5Ar4xvf2z9eFuLPwbo62Y6b3VTj8jXkmr/Frx74xmZtb1JlX+7Gdn4V+b18UpT5pI+zy/CuK0P0sl8X/DTwc5jhuY7q5/u5zzXmPi343zTxuYSsECjpjtX51a18WPDHge1Mup3AnkI6McnPavlnxd+0featcmaZvs8C9BnqO1cNdxeh6LV3sfozrPxLj1WaSdpxBbL3JwOK+TPir+0hBNLJ4T8Ly7tybWkX+QP6V8eap8TvGPjdDpegrJJCfl2qDz+le8fA39nzXNe1BNa8WQG0toCGEUg+Z8e/H8q4lKFPRs3+p1ZqyR92/sP/Caz0yWD4geJYle6mmXb5/Zc8/XAr9x/EHxU+Fum2f2Z9UgiK4HynA4HpX5O2vjG00zw8nhuyhCbMBWTjbj3xXE6t/bGp2Wy2HmAc5PNdtPiH2PuxZ00OD5VbcyP0ffxtpfiHVI5fCupRXD7+Iwc5/Divsiw/aD8RfAX4Yax8Rda06C2Ol2UlyjmMKJHjXIQep/lX4e/CD4f3s2trPNLLHlgy7DjBrJ/wCCqH7U2qeFPhXpX7L+lXZeW9cahK+7LxoQEKE+h9OPSvQwubX9+Rx5xkcadqcD85fGXxs8R/tG/FnxP8Z/E64utYWa6iCDbsSSQsB+HToPwrxSx16zgsjLdjMjcf7Wc1zvwy8FeMfGLjRPCasP3e+aQZwqdO3avtH4Y/sh/C/xBrsel+NvFttYBQu7fvHPtXyOOl7aszbL4+xjytHzDdTTWenwXDggZL//AFq+pf2OvAs3xL8ftd3S/wDEssWWedmHUf3Qfr19q/QjQv2E/gTexR2rfaL1IyFiu4pP3R9CRjgdsV6jeeHPAfwW0pvBPw6thDGozO5wS7HrzgcY7V1fUvZUzuwF6lXltodLq/jFPC0ip4WcW4hCKmwlV2qCOxHXiszx5+2B8Sr34T6x4KjjjubmeEpC5BwORnjvxXzTruvGRz8xA6YzxiuHn1Vo2LvJjg/TpX5xjslw2IxSqcnvJn0mY8I4epDnaSPyS8S6D4n0/WDZa5Ay3VxKWO0cHceo69Ov4V9meMf+CeU/g39nyb4xJN5mtpGJ5Il/uNjAx7qfwr6v+EHw/wBC+KHjv+2dethJYaX8zEDlsjGAa/RLxG1j4msJNA1KIDTLiPytq4G5VXCqR27DNfvGROSoRUeh+SZxgo0qns4n8q2t3i6l4KGn233YON3bIxmu88AXxtdMF3C3zYXj6cVF8T/AE/wv+Iut/D9o2W3hcvCG6fMx+vY1yGmi/so1FkNyLwRX11J8258/UdlZnp3iXUrvWXa4yR8u1Px4qfSNIsrLSFgYBpmHPrXEjxFc2q7ZYDgdPb9K7uw1rTtU0YQtGYrqMff9f8K7ZRUtzkWmxnvZJq13FotkuIYuX/wrtW02ztS0cS7fKjY/kpql4U0uK1s8rlrqd8n2A5/pU+t6mqT39w/3Yh5Qx6suKn2UUNu55Jo0LnQtTvyw3vdjaPatrwVpt1438ZxzXZPk2gC47cVw97OdP0wyKcHz0yM4rvPBfiS18MLckMFe75Q+5GMVUZJbCPpy+uLd2NnaYCRcZ/CuUuPKMnzdqx9JvbkWoRfmnK5f0H40XV7HbyDYd8p/IVdWrKw47ntvwtnMGuRRtywZTgdq/cyWNPE3gnRvC8yJMgSNxG/K8KR049a/CL4YSyw6nFtG6S4wh9vSv0e8UfGnStD13wx4HSRvNZEibY2NrY78dqdV81HUmtHmkjrfFf7D+m+LtZfUILWXT5C2cghIz9AOlfNXjf8AYh1/RL4nSb6DEbbtpzk/ka+sLrxR41gvXOn6s+Ec7RI2eB6Vtaf8ate09/K8Raf9qHTzQoGPxwf5V8Xistw8vsn0OHx9SlHlbPzA8VfCT40aFcCSKO4khT+KM8AD0rpfDP7WP7QXwggi8OeF72WwtzwwJcbsdc84r9Or/wAWeC/G1p5dtJ5E5HQ8Y/lXDp8H9K8YWci3VjFNFFnEm0bufSvncTwrTqLQ9rB8Qyi1zFD4c/8ABUez0vw8PCfxD8OW2sG6ASSeSEMB+J6V9R6P4M/4J9/F7w2mua7qa6DqN4NywrKI1Rzz90L0r8o/Hv7I8tzqb3fhVXtjAS2HyVP4ZFfOPiT4KfGnR7j+0ptOupYV/wCWsXCYHt2r8+zfgOo5X6H2WD4xjBWP2tl/4JoahrlpeeIfAXiCz1iyRS8KI25tvYcnHT2r4Q139nH4laHd3i3WkSKsJI3Rx8ccZ4r4s/4aE+L/AIPki0DTNbvtOhj+URLNIgP1xXvngr9uDxz4BkjvbpptTk/iLuWU5GOVYmvnqvB0Yq3MfTYXjZcuvQbe6Hqja5HJHLNHcpIhX5juj2enAx0r16x+N/xv0DxJZ6hY63c3V1ppXyvPkLqoVgePw4xVMfHnwt8RtVbxP4gktNLkuBjG3Z29hTHk8OS3S3OhXCXybSMxnuRjNfP1uGMTDWkz3sJxLhK/8WB9UW3/AAU8/aHn+INhrvjOT7bHYOi7FBwVUjsTivsfUf8Agtx4k174m6bJqumeTotqUjkVVXOPrn1wOlfktZeEr42zSvCGUo2DgZPFeazeH0/tILfw+VsQsPlXBPbtWUM1zTCa22OfGcP5fjHokj+nrxb/AMFmfg/rPj3RND8NN9i0w7I7hsqMMeT09K+yPE3/AAUe+Dlpr2h+Evhnqyajc6rsyd+7Dtxtxjiv4kLTw5ZaxqsktwgWJPmIAAO5eeuB1xis9tI1qw1aLU9Dv5baW2YSIY3KkYORyD2r18H4iYlW5z53FeGWHf8ADP8AQm8SftSeBtGvrXwhBdW0utTwCRl7ITxnp2PuK5fWf2iND8KeBL7xz4rNnd29k7RSgDh2C54BOK/gbh+Ovxb8O+LIvEFpq8892rBWaSV2Yxk8qCScZ+lfuP8ABL9oXxZ8XP2QbmPxxGqj+1Whj3LgldmOc/e+uK/QcgzpY6Wp+f8AEnC6wcbH6f67+3F+xd440GfUfFHhJLi625SMRx5b6A1+Dvxt8T/A74seM7m8sPC1z4fsg5ClQka47fd/wr2a08DeGb1N1xMscwG3+HhQOABjitKx+E3hVUEtzMkyE/xgH8hxX3yyzDyg1Uij4SPOtj4K1L4MeDr53XQ9bgWPHCyElv0FcNq3wC8SRaeU0+Fb6JTlXjHb8cAV+ourfAn4cXNp5tneRWqFSGx1LY6DHIxXpP7Jv/BMC9+OOu3XxF8MeKJLG3sGYRRTvK0RZCB90/KQc9McV8vmvB2Akl7HRndSx9SC1Z+Anin4Ra7pFtHJqthLbbunmAEcfQcV4xe6La+HZ2vbeMyMcYUL+HGRX9sPxQ/Yv/ajTw4LJ00DxBbRIqIlrYr5xVSP4iRzx7V+e/j39iuXXEWDx18LdVtGiz5tzBsji+uFBOM1+W47h3H4aq1T1R6FDM4vSR+E3w5+PXxl+GyQ33gjWry12EFYjIRGPwFfo78Pv+Cyv7Qvg+GGz8Yafp+rCPA3vb75cDjhmOK5zxz+xT4Ksw9x4f1ePTdrbVhuldiPY4FfN/iX9lzx5pyGTTbb+14APvW6YH/j2K4qeErUvfq0TadaEt2fsB4f/wCCsvwA+Kmy0+KvhyexuGAV57Xy4sfj2r6e8A+M/wBmXxqqv8OfiTb6d5nIttSuGd8nsAq4r+WLV/hH4s0XdNrGmy2MfZnAx+IAOK4ZbTV9On36bNL8nR4SVx+RGK+QzTgnJMemq9Ba+Rh9ThNaH9i1/wDs5eNvFWpJqPhS+ttXgUgtLaA4I9f8ivMvEnwu1TwjrU+reNLCdWgIELqQoyvcjrX8yXgb9pL46/DG7W50DxHf27IeAbqbZ+KhsV91fDv/AILJftM+A5FTxFFY69a9HSa3WRyOnBfNfmec/RtyLFQfsZcvYwllzS0Z+vEOtXd6kuu3r+ZCF+SMYyxHHTNGmeJ3u7SS61WOSBbdse2MZ5r5n0X/AILRfsxfETR4dI+K/gm406bhWe2EcQB9RtTOM19P+C/2lP2GPjLF/wAIn4R1+LQrh9ru165bt04Ar+duKfok4xNywD5kcbwc1qdO+q+CobeC9t79v3yh2wx2gj2xXrOjfES+17QW0fTL9HlgOQG5Owdx09Khvfg34i1a1jf4bvY6/pwQRqbRVGQe/JrzHWPh38YdKtvsdzpn9mSRtsVzHxtHTO316V+T4zwOz7LV7tLYqnWnDdH1R4f+NunJa2+j6pG8RgILy9mwentWnf654a1+G5v5NQe2WViIRvIxxwen9K+KLCPx6lvNo/iKECaLJWULhcfQ16l4b8WavdaJ5OpWSMtqm2P5AC7DuOa+ShnefZdJ069F29Dvw+duPus+o/CWpWuv28Gk6tqEdy1rgAufTvXeavBpl9JFHe4KwNlWPpjtXxXo/wAWr+XQ3hTT1tZd+yRmUDjsRXoFh4nkhFpLFcGfzeCr/Tn6cV9Pw54lyhU/f3R7eHzmPc9uA1CDWDPYXCrp84CLGfUVCbPxP/aTXeoRJ5AO1ZAvRK5+38X+ELi4jtbu6is5YjiNJD3x2qrrVhf6jcM9tdS+ZB86Ir/LJnjAFfr+D46wOLjy6XPdo5nScG2dXrXim50C6gfwq6PCeZnx0wPTtzX4uftvfFW78W+JH055RuLYO0+n/wCqv0v+KPjG38HeAZLnVLN7a+uVK8HAG3nJ474r+frx94gl8S+KLrVnfd8xAz25r+1vBnhylh8P9fcNWj4TPsZ7T4dj/9P+JURqTxWvaWPmEc1kWjZcIa66CHaoHY19jHc5Z7DbUvAG2cuPujFf1c/8E3PgxYfB79kuX4qarB5ep+I3Ro5Rx+5kUgr+H4V/Kfb+aNUtreLC+ZIqfmQK/t5+EnhO9tv2Lvhr4VsgHefTI5HHp83+FfI8YYi1PlZ9BkFBNq54n4I8GHXNQnktBugEh+8Pvf4V7z4J+GIm1x4r5cIrBowBwpr3HwD8M7S3jjhgTYiD5yB3r2/QvClh5jiJNrIcZx1xX5hQgj9MhpaKOl+H/giKEgzrvkcBdxGOMUnxLsbTQkjjtVAKnk16tYI0dpb28X7vBGa8X+OVz9js90bc10ySsfQ5PScpWZ4rd+KLfYVcjPTFeA+NNQaZX2njFcjqWtas16zqcxg1y/iDUL+WESL09K8PEH6PluGStocTcyusDfNgselZUaRSOquoOKxtSubppjn5RWTBqbxXShzxWFN+6e9PDxtoj2nR9MthcpcFePSvcbC+t7aJdgUDgYrwXTL8CyRwetbOn6lcNdIsrfJXRToRfQ8+dGyufavghtIvZYzOi/KRX3d4F8CeFPF8YtLy3SRGAGMD+RFfmx4BuTEolXt0r9O/2ZtVsjILq+HCn1r6fKcFBtcyPh+JXy0ro8B/aY/4Jo+DfGkB8V+Grf7NeojMhjCqMqM84A+lfzpa/wDDD43/AA2+LLaD4ws5NR0UrJFOJBmMoc/d5O0446Gv7yLe403WbKSziUEOhA/EYr8QvjJ8Jl1n4l3/AIeltgfLZmjfb0HU/pWmYYb2NTmjoj8qhjpVLwlsfwzfthfDjwn4S8VXreCon0/S3k8wRSHOGz0HTjPtWB8BPEt1p3xa0XSomyGtHyB7Cvvj/gsl4a8G6F410m20NlW5VG8+NOBxxyK/LD9kee71f413PiO7bNvZwuiY5A3D/Ir7DGYyLwC5+x4WU0YxzKyP2807VvLvnEgyGGB7cV794M8XQaVYm/8ANCiNefoK+RdI8VWDr5c+C0h4PpSeLddmtfD919gkMa+Wy/mMCvyyNLnqPlP2ipj1CifoD8NfjC51S51SchoN/lwgHHUVqWXxsttO8YSu0IBtnEuOOG/L+lflH4K8Y63ZeBvtc10M25EpTv8ALXCax8eptPsrjxAZGSe5z1/LFdX1Gbsj8zx2M56jsfrHp/xh07Tdbl1jU7kNPqF4S57hGPQe1cf8Tf2u7fWfEZ8G+En/AHMIw2G6YODnivxVsPj/AHN74gia8uGVePzz1ryfUfixrdr4tvbvQnbe7tHvPcHnOK9rD4RqNmccISlsfvPqfxZsbKC0Swuwf7zE/db0FeTeJP2nvAfgLxG2pwXfmTsoGQ3/AC078YPavxw1T4q/EG+086TZeZ8nIYf3j3rB8PeEvFerTf2prySTEHco/wBr1qJRjDVnbSwNWWkUfqV4s/ai1bxRcy+ILyZY4FwU38nr+GK8zvP2qpbywdbC6S8kU87eFH4e1fJlx4F8beKTshikAUYAHAx9K0/D37OHjm6QxFGhVuoX5QfrU/2jSPTo5BWfQ2734veLtZ1C4lLOyPwix8bs9hXUfDDUdI8OaiviH4lXiQmNt9vaA7WJxgbuuQPTFTSfsteKrW1g+yysrx8j/OawtQ/Zh8e/bf7ZaQzTL6jI/AZqo5zSWxvPhava7R9L33xo1TxLrC6kLkzW6jbFBDuEQA44XkV6D4e8d6lptx/adrDLOX+9EW4P4HH8xXzTpfij4r/DmyGnWmlwqEGN8kQYVp2/xc8QyWZvfEMsMLd1SLGPSuuGawaPPeSThvE+9vBfx/06Gc2XijwdNPGeMxsqkZHY4NfRvw5m+G3iTUd/w416Xwnqg+drW/keXcyjdhc7R2r8Xrn483ssYhtLjewPPy4Bx9BXr/w8/aLmE6NqtxCNrD+Ab/wb/PFDzCDOWtgZX+E/cvwZ+1feQ+N4vA3jrU4LS7tyED3Qylxu+X5RwOR054r7L1H4bXixN4u0WInSr4bLi1fDAqwwxUDgDHPSvwzvtA+Gv7SFtCbDXorTW7bBiC/Ixftznn9K+0v2Q/2jfit8BfEP/CovjdK+p6DNIsEco+9lvlGXO7IHHpxXP7VcyaOqnVdODsj5Q/4KT3viz9krS7SLwWjpFr3NtIoJSONyABx0Pp0xXzj+y9+x3J8QbKPx18ZL6QpqCCRVZj5jZ5+96fhX9AH7Xvw7gTw9a+LtR0yPxj4QjkEn2eML5tumQS2988L16dq+bdF034cfFrQrPXfgdex+TtVf7PLbnibn5eigYxivcw+LklZHiYeKqVLzPCrv9jv9nO2shYDT55MD7wk68d+K+Gfjl+xHo1nA998Lr4wyRjcsEv7wt7DkY4r9a9YQeBoTY+KP3U+MFT0B9Pevmnx3rlpexs9izBPbj+lYVcylFpNn0tDJY1Ye6fzaeP7/AFvwrrc3hjxhAbeWLjn7rc444r5f8XtFbSG4gbIJ4x0r9oP2qfhzo/xF8PSOkSrqFuCyMByfYnjtX4Wa1d3ulahLpN8M/ZyUI9CK+gy/Eqex8bmuVvDy99aHGXGrXumal/aul3D20y4w8bFCCPTGD7V+hPwB/wCClvxW+GMUWieMydXsFwoDAFwuOPmIY1+cGprH5hlHP9PwrAZ2Q85x6fSvacFY+cnX5fhP6tPhj+2T8BfjbaLHFPBa3pXBt5NoYNjt8or0XVNM8HzEyv5QOMqRtK4/Kv5EtNvtWs7wXekPLDMSMGLg/pX7efsc/BL9qn4y6JHe+LdTOl+F49p864UiRl9Adwx27GvDzCVJRakexksqtWXLyn3BqH/CMWxePTYTdTf3Ycfz24rxHxrbfHHV4Psvgbw9NBkY8x9rKPfqD+lfpDbR+BPhT4Uh8PeDrdJ5fuPcS4kLsOp5HH61xH2+41ImS9YJI3TZhQfwGK/P8yznl0ij9hyrh5uCcnY/Jq3/AGQfjZ4nvP7S8c61HDuOfKKYI9vv17h4Z/ZK8A6GUm8Tzy37r1G/j8OtfbF5EwY+ed3pk1zUs1hCG8+RQPTIr5qtnFaUrRR9AspwtL4tTN8MaJ4L8MWa2nh+wSMoPl3qCfzwK6p9X1K4CquAv8vp0rin1/RLYnbIvHqRXN6j8TtB0oYEwJX0rgxFerJ6no0qdFK9NHfz30sBJZiPx4rLl+L1xoJW2jIKngj/ACK+ddb+MNnNMTFMBntmvK9d+IWlrCZZJx5mM49PSvRwWHnK1jnr5pCCu9D9Xvhl+1N4T8Mx3XiHXEVYbGLco9ZFGQvT1r8Hvjr8WNf+NXxdvvH2oSFori4cxK5+6meFHtXR/FHxxHqHhG38OeH7s/aZ8SvtPfIyPyr59vo5bGSG0kbdIyAsenTmvsKUZKnys/M84xkalTmifoP+zvdN4U8PXV/GW826P2csDgbW5xx6V9DnUNItdJjsWjR5JPl3HO765r5U+DuqO3gCKzmGGF6CG9V216jqV7Pc+KbTT7STaQ4PA9q4YYW0riw1bofe/wCzbp+q6Ffza3banI9qi48mV3cA4xwC2P04rrfH/iCW5nlkBx8xYc/pWh4O0xtC8FJERiSUBicc/SvFfHOpTWkm/tXPj6krWPueHMPBu7Rz817NcsNw71y/i/W7fT7YqDhiMfnxWdd+LLSO3ZmcDYMmvkH4lfEx9agubaxkJQDGfxryMswb9rzMvP8AMYxXIfpN4U+L+l/CrSIPA6bI7y4QTRXZA2MSu7ay+w6c9a8g8T/tkX0dmmqWlwiXdrKUuFI+V1ztG0dutfnReeLLmXUrAXEjutoARls9UIrimujciOC5BJuZ2DFvT7w/lX6TleI5I2PyXMaKcuZHof7QPjKy1v4o/wDCUwMzidFaXc2cbh0HFafhREi/4mS4aBxxXgOuXcOu3V0k2N+AI+f7nH8qreBviRceHn+wahmWCM44/h7dK+twNRvc+PxnxH15LqfhqaHy7yEAtx/h2q0G0WPTv3MGyRRnceQfwwK8sg1vTtamTUYyPII6fhUTeN5rO8beN0A42e1evzI5j1m0kXRNCk8Q3jfvpQREoOOvH8q8/wBeuZrbwXLfS/fuJQ/05Aqre+MIPEjRRsNsMfRfSsn4h6xaz6RFpti+4KKqrKPJZbgjl/Gq20ngePVLdx5pkUsPYYFeMaVrV/qetaeu4lPtCRhR6E4rsdVVm0LymyFC4rivhTEW+I9jbyHESzIVz061zYaCbVxyVlc/RDUbiz020jso4jAWXnuTj34xXPWsSGYSR8nPevUPEGhyvqck9ihn2/LwCQO9czH4L8ZatKE0qxkf/dT/AAryM84vynC3p1Kyi0Z08ZR3lodr4e16Lw8wvIl8y4YfuEHUvjge1fQfgP4eax4l+K5127driS005NTYDkR/MFK/UZ/+tXnfwz/Zk+OuveIIZ9I8PzyzRESK5Hy5HK8H3r9k/g7+z5P+zB8H73x18cdttqGuy+UN452SKXMY5PAx7V42E8RspxVVYXDVb6HCs0ozqqMWfG1n4na6ZppDwSee9Wv+EmLyBVwcV5x/aFvcavfrZDFq1w3kD/pn2rRESxJ5i9e1dVaaPqKK6HRXuprc3CWMAxLKcApwRXoK+IvFvhCKDT9DvsvwWU/4V5f4R0qddSbWNUX5VyV9uKj1bxjv1GZLcAsvG7vxUU66jsb+xZ9CQ/HHxfFKLPWUhlKj5tqAECu90r46+Er6FdP1CFPs+CGDDrx6V8YeHNdmZp5ZuWk4JNP1TULee7hXaEjjzkDvxV1MTF/EHsWfXmp/CD9m74p2rSpbpBcHkbCBk9fTivi34vfsHTNcHV/ADGKIchG+fP6r/KtKLXpNOmzpbshQZ4PoK9N8HfHjx7Gix311HJCx2IpTkdvWvGxdTDT0aPVwsqsNUflH8T/CnjH4d38ej+L7doBjETAYX0649KjtfE+p+GtPit9HudmV3MTyfp2r9w7rwL4O/aH8LT+F/iBZrJf2wYwSr8uDjI7V+FfxS8PzeDPHepeCGIK6bL5W7HPsPbFfFZvRdLWD0Po8BjFW0a1PQ/Dvxm8V6XbG+1adpo24WMEjb298/lXt3w3+N2n61fSWOoqm5fuM4zn0Hb6V8PX96YLZUj5wPyrQ8KWN1JdW7QgtNI6HbnHcfyrwOaEtJHsVeenFcjP0N0DRr3W5tTj1u3a2aQtJC68KFx0xXB2V8mmabNC/zygmMOa9j0ua+0/wPJqusYGP3K46ntXiervb/wBmFohs4P4kdK/M+JqtL2vJRVj9P4cpTWH56hwcNlfa3q8cdqPnnYQRgDJMh4GK/pw+FP7I3iXS/wBm/RtOG6MyQx3rxtnPmMv4Y6V+RX/BN74Y+Evid+0joeneJpoltrKSG+k3n5co3K/iB1/Sv7lk074f6lpsGiaJLbz20aeWAGVcBen5V9zwTNUYc0nqflfHWKrOpypaH8uXif4UfE7QWV10xym3LOOwH4Vx0OsXMKraXsU0Trxk8c/lX9Q3iH4M6TqFo0cdoGiIwpBUj6YFfC3jz9mDw9dPJd3GnbdrEBQP1r9Qo57zdT87+rw7n47XtgZ7ZpInLqqhipPRicdsV/TD+wJ4Qtvhh+z7p0F6Cs987Tkk/wAEmCPXpjFfijrvwQks/iHo/hWxj2jUblUbjop9q/pW8F+GNP03wPp/hvyPL+z2cScH+6OP5V3LEOWx5GMilI78zwlk+xyKoP8An6fpTptNh1MvHqSpNGRjDAV57beHZ7u2e1LtEU+6a5yKy8QWNwE+0s4jydvqBWE8fUirJHK6S6FvxB8CPhd4jsxour6LaCOZiWZIVVuOfvYz2r5v8T/8E6vgDrDy3djBcW8rcqqSkLke3T9K+s7TxrJeQgy2zJt46+n4cV1UOuWtzaC6i5K9VHX+lcjxVKWlSJj7GZ+M/wAU/wDgnr8RdQgS2+Geu6VbpHw1vd2Ymdh6ZO0V+c3xT/4J2/Ga3ldvEXgSbX0Xq2kpHbg+/Q1/Vs1yPKW9dAvrj/P9KuokDqT1jYfdJ4/w/SiWXYSotkjppYucFY/gt+JP7IvhTQ7l4NX0q58HSnjbqB845z6KBXzXrH7JmvzM8ngzUodZXHCRx7f0Y1/oYax8MfAniDnXdJsruP8A6awRuR9CRmvnbxx+xB+zl43kk+2aIbVmGP8AQmEA/JVry6nCFCfw2OqnmnL8SP8AOu+JvwG+LXg2E3eo+H5hD3Y7cAZ7EDivMNHnv7E/aII5bWVRtyvytn61/ej8Rf8AglH4d1C2Sy+GWrR6Y+fu6iTdfhj5e3tX5hftFf8ABGz9o2WN/wDhGmsdWC/wWtsIj+DZryMbwbWhrRkerSzmk+h/Pz4H/aF+N3w9nhPhTxBqMCBQcNcSbAfpkCv0E+F//BZn9rL4bOmm6/LbaxbLjCywhnIx/eYkV5x4+/YA/ab+G+8eK/At4sUYxvB+Xg8HgV8meJfA11oebTxNZSWTLwBJGSf5V8riMpxkP4tO50rF0ZrU/e/w9/wWk+CvxMtIdO+NPge5t5RhXuIZEiH1wsZr668E/tA/sEfFW2t18KeMotElBH7m7lZmBPbhRX8jsXgy5lgP2Q+cp6BgP0zjGKW20LWdGffaM1sw7oQP5D+tfLZnw1lWK0xlFa+VvyOWeApz2P7KW+FF3r18t58ONfstag35Xyhxg9PvNXNePvhl8YNAibU7qwP7s4+TlCB3+U8V/KN4Y+NXxd8DXKXGma3fRLwCFncdOnHT9K+8/hR/wUz/AGm/B7x2y6yl7argFLmPzD+bNX49xH9HHh3H3lQfKyHlLWsT9cdM1Z9Xvxc3ULZiXbhwT846gZAxivYvA/jy40TVo7jWEeeAN+7yw+XFfJ3w2/4KR6b8RVj8P+PPCkc0rEbZbNY4gWPc4zX15P8ACv4a+IfA118RpZ5dGYjIieXcG6dMbcflX4bhPor1cNmMZ0a3uprQ1rYSvTpc3Q+Tv2yvjPJrkLTWweLzX8tVz8uB3xX5dKDJLnHJJJP/ANavTf2lPHlw+qkaBCb1LUfu4wwycdTz7e1eMeDfGK+KYUS9sJLKU9FkPPH4Cv79yuFLLsFTwF9kcmHymvOHM9j/1P4kLTPnDIr0hLc/ZA3TiuItITLeeWgxg16u1t52liS3BbHGAPSvsvhtJ7HI5u1oxOMsm83xVpO84VrmIH2+YV/oA/AHwvFB+z14BmT96E0lV9sA4z+vSv4TPgd8Ode+IXxg8P6ZDYzPZS6hbq8ojYxgGQZBIGBX+hT4R8P2fwx8DaP4OhI+zaZbrEh7fMAcD2FfmnGOJTdr3PveH8G+VSlodV4Za1Nk0PlqhAPbrXY2OlxSeW9ou35fmrgtAuEvr3EX3dw5r3UQLZWXnRLgZ/Kvj8J8J91CkrFd4Y7WJFPOO9fL3xdsrrWpfs6AqvWvqmykiaE3V4cRjuelfHPxX+MXhzTtQktbDExUlePb2xVVMRBKzPpMmozTTPkzxFptpoUxjkAPr/8AqryjWNStZ4fKiGK1PHvj17+4eeFRhugrxC48XvavtmTcPb/9VeTVjzbH3+ExHKtQvZo2udjjirKWGmXe2Re1UF8TaFqnyt8jemKimvYY2AshlTXHfl0PRji76Ho89tBa6IsgO0Y4rK8JamX1AC7Pyg8VmyXs95pP2dv4RWRoMF0l6rsNyhuo7V6+DiuW7HVqxirM+4PC7Xs0sVvagAPiv0o+Gug6roOk296vKuAWAr8svAWuSw3sGw5EZFfqX4R+JlsNGgt2wMKvNfS5fVtsfn+fx54tI+6Phr4ha+XbJ8hUYx9BXjHxr0ZLJrvxVZBTMUbPHoPWvR/AHkaroZ1exHzY6Cuf8fWa3PhC9W54yjkH8K7c3XNFXPzeVGNNO5/na/8ABYzxNKnxg/tBdokfeuwn1P8AkV5b+xh8GtSsfhhfeNoEDXFw4yh6gH3/APrVX/4KRpfeP/2yNX0y4jJtdJnKqOoPBPTjFfWf7C8l3rnhzWdHIDQ20nygcYwnSu/MsL/sSPmsllGWPczkYLtrC5SO5YQNu5B9vyrp/Eeri40Oe2vzyUJjYEYPHpXoHj74P2Pi2V0KbGwTuB2gV8x/EPRdM0iCHSLK9V7iBNmwHJP618pl2Ds+Y+qzvMklyxPCL/xJrXhiLc0jsH42jpg8dKfd+LNC8a6GtvdKBFANjY4ww/CvdvAHgeK9uI7HxKA1xKBsiZeino2c+vbFfPPxhsbPwh4iutB8NxiMI53OvI39+P8A69fQ8kVqfIUbylofP+t6Ddz+IkXSrneqj5VUfkK+sfhP+zD4t8bGO+v42VWw2duOvau+/ZT+BeqfEjxLa3d/bmRAy/w9a/pJ+F37PNjZWMEQshGYxxgenFeBmOOnHSLP0LJcri0ro/Jn4ffsTlFVLq1DZA5NfR+ifse6NpMiq8AA7gjNfsDpPwpNugzEAOOw4qbU/AVrDJhogcjGRxivlcViJy3Z+hYHLaaV0fl8PgHoWm25jsbZBnHO2of+FR2VgQ3kg/hivvDxL4Ut7PbFbj7vNecX+nB/lZcYryauJ5VZn1ODwafQ+L9d8ERwjakWK4G78OyDK7MAe1fZmu6NGTuHbtXnN5oq7yNv6V56xdj0VlvSx8q3vhOSQbZYFkB/2a891j4V6XeqytaKS/QYGK+3v7IDMFCD6UsnhaGfrEK6I5s47M4sRw9CT1PzM139njRp12xRGEn+6MCvPrr9n3VLTMWnqsqHsevHNfrKPBpZ8LGMVvWPw2jvHU+Xg/hWlPPJ3SZ4+J4Xglsfi5Baaj4Xu4opopbeWJuDGdvT3Ar9Tv2Wviz4Z+IOj3Xwv+J7rOsaeZazt8siSAZUZ6nkDvXpurfs36brW95bdDvHda8K1X9knWdBv/7U8Oq0U3VSpwPyr6DDZv0R8DmuQzj8CP2F+HXxG0jXfCS+EfGl1mzEJ09m4ZPLPy7ivAyBX5SePf2O/in+zP8AtIzXnwyupm0HXGe5sZN58oxll27QpCjvxzgU/wAIeNfiD4G0S70TWIGkfJ3Rnq2O4P0FfoL8EfH0X7RXwV/4VP4qcw6lpBF1Y3D/AH02A4j7Hk47/hXs0M2tofC4zLOR80kY3h3SNT1e0Oi/EmePUpZSMIo2mNz6sc5/KvhT4vx3/hHXtQ0i7j8uGFise0ZzjkfSvs34ieK/FvgnxbpGheLIDItvCrSTDjGP4uBXyl8YPEkWqareahYyLdJK29cryFreo3N+8evw7jGtLH5zePfFsEUCm7hdjJ1wPXgdq/Lz9rv4Knw1pNp8atKKwadqc32QQsuG84DLN9Me1fp18XfHo8KTS3QgTiLcmQPvemMV+fX7ZnjDX/FPwU0GfX5OTel0jUbVUbeOP619FlOI5FY8LjHH+1fKkfmJO8eSHOav+FvDOueMvEFv4c0CBri7um8uJFHcjv6VueHPAeveJ5fMs4iif3jX6zfslfA5/g1oFz8V/FcYl1GcYs4mA+XH8f4jjGOK93G5qoQsfLZZkNSrL2ktj6A/ZL/4J6+B/hRa2/xA+O4S+1MqDBYdNjY7/eB49hiv0B8SfET7NbLY2cIsbWLCw20OFVQOmeOfyrzC68VeLbO1hGtWcxubhY5eefkcZDAbelc8dctNQnR/M3u+cg9sHGMV+dZniqrlrsfs2QZXh4wvHc6m3vL/AF+5N5MSdvIHQVDq9lrutgDRpRGU461wXxf+LPh34MeDl1S7kH2u4wsMX3TyQD69vavJfCvx8s7vS4ZXmCNMu8rnBHtXZlWWuavUWhxZvnPLL2VOVj25vh18Qb+QJPqIRW7noP1pLj4A30sXmahrWT1IH/7VcLB8abKWVIPOI3nj5sV7HoHiG61+y81QwjBwST/LitcRgYQ2R5dDMJt7ny18Qfh1b6Y3k6feSPIPRjXP6R4GtHs997ukY+pr6i8WJoDWh2tmWvEmljgjIjbHpXy+Z+67RP0DJpXWp5Hc/BW28Y6rDpWnSNBJK4RTngE/lXyl+074Q1j4J+LrfwZdy77hk3MexXtX2brPjB9DlW7s32SRkMPqK+GP2sfGs/jvxnpuq6q26aO3Ktz0r3cgo3jqfL8ZxhFc0WeVeF7ppLpruSQs1bd5eS3mpyvnACFR+Vcr4JtQha5HIHb8K7HTIYbzUxcKOC2CB2r3q1NbI/OKFRvc+4fh3dS22gWNhkDdGrke+MV7d8NYV8QfE+CZh8qBeOv3TXzN4Ml1TUbuG10e3e4aLCAJ7D8hX1P8L/CPxC8L60fEeo6TIkP3TlhwPWuKrLlWp9HgsLKUlY/US2uxPZ/Zhz5ZwB7Yrxzx5ZRGNtyYIHWum8GeKrHW4hPZ8MPlZSehA+lb/iTToLyyZ5BzivFqrmdz7jLsWqL5bWPg++8JjxBaXul2h2XMykRn36/0xX5765p+p6BfSeF9SRorhZWRlPfHOfpX6s63psumX63VkmCGFfM37U3hewuLe3+K9mgW4hQxzhem0DAP1zjtWuWRvJo8fibDyb9pHY+NJGht2uJ5ueFA+owK5PVdbSC5RUORCu8duvFcvqfiwzwLGHA3uW/DGcV5vq3ihd8mWySoH5Gvp8NhGtT4avWSXKy7PrkkF5DMp5DsW+hrp7yyhvIv7Z0hCIyPmA/I8V4bNqpeXz8cCvYvC2p3FnbJcx5Ik4xjhv8ACvrMDCR8njYq5Y0rVrqwbbYSN5fuen4V6Fp2urdR7JXG6q9uPC9+wEmLeQdV/wAOgrQl8GWl4A+lTqh7V67w8lqjiKk2ry6SGkCMR7Hj+VYkni2K4f8AeHA7107aRrdjiKQLcqO3T/GuY1DQ9MZjNdWxhPcg8fyrNSte6HHcv3evaZc6aYY5c8elP+FGmSX3xD0q2thlpLiJRt92AFcT/YOjxSeZHc7R6EV7r8DToum/FTRZrVwQbmEkfRhXPVlaD6HThE6kuRn9On7Fen+BPAOiaj/wtaziW4acmPzUWT5cY7j+lfXt98eP2fvDhP8AZUFnn+6LdPp2UV8IXevgwC4AU7h/hXjGtakZpztCkeuOlfxnxx4c0MwzB1qtR/e0foWS+GVDFrnqH6vaB+1V4Hmu0i0TTogPugqu0/oK+PP+Crfxt8ceLr3wf8JfDsLQ6eiQX8jdRho2GP8AP5V5R8Mblp9ShiVRjeMn27/pVj9v/Xvs/i3w3JAyg/YLcDPB2gEYr7jwr8McBgsQ68Xd9Nzg4j4JwWX6w3PmLTLiO3IWQ/6oBcenFdhHf28qBQ+K8Qh1eKRncNzu/OtBdVZsLHX7ViFJTaPm8Oex6h4ouorf7NAeMYrg0uZEYkj5j1asVbyVwGptw8siFEYAmvNqVpJnrUaN9zdtNZNu5QnOamGpCWfy889q82uLi/sWLSQkgdwf6Yqrp3iZLu8woII7HiuOvirI6KOG9+x6a41eyn+0qu5T6DtV7WJrSTSv7R01vIk3KGX1II6eldR4bkttYthbvJg8D0rE1/RpzDaaJcQ7WuLhQhHf5wK86EOdnVUfs4n3j4P8VWHws+GV78Qr9fMksrfCjrlmTgn86/nv8XePLz4o+O9S8X3CiNtRuDKVx02/z/Kv3n/ae8Gaj4E/Zs1PSLnCx3EUcjEHkABcDiv5odG8X6PotuZpQeC33ee+P88Vx5rg5zXKuh6OSTivePUmmF7rItITt6DHWvqb4T+GWvdYS5EO9hiOP6njNfJPgW8i1bVGmtYJJZZVJQbSOcHjp6V+jfwz0y90vQbK9H7mfgsCPu140MlqtHsVcXC65noj1r4pRQWV1p/hjR2LR2kKtcg/d8zvXgGpp9umFsw+UyAkD+76V9O6n4AuPGMb6hot0JHdcunAbOPUkV47cfD3x9YTyXtzYnyIUKhwQc49hmvybOuFcfDEOolofqGU8R4H2CpqZzHgPxBb/DnxC+raJLLav/qwUcqR3ByP5V6Xb/tOfFfTfEI1Wy168iP3Ffz5MZznO3dj2rxuPTrn7WsWoW7x5wxYrx/SuSurNpNTfbhoYpPbj8PSuXDY7FYdcsom9ehhq+uh+l/wy/4KV/tb+CNQazsvFAu41fePMQkkf3QC/YV+lHwN/wCC13i6PVl0f42W0csYOXZYx9zHXIB71/M+0Vrqd61nzBsbduH8Q9O2KvJePpSmKF9sxIQs/J2V9Rkmd1ZyvUex8bxHkOHVNzij++H4Hax8K/2nvG2m/G/wMFawtCGC4zhkIB44xnP4V+mdzewReRNa/MGcIwBwAoB7V+DH/BC/w1rPgz9m+bxP48k8uPULiQW6Nx8rYIPtwK/cS6TTNWeOy0w4DYO9T/Sv0zIuJMHVlye1Sa6H8/ZjWp+1cIvY7DULtLV1uNu6OTgY4qpOlh9oEwhJ8zHTtXL32m61JOthYPuhXCq5Ixkc9PwxXXLcXFvZCC6VWZR1+lfXXc9U1Y4Y19Uc1faGltfteW2ALgYIPAH61y9zoN/olx5lkWdZ+o7CuqN1ouvWrfaMwNGRz+P4V0qWsF9pfk7g3lj5TXHVwClsdv1m2p4pfarqmjl1eCTDjhieBUGkeNNVaAW75cZ/3a9i/syy1SwNrMgBjHU1zLeDbPWtNa02hDD6cZx0FedUyio/eiyPrik9huh+Mftpe3kjMezHJbIr0GC9F6jYTgD8fwrwW28PvAJJIYik1v8Aw564rQ0zxNq08JuHtX8yI48vPbpUQrVKXutFSpRe57M6tcW4kjBWRfXFQSXbwoLqf5lIwVyf5Z4ry278eXiRDUZNPdGU7QoPbpnp6e1dDY+I9Le2F9CTIbjh4zxit4YqfMiHRilojr7my0S/tEluYIZ0/wCmoD/hg8CvO/F/7PfwR+IGnm31/wAOafKkgwSsESkfiEzXcm3s2hSG0iJjkGT8w+WrFlDcWwezAJhx8r5616Dxqe8TnhpsfmF8VP8AgkH+yT8SA/2LSm06ccmRJMJ19FA+lfBfxJ/4ILiKCS8+G/iWGJcHZDIjN+pYdq/oztRPLF9mu1MYj+6c9f5VYtrhCri4TZtHy/NnNcValRraTgjrjXlHY/ig+J//AASN/aj8CRtd2+knWLVckvGQgwPbmvibxP8As3fEzwGjza7o81kTwBt3dPwr/Qyje3vrZTMg+Q/cYg/mOn6Vj614F8CeK7NrTV9HtLlSMEGKP/4nNcFfhPCzXRGlPNqq0R/nu/DTWtW8JarH+7PD/NvUIcd8dK/Wqb42X958Ikgtrhvs0AyqtwWPTHev2++PH/BPL9kXxZ4YvPEniLw8ltJbLvaWJtgXBHZcV/Nn8f8AX/DXhTf4E8EJ5dhZO4ixzuXoPpXyGO4eWB/eReh7kM7lXiqLPgS48N618RPjvLrl7dyrZ243vgnYOwGAR7VZbwX8WPEXjuR9N1aK2sHLLCm3pt/H0r1DwFYXcVk0gGJbxzubuB9PavedK+GXxJ8U2E/ij4f6JLfRxYG+PoCMIe2Oc18X/Zk8bW51ufQUswjSiqb2P//V/i/0CzefUHZP4c/jxX6Lfsm/s3RfGPxX5vilvsXhnTzm8nPTKYbYOmNw/wAMV8T+BdO2h7uZRt7e9ftX4Wu28HfspeGdK8Posc3iJEkuGTgvIH2r278CunirNZ4ekqZ+w+BfC9LM8z9nW+FH6j/sw+MfCM2vp8NPhN4YtrTQbZSscpjR5NyjAbeVB9xX6G+HdU13xKl1oHiYkTac2yJj3TtXwj+zd4EuvhF8PI9SvHS31jUlWRnkP+rTH3R/j+lfoB8Ozp3iRLe4s5vtM4H7x1I25+or8njivbz94/oTxC4fwtD9zQppWPV/AWlPIywRrnY3NfRuq6STpqRQDjqRWN4X8KjSYGvogMuBx6Vz3j3XL7SbJ1jlwWXgDtWlX3I+4fh1Km1U5eh86fHv4i3HhvRW0PTrlY224fHavxy8e/GFDqQsNPkZ5nO1pMHA9eme1fR/x71W/wBQ1eSO4nbfISOOc1806LqfhDw0JLXX7ZZGPO48GvE96UlzH6FhMC1S5oI+e/ib8W9P8FbRql+67xu/1bVwvhn4la54wia88NyfaYUGS23pXsXxIn+H3i8MLmzjk2jAJ9Dx3zXhcF5/wryymtPBMgtoLhcOuA35HivZoxhbQ5ZKvzI9G0fxpFcsbe/2xTjj8vwFe6eFC2qWf7v5s1+aKt4nl115kuml3ncRjFfob+z7dXrpsvFxgY5+lcOIoxvex7+Aw8nJXPa9A8P3eoTPZxKWPpiuH1FdW8L6hIk+YwGwue9fTnwFurW++Ismm6gQFfJHHpxXwz+2T8XpdA8Z3Npp8flxbsJj6/T2r0cFTTjY587xDpM9Ls/iZrVo6x2sgUg+tfTfw7+P/iBFFrrYJUYwwIxgfhX4F2v7QGu2t+TOklxGWxwvr0r9TvghbHx54VgudSJsGlHyt15xx3H0r2cPh3BXPkZZnGekkf0R/sw/tCaXfQJpclzlZPl2tx2r7B8eRD+xL1hgxtayMvoPkJr+eH4YR+K/B2spoM7/AL1CHjdTncK/dqy1DUNR/Z+m1rUH/exWMu9u/CHtXeqiqK0j5HPcPJfDsz/OE/bP8SNY/tb/ABBmJBEV0VH/AHyf/wBVfc//AASZ0mz8VeF/EsszjzXmyAeuNvP5V+Uf7a8mv6r+1P4smFncw213qG8SvG6K4HGFYgCv1U/4JzWtz4C8OXtwIvs8MtrIvmMduWZTyOPwr6mpGE8MoH5nSxM8HiHeNj7T+JPhPw5c219pVhqMdtIsbKWXkg/geK/FvxD4e8E+EfiTa3F/rp1C4jmUumMZAPTGTXpHx0+OOqeG9dn8K+DZnkvbuTDzE9Mt24PauJ8G/CdrjWV1zxTm4upITNk/3gOBivEhShCOw8XmDqysfQXh7TdT8QeOG16HC+ZCbe0Xp97lT+FcR4g+COv3PiuSC7hDnf8Avye719F/Czw7cat9l11QVMDAYA4GOhr3/WfD9xp+trczLuNy4ff2bIx0rzq+KilofQ5TR2Ppz9hH4L2OiwRXckCgpt7elfsNYeHJLYiWJdo6YxXyB+zFDDp+m2kSwruOC2OO1fpHJbEwJ5aD1r5DHVU2fpOX1GlZHAXSNEnl9NoryTxDdyQuXVsj+Ve96v5NtavI67iw/KvmbXzKyytjK5/rXh4ippofa5bFWueb6rfiaYq5zXnV+Q0hx0rqNUhcS5HGf0rjp1Kud1fNYjnb1Pr8DWVjl9Rt1lNc1c2MKqWIHFdTfEhTjjFcJf3jpkE8VzuLPahXuinNZJu3KPwq5YWaR8SDINYy3u6UKDW9Zylhk9qzsZ21NJdNjHzJ37V22jaM+F3DGelcqszBEYAfnXoOhXcy7HkG5RV04y5lc58QjuLPTERPLkGQK9b8NeCbTX7dFkjB2kY4rzm01CLeJP0r6X+GE8EvlBV+YkfhX0eU0YuornzmbJRp3Ob+IH7C9t468Mf8JFpMGy6jXeNvf27V+c3hLwbrXwn8dzafqFrJaFJMs/OM9Pyr+pP4dG0k0SKOMAgAZGK+Y/2uf2etJ8beDJ/Efh21WO9TOdi9cflX3WJy73VOKPxnM8TFyaPys/at8J654n+FVp408JhXuordTMSAMqVzgflivyDn1Vn8Pxm7l8u9mbypFI7dcdsdK/dKytn8S/B1/Ceqkpe6ZDsEfdygIwa/Bjx94G8e/wDCUXsk2mSwB5yUXBxhfTgV6GCwcqqSjHU8XLs3pUptS0Pgn4/eG73UNUL3DnyYM89iK8K/aA8L+HtZ8P6Hp2ocJFsbZ1H3etfavxC0K8nt7jS9WjMc2DgN15/wr4R/aL0++uNQsRpb5FtborJ7rxmi06VTkmjHFYf20+eOqOV8KaZoqahaabZxqqGTYQB2Azn9K+utU1u98QeL/DXw506RYzdTiAngYUKSDjgdvWvgD4c+K9PtfEivq83kJE3U89B6V9bfA2yv/ib8SLj4iQZSy0X97HP1QFflx0xnBrqn77Tl0HiMwhTp+xR+t0XxW1Cy+Ixg1WK3lsdOsobfzzs4Krsxt5r4j0jxFb638V9VBuALeBjcLjGNrZI49sVR0j4TfEP4hm48ReD79rwRTmS7RSuGj5AOByMZH5V8YxeMT4Ol8QaleyGOeGMRAZ67WIxW+KwLmk5LQjJ8wVOMvePjr9qn4yeLfiR8T7ya5nc2dlM8cKgfKNnFec+HPjL4nsilkwaQgDb6n26VZu/Fllq8hSWHfLNIxC7ecsa+0/gF+zj4fgmj8b+N4Au0bo7cn24/zivbpuFOjax8/XpVKtT2ie57X+y58LNe8a3SeOfiAzQWQG+CInrx6cV97694k07TbUWWlMqheFUHHtXhV749s7LT4dO07ZENyxxqOAuTtAr0bxDpngv4e2MbeNDJPfSBW2bdqjeOOcnP6V4OLkpbH0+AkqFNRlueb6/dXvmfaGfivN9b8QpawiMMdx/Kug8U/EHwev7pIRECOBnOB+VfP2r6joPiGUpoN/m7GRHC3AY+mc14lTLfaS2PrKeeQo0jkPiF4xSwhe435MYzXxTr+tXPii6OrXT9fu/T0rsvihdeJtO1658O65Eba4j3bkPIIGOh4rzzSNNhur2CzLcPhcemeK+gwODVGOiPh87zH273PUdEt7vS9MEw6OmR+PGK+uf2QP2cPFH7QPiT7Pp8RSzt3Bnl/hGOcZ4r5cvrW5ijXSY+XQ+Uoz19DX9Cn7F+k2nwa+D9lp8EYjub2MTzdjk9qmrVVwyLBKs7M+q/hX+zj8M/hVbfYNIsUeZcF5Ww2SBz1HFQ/ETV4IRLY2+wp02hVH8hVbVPiU0Omulk2wynnnp+leIat4jtp03Xk2HOc18zmuLaP1nJskjBe8ebR64nhLxQtzGdltKcMo42+9fSemeINN1i3Z4HEiMMCvivx5qFhLGxjlDcGvGPCnxum8Ga+NL1SbNq3CtnGPwrlwFSU0XnuGpwSlE++vFOmxyZWIZ9eOleD+OPDVv4n8C6t4SABluIiseezZB9vSvZvDvjnTdR0qLXbTFyp645yMeldnpfhjwP8RZQ/h25FreEDcrEDB+h/wAK9jCUuSaaOHFclfDcqP5d/HuieI/Beuz6HrVu8LwHap4wQOM15HPeM8p80EHtX9Cv7Z37C3j7xZov/CTeD9t3qNou4xAIvmAYz09Bz+Ffz9eJrDxF4W1aTRvFunzWk0ZKtvQqBj0JAzX6Bg/ZNH4znOHr0am2hnRzu37tT1rsPCvxLgtX/sa/QTwLx6ba8du9WdH82AfJ061n6TeR2V2XcBlk69B+texR5YtcrPna85t6xPtZfEGg3ECOzloR/Coxj8ec11On6r4Sk2Bbp4T9Ca+cvD96J4l/sqRD6glRj9a9MtReNGBMI29ty/0Ir0/b+Zi42Wn5Husd1ovlf6PqWD/un+tU7i7sNpH2vzP+A/8A1680X7PCoM0IBHo//wBerMPinR7X5QFyO1J16f22KnCrLaJrXx0t87t0ntjFavgO9ttO8c6VfWUWwR3EWST0wwrFXxjoske17d39ghNbOhtaalrFsNLsZgfNT5tjADkV4mYYyjGL5T18nwVb2vwn9DGnalLf6Jb3q/dkj3Dn6Vyk9x/pBKn5R1FS+ELiGDwDpVgf9dFAAx+vPI7elYdzIVmIQcGvwjOqsJ1nY/o7hqn7OkuZH0J8IB9p1+3it/4mBI/pXjP7f8Opaz+0BbWk8ix2dlo8PlLux86nBGPxr3r4B2on8XWNvEMM0ir/APX/AAr8y/8Ago/4pl1r9qK6jN+YYLC08lox3ZWHPUflX3fA0vdZ8V4hSjscVaeIrpS1vM/3GOMEVpw+O57X5XcACvgX/hZklrrTWemNmNRy2a6M/EKa6UIW5NfTYqK5j8xo01bQ+7rH4nW+cvKOO1bw+KuhsBHcEKfavzwtNa1We4/0V8j612Xh3QPiN401CHS/DukXWpvMdoMMMpUHOPvBCv6ivElgZ1J2gelUxEaMLyZ9k3fxX02BtzTgxj1xWafiX4SnlVnlVSe44r57+I/7M3xw8CPH/wAJboN3a7xnCpIcDt/CBXl2i/DjxT4ivRpWkQTNc527HyuD+Nc9XJa691wHSzahJXhLU/RLRfjR4I0xle+u8KMdP/rV1r/tTfDi88V6fELkzW+nKWZljd/mxlRtA/vYFfNPgT9gnxhqky3nxAufsUAwxVW3AjsOGX2r7H8F/Av4R/C9Hh0CwF5dyY/eOzDBH51phsslS0lEHVlV3R1Hxn+NXxH/AGkvhlN4V8KWj2sV2Qv2qRtpVOB9xgD0/wAOK+bPCf7HfgHwTY2NxqEg1PUYU/e5+Xk9eMsK+t0t9TjcSzoF7KIgMAdu39a1Dp8jRh5SGl4yOhxXasFFvVGtPFRp+5E8x0jw74f0qy3aXZxxSIeAVH5dK7mxtxe2js6BJBkgAcHA6Vpyafbby84HTgD6Vo6fpV5GVityrO6btoPKjv8ApXbHL4rY5600VrK3sbJY1mkNvPIm5QvTPoa7XS9V1qwshctcBXbjaVVhj9K5y0i00b11Zck/c9cevtVC5vX0gn7CRKwUsqseDxwM+vtU1aUErSMqdSpH4HY9B0zxb4YvJhb+PtLikhBAeVRglD14Ar03V/2MPhT8XvCl74s+AEm7V4oWY2XJ+UDIXORz+FfIU+uajJdG534YR71IHCyD+Db3+v6V9k/sufFjWvh9YS3ttKUaY+dPjH5dOlfn3EuVYe3OkfT5JmOJ5rcx+Tt3p0ukaleaBr0Yt9SsW+zsv91x19OmMVo/Cjwbq3xU+KGkeC4h58t9crbDaO574HpjNc58YdbbxN8TfEGqhv8Aj4vZJNy+5zn8OlfZv/BP59P8E+Nrz433li1/beH4Fu4YcE75UbaeR04NfktXLHJzcHZWPouK869lg9d7H9gmhfDu6+FXwz0Pwv4fb7L9m0+38yIA4EgXa3p161taT8UPGnhoxmOXIZcGMjP61+N7f8FgfDXjSVF1/TG0pW2jfk5Xg+uB7V9n/Bb9or4Z/F8J/Z2tW7MQBtkdEx/49X8/Z1wvmmHxUq+GZ/J9TGzeJlO5+j/hD9qPw/pr/wBla1EY5mbJyele62Xxy8C69L/ZkVyqu+MH6c/0r4PuPhvoes3gmQwSNtyZIpFfjH+ySapxeFNI0WffYyPLNyEO0rg4rswHiVnuXpQrJ2R6FLMJbs/SbUNT8NalFFpkEihpMZZT0xz/AErs7GysI4kitJ+gHNfkRJ4k8e+HZSqmQ+YeDgnj8q9J8PfGX4jW/wC4AY8dSMdK/RMm+kLCFo4qB30s37o/SO3a4lv5pPNBSIcjbim6Rqtvdyyywkpt4ZMf1/8ArV8g+Fv2iZltzba5+5mPBk/+tivePDfxY8M3MPkR38bTHrwBX61k3jDlOMio0p2Z6dLMoS6Hpd8ujPOt/O31UDGaz7jTNBtb2PUZGCq/RB2zx2rmdQ1vTNZu0t9yOqkblDdfTpVn+0dKm1pbCzleIRY3Rlcqce/avvMPneFrxtTmrm31h9JGvq2lWunaguvfK0bfIY+3PANYd9FoOmf6fdplJ2CnaCAPTtXbXaBoGm87K9QvB6VXs0uNR0dxckOuflOB8vpxXr0IKSvodMFK2rObe00zR7PMLFo7huOvArTbU9Oski0tzuD9CAai02XU9PtGj1dNyfdjbAP44xWTp+s2CNLYakxMjNhMjHHtWNRxWwcqRunUoRKdMuE4jP3x0NQ7ra7kEsceBH0GeuKraOdNi8zRrq5+eRsx56/Sr0/hQn/R45yki8jHejlnJe6T7VFeTT5DO2sWyYdhyueMD0rnPEHj/RfA2jya9qkmzfwsZ5PHsKuXvmWV8LFJ2V7dd7qe4r4x+NWneO/jVaT3nw5Vre605yvznZjHcAjB47V+a8ZY3FJKjhtG9DenNNHk/wC1n+1haW3w5u/DmhqYTKpadjn/AFbdOw/Kv5cvFmsSa9q7XTHcXkIHpsz1xX6S/to+PdV0ewh8H304nvpDtupMAfMBgjjtX5eQwTfbFXrgbc9OK8LG4ussNCnWfvI7sFFRnzI77RtPu5Z4obcZLuqRhepzx0+lf10fsN/Be3+Ff7PWlWD2cf2y8TzpFlVSzK3I4OelfzXfsneBNB8Y/GHS4PEt0lrZ2sikl8ANwcYyw71/Sx4X+P8A4dtNGibUHUQ2S+VGqncAi/Io4/Ovn48SSweLS5dDsxi53dH/1v5H7fy9N0w2sIwrLx2xX7w/sy+E9P8AEHwF+Hd1ra+eltbo/tuWXIH6V/Nj4n8eXErm00s7iAR6V/QX/wAE3Pihp3xn/ZnuPhXZMj694bliktoycM8UfzOR37YxzWvG9CVTD3iftHgdmcMHmN3pdH038cfjRqt34t1Hw7DKY0h3RKh42qoAGAK/TT/gnXZXz/DlZtYUoc/IWzlh7V8Q6n+yvB8W9Iu/ird3j6XfeW3+jsMFmGOMZHp6V9z/ALE994uPhi28P6vEYzp58sZ/iHTPQdq/GcshyT1P6l48xdOrhU4I/TSXWb2ApZ25yneuS8cPbPAkZBklIx9M10DbILtrgH5RwPevPtV1dheyXUmOB8oNepiaisfz/Qw96ux8S/FTwXptmsmoTxhnYnHtX5hfFKxMty3y7CD8uK/XH4pzW+oac+zrnJFfmn8RdKWabfnO0nIxXg1K9tj9SyNw5OWR8Aa1Y6xJM4tZCMdu1cddT6hAy2twd5PFfQPinT7a0dmU7QeteQb7FLsTSEEA1vQxL2R7NbBU3seh/D74fnWLtbjymJAxwK+7fhr8P08OQm+uARxnB4ryH4I+LbLT1X7XFiFu+K+2dcmsH8PDVrbiAp16fpXdytq8jiUFB+6cX8CbCW6+P1rZAfu5Djj0bNeeftp/svXWoa9Nqlhb+ckfPoecjpXX/s8eNINE+M0GtTkMQ4CLn6+1fsZ8WfB3hOw0JPFvjofZoJ4k2kDOcjOe3rXqYRckVM8XijCwc0rdD+STR/hpFpEi2V9ZBgH+YFeeOlfpJ8ENb8CWdtB4f1e0EW3A557fhXvnxD+HXwu8RSNf+GblHK8r0Ge3QV8keLvh5runyefo8mHB4dODXoSxz5bHy88kVk0j9FtC8N6N4w1uDxF4C/4+9KxmE5O4H5Tz9Ce1frjpdzHd/BEWV7H5Tsm2WPPZsKw4x2r8ov2D9B1yS8Eup7i74Vyec4FfqL8Qtf8ADvw70Hf4mn8mCWVVRsYHJAxisqs3CmmjmxeAjLFwoRWh/Pj+294K+Enx4fVfgRD4etrG80xJZbe/QbZcxLvGRgenrX5VQlvh18L7Lwysn+k2sbRPgYyRxk1+2H7XnhqKy/ao0zxPoCb7DVrSaYhemFXn9K/G746Wi6l4uv1soxHbs5EYFehlmKdtTwPFvh+hhvZ+yVmfFtv4DivNWbxx4hjWRYZlJA7gHNejWGrXmr6q9xp8fl2/KxcZ4PbtSX2hNBaf2DHI2+ZssBzgYr2rwL4NSzSC2WP5QoUD39a7cTWVj8lwuGTWqPUvhHbaykH9kWMO8zcHtt4+lfTY0C/1DVbTR7pRI8KgfSsfwVolx4ashqNvFmT6Yr2LwhdT3WvrfzwgmTG5h2/Svk8XVs7I+ny+k0tD7k+Cnh4aZawQt9/5ea+47YyxoATjHyj8q+Y/hLBZ+ZFPMwyMcD6V9Z21luPmsQVPIrw62r1PusLTtBM4jW45U/dS/MCK8jv9KlJZHX5TX0Lq1iI/9fz6cV5det+9YP0HSvPxNB7xPqsFW92yPDdZ0BEwQucV5Tquk7ZCqJX0feSQ+aTKRivMdce08zzIiv4V41eDPocDN2PILjw+8sZR4+tcRqngohWZR+le6S3COmIiCRVGRXmG2RRj2NctmfRYeaPmu28JzJMTjmuotPClw8JAWvTzofzGROB9K0tLsZA21l4qlSid949Dw688PX0Y8tONtbGmXZ0yzZJid/avWdR02AZJXmvItdhnlujb26YFdCpLoZOClozQsfFkhfb7ivrD4V+I5TeoqHOcdK+XPC/giS6YedkkkV9o/DLwOukulwV+bjFenk6aq3Pns5w6cXG5+ovwjvZjYIEXPy/0r3u7sbe9sdu35HxuTt7188fCLXLVIPse4KcAZr6IXUW8lVU7RuweK/TfrKdJRP53zuM6Ne0T8xfjp4F0j4f/ABFg1G3g2Wt84JxgAZ4x6Vk+OvC3wu8RWseoSnTkEOAU82Pfx688V9OftZ6Q9z8OL3X7FN81mjui4B5Ue/8AhX+dJ8e/2rPjva/HzXvD2jeJZ7G5k1JoFizlVwwwQMACvUyniKnl6blG58rjOH54qXPex/Tz+1j+z58Ene+8Wa7fWdhZi18yKaORGJf+5sBHNfzDeOBpl1rF3JZYntlkZIZP7yj+Vfav7W3wxu/hf8EfB2uat41l1y/1+GK5u7MuMRySjOeGJx7YFfnbdagYIRERwOBjpXzc+KI4/mqxifY5FgXh4ezk7nz58RfAxS4GoaVlGlOG2iv2v+H/AMG9K8P/AAJ0v4ceFLw2f9qRR3VxLgbmdwNy+wr8wtCjfWfFOmaKV80XE6p+ftX9BGq+DPD998L9KtNOQW16lvGCynleMdAK+hyvC+2jeR8NxX+6q3gc18L/ANn23/ZH0i/8Q3N4t99vtRgo27G4d+SPav5lP2r7zVNI+Jmp6f5gSzunLBVP1bn0r+nTwh8LvEPii/tNP8QajO1mGAmjdW27AOOpH1r+db/gozpHh+6/a3v/AA34ThSOzgji+564wf5V9HiacY0lFo+ZwGMnUqckTyv9njwNp1xIPF3iVQ0cX+qUjjpivrvU/iDbvIIIXVEQBQB6Cvmu0b+x9Ch0ezbCoo9qyYXumuASx6ivmcZUl8PQ/UMtopJKR9NeBdUfxj4/03SDkxtIJSOvER347f3a+8fjB8VdK8SeJLrQr3T0vdOtRCkWflK4AB5wc4r4d/Zm02G7+JUVxM4jS2ik+b6xtj6elddrPiXUbO4uJL0BUWRvmznI3j29Kinh7qxy46svaWfQv+NNE+GLWU2pTahLbKByqpkfTrXk/g7w38GJ4V8TSajLfNFKrLBsKg4Ydwa2ru+sNV8NX93I6eUQQBxnPSvPfDl9YW+hWkFkoQlGLLgdjivUw+HUVqeJmOO5tDw39oTxdb+OfiZeXyRC3hjyIlXsDgcnv0rzn4daZb6j4gmGeYE3fkMiuW8aXpfxVflnIYOeOw9K6D4fytDFPeQPhjHyfWprydrHDUr8sE0dl4W1uHUfiLY6Xe5ObuMbu33q/ow0rVLaz0S2jhb7kQGPQAYxX83Xhu4s7XxDY3xALRzpIT06MK/cHQPGNvqHhu1uLZsnyxnn1r5vGKS2PqeCcxcqnKexTeLYvMPmtgeleFfELxRLI22xcjHpUOpaz9phzAea4S7keVsz8ivlK16k+WR+00qqUdDkr7V9TSAiZzntXkmr6S+s7HvTwWyMfwiuw8W6ulhL5Uhzn7vauAuNdAYoWA4+WvcyzDqCtY+WzjEuWjPqP4EeIPENhrdv4X0UmaCYiP5ui+pP4V+ofh/4F6DZeII/GCXLLNDg+Wn3GOPr/SvzF/Z08a+EdIu7Wy1BlS6vZNsjHsAM8flX6nS+LYDbrbeGZRJBD0b146131tNEa5TOMY2kdzrlxr+tXxJUJGMBR2wPyryD4pfsxfCD4zaL9h+IunRTTp9254DL9AAPp1rfXxjMYyC+5x6/KBUn/CSx3UQjE/ze3Ncf9oOijTHYenV0sfBOrf8ABM79mRD9mtFyw7gH+Wa8w17/AIJXfB27ydPvntCR8uF/xbH6V+ndjBfTXW6GNj/tEDFa2pwu/wAkpwVHoBXH/rNiL+6ddLhTCSgpTPxOm/4Jd+GbG6ZYvEMyjthV/wAa27P/AIJv6MF8tfEE3H+wP8a/ULU7qASlWYfKevH8qnF7Zxxg71P5D+ldUeKMQ3YqXCOCb0SPzi0r/gnNoUbqL3XZZk/u7R/Q17JoP7Evwc8Ooq3dr9rkH8R4/wAa+xIry1l+46n/AD9Kas0DP5SMHJ9BUV+Iqy3YsLwzh4zskeFwfAj4X6WixafpEYx3OP8ACur0zwL4f0Vt2l2kS/8AABx+lepJFBGpdmyfSmKbLBXqD1rwq+fVW7HtU8io0/eijiDpE9rOZEXJkXOf8KtWmnSeeplGfaugkeNX3bs4GBmrG+2a18wuB9K8GOJ56j5kexRj7tke/wDwUigsfFVtep92F0kJHbFfy8/ttfFpfF37U/ixvtTLHb39zbDHI+SQj29M1+/uufF6x+GHw/17WvPCTw2b7M8YOMCv5NfFfxD0/wAS+MNd8S6gu59RvZLjd/tSEk9vev1jhGm4U3I/GePMVD2igelWN/bwsIo3zvAG71/wrqhq4UeXFKOPXj+fFec/DK1ufF+q2/hnSrfzrq7cJGnXrX6v/CH/AIJ46Dca9bJ8ePEJ0VXUSmK32S/IeACCy4OccY4r2cVjop6nx1Og/so+C/DmuajNeeXY73IOGEQ3/wAuK/UX9kP/AIKgfG/9haJrO98B2/iLSc5VroFGUE+mxs+1fpb8GP2Sv2NPh9pEtp4XgtNQuy5/02V8TDjjCBivt9K6zxn+yz4K8UQo0OlwXKsCC7/JxjjC9OK1wOZxpu8Tix2W+192aPfPhT/wXn/YK/aGji0P496Snh+/mAVkaDKqT6FgowK+yND/AGev2Cf2grT/AISD4J+IdOiluPmaRJYA4z/s7+K/nA+Ln/BNz4b+K5JZrKKRLgLgKkfyg/XNfDl5+x1+0P8AALV11r4Ta3c6eyZKiB9/T1Xp/hX2mC4spr3asbnxmL4PlB81Gpqf1y+Kv+CYXiOJJLjw34lfV4lGYovL2r7DeMivknxv+yV8avAbmLX9KKWyjOY8yMfTov8AWvxu+E3/AAV4/wCCmX7Myrp3xAWTxTp0BAWO6Yr8o4x8q/0r9kf2ef8Ag41/Z38bW0GjfH3R28J30mFk8qFpVJ+rY/lX0MamU4tWTszw/a5thH+8V0fOWoaJrelTG1ubeWxweTMu3p6A1DbPaiQRFNrNw0rnGfoMf1r96/DfxU/4J+ftQaONV0vWNI1Dzh965nghlGemIy+a/N39qLQv2VfBWrt4c+HmuSXmt4YrZRxbosAZOJAxH3QccV4WY5Fh6V2paHt5VxLVqvk5bHx2ttHlp4SPkOMy/Iv4dazZ7h7LdcRqFbH7zccYT1X1/TisrUdXtLqyjjj3TWUkbI6MMNDLj5ef4sNj0rO/02S2jj1c+Y0Fu0QbuwIx07V+cYnHQhNxifomHwsqkVNk0FzDc3IktF/fLiSOXs6Lzjb24HrTILG2vrd3uyUDXHnhM8qR2z6e2KfGUtNMtzb7QsMOMfxfSn24RYxG6MHkTcp7Z9K8TE4qUup6FOhbRGVfN9kd5iQiSyZPfArs7LxSngT4Zatr122z7YWtYM/xErwR6VxcWjah4i1KDRugnYQoevzn24rgv2oPECR6/afDrT2As9OgUSgdBcrwa+R4ixTjStc+nyDAXndI+XxMpP21/nYjdJ7tuzj8q/oc/wCCfPw20fwP8FTceINNFzJrBLFGHHlOMj/PFfhJ8MfCF3418Z6X4VtY/MN3MqOAM8Hvj+lf1YeDrR/Bnhmw8M6fafLaWscR3LgEx4/KvyTiHM50MPpufEeJec+77BM5G+/Zw/ZU8epc2+taMLO6mAAkUABMDqAeK8M1z/glt4LvGj1b4QeLJrCc8bBhckfRq+3dL1bw1rNvLFqmnp5nQEdM/hXpOhfCJ9SiiutNvRarL0VWxtxzn34+lflkeKa9N+8fhdCN3qfj7J4H/wCCgv7MWrTr4P1NtYtYedpbcWXoOleteCP+Cpvxq8E3P2P4v+A3mlUYabEhBx7bR/Ov1ng8D/8ACHSLfT332pZDt+fB3Y9s8VzvjC38D6tGLbWdKtrov90YXp+VdE8/w1f+NA2nTcNmeU/Df/gqp+yv4605I/Fx/sO4TAdWU8H6MRX2Z4A+PPwI+IrLP4U160aN/u73jXPHpur89/GH7Dv7KHxPiVrnSodJvpv+WiHBz9DgdK+WvG//AASMv9En+3/AzxZN56jckQcIoP13EdPasK+SZRi17r5QjjLdD99Ne8I+F9R2zWcscjMM4iYOD/3yf6V5Je+BtQc+Xom+O5Y98qOPrjtX8+uraT/wU+/ZoQGKSXU7W3OVaJvM+Ucfwpn8q9B8Bf8ABXr4yeB7v+z/AI2eE2yFwZHjkz6d1ArzX4bvV4Gd0bLH9Ej9yBH8QfCV8JLGdpG6tg56fTNdZYfHrxfDcqL233svD5GMgfhXwB8Df+Cpn7M3xFmez1i7/sa8YgFWUBR+JIAr7Ys/iH8LfiDm48K+I7K438bDLGuB+BOfyrwauT53l75qMnoCxNj6H0z9oix1K2CbFgkUYLE9P0r1DTfirpT6Wlvp12Ekk6hulfHWo+BfDtzpAnubgK+5dvk5cPyMcjGPyqnJ4V1ibUE06yZVCDox2cY65Ne/w94p5xhJctW+h6WHzGfc/SfS/G8D2kaytHLhcAKwbn8qqDVdD1nWwJYsOgwcdRx6V+f93Lrnw/lSOSZ8su9CvzDH17Vmx/tLT6dqZ8xT5ir98jrxiv1bAeO0bf7RE9T+1Ype8fopZ+GtI1XWHufMG6P7p3YI/Cug1fTtY0+CTUNPkWWSNCVUnAOB6818BeBf2ktH1K8mu7tFgkXvmvoCx+MWla9pp/s66SR8fNGTt4+v/wBav1Dh7xiyqskuezNcPiqc9j1S91rU/wCzF1jVbONLvaAxLfL0z1xXxz8Y/wBrLwVo2kX+g+D41e5EJW5lT7sUg6jIHOPwr6W1u3uPGfhyK3M+xPvbFPtjGeK/BL9ti+0H4B+F7/wz4euAbrVJndyTzuPVe/QV7eIzOnXn9YpTXL8j0vZqS/dM/Kv4w+O5/iH8SLvUs+ZCsjLn1Yfxf0xXDWEBmumMZwAOtZmlLcCyFxIFLyDe3PTJr1H4d+FtR1/VIrLTkDSZ5BOMjFfmmcY6FSEqtQ9uFHlp36nqnwO0Tw1rXj6BfEVl9qtNP2SylHKuqnhThc5+bHpX9A1j8PvhXb+DPtKY0yxWONlkc/KwC+pxg57V+Vfwi/Zc8UajE/xQsLMaDehhFPEmSkkSMAGbp1+lfSf7Tfxb8IX2g3vwI0a8nuW023hlnVY8x7mAz86txg9q/DcyhjqmK56GsQjVaVmf/9f+EkTEuGzjHT+lfT/7K/7RPi39mv4t6d8R/C0pTySsc0a8B4yfnyOhyCa+UCzdKswzMoGMH619Pi6Ua8fZ9D0crzOWFmq1Pof3UeGPiTpn7SPhe2+LXgLWUkS6jVpbSNgHhbHQoOnPtX1H8E/GWs6D4ktdM1RiA+1ePfjkY7V/Br8Jfjz8X/hLf7vhzrdzpwb/AJZxNgNnjB61/dv/AME3PB3ijXv2RdB+KnxVRrzX9cWK4jlm+8EfOQP93GOnevyjOMhWFqXWx/QmSeIqxuG9i1qfptcyIlsWb7uQVPTOa+c/iNq72WoJDAeH44r2vWb3y4orS4OGAHFfKXxeup7DVra5P3dwr4fMMRZ2iddDlcrxPNvG9zNDHITnBr8/fifrdvYzvcCTCNnjpX3H8YNb+w6B9vTkbc8Dtivxx8Wa5q3xB1xwGMdvE5VT2rhpx5tz6+j7kFY4vxFq93rdxJDBuKA9qzdP8KC4VVl6+/Fe+aT8KLZbMTLeQqcZO5sH8qvP8PLuDbJbNHMp/unJrqhS5dT1aOJVtD6c+GafCyz8BWtlq6GO4jAL4Xd/UV9AXPjDwb4g8DvoWgwIqomAx4PFfnZatqujN5d2jEKcFexHbiu/0X4nWOllrX7OsYYYPrXpRr3i0N11uzS+Hqx6B8S7a4t3L7J+eMgAV+4nxL+Kfhj9oD4NXvhVpo4J9PtlCHcOqAfTHSvxO+Gkei6z4gmuXnIaQ/LtHT9a+p08M2Nhos9polw7yTDMzdD9MZ/rXp0JOdP2fY8LNczjOouZH5o6F481/wAJeK7rQL6Z2EczpG2eCOf6V9h+EtbPiG2WFn3nivkD42eG7jSrj+0rZSskBLcdW9f0ru/gZ42XVbSK4tyAejLu5B/Ks5Q5dzSnjYOPKftJ+zL40tPBji0nT95kdO36V1v/AAUR8ctcfBvTbmFXMslxAsSr33sOfbGMV4b8EoLi/wBRh3fM7EDI9K+s/HI8Jy+LbHTfGSrcWEEbrHC+OJXH7s+21sV24ht0kjjyqEfrftOx8W+MPBOs+NNK020WTF7pGmzxzSHgqzpvUe2RX4leOfD0tnftYzMxniZskjPev3i1XTn+Gj6roupXour/AFVhLI27hFUEKBycccV+MnxMsLu98b34iGVLlRt6V1ZfaET888UsY8RXWux4D4Y8L2z6nJenEj56n8ulfUvg7wvAJg9yBvXBUAVzfw++GN6bndGCXByWHSvqvw14GewudzO0hGODRXxB8DgaGlizZxRyaaLHZiX09K3vBmj6nLrP2S0iZ1XgkCvRtK8GwanIJ3XyyeDgf/qr7J+DPw60vTohO0e9z3I9q+ZxdbU+uwGER0Pwj+G72FiuoXOTvAODxivpuxsmjKq/AHQVUtTBY24hRenbpWhBO0rDd09q5eZPQ+jvyxt0Idf0+4eIMACMdfSvBvFhWyVzvAIr6M1jUbfStNM87DpwDXwP8TviFPDdSNEm4NnAWlUaitWduBqOTVkcXrvjaK2uXRiWx2ry69+IWmxSbJzj9K8n8R+N727vmNpGxcnHTpXGaj4O8SeIV8538sP78189iZN/CfVUqjgrHtE/xl8G2F0IWlOR1rah+OXgSZhEZ1T36V886d8ELWBXub6VpZCOM8Y/WuOvvhJpU10IvP8ALdT61yqq0veR6FDFs+9tE8V+HdYP+iXSMD2r1CzsoJ4Q8WK+BvCXgPUNNmX7BODt6YNfX3hiS+srSOOduQKy9qepRxDZsa9p7wsMciuKt9FNxqG8rXRaxq73D7EPT+legfDXQ315zcSJhV/GuqjVR04iq6cOaR0nhPwlBAizFAele1abc6XZn7NNKEbgCvLtavH0XekJ27flxXx98Tte8ZXTltPnaDHQg/8A6q9TDVVHVHyuJTq6xP2F8Da9bW8f+hSozIemeSBX1t4G19ddzEzBv4semO1fzIfDj43eP/AvibyvERnktmGNygnrxX6QfAz9pp9S8Vi3WcBFAA+b27jHFfQYTNoaRkj89z3KG7ySP0Y/aF0+4i+G+r2Tf8t43RMjjLLX+dl8Vf2RNE1j9oLxH4w8VazJaTDUpJRGgHX05Ir/AETfidrR+J3wkmXR5B58ZLEggHgV+aN1/wAE7/2WrfSP+E2+Kd1aTX2pHzJI5JEwGPJJ+cdPwruzPB4jEQXsZWPzqtmkcM/Zzifxd/tS6f4i1E6V/YNrc6laafBEnnRqzsPLG3gD6/gK+Uhrn2iDZc742Q/MHQqV/PFf1O/tCfC3wt8E/FEun+DhYXWlXTfuEgkRxsPHIBJFfDHjv9nr4QfECyfVNWs49Kum4D2wz+OCcfpXq5Rkn1ajy9SqGeqMrvY/I/4G6nZP8ZvDlrcn5GvFG7g9jjgV98fFL9pQ+FvFM3huwupRJBgcAgYBIryzUv2W9K+D2rWXxisdZ36To0/nzLIyKxVeMBfxryX4qzfDfxxq4+JOja0ssGoDyxEjKXXGW3MuRj0r67AUrbHzWfYyNapzWP1Gl/4KMeDNb8OW3hK20uK1n8lEmvFYmQFFxkcAcmv5/vjNqen+IfjHqvi6KQziTESueM7c8/r0rS8Y6PJ4a0QavaX2POlKkbvm29sV4nJdI7bpsnPXd1/CtcdVZfDWWR9o6skb/wBsluRtBq0mqm0hZVOSBXOwyhBviKgfWuY1XxHa2cywwOpkk+XrxzXlRoe0aZ9RicZGHwn3V+yzNC2uardXyyP5cX8Az1X2q78S7ixlsLXSNMnWU+a2QSM8nOCAai/4JlaD4y+Inx0u/DHhkiS5ukP7pz8m1UYMCfTbk9K/Vb4jfslfs7arpl3p+t3KeHvFETh2bT8Mm7dzly2OgPYV7VLBxirnydbHupVdkfk6PCOmpBBo8abbmUb9iHco4zyc+ntUVroDaX9pur2IJHZW0m09uAT/APWr7J8R/sg+PYNGn8Z/DzVoNTksR5SxtInmSKRg4Vec7SeBXxv8d/EOreD/AIRrouo2slnfvtSVXXbIN/XI9BjH41hUqK9jz8RTfU/MnV9SfU9Zub58Ylct+APSvUdPu7aDwmq2iCOV+pFeSxwxiBWfAJ4Cn6136j7Hp8QbuOnpXPWirmeLVoI09OcvLEoO0qRzX6W/DzxFNbeE7Zg+7gAj9K/MrS8SSq2dvtX2t8KdTN94dNs/HlHFePjYJxZ7/BiVOrzM+rYtQke3Dxt1rWhmV4CZfm4rzTTLloogrHK10VvqScKelfHSo8sro/acPik4nE/EvRX1HT/OtDiWMZUeuP8A61fIjeMreO5/s28OLiPquf8A61faviUm4tSI+wr86vjjatpGsLrFmuHxg4r3sD71rng50+WPMj3XRfFNsZoHY7SrDnNftD8KvEeg6v4Ltbeyb97HGpaVDnJ44r+cjw74rS+hiTdjO3cfQZ5/Sv1V0f42eGPhh8OrDTPBswlkWMSSknJJbjbj2zXpVcNqePlubRu1M/RXUr17RcPJnPQVhT/EnTfC1uZZVBkxwM1+d/hD4y+PPiXrTW1mRHGOp3c8/gMV7tN4SvJkVLu5LyYyR/TrXzGZUbSPs8BKFWN4no2r/H34iXGm3eo+GjlokLJCTwdvPp6e1fnpe/8ABTrx1a30um+JbLypYHKEZPAHH90V9RLDdaLdGRfujqueMdK/PP8AbW+EVrA9t8SfDsWEuM+eqDgfl7+1e5klClNWmjxuLKuJoQjKk7I96tv+Cinh28YSXgMUnfAz2+ld34R/axu/iTq8Og+D0mu7u4I2pGOg9TxxX4XN5kqq0XcYx+mK/q0/4JLfs0eCvAvwot/i5rNst1rOqx7oy6jEajjA654+le9j8no043ij5HIeKcVUq8kmdt4X+B3xYbSo9Y8SXbWYkGRGW5wR+FdjZ/DPxRH8tnfM7Dt619gfEK6uL6dpAmVHp0x6V47YavcW14I44woz6V8HmMYcx+0ZLB1FzTPH9W0zxz4YtTPeQedGvXb978K8vn+KFrA+LndAR1DDpX6zfD7w7o/jqwFleoobGMke1eDfGf8AY6028hm1DQ1V/UDj+tckcujLVHpfb5T4Jb4r6NJJ9nhmWQnAAzjOaw9Q+JccNt5UbgOedpOCCDgdqqa7+zLrfh7xNp+rpAGSGdXeJvulVOT+lUv2/wD4LtpHgOx+LPwzneyyNtxDCeBxnP4fSujLsjU5u581nXETwmkT4A/bB+PZs/B8nha3n8y8u9yyBW+6p/nX42rOxG3AHt+GM13PjW51m41mW81iY3EjvuEj9dv9PSuSuYYZU+2RD6gV+o4DK/Y0VFH4BxBm08ZWcz9Hf+Cd8FhN8Vv+Elvk8x9PhWSPA6EHGa/X7xHq+ieIfEfmXNsr3ckrO8mDuCEcYGentX5K/wDBN/z7fWtVvJkzCbbbn6NX6faQtrPd3mueYfM/1aj2Havg88ryjUduh9bw2nGheRrHStP0+7N94bvZLKcvhMZOT34zxxXqOifHv42eBGH9pSHUrOMfdlbt0HavDJprq71iCziUARDef7wzTdX8R3EBn+1EvjCoD0ryaGZzWp7jjCWh94+F/wBtzw3qMMVt4nhksWc7SkaBlb8eK+hotd8DeMbdLvQ5LbMi5+R18wcc5HbivyRS70+S2slltEk67uPbjis3R9YVb3+0tHf+zJzIMtGTn5GHQZ79PpX0WB4js0mceIypSWh+kfi34b+C9ct5ibOG88oZfeuJP+Ar3/wr8/fi7+yd8Mde0e6vNH09J7iNvnVhtZB17V9Y2viW/wBZ8IzeNobxhqVksSqqn7+/g5Hb5c11kx8vxPezMTtKQrchhwdynHH1Artq5kpaxPIngUlaSPzB+Gf7EnhXQ9YsNXs9QuLAXyNJEYucMgPYn29a/QLTvCIgtdNv41zqEcbE3LMdxSPg8Zxyua7Ow0W30n+zfNQbLCGeCU4+7JNkxj2yDUwgjs7aCKVudNVoT7+b1/Q4rnlmVRx5eY5qWW0FPmUTLMStMscAXy7geYPrRJ9iFqDL8tyrADJ4Yf04qvKl04NjboAn/LPHUL6VWlhso7xTdEnaMYx3ryakmpXPaUFayLarCytYzpje2Q47D0qa4mMcP2NG3HhUfHTPHSmWlnK8zSEkLj5R1FaslqVtFkYD3PoKznNWuVyM7b4TeH4rV9Q8Y664WHSbR7pD2MsXOPbOPwr80vEuvSeKPEV9q10Sx1KdrhT1++ePyr9GP2gtUHwy/Zps9KgOzUtduFk44LW0q4P4V+YVvemJH8lPmhXbEv0FfCZziPay5ex9llc1h6Tmz75/Y604aJPrHxbmg+XSbPdD3/fIcYz7j24r6Y0j/goT8RLWNf8AhIbYSRSHcOfXt93sK7z4LfDU+AP2ZYFv4VFxq8gnYH/nnJHz+tY1h8Dvhx4qukjurgW0jqAqJg4wPqK/PM+zfDpeymj+ZeO8w9ti5cp6H4S/be8CXVvDZ3PmwzXEuX2rwPx4r9Cvhj8WdK8WGOLR9UhbAyCZANvHf+VfkpqX7CM+qST3fhHU/OYcCMsMD6814r4g/Zy/aW+FW59EEsYPPm2xYnj2Ga+DxdLC1vgaPiqXMkf0W3tt401O1ctNld2VIyQR7V5pq174h0VFvLjKpHySSc/ljivw68K/tl/tR/CZItL103t7CnBW7RlTj32ivU4P+CjmpatM8nijT4ovMADbGYkfQYxXHT4bqOPNTaFzPc/aDwz440LxTFBeX0SuIdwO7gdDXo2ma5YW1vLf+Hb3c6lcxcqh5AxnnpX46fDL9pzwJ4o1VbfU7pre1uD937ijAz1OB2r9VPh3ofw38UeG1u/DniSNo2ALIJEx+OGJrwMTgMRSlfkNliJHsE/jX4iazYzQRrDCsK8becj8hXzL4t8P+DfFU/mfE3w1b3at+73HJ6nGeleseJ7HxXoMKXelzeZbwg7Cpzu4xzgelfHHjv8AaDn8PX4027cYbAZHBG3n1xXXhMTXj8CaNPaLYk8R/wDBOb9lP4oJcR6HI2g3DLnMK9D167hXyf46/wCCY3xZ+FkP9ofBfxfLJCBlC8gT+p7V93eBfHuh6uUuL2YRwtgjsW9q+0bH/hBPEFhBEhUJjgdR+fGPyr6HDcQVqek0VyI/ADT/AI7/ALfnwDSKw1UXOs2ltxhSzqwX/dQ19b/DD/gspZ25h034xeE/I8vAlmKysw9f4Bj8q/SJPC9lBq0+68R7NQStvJgIwA6eteE+JvBX7O3jiSXT/F3hSxg8xjH5qK27njPBFenTxWDru9aI4Rktj1y6/b5/Zr+JXgB7/wAMawttKCqJHJtjwDg4AZgeK8ti8f6HrQS5i1GzeN17yp07cA18f/E3/glp8KPGNhc3/wAJNVubaQNuEPAiBA9S2Rx0r5Jv/wDgnd+094aj8zwhqnmiEf8APTJ4+lZ4nhTLcT/CnYzxEJM/YnTL6zbfLbqVdjgbBkY9RWrovia4F7LeW109u1uNhHK7sV+DJ8c/tp/s86i0niO2udVtE+XyyGdML/ujNeveC/8Agpro+m3kUHxI8OLa72G+TZICO3QjFfL5l4ZVYR5sNMmjipUo2P6KLb46t8O/h5qXjrxbqbRW9hBuRZCBuwOwr+bP9sD9q3wv8YfibbRaPqUM0bqLj53A5btWv+3d+3D4L+K/wns/BfwqkkY3Dn7T8uMRlcYr8IdQ8Bw3Vz/aeXglRQokB5AHQDPFfrPBuQYnD4W1aR7GRcRwpztM/XbTNch1O6S1hVXwPmMbAjpx0r9eP2Jf2atT8S203xT1qJDp1uB5ascFnXoAPriv5YvguvxX0rxjY6X4d1J7sX8yp5cuAMDn09vav7Jvgd8RNW8EeF9L8Garbm2FvbJI/l9N5HXp3r8x8Sc8nhI+zpyPrp8T05aI9hTw98a5vA2seO5LhrOyhWSOGzhOWlQdBtwMV8Q/Djxv8OZP2a/Er+I7Q6b48vLl03bP3xjEg25zyePav0Btfjnc3OqBrCRisfDxkDZzxx/+qub1P4TfBDxn4lfxlq8X2HU5BzJEuNvHbkD9K+byfxbp4TD8jp3kctXPYy+E/9D+Dinof4ajpyDIJ6YH/wBavqqKSlYwhLl2PaPgdoY8T/Fbw14cx5n2nUbZGX1UyDP6V/pd+A7HT/BXgHwn8ObFBHFpVqIVQfKMfLjj2zX+e/8A8E1/hp/wsv8AbA8J+GyA2yeO4bHOBC2f/r1/oMeNM2Pi37LbuMW7hVI9MA/0xX5xxbibz5Wfq3AuCdROojrvHUQt7/zicJgAV8y/GOM3Olm5A5jQlfwr6d8ZRyXWjwzsM5XOfwr5w8RL/aumGzcZwGU/TFfmOYUk5XR+k5a+WXKz5h1zf4k+Hyq2GKjyz+VflNqvgjUdP1nUdIt2ZQ+7YRxjPSv1g021NnrF3oG3EcvKDPQ4xXx/8R/Ct1ofxFxcDCkAen41y0nytH1kK142Pwa8cXXxt+BnxWCeKdRurjSbqTcrZJAU9vav3e/Z/wDBMfj7wDLr9hfeaBarKu1vmBOPStDxh8HvBvxX8NyaL4htomdUwkigBuf8K+LD4b+O37LD3Z+HMv2nTriPyvJkc/KAQc8DnjtxXq6Tj7p0UY6aH3Vrvwh8d2NzaWtspuftG0DzFIzn8O1eJ+LfAfinw34ng0fWtLJnujiMRoTnnGPyr0b4U/8ABRnR7vWNPT4laW8U1jEinYhZdyjHViBz9K+wbH9qr4NeOfGGma9Aqb7KTzCH2AgY6daWGwtQ5sViqtJbHyT8PvAXiTR7s3EWlPE2FdlKHjPHPpV/41ftk6R+z1YxW3jnRdm9fnOztkAY9a+9dM/af+B15Dfah56G4vNyMh24URknoD+VfiP+114I+Mn/AAUU+PY0n4W6VJpXhLTdiPc3C+WGCLg7eMcmvewdBwfMfOTxsqjtNWO/tf2p/gd+0FAbLQ45YLlkJ2lVAwR165rK/Zo8H3V18Sb/AEfSwWtfMAQ46c16no/7EfgT9mnwpClrbi81mZBEZtoJyePlI6da+yfgJ8If+FbaCmq3tuF1G8OQMc89KjHz5pe6OU4wVrn2Z8MdP0z4e6PL4g1HattZwedKx6AhSQP0r8/PFn/BSv4c6rNdX9na+bcGR1VpF4G1tox/Oun/AOCj3x4g+BH7Lc3ha2mCax4l2GIDqIlwrZ/Ov5TL7x/fQ6elnaMW3rv57Hviu5UnyK54uBzhU6ktT9fvil+30BrZmtCZbi4YBvQLnp3xxXrHgq8h8T6Gvi6PD/bfmOf4c9f88V/PvZz3dzMLm5JLsep6+2BX9F37KHg+71T9nuzub+EoNvyuw9PyxWjhFK97HgcQqVe04K56d4W1BNPszp+mKNg5Ld+O1et+H7seatxMNu8dPSvMdE0tLedLTGxC3zd816+32O0tWWLDYPAHXArz68bq6Z5GFpTitVY+mPAmii8sluPXpxX194Wt103TE+XBNfG3wg1l9RgitoThR6/4V9vWETeQrN90LXz9aKb1PtsFRtTUmabTM4BK4ParlzqS6TYtcSDlRwKjtk3IJJuPQV4T8YvF0tgBFbBtuMHbXDVly6o9KFFS2MH4nfFJZ7JreGXBIx9K+E/EmvxW9vJqGo3hijHJycCug8aeKNLSDzbi4IPcNxXwj8ZviPpt/wCXplnKHVjtMYOd3pxXgvFSq1LH1GGoKlTTsdprXxth8/7L4StDNtOGkuF2J9QeQfzFeb6x+0QbBjFqesWsUmceXHMm1ceorxLWW8WzeG7pNRhuNPtIE3RR26/LJyPvZr8/tX+H3h3xF4sTWtQbUoYTjzVSNfp1JAr6rLMBBr3z5/M80qQlaET9jtI+M0us2IvbS98yE8CRSCv6GqN38R7uO4RpCskTHlh2r6G/Zqvf2RfCX7Na2WqQGXUckKJUj8z9GzXwZ8QfiF4LsNZkt/DltO8Zc/KE4A/WjMcFTSdjtyXGVKrtNH2h4D+JtjJOomYBegwev+FfY+havHqVmv2Y9Rwa/HnwjeyQKmqw/wDHrL/CTh1Pbj61+i3wn8QTy6JGrk5HSvl/qa2Ps8PFHq2tXJ0+XzXPA619pfsyfYda0uXf/ChY/gK+BfH161tCjSgjePSvob9jPxdJNrVzookB8+B9g6c4IArqwODTlyyPWzGh7TD69DI/aO+Mfhz4f3MxnmAOTtQYz6V+bt1+1Hp2r3nmTeaqB+m3Irj/ANvjVta8H+P9Tj8SxtJJEWaGHBK/0r8OLz4lfFvxJryDRJxbxythI0f5V/3uO1fSUckVrH5hLOpUJODWh/S34W+J2ieI4vJ2ylcgltoHHpXrPh7R9Mm1NNQ8L3Sxy5BYK2G/EV8l/sg/s8/EzxX8E7j4gW95DeanpZ3PbGTckiqu727dscV79oviLw/4ktxqvhr/AEPXLGVYryzHyqeOT74+lcuY4CVGKlHceFzKGJupI/XD4HePdYl8B63oN45Bazfy5P8Aa6elfzhfFL4kfFSbxhrui6rrk9zFa3kkawSEDhDgDGOn8q/dv4S6xcWHwy1zWNwjdbKRY9xwA+M+lfi1qfwWe0+Jd94v8Q3ZuW1UNO/OUDSen0rnqcX/AFdRptanwedZPCpN32PEdJ0rxDqOiv4q1Vs5OxMHO0DtXVeHovtGizG5O7ad2Pavr3xx8OPBuj+FLfSvCcokM1sJJI+4k74r490jTriC8uNLkzGwTG3v/nFfsOEnz0Y1Et0fmNWqlVdPoj4U/bHt9a8SfC8aB4QtJLmV3bzYYlLHYeOg61+DsdsdGujHdb9PuIcr5R3Iylflw2eK/or+J/jXWPhxqdn4g0GETSwTtujkHysoB+U4r4e1LXvA3jf4tS+PvHvhGxELjMkEalgx9ew/StqeNcFaxjOMt4nwx4B+GviP4v8AinSfDsN080NxJtLqeI+Cf6V92/Ez/gnn8QvA8az+ELuG/j2AsJpPm6dhg19efDm+0H4g+KorD4SeEtP0OysNry3aJ5ZVTxnpj/OK+ubtLYwx3+p3QZ1yoaI56ccfWm5up0PRwuOlGPLY/mK8eeA/ij4Nme31/R54E6eZsIQ49DXjMTwt/rwu4HjdxjH51/XCmg6L8TY10TVtLTVreMfN5yAgAc9vpXxb8Wv+Cevws8fXtzqfhWP+zCn/ACygG1gfUDNdWHpq1kctevK+p+Vf7F3x88U/s5/G6w+KHghPNmsN4mRvuSIyMjKR7qxFfu1N+2d+wj+0CgvNUF14Q16RQt3GkQjt2c5+bLNg8n2r8m4f2KfFfwt0rWfEMs8NzbICIVdv3h5x92vi+LwF4j8Xa2NHtbfMiCRyZBgDapOM9O1eJis2jQk4SOzBYFz96KP6RPB8vwD0bXYn0nxshEk8bRLDPEznHbAPGRxX5J/8FV/ilp3jv9ouTwp4bL/YtGUxSSEAGQnaRnHHFfMfwd+HesHxHPqEcAgWwjkczD5drojEY49QK8J8a+LdZ8YeLdR8Q6tMXmuJWyZDnpgDH5VrgMVGt7yOfH0OTQ5mMC9u0tgmMMFFbGr3Hk3YtMEtHgY9KytJu5rXUvOmHyoOoGelEt8bm9e+mGS7V11zwsQ2/dO18PN5107MMKBX0b8NdWayDWWeG+bP9MV89eH42Nm0iL3xXouhXp0y/imJ64XFedWjeLPo8li425j7L0nVfPiEea1F1eOGUI5ryvR9UeO4+Qghhx7VvXUsrLv6185Xon6JgcRoehX939stCqHjFfJvxT0v+17drZsenP8Aj2r3TTdVxmB+9eX+N4leGTHYV24C0WrnVmqjOlY+S5/Amo6QqXNm4wR0Bz0q3ovjM2jfZdRLxHp8x4wK7tNe+x2v2SCFJGJ6NXE+IoLHW0H22KONh02cV9bShTluj8qquVKo0j7W/ZQ+IOjn4n2+gTSrtuyFGfZSf6V+n2v3umQ6uLSKRVIYkgeg4xX893whP/CLfFjR9Uhl+WOYfyIr9ofF+o+b4p01oRt+0qMseM7h/Svl87wq5rQR+lcHY18rU2dTrU+mXFxOWP3RnH05r5s+Ieu6RqHg/UNPv8SJsbg9OOmK7e7u5JL/AFMeYF8qMY59Qf8ACvlvxDfRz+Db645LqG+npXLk1CpGdpHtcSYmnPDNN9D8y7Gwe98RCys13b51RV6feYAV/al+ybA3w2/Z+8O6BqK7LhbYDafcZr+Qf4F6Lb678bNMsGGR9rViMcfI4r+vSHUTbWEMMjBUhijCD04Ar3s5quMD814Vw3NVbR75qeuQXWmK20e/+cVw+k2i32oDykByfT2ryKfxpcCYWyn5DxXrXha8mJR4iB3r83x9bmlofv8AlU4wpo+jNCt28K6ebuP5XI4HSuC1j4iataRyRvLjcSQDUHiDxU0dhmaTGwCvmbxJ42W4uAAQQM1jSxXJ8JWJ928kzd8S+JptSBMzLxmvkP8AaK8Zpf8Awu1XSbt8x+Q5x2GFx0r1fXfEwFrldo96/NX9rH4mWejeCrxJpNgnR4hjv717uRYyU6uh+d8T4un7N825+KPjedJbxvL5AO1fpXEQSlFNv2q1c3ouyHJ9/wClQ6dZtfapHbJ/y1YCv1PEVHGkmfiHNz1bRP2B/Yo0v/hG/h22psoV5cjnjIJzX3ckECadF9jOJW/eHtXyt8K9DXSfBek6TEMKY1LkfT0r1681HUbRZZLU5QKEVa/Lszrc9Vn6Zl1PkopHoWgNfxPd67Kik/dQ56/pWPqd697c21nMoDs29vp6VV0/WZ7TSbWwuBhmJcj6ik0O+stQ1S5vbgZEQKjPQYFcMX0Ok6HXrzT4bkS2WR5Kj7vSsfwhYR3MhvJVBAJIz27/AKVzV5bTXUEhtpsecQAo9jXX6dZ3egadFZTMpechfQgE/wCFedzy53FHVRdkfXXwT0a4bwjdS3qj/iauoi9/KPavZtTLX82oTqqn+02ieAj+7AfnH4dK5fwZDY+E00vTGJdNITdcDHCmZfl/nW0t+LQ2lttJOmLMDxjHnnKj8Qa+iwcLR948rF1G5pEl/qlrdi4jHI1PbPGB2MAxn8xisi7eNpknuGwl5gt7FRxVwx2tldOLcbn0shEGP+Wcwy36mqQto3keORGKyHMeegrUSpRKzTyyKRbDDwnH1FFvbSST5uACGGT/AIVrLGlvKsiIMgYdf5VPaukjlWAAY+nSsMRI1Q+1jMMEgt164rc8M6M+q65Z2CjMc8yJInsSBTbG2k81oUxj8q9D8J7fC/hLX/H9/tSOxs5fKJ4xOinaB+OK82pWXK7HoUKLe58J/tq/EyTxX8UrTwrpbg2fhy2XTyM8Bo29MeleSfBDwvc/EP4naP4YggLia4QyYGflzivAr/xLJ4r8Q3viXVZPn1KXz2/3yMYr9Q/+Ccngj7RrusfFfU1b7NotpIE2/wDPSIj+Y/KvlalDl5qjNuJ8dHD4JryP2E8VxeDdH0WHwnd3MS/2fAIWjJAwFxjivivXYND07xFHNo8uE7FDnP8AhXi/i/Utb8VateeJYppH+1Ozj+9sboMe1Z/he38VvKI7JA0WBkyHbt/Q1+OZ5RhWqtSP5ZxFT2lZzkfpL4Gt0GlrJDL5EsnO5ePzr3uHxbeWehrp7SG42jgqAWPsK+CfC2r+J9EhT7T8yKOV/DtXfaZ8XNM07U86k5hYYKKeAPx/+tX5jnGRzi7UmJ8lrI981K28J+OIf7G8daCjtJgI8sZ5/DNeA/ET9iH4MTRpfaeGtJGOWjg6gewzXqI+NEeszR2100TDP7uQdhXpmg+OPC1jdy3WsyLL5yBUIGea8JyzHDL3JnI4o+AvF/8AwTauroCfwTrbAlAyQzOFHTOD17e1fKXif4J/tX/A+YLp11cQ2+f+XP5hgdOgr9mdd8flNZkuLUIFKjaRwV4x+tZGn6/4i1i1llmnkuUTqgxwPpit8t4uxMZWxCuYs/Kbwx+3V+0X8PbSLS/FQkuYoDjFwD06dhXoafti/Dzxwz3/AI/0dYbiQjDxBmx+eP5V9mav4T+FfiaC8/4SewiefGPujzOo6dK+OfGH7JfgfXd954duzbc/cPH0wM1+lZTxbg5r3qdjNTaPTfBfxg+FF1MI9BvzGP4Rc/JjP90Z7V9S+H/EGtCw+2eGtXiuR/DHFJv/AEFflZ4g/Yp+KNvY/b/Dix3gH8BYs/oMAV5nqXhL9pP4P7Ln7JqWniMA4hV0U4r2Z/VsR70GkarFy7H64eNfHfxb1J4bVFmjZDjeAwX+Qr2T4JWmtX0kg10vcyuOd/Pbt6V+Rfw2/b0+I/g3U1j8dW0d7b4xiXLPwOnPFfon8GP+CjnwQ1G7D+JbJtPbPLKijp6civBxuCqp3hY6Y45bNH6ifD7RdY064/sdwogmwQprzPWvHt58O/Et5ANoAm27Rz8tafhP9pD4afEGfyPh5rdg0ki7wssqK4GPQZqfxv4Qt7/Wra4SEXTzRhpZF5Q/QjrXiTjWg7zWhq6yZ534q+KWhaxbMq26XquMtFIgK/TjFeRWXwG/Zi+KWgX+reOdHtbJrRGldgD07jqK9quPgzpmoa+LOLzLeOTbnAK9TjgcdPrXzL+2VfWXwN+B99p1vmC71VHto3YckOCN34elfYcJ5l7atGmpM4sTOJ+B/wATLTwtp/xJ1e18DRKNKguJIbcHjKoQBj8K4aW2hlJE0WQB07VuR6S0tmlyj7pG/eENyQSADj60kdtqfltJNGDH3H8q/falWEKS8jxHG7vE0/h3b67oXie28UeGtNe8ewPmhUTcBxjnHSv0t8M/8FMZtLlFv8QdL8uXAjIRc4Vex4GK+g/+CYXhjSfD3gnUvFXinRYLuHUT5X75MgAdxX3Tr37Kn7KnxNupJtX0e3sJ5e8EY3Z9snFfhmfYzAYuUo4qB6VCi7Hyt8L/ANtj9nbx3qCrLevp0qAbfOCxruPGPvV9dDxppXiaNZPDer2l4zcbYZVYgduAa+FviR/wST+HetSM/gO/mguGc7POwiD06Z/DivkTxH/wTx/bW+B15/bHg7UWZOQhtWYkjGOyelfFYrgfKMT/AAZ8p0wjKOx//9H+DQuoOzvVmFTjnp/nt7V+wth/wQ3/AOCht1cRRN4MuLTzU8xWnhZRjbmvbtN/4N7v2zodH07X/Gs2m6VDeTIhgnZo5ChYBgOO44r6SvzQu0YYapGc0ono/wDwQF/Z81XV/jRc/H/W7PbpOmQzQCd1wDI6HZj2r+rfxbqcmpS/2kuAN+4MB26V8W/D74feD/2Pvg9ov7O3hV4lubGw/wCJhLD0kmgU4OffI/Kvd/BnipPFPgyzvN4+VCG9jX5JxLiOeeiP6K4SwMKVC6PepPFaXmjxW6tu2jBFeWahNGszcYDdq5CXxA+njy42BJPrV641qGbapcZxmvlJJNHuTw/K7o8o8YaO9rq8er2n8GM1x3xf8Mxa/ZWmvW8YMwA3GvdJpbDU4CrgF+lZGo2KzaZ/Z5AxiuX2UTehi+XRnxHbeIE0LUUhuPlGcA9M1reNNXtdRsMXCLJuGVyB/npWb8TvDhBeK3HKHK8e9eDt4ovWiGmXp2+VxmuzDRUdj6HC1rq6PHvE3gvw9qWom4jhWOQN1Ax/9b9K0fCngfS7PURcQlA+RnIHI/KuqksrjVGyVzg8YFe4/D34YDUSJpItwr2aFR2OieY8qs0etfBr4NeArvUIb5rSKaRvvqQNp7mv038PaZpujaWNG8OWMGnRMPuwADOPXI5/Svmn4e+DovC0MTRQDzG6AfSvtfwPo0E1mLi/UZP4Yrd15vSKPkc1xV/e2PBtX+Hlr4h19Ne1yLdBZglcjqcYrhfEHi/wn4Itrnxz4yuFt7CyQume23pgcd8V0P7WP7QfgX4JeG3vtXlbdGhMdtF/rHI6YH+eK/lS/ab/AGnv2g/2otda3t7S60/QIc+VbhSjSDsOMZroweVTvzVNj4PH5pBapmb+3F+0nrP7UHxpl8SSTH+x7LMVjEOFEY46YHU818ZT28Esm1htXpwOgrVu9K8R6VCia9ZS2xQbVZ1wMVDp0YvrlINp+dgnp14r0K1oLToeZhP30tN2fpN/wTd/ZF0n44eL7jxt46tt+iaPs3qwypcqzIvUdwK/dCTx/wDDPWrpvhJ4YtIrA2v7tUhG1VCjv+VfP37Mun2fwU/Y802xsI9uqa6iTSYGGLDIH5CsvwL4fi8DW914v8TKz6neFmVR94elfmWa5rN1rR2P6O4b4VoRwXNVjrY+kb/4GaxbxeZZkOu3ggf/AF68pvdFu9OnWwvWaOUfLivuT4O6pf674KS51SNgwKgbhglSOPyqp8Vfh7YX9nb+IbaIecrYOB+FdmExbasfl/EmXcte0FoV/gxpkVtpsS3EYDgDnvX2JZpC0ICnGB0r5z8EafKNMiKrhhgGvZrF5N3lyHFVVlqdOAo3p2Z3yFJbUo52lRxivkn4s2L3EEhLsGPTFfUTT/Zoij9MV4V4vhjnmeW4+4O1cWJWh6uCoWaPzr1v4VXeubmud5Tnqa8aPwP8PaXqH22/WF2ByN3UV+heoabf6xGYLJTFF3K+1eN+K/AyLAzSZcqOc1w0aFlofTww7qWR43LqXhiPTF07WUtXVRtH0ryTxFo3whZWJigLf3VAx+VbfiLwbBKd8qdOgryHVvDqQMyrCpHvW8J1I7M9Slky6o47X08CW2IdKs8kfc2qAv6e1eXvpOo396ZNJtI48cbsc16vPphjA2IFK+gq7p10bG8RDGPm7YpSqSe5tDKEndIt+FvAetLpwaeFTKcFsc/l6V91/Cnw5cfZYEuI9pH4dq4v4cppz2IBHztjJIr6r8MRW9tCPLAOMe1duFpJ9BVacKeljP8AiF4ThuPDv2hly0YwB9K8O+BGt6l4U+KWnSWPGJkQr7M1fU/im4tl0UhjnIzivnb4SmxX4wWS3ibUa5iwT/vCuhYe000etGXPh5RXY+nP26fgHpPjFh4nvdLjuZL6Pd93OMYyK/CvU/2QPBep3clnbxNpbPn7g2rX9jPxK8IWuqWltbogeMwHYCPavzE8V/C/wtfa3NZalCscicDAr1qsKkYqx+WvCU51XE+RPgN8PPiP4N8JW3gHwjdRw2RwTIjYZuMc19feCv2FbUS/8Jvpcrtre4SXEchwsmP7o+lYOi/DKWy1JzplxIsUa8bTjtxX1X8GLn4iprsFuzTTRxlQC/IH4/StoYWU1aRwZhg4UFzU1Y83+OuqaR8MP2YNb1q8tmt5wzQuFXH3kJ4+mK/nF8QftBf25pMVlYTzDbHhSe3HFf1g/wDBRXwQ3ir9lDU7KBI4blp/mOPlO2PHIH1r+TzSv2WtXjhglu5YBEUByrc06fBEa81No/Kc34g5JygfRnw6+M9tFrcGr6vAZYLXTlXcw4Mg616B8WtAs5PHFrrFknkyalZR3ChBhSH6AV4l4v8ACn/CE2UGl2XzxTWwU+mTxxXrXgV9b+IFh4ftr6TN7odyhkRuptV4Cj1FfpuXQ0VCXQ/PKtZqbnE8K8efs7a1430GZ9Fh8y5ViVTGTk+1fC+r/ss/FfTG83VNJYIx8rdt43en5V/Qp8N9TEfiVvEFgkY02OSRJd3VTmvNvjVq1z4x1228H+GJFxbXRusjgEEV6dbK4v3kcuGzycZOLjc+KPgP+y74n0f9nl9S1Fm06S/lZXP3XdEOQoX2xnr2rqDqXhPwpbrY2uli48pQN0qZwwGCc1+i/iHWYPCf7P1jpepQpJdb5AzuuccZyPT0r8o/+Evnj065SWISq0zfMw4Az+lc2IlGlBRifQ5VVniLtxPULL4j6dawKnh6KKGR/vmIenb2rf8AAXiPwzefEGDVLa3eS+6GNkyjkjB/T2rxzwz4i8LD5p7aKKUZ6DHau5+HHxltvDHju2vXt7dVjkAGV5x0rlwFeHNaRri8DUa91H158WP2Z/FWseMdGm8J+FIryw1cH7coi3iMMh28D/ax2r4E+Lf/AAS78baF8f8A/hX/AIc0yezuL0eYkQQqgXGT26Yr7x8f/tj/ABC+GXxrt7HwprCw2d2jH9622NdsRYfT296+TfE//BSz4ma78fo/F+uXdzNeafJhJYc4aM8FQTx93Pavjs7wNCtX1R6uU0cXCi7Gd46/4J1+JPgL4J1LSvHlnGv263kWNogG+Zl43dMc4r+cb4k/sDfGvwYzahpVst9FKWkWNDufGeMD/PFf17/H79v/AFX4s+BU0jRLSFo7lVE0twn7xMkdDXx/4G02SfUtOk1W9heyuomlIVgdu0/dxjjIrrwFOlhvdgePi4YmbvNH8j1x4Y8TeD7x4fF1hNaSAHCuuB6Vy6N5z7gA3OQq+34V/Zf4y/Zq+FvxT1FjqWi27RP913Qfd9c1+a37Rf8AwS7+Gn9pib4etcWkr/eQNiHP/wCqvZup7Hz3tmqtpI/FXw5H5VmoH8fzYPH4V0EiBrlVHavqLxh+xj8Yvh2o+y2g1K2jXjyBufHavnO40XVNJu5I9dgeylTqkoxg9MVy1aTWh9RgsRE63TdWaBFbd0r0yx1WLULTaTzivni0nk84hPmWvRtBvxnahB2/hXm18OfTZZjU5WZ3ySNDJhG4PasPWtsimN+cipDIWYFD83pVPUctBvxzXJCm+ZHtYqrzRt0Pm7UIjba1KI2+704rIuLpXm2uorQ1d3fVriReMVzQkD8tw3avepztG58VZKozb0yxaWYXES4ZDuBUcjHpX074A1/4xeINetG0qKfVfsmCI8b8ADoQOlfO/hqC5vLmLT48ZlYDHt3/AEr96/2I7nwrpOrWvhPRbKLzlVS020eYTjJBJ61+gcF8Df2m+ersfPZ9xZ9R/hn5j6v8Q/iP4X1zUotb0GfLxgMI4/mXAIGfTrXzdNr3iLxJDdaUs32JJ85Sb5CPbFfsb/wUL8M6t8JPE0Pxs8BD7VYakTHqVtKN0abeBkD/AGsY4r88vDPxg+HHi/zj4r0mCK4mUtGY0x27V62J8PqdGu4JnBHi+riKN2Y37KHwH1TTfjBZeIr6WOWKHc52HI+Yf0r98dR1uI2e9W4AAB+gr8mf2cPFvwy065uftGofZbssdiynaMemPpX3fJc6je6Ot3osq3Nu3zfuznA+tfnfEnCuLpt6XifW8GZ9QV1PRnq+gap9sdpLg7ghr2HSfFLxskdqCO30r468EeJ5p742fIwcEfhX0noNzbLdopJwOfrX4rmSnRm4uJ+24XGUpUlyyO48QahqNwm6Z8J0Ir5p8X+JLS1uTDC449DXtHxS8UWmm+HLhrU4kWMsPw7V+V2v/EefZPeXs6xqrc5OOKeX4KdfZWPKzjM1Rje57d4z+IkVnbPG8wCAetfjf+1B8XU8aaqmg6ZLvgtzzzxWz8cP2iZtYL6F4Zl3KPlaQfWvjlLK/wBQfcsbO7nJY1+jZHk/sY3kfk2fZx7d8sdjPbnpgeg9K9L+Fmg3GseMLKJF3KHGfyxUej+AprkCS8Xavevqv4PeGbLS9bjaJOI9rE/SvTzfH8lLlOPJ8nlzqckfevhmWWxVWQfJBAABnuOK6m1vTcTWlrLwztuOPTFcDDJG1pHFEcNI5BHt1rsdGdoria4PzCJdo9u1fnFWouY/RqVD3bHX6tdQSXk11GcrEoRcdqq6fYyWmhS3aNzMc4P1rimW4W38qzfDXEnOfQc12d7qE8EFrpUq5RR85Ue3H60A6USqj3gvrWytwGIIY1674OtrrxT8QYbFlVktyMg9OleeeHL60lvp7t/lSJMDNe0/CD7L9kvfFJGZlbapHfJ2j+dcdFfvLkLTRH1L4R0XWdXN7rruAur5WIdnFuccfTGK7WMGeWSeFh/xMwDz/wBMBj9MVNY2kmg6TZaZHhH0bBKjqPtXP9ainhgtDc20P3rJgYvQrJy+K+oX8NM86tFXTGxMdtpLgeZKpFxj1BwtXmVp8xoMNCeAfSokmia8l4Vbe6AaP2Kjp+fNWSZUVLqQjzEGCP0rJuw0uiKElvL9q89yArcN/Sta004+eECj609onnYRyoAh6/0rtdKsrhtsbRrsYgfSvFxmNWx6+EwF9WjPgsIbRnuiMvtOB2HH9K83/bl8cR/Dr9mix8GWbCG+125iu8LwTC4wfwr6J8P6JJq2uW2mBBtaUBhj+ENg/pX5Ff8ABRL4o23iv49/8IbZz+ZZeF4/7P46ZjPp261xV05RXIdjioPQ+RdPlXyvssZw7PiMdcEjA/Wv6J/gnop+Cf7GlpKIwmqeIbnzWRuMpMmMe449q/CD9mnwYfib8atA8KQp5qXN5CX/ANlS4HT2r95/2uPEWt6d4r0H4aeFLX/QtC02NCFHSZGx2rz80l7Og1Lsfm3iFmalS9mjD0K6ur6NM2kNqY1Cu3+6Pu+1euWZ0HSoI2UQTb/mcId2M8dOK+Kjf/EeWAi+byS53gjj2x+VYF5rmttd+U000ThQv7vhT9a/I8VlntpcyPw3ZH37eX9nBN/xLJB5b9RJ2+leY+IpNNlkN1L5Ly58sBefxr51s5fFM+jNdy3MnmxfmB6/lSaH4q0yQR+U010+SH24ODXdlXBNWvdwPSweXyrW5T1ZheLbyC3k8sr0wf6VqWPjHU7KKLTZnfag3M3p6Vw0nxGj01WthambePlIUZrGk+JtpPOtybCf5BtddowfStq/hbiqmvKd9Xh6qtEfSWm+KdRmlW9srjeW4w/fAruNI+MWoaSH0/AiuO/of0r4T1T4pRAiaO2ltzDygAxVTUPjtpE0Sz3VtMZlHUDFeVV8J8UtonP/AKt1+x9tTfFG7F2091bwbW5Zh978K43U/idJqOprcadabUBADqOnavjSP46+DbdnvtWeSMnordh3r3X4Z+JNK8f6a+peEBIYF7n7ua+bzngWrg4awPMxGTVqWrPtbwl8Q/EejNFM1yrYwR5Z+Yfh2r6u8NfGfQfE0D2njKzhvYVXGbgbicdhX5i2tn4rtX8m7i8gScJIgxmu30Gz12GV4ILnzxHyw/u1+eLKqjk7ytY5YSto0fV3i7wH+yl8RreWDWtCt9PZidstvEA34H/61fIPxF/4J4fC3XrLz/hvrWGbkJcsqr9OPavR08B+JfE1qLu1ugFj5XBxjHXj6UkWneINOiMkwLsPlTaefSuehmdejPkc7oc4Jn58eJf2avix8IZvtekSiGRRtWWxb5tvT0qe2/as/aS+G9ta2CapcSRW7DH2pz+WRivui+l8e2rYuVl2t9xZRx/KuK17w34K1nQXtPFejTy6qHLRuqZh/H+lfpHDmf0KnuV9TNU5HceAf+CsXiOxsbPTvHGmpNNCy7polLHFeDftvftZaZ+1DrenrouY9NsY0XBXH7wdeK4jxr8HvDWkeFJfEk2bUr8ox0zjpXyNLBbWwRtMUFPv5I6nof0r9IyTC4eM/b042PMxvMtCdI4hL5dvkkD8MV0VjZXF+0Gm2+4yzOFCgVhXCre7Lm1OwjqBwK2vCXjD/hGdet9fjKyNaSZEb8g9q+hzOo3TvB2ZzYaVj+l74PeBbb4e/B3RdCtRscRJNMv+8Aa7vVdKOv3lpe6GTEyH5sdOPf8A+tX5yeGv+Chvg/xjHa6f43t206aNEjDRLtQhVxX1v8P/ANoz4N+IZ00zSNdig3cMXcAjjtX4PmeQY32km1dHu0KqPr+1bxLa2MV+22co2Cufw/SvVNM1zUtS0iTTmuHQxgMWBI254wOteC6J4y8K3NlJpXh7UDPdDJyGDJ069qwh4o1C3SRIZzlRiXaeT6V8bictqU38NjZ1oH//0v6i/FfxG1EQ/aLFp2CcbCSVHbjnpXyf8QfF6eLovI13MjRfcLfw+hA7Yre8X+O/tX7uCWNS3Qrwor4s8c+K9c8Kagbm+2z28uf3ijgfzr9DzLCQUWkj57KJSjaXY+Tfjx8C9d13xO/ibwZeM+1XMiO2S24gnHTsK+ZPC3xck+Hmn33hXXC1vNDcBdrdx14r7vt/iJovie5ltreVY5ORnpXx1+1B8GE+IunPqOlL5V7Gu9ZE/iK/THUV+U51lt07I/bOGuJWuWMi5a/F2x1pxJHINrYA7V0h8bQKkbCTLBsV+Ovhfx34h8N64/hLXmeK5tHwQ3YZwK+u/D/jGS/XJfPPH5V+d4jBzhofstJwq0udM+4L3xe0IW4sn28Cup0z4iW95aqLr5Wr44h8R3NzD5JOB7Vu6LrU+Dak4A6HPWuP6vI8qtTVz27xtJZauBcWG3nrzXy74w8KRrmeNRuPpXVSXmsLft9mfg/lWvJpWvata4+XIHpXVQw0rCjnn1f3Ujw/RpTpo/ejp+le2fDLxtJZ6sFZvlDDiuEufh/4ldjHgc+1ei+A/gn4z1K8heArFzjJHHSvUo0JLUmpxC5as/QHw14i0+bbPHxgDk9K0/i9+0VpPwf8DHW76YRM64hB4yeBxXPeEPhGNAlis9cvPNl4L4OFCjk8fSvwf/4KZfHy98c/GqP4X+F7r/iVeHOSF4ySNuDXuUYSjFNrQ+dznFe1jZO1z1z4lftReE/Heq/274kSPUXOcLMNyr9BXhWs/tEeFnj/ANDsLaPHAwgGB7ccV+f7X+px/LG2Sc4GfasCW5vmbc5+7XprMEo8jR8kuHuaSvqeg/HTxUfH8m9cKF+6E4H5V83fCa8uLrx/p+g63yklxHjA7BwMV21wlxcZ2nd+nSui+Efh+3h+LGhXuoqPJSdM/nkfrXhY6rzRfIfV5Fk8YV4pn9Z/ws8IaXquo2emmIPaaLblAnYbkGD+FZ3ikeAtE8UHUNd2yrGSUTtwOmK1Pglq8tj4v120VvkuV/dE9CoiB4/KvzZ+OPja/wBK+I1zBqcjLbGQ4H9K/LcXzKo0z+o8mwqdBR3R9R+Ev2mb68+NEOhQHy9I8oqqqO+cD8uK/U2306LV/DMdxIMAt3/wr8Vf2ZvhhH8QPHFrrTOBHEwI9cZzX7l2jWyWT6fauCsWFC9egr0MElGOp+acY4CNOfuoxbW1is7URW4xjH8609Pl3Tl3IwpxxWW1yu3KHkdR6Umn2b2uZhkLK2TmlWqyufM4B8sLM7Zt13lz0ArzDxBZfb32IcDuK9ChnjiXySaoppcU14zxjANYSqN7ns4eKPN30dY7L7NCNnHpXkfifRYPKZ/zFfUd7pm2Mle3tXh/jBYnZtg2qeDQqjSPpMrm3LlPivxVo8W8BF4FeNato0LMQq819S+ILaJpSvXHtXjV/pT+aXIypNQ62h93haWmp8+32iyCXATirmh+Eo7mcS3YC46MeBXsraNaspMq8VwvibWI9PEWl2mFDHBasfa9EKs7bHrXgSw8NROEjnDvnGAeBX2f4X0DSp7HdE4Py18k/DL4Px6ppw1WGVi7c8Hj8q9w0208QeG43js90hXoor3MC0l7x8fmFOUpaGx450YQ25CPjjFfJTXcnhzxZb3xk+aJwwPuvIr6M1PWvEGowbLu1Zceor548SWF1d33nLGN6sO3vXV9YXOj2Mtor2bg+p/Rd8GNV/4Wb8FNM8UXLiSa1jRWOf74+nbpXyf8T/AWnXfie4vLCVS/9wHkV6X/AME9vEZu/h1d+E7shWTY3PHCA8VyH7ZWjf8ACrGtviJoEjYu2USjPyjLBf619DXxEORM/J6OFlSzGUGePeFtNk0PUkh1Dpu7+lfZ3w4+yx3vm2o+ViDx0H4V8L+G/iZpvigI9yyliO30r6/+FOoo6x+Qw69/QCssHj4yuj089y6r7M9I/a1tLa5/Z41ySYjAEhy3QfJX8zOmJZX0VvplhcJM8igFfT8K/pI/bIgi1n9mfVreCUxBw/zDjPyV/Mh8P9J1LwxNHdzIdjYVWb/HtX3+U4jlpKSP5p4qo/v+RLU2vjtYW9utho9zLDCsES4A61j/AA48X3nhSCX+wLNrp7tPKWfbkr+nb/61cP8AFbRfiV4n1e58SJZNBosaeX9rlA2ZXqAc/lX6Y/CS7/YK/Z++C2nv498ZWh8Waiqt9mmuM7Q653bdpxg8Y/8A1Vgs0pRqNsMFwvWrKCtofNviO08ZpawReG4/sa3ah7gMPlzjk9sZrz6TXL/TNaj/ALOtzcz26gSFB0A65Ney+Lvjd+zbNrCrY+LbXWdSl4gsbKbLY7cY547cdK5K80b9or4kWy3ngbRrXStFkykk0luRMQDgfMDx9cV10c4UvdjI+3nwxg8JTvKN2cH+0f8AEbxprOh2+jaFEYLVEBkdh8gyP8iviDUdf8OaBolrJqFx5xb/AFsceck9uMetfsjffsxTHwDa+IPFN/DHHkJ82QpdR79a4Cb4Qfs96/b21rq+s6NDe2+Q+OAeO/pWuNgnFNs8vC4+jBuNOB+Kl14im8Q6k7aRG6xjoAMYxXW/DTwDeeP/ABLNHNqsUVxb7T5RPzAZHbjtX6waX+yj4VudTnvfCRt9SiIO0WuD27c/5FfHvw8/Z00bT/2tJrG3vJfPwzSW4b5BtRjhhgdMeteeqEU7xPdyd/W6ns0rHz98f/2dvi148vLj4keG9Whis7FAPJZjv5G3A/L0r4v8E/Ab9q3xbnWPCXh+9kQbj5sqcPt4+Tmv358IWHwu8J+Ddb1bVryYXOqSeUguXHkI6MRt24PXt05xXqX7NyeKdN8Pxw67Na2tr5c7RBBtIGDtJGfpXLWwtNv30fo8MmVGKhGO5/Odf+NP2nPhvcQ6B408NSxs7BFTyfmY9sc+uK+z/C83xw8O6La6/wCLPBV61vdYYrbQjdHF3zzxXsn7R3i/4kw+JotUsI7O+ZXLRySx+YrYOAF6VU174w/tIReGBqmtQxSGNVSCCKMjeCONw3fMB6cf0ry55ZOGsNjKUMohejjbRZt6N8fvh5data6Vol9JYTB0R4L04KjOCNvtX09raeHYvBF9rti32yRmxvGGVQcDI9PpX8+Hxf8AEXxP8aeNU8TeNrK30ye3+UfYojFnsCeuTXsHwn+OPjnw+Dp/2tmtiNrJPk5BGDxx2r0cDWcFyyR+U8R8K0XUcsFrE9h8Q/G7+yvHg0rWtRjtrS0+eVB8u+MdTjFX7nXP2cfjbbziC1sljZzslkAEhHqDgVIv7L+k/tW7rnQYZY9ShQ5EbYDJjPoK+NPiV+zl8QPg7qj6LJFNGLYHCqCOF7V9E8M5RTjE/OKsHhpuMmeneKv+Cd/hHxNZSaj8L9S8uaRvlWR8rnPYCvkL4gfsffHz4RTiLW9Lkni6iSJDgr2wa9D03xx8TvB+mLdaTqE1rNE4YR3BOMY7dK+gPD37bXiTxv4euPDXj+aGW9soj9lLbssw6Dk4rieEU7x2Hg83lTnqfmzJFd6cfs+rRPbSjja4wfSj7SwtmgznH+eK+r7T9obRdd1n+z/jZ4bhls9uzzrGERyr6fNz7Z46V7fN+xl4R+Ivhf8A4TP4Map5MM/KQXcgds+mBj8OK5Xk094s+sw/EMLcskfip4rT7NfSOvy5+8PSuOR49qyMduPavrP45/s3fHD4dX7NrugXLQE8zrGdhUd84r5dnSJ9louA4IDKQQ3HUYx6V0YPD801SSPMxGMgrs+i/gh4Lhm0mfxpq/8Aq0P7nPftxXrmm/FDxL4G1KDxH4Rumt7hJNyjOM47EelIbdbHwXYeH9EhfgK5xwBkZryfWNK1aW9+1Xb7CO3TGK/o3h/L3hcInHRn5NmWK9tXcZbI/Sbxb8UPF/xE+ENjJ4ujt9Sj1qN1njgGShU5DH8QPSvz0l/Zg0191xoeuQwys3yxO+HUZ+6PSuFj1HXLBfscOq3MMf8AcR8J1z0qMa1fW032i3nO/wBc1x1MO1N1Kh24eolHlR9CaT8GNa0DSJJdYsTdKi/8fMKg/TnNd58D/j54r8FaZdaN5Fw0cMoAR1ByoYZ4+lfKb+OvGl7H9iOpThCMbA52/lXeeBfjlqng64WzWytblU4kMqbie1dH1ulKHs57HHUU4y5qZ+k/xK+L/wANPCPhSD4qacPJurmP95ak/MW6fdx+NeA/Db/goL4R1fUzpviaJrPJOyTGAOPXFfAfx++Lt1491L7M4jiVF+5Eu1V/Cvl1ZzFIMckDGa/J+J+EsLUk5QifcZHxHXglzPY/pJufiR4T8aeEL7UdJ1SK7/0d9oVs4JXgYr8NfHK/EPxhrFzbvN5Ft5mApOOBxXjGkePPEPhiUvpV7LCD1RWwp+or0zR/ileeJE8m72eenKHHXivkKfD0aMLo9jH59Ku7MZp/ws0Wzi36kxZj2BroofC2m2SBLIcds1yD+OryS68rUotrKcAjgD9K2rbxNp9y2JG24rhq1Hool4WCeribDL9lUqRjFez/AAsPnCS9I+Ujb+VeDahqscu2K3IYNxX0T4ChOm6RAqcdzXgZ7rFH2OUYjm9xrQ97sroT3Ykh+VYkGfrXbQ3n2bTsd7lsD8K8h0aUMjS9DLJtx6Cu9e4T7fDDndHAOPrivlXBbn0nNFKyO60iBbq/WFj/AKpQWFWmuvNu7p0bCp8q88Vi+HpWS2utRZsbjj8BVi2iY2ka/wAUsmSPas3NnMkd5Fut9Cjtgih7ghc455Ir7Q+FnhiO0/sLQ5YlT7YC8qj/AKZgt/Svkmzjnu9SsrEbdikZAHPTivvXwXAy6lquq2w3GwjhWH/gQCNj04NPDQTkjKsrbHqVp5kqxak+M6mZEmLf9MT+7/ICuVW4mitLS5mG4wF0mXHUFtqk/nW5rCshutOjb5FSN4MerYLY+lQSRw38sDK21NQUeZ7GIf4jP6V799LHlyZYktpDALRtgGQ8Xt6j8q3bqNVENxKF29HC/p+tUmRXMSoVzbHGeuQRj8K6KxsAJ1jGCkvXjpiuGvUaRphZXauiawt1uZdpXIPQV6zpOgyrbliMbR8v9KXwp4RjlY3DgHHTtXqGqW0NjaIYFOIhljj0r4jG42DqckT9AweCtT5pbHn13rVj8PvA/iL4iXzBE07T54436fv9hKfTmv5NPFvjHUvFfia+8XXT75tVuHmkZj/G7f0Ar9+v+CnfxE/4Vd+y7Z+ENMuAt34luLa5KqefLGUfP55/Sv5vpZmlxb2jDOcKMdyMdK+kwdCbhFny2PxHJJpH7xf8EdvhwdT8V618XNbiVbXSLd1ieUcCVVJBHTp1r9ENW8VXd54sv/FHiKBJBeTt5bqOAjYI/lj8a+dfgLptr8Af2M9K06FjBqPicx3kg7+VIu0/hXd+ErG/10Cy0IPqIYKPJj5K4H07de3SvkeKq8pPkgfh/EPta9VpRucz4u8RA6w0aDZHuOM9CKyYPFHheGNzcbTNjjPA/Gvc/Ef7PnxU1m4i+yaDcKu0YYqNv488Vjav+xxqFparqeraxaw30uN9v0Ye2M15GAwUpxstDyMPwhiqy92NjziTxVpeteFNV07ScR3/ANmITHr7fhX4Y/BrVfiJ8R/Hut+FdQ8RSad5FzIg8tyhyp6EYr+hrSv2aZ7C8ivZTNK5GMxEbTxXi7f8E6vgN8PvFd58VdXvL+C/viZfsyzBVd85+7tr9L4RSwqalqfb5FwtWoWU0flNd/BD9oM+NDolp4gurqxP3HgkOTxkVzesfDD9tzRNcnttFt9VvbeHoV+YEetfrcfivPYxSeDPDunQKqsQrGPNwAOmTxitvw9rniCytmufFeqG1VBnyA+1iP8A9VfdU+II35Uj66eSu12fj6viT9r/AMNQq2v6RKsK8F7hCQOwzivXbD4m+N9H0SG9+I6Wccc3CCNCHP0r9mvgl+1D8Otc8RSfCXQNNsPEE8w/e2s0YlnwPmyPpjP4V8+/tIfEz9kDW/HFp4A+LXh290YvJ5DC22QiN2YKuOCcZx0HSvQjjINXkePXg4H5D+K/iz4d8R6p/Z2ixbQvEm4c88Div6Gv2D/DvgLxJ8Dl0TZ9mvolDM4+63SvxX/bQ/YD1n9mrxvp/jXw5ctf+CtV/e2d2nzOo4O2V/ocDivc/wBjf9qHx94f1p9K8HWsc1jYYMoKbyY8YJ3ZH8q4q2R0MarVY6M+QzaMmmz9tfEXguVbFbeRt8KyBY2X2IrnrbRLax1OZJHWNVX5mj43cV1vhD4waH8UvDdr4w0MKlnOF86EAfIxO0j/ACK8k+LfiSw8NakktjIsUef9WTk4Nfyz4weFtTAyVfD6I/M62Ik6nLY9a0zz9L07faSlreT+HvXpWh2dq9lGbgKBtL4/iHFfE1l8ZLe5I0+M+WgHyP2zXrOg/EuBZlj1CXgqMdvyr+da2T1U7lM+vpINItrKPzZEZpU3BZMMwB449KyoPDllFKiJbpLDdDYCBnbkdc15JPqp1iy/tywlVpE+Qn/Y9MVYtvGsnhvSzrcUw8mHlo2OQCK6chwFX26TWhlzs+Gv21jo+lXn/CE6O7rErh5Ezj5q/P8Ahgu0gMSsCiHCj0FeyfGv4l/8LC+JV5rjhZE3kfL2xXkmrXE1rZCfRbWR95ycdq/pjAUVRoRSPLxE3J2Y+SNoY41tRu3feFfev7JX7Mln8UdK1PxJ4jsd9tGu2I47+tfAmgDVdQkjtriCRN7AdPWv6JP2bPBeteBPhPaWumSL5kyCRo+vUdDX5rx9xTLCaQKoYXofAfjP9jfT7SeSG1dwMZXccgf4V4XqX7Hvxi0aP+0vDCi6hHMf2fl/51/Qn4fhstUhfTfEGnqpkQAyMgHfsa0V+DujRxvJp935AX7iq3yEtxyBXwOA8UKkV76O76m4rc/mm/tD4/fC288+7fU7RoR8u8kR8euO1fdH7OH7VnxI8Zztp/jL7OLS0QGSdF2sewH54r9TNU+HsTWbaV4ks7G9aP726PcxQ9cfhX4yf8FKLbRf2b73StS+G8P9n2OokiVUGFztLV+1eGeNwOf1vZ1kkefWg0tD/9P9MtV8XNocLwG4iZR0VueK5WHxroHixDp9ziLHA8z7v5V+d3iD4meIF1saN4rVti/6mVPuuvY16Ho1xcXgUafPvYDOG5r7+vjVVfunLh8J7M9A8e/DOGWeS88KyCKdeQy/dJJx0+lea2HjrXNBuP8AhF/HUJQ5Co5GAfpXW2Xim+0+8FtfHa/Tb26V20dz4V8dWjaF4miBGNqTH7w+hxxXl4jARk9UelTxXJ8J+cX7W37Of9vWcfxl+HkBlkgbbcrF3C4ycDtivnTwHrD3WnKw4yM/Ttiv2HsdF174TagNN1hftfh+9xGXC5AhbhuOecV8FftBfAOf4O+N18QeH+dA1nM8RTlYyx+WP6nr2+lfD57kut4I/SODOLVOX1ebMfQ7kmMLJXplnEssCfZxyK8j0vzIJhwfnHHoD6V7d4T8yWBkdelfLLBWXvH6NXrRXUhhdonJk4r0LRXd4dwbCiucns41JZ+faltrwQLs3bVrow+FXY8OtVWx6jp1mNRmEYOMEV9p/CLw0LW182XpGMjI4PFfG/w+23t6sZ6E1+gukB9I8KIPu+YNv5V6Kw8doo4p4mMNZFjRtK1HxL4wNnZoZnYYwnGRjGMfSvjL47/8Emvgd8WPGEmtedL4Y1y5c+a965CSHHYKOlfq/wDs3/D2wvdPutfv5GgnmGIH6HI54/CvouOx0rxYreAviBar55z9muUHzNgZ5PbAHrX6Lg+HvaYVcyPyDiTiyqq9oS0R/Ht8ev8Agjf8evhRYTaz4FuY/Etog3CO0UsxX2JPbqenFflB4i8B694Z1E6T4ksZdPvYyQ8Mq4Ix+Vf32eI9E8SfCLXo9B1uR7nR5T+7kBOFHvyePavmr9q79if4QftGaEW1yxtrPUGjJtLu3XyhIT93djP86+ezXILaRPo+HeMvd/eH8T1r4Z8zBRPqCMcVu2vhw2rpdR/u3jYOpHYjoPzr6k+P37OHjj9nHxu3g7xCjT2xz9muEHyOo68+3SvEo7ZjJsOQcdCK+InhnGbiz9DwGJVf95Sdj9gv2PPjla+K7G303WJANW01Dvyf9YCR7DooxS/tY/Aa8+Kdx/wlfgdMXUrcovY/SvzI+HHiPVPA/iS38TacSrwMu4L/ABL0P6Gv3Q+HWpJ480yw8Z+F5PNE+zzYVPI7f54r5DNMpftOZI/YeFuKZQp+zufNH7NHwr+MP7P89trfxBcLa3DIFXGCFJx6npX6m+HfETW+tmZ3Vra8Bkix3GMVb8VT6JqkNjoOtxLMUxlMcr7VyGsacLTUoJLJRDZ2q7AD2XrXkVounoGc4r6wm5I9Iim23ryNwrdq6+xlaZAsn3Erz+23XTrdAjYygj6etddb6hFCUAGQ3B9q0rU1yJnxdB2k0zfNqXuldehrSVvshLE9arR3MbkCH0rz/wAT+IjYo534Zegry6s7HvYSMmjubvUocFd1eJeLTBI5S3O71q1YaxNfW3myP96uduygSUN3rH6wfRZPJRn7x4N4murO0unt5xyemK4V7ZJ5PLiHFek65otreSfbZPvR968/1PVbbSwZSQAKyc10PsVmcUrI4/X5bewgZGPbtXzd4iRbx2Zzgr0Jr0jX9cF/O8kT9Ogrx/XL2SfcgTcx4GOla0Kb3OWePT3PoD4S/HWfwfZHSLhvNHQAfSvatM/aCWadvtMW0DrnHFfnDD4d1We9+XdEO1dRLoGvbAbaY5ONx/8ArZrv9rJLQ8nEV29Io/S1PjJpd7biBI4/m745qg+o+G55ftUygHrivjzwtpWpWNkJb2UnA6122mapaLKHdjI2QBzwPwqqbm9WZxxk6aP02+Dfj+fQ7XzNBUq/cJ3GPp6VY/aA+K9x4/8AAg8K30T/ACsG+YdMMDj9K8Z+FM1zFPHJAOG/h/CvXPG1vp2pWDz+SFaLHT2r3ZybpK54HPH2vttj4a8JatdaDe/ZpDghuPpX6NfAzx3vlCE7l4GPwr88vFNh5Oof2vajjPKen4//AFq+rvgXdJvjlhIAbBzXi4fE+zqNHu5jioVKHMfYP7XXiW3i/Z2v2vNxJJCRp/u1/PPcXevWvhuXXyDLBa232qdf4Y0Tpmv6LviXaWWpfDHGpReajXOCD/d21+PX7bWn6Z8O/wBmvxFq2iRx239rW8liqouDtYDH5V+7ZLktaeB9r0sfxnxBm8Xmjh1ufzn/ABF+PH7Svxasr6w0rXre08OWF9I1pEA25lHc44x7V85T/CD4neJo38S6xfnWbudfkMX8GD6HoAO1elfA79pnxJ+zp4Wv9Gi0SPVhOrKfPiWTBbn5dw9q8i8Z/tj/ABI1rxCmvaFoJsJAmDFAiIp98AgV85isgm7n6theLI4bkgoop3PhjxBo2s2/9m29xFqqqFeSPKlT6gjkH6V+j37G/wDwUP8AGvwKtT8L/iNqs11pzPy1y7vLHlv7xPT8K+KPCP7X2vTm28ReIPDOy8sH3ySFUCsMYwR+NeN/Eb40/Cr4v+IpNR1yzOk3crY85NqRdcjKr24x/hXzksHWw01yH1tHiPDY6HJNI/ra+Mnjuz+Ivw/0rXfDuseZ4eeHzYpI5TsEpHO7r9MYr8qvEvjC+t7jyljG1nK+cgGSB3NcV8D/AInan4b/AGRotY8N30d4ljM7TL1i8tTgbVJ4rzCH47/Db4n6iovdHvTd7VAeBwkbbhyQMYHpRmPEbjHknoeG+EuSTq0tj6I8LftA+KvBupx23hG+ud0jAKQ+FB9wB0r9MR8VH8K/s6+Ivj94/wBKitNa0O3XyryNBEtwZRt+bPcA+vWvyvg+If7PvwLtLd9Q8N6jq2qXPz7FlQhMDPzA8Dp61+hfw0tPEX/BRv4G634f16A+HvClpHGtnDgKZWUbOSvynk/pX1nCuIjXh7p8zi8RUyyp7SJ+X2gf8FKPgdqfwlsPhX4vtGW6u7gvfXbbTsKzCRdvdc19g/EL/goN+z94an8O6X8KL19TtsQ74lfe3AAKt8oyPyr8U/2p/wDgnL4++Bfi6VoLZ72yYv8AvY1yMEjaeOmBxXon7In7Cni3xbexeKrm3kSFDtjX7vOMcivdllk3U1Pdl4g1Z0LONj9H9L/a38R/tH/tZWXgPwhplrbRW0DmCF4f3QKxhuVHc5x9a+wPhx4i+NM/xwu/BHxltdNj0rT4pdnl2xUnYMrjJAGTgV8LfssfseeK/g9+37o9/wCO5mt7PVt4jkJIAwAoGQfav2C/ak+Gug/Cj42XvjZtSN2znZFaq5OS+McEkH8q9ujhI8vLJH45j8bUq13ObPJfDmq/AT4uaxf+CfHWkw2c4n2QbUUFhnrmvLvi7/wTk0hJZLv4ftsLchSd3yn06V9L2+keIJdEtYvElhaQz6rKpguI4VSWJWI2jcB+vGelfoBB4dk0Dw7ZaLdyCaa1iUSyHq2a0fD8amp5H+t1bDy5L6I/Db9m7UfEv7KHxCjuvHVlKkIcIGI+VkH4Gv0p/aA+JHwJ+P2jSXuu+H1gikgIjuIUEZLFcDoPXFe1a34J8HeKoJLLxJZpdwOpUl1BZPcH2r5/n+B6/DOac+Hw1/oN5GU8pjvaPdxlT/Dj6V6eW4qGG/c1Dz82xqxMfbLc/L7x78GfCvjXQUXQ7a2u7WyQI8Mafv029yf/AK1fj58eP2WZtPvJtZ8Iyyg8uNp+4fQfTv7V++PjD4GfFH4c+LIfHfgFzNpk7cD+HP8Ackxnf+Qrv/FXwSstb0+1+KVlpyxWs0oTVYWTGw7fnlVf4R2x+teNxPlU6FsTRe5jkucQl+7qo/jjl8OfFTQdVPmsLhR1EgJ56V9D/DT48fFv4Rx7YV3wO25o1U8D/Z57V+snxy+GvhbRfFc+qaLY40qRv3R2bhk//W/KvnO7+GWgeI45TcQrGgH3l4GK8GjjZaQT1Prng4cvN0NjwB+2fofjtY9I8VOAWwjfbiXUZ44B6flXT/Fb4Hfs6eIvDkviTV7ePzpBiF7LCJvPqAK+SvFv7Nfh6GFdT0+4ETE5DKcEY/Gqq3p0bSE0dbqSZIezvn5vWv1zgnhf2j9tM+PzvMfZ+6ihNpOi6HbbbdnxHwoLfwgYHavHvEl3YSOcKDmtDxN4klduW56cV5Hq1/PIcA5/Sv1HEyVGPs3sfJ0rzndIivI4Hk+VVI9MVitDEWzGoGPaop7sqMMdnvXHX/iO4lvF0vREM0z8ZXoP09K+OzbM47Hu0MIy14n1/wDsK1KoFacjgJ2ryW017W5HaQna7dT6/wCFezW/hm20IC61eRXlcZO73/lWO39hW05aKMNn0r8/r5t77Vz1qOEVtUeN3unaxcSNeOrSO3U9qw5EnUFCCrD2r6r0zxNJEAmm6eJNvTK5/TFaurSLrlkYtV0xId4A3ImCPyrnnj77s6eVRWh8SSswk+auv8BafdXniKJLYZCMGb/dr6Psv2XLnxvpbX3w+vYr2+jPzWK/6w+oBbaOlebWWn+Ivgzc3EfirTpbTU2Yp5Ei87MYxxnt0NeHi5Tl8Jrg6sU1c7vXPC5vZ5XhjAQt+mK841DQTYjYo5FfpZofwh+CnjHwNoviTQfE1vpl7ewr9ogumdiJT2AAFfOnxZ+FFz4B8QNpk9xFdQ43LLEDhh7cf1r5OvSlB3Z9/gq9KcbQR8seG7O9utcht2yV3jIr7itoba007anDBQAPpXzx4Q0tl1KS9CYx0HpivW4pp/tEUbt1+Y/4V85mU5T0PewaUdj1XSQ6CFRyAu81uaTqStLNPuyWO0A9sVxNhq32aCWUn/ZA+lb2j+RdwwwD5SzbjXkexOmpXs9D1aWdYNGhsj/rJTniuu0C387UVJbCxRj8xXmtzIJdXjtg+UtwPx7fhXoPh+FbayuL4ycucL9K4qytojenNNHvfwysrXU/EEmqk7kt/wAumK+7fALro3hyzN4MSzPL9o/3MEr/AEr5E+EvhuSLwzHBEMz6q+2Md/l+b+lfYM1zE91eNAP9HuI4YoB/tQgeb/IiuvBUerMMRJmlc3DRRW/mg50pz5g7sJPuj8jir0FvFczy2iLtSMBof+BcnH06VRhuPtd5FeSEGLUFAdR3aPhf5V1OjWyjUIYZkbzLQHd6HPI/wr0ZTSRxQWqN7R9ME12v2ZRsRMuCOcgV6FpWi3dxPuWMGJwMEDpiqeh2Zaaa7dR5lzwNvTHpivo74Z+HJ7mQ20cW5oh0xnHvXy2e5vChTufR5TgZVZ8vQ0fCvg23+x/aJwyqBzisjxNp5vZ1tVYrbkhTzjIr6U/4R9dI0fzt4mduPLQdBXjcvhHxr448SXPh7wJp011fPbOkEcS7sOUO1uw46n0FfmWSVauLxfOlofoGbToYfCqF9T+Xv/gqz8Y7Pxv+0VB4R0WQyWHhOB7Eop4L5VgxHbGMYr4m/Z/8Hp8Qvi/4f0Y/PHJqNv5q4P3C4yOnpX9Lyf8ABBmwfWNV+Lf7S3iWO713V7prmWytmdHj3cbD1XIHuK9r0r4Ffs/fsxaRC/w28Oq+oH91HNPF5jiToG6V+rTzT2MPZRR+a0sIsRNnP2Xws8PfETxBbJ4okdbDw3b/AGCCCE7MiM8HHf6V9AWraf4GtfsHgi3S3VgAWwN351qQ6NqqWVrPGizXl6okkCLja56jpxxXfWfwsWCD7d4gk2nGdtfEVXUqVrtHtYHJMLR1mjzCHxL8RNNZLqXUZjHIePmIH5V2J1K71XbNdpFPJjk4AJq3qngLxr4oEdt4D0qfUI4zgCIA4r2fwX+xf+0f4gtl1KbSJdOhyMmRenp0P9K7qWW4ndbCea4Wk3FWPkzxd4p1W1tA9rbtGUOBxgD+VeP67qFp4/s10vxVM6D7qspxs9K/bfTf+CZ3iLxNpYk8f+IrSBTz5Y3IwH4ZrntT/wCCY3wd8IW/26TUpLojkvFIR/MV9DluArwW54eMzyjLY/mo+P8A4G8dfAzTIte8NRJqmm3h2i9Vc8/3S/OcfhXB/Dv4h2+n6zFZ6n5d80qhpvPAZQGU8AH0r+gj4s/CX4cp8MdR+HmkMl5sV2jhYcqT12j6V/OtrHw703w34iurSSGUWbSeWhX5WRhwR3r6qGBmoqRxxx0ZbH21oOp/s1HPiPQ9LfT/ABVbMjW93a7YkJDDIk2gFhtz3Fffvxii/ZE/ay+BYtfiBplna+LII4ytzDGkZ3xFSCzBd2Tj+9X5P/Df4G/DfU7eSZnuvtsYD7fNP3fUetfTvhXwb4a8OQ+ZF5nPBMhz9K9zB4d294+PzqvZ6H0z8ePAPgzVf2UfDngrXJWutGaKaA3DsD5cmVWPDY4y2P5V/M94T8YQfsTfFjWvB/iq2kuJg+23I6SRy8Dsema/dP8AaQ+O2geHfgPF8J74rPLfyxtbhQcxtGQxPA9s/hivnHxj+yT8Evj/ACaP8XfFNy4uFiYGMPhtxUADBx93FehRruUvZ2OJ0Iypao8E/ZT+Pl/4K8c33g/WGEdjqO57cHgA9VA/EivvDRfCum/GDxPMNYudstv8uzt/Svjnxz8FvhRpd3HPbySWlzYkm2kLDqcAZx1xXsX7PHjVtA8brJeyi4bb8+3nOFPNfH+KFSpUy3lavY+BzTAQhdpH0hq/7N4sYw9hLyjYEef5eteP6x4T1bwtdPasZH+f+I8jHpX2rdfF/RLqaNbpCVU5jPAx9eK8z8bSaP41hlvVbZt5BHav5CcPeakj5Y+V9P8AG2uafetZxzSpFvwRu4rW8ffE258N6AuiQT/aTcnc3oAexrhrv4c+KNKvn1exf7VDJJuVQewry/xzrq3urLHcR7WjGNi8dsc19PkeXU7qVjhqya2Oa1TS/D66k1zFJtMq7j6ZPtUd0hsLBEtJd5PQA8flUWp6fp18sV1B2AVqbDFHBviQgLjjNfcz+G3RHLZXO1+FFjca34902KWIuElVnVa/f/TvGXhpILTSo7hLJoohknhf7uCK/Hj9ljQZYdcl1642koRg199f8I5Ya80spLGUZI5x1PTHtX4Fx1H29blj0OpSa2PuK017TLdRHpuoRTo6hWJbJ/D0rubXxNoscsFn5MohXkv26etfmWll4y8Mss9grXUSHJUfpXuvg7426taIun69bhdwG3I4GP8ACvzLF4VxVoD9oz7evPGN5FfLbwW4mimGEYKCQO+enavkL9tv9mjwb+138Lm8LPdRadq9s2baSU4APAYYH+zmve9A8ceG7+zjn3gbsbj2PoAOMVr6noWk+IXF1prEyod21DiuzIOIsRldT2tDRkS1P//U7/xr8MdG+JHgj+zdEuhDqNiC9s7D5iF52dR2GM/pXzj8OvFuuaBK3h7W7aSC+ibY7EEjHQEHAr6I1Xw94k8NTiXYy7TnI9q0NM8dadcny/EVnFMScZVAGx6ZruwmN9m0rHp1YJoW8l0iTTjPeMJrjHLLxill0LU9P0yHWLLMkUg3Y9Pauqi+Dvhjx/C1x8P9RFvKfmayY7mY+g+6Ks6H4o8RfD3Wk8MeOtNMNlCNuWGQcdgcV9ZhsVCe541WLjqjf8D/ABZigh/4R7xJCLqxkG142GSo9jj+le5ar8AfC/xd+H934a8MzLeW05862ic/PHPjCAHsM44xVS//AGevDPxT0ePxh8OLgQyyjc0AIzn8x/KsLQPCPxS+FV/FcHdbTRHerLkoceorpr5ZGrBnn4fHuhU54H5Nal4V1bwN4juvCGuRvHNYymFg4wSy9SB6dq9c8LLGIzxjjiv0L+M/wftP2mrY+MvDkK2viqzj2ywYx54HcdOWPtxXwBZ6Nqfh3U5NH1mJoLqE7WjYYwRwfyr8yzjBSoytyn69kvEMK9KyeourxyxqSq1w928nlExdTX0f/YUV7aoe5HTFeba7oltYzIgXBJrkw1FTWmh79WslFSOs+B0epT6mn2n7gb09q/R9hcXtlHa2i+ZswQP/AK1fDHwtX7FcKGXaD/hX2t4XvdRsZrXUbYbxE43L/s1vgqb9rys8HOq/7q/kfWvwk8UXmrfDq2u7aHyJ9PnkymOgA2+3avonRNX0bxtoJ1O3b/S7DDEjhhyBjHauN8P6XDYeALrxJZW2yOSIMAuMBmYDt9a8qeXWvhlqmneJLZS9rqX/AB8RrwMdvXocdq/eMEo/VIpH865hiObEtM+tPEmn6L8Q/CK2esoNjL5YA6g9ufr7V8m6PDq2gapL8M9ef54D/oUhH8B7D6Cvoaw1mH7FPNYHdbTYkAHO08cfhXCfGzw6+ueF7Hx5o3yXlj0I68cZ/LtXyGb4W0uaB7uXVeiPhv42fs8/Dz9oO6h+DPxCKWn9oRudLvHGGidTkgtxwSPb0r+cb9qL9jb4n/sjfEJvBHj+1Y2/P2W8x8kiYBGOo6H17V/VP8S7N/Efgux8baV8t5ZtGEkX+EZBcfjzXvv7TnwG8I/tofszx2OpRRyXbQK9pKoAYSxj5VLd8ttGePpXyVfKI1ffitj7HKeI5YSag9j+GS1s4xCWXjj8eeK+w/2WvjFqPwZ8Yo92d+nThQ6E8D0I4PfFeLePfhx4q+DXjnUPhv44tjDfadKYWLDAYdtvsKNJ+zbwucgAAnHpXw2Ow8+dxSP1/L84VOKrxZ+ymqfF3wjd6r/wkNreK3nMGznGPauS+Inxt1TX9LfS/BUTTvjDMo4z9cV+b1lEnkFUkbZkHbmv0O/Y91e1v9EvNDvYlch2KFl5GB618vmeUSSUmj7bC8W06qUD0D9mPx14m8TaLNpfjPMV7ZttVSP4K+uIWgluwIhivBDoMHhvxcNSt12GfhscA9q9mjvbZU3QD5hxXgV3pboFVx57xOsvdUiso+yrjk18tfFXxLHbwyXML8gV6NrerSbGVjxXyJ8X9TnWzdUbqP618/i63RH2mApR9mmfQvwq1Y6v4fWedsk9q6zWzC0n2aH7xr5x/Zh199Q8OTQ3pysUhr6WuXtZA8sPpj6VnUpNRTHQ+NpHhPjLVEtg1pbcBRyc18x6zqLalcm3g+Zc4Ddq+hPiJY7dLnuEHrn8K/ND4z/tOeGfgPZMs1tJdzdlXjHH0Oa6cJhedqx0rnPpODwf+8M1ww2/l+lMl0nQLWTy3dCO59K+EPhv+0N42+Pdj/a+huYLdCAVxjAJxjPH8q/SbS/2Zddt7nRvtZe4GqZ6HB6enNelWoSp6I66dSEfiPM5r7QLQBfMV9voKsWt9oE0yNGuB65/+tX178Xf2QT4B0uK2EDvPOEwc9N2D0+leSL+y/qe2ysjlGuhlX54wemBntUUYye6O3+08JFe8zhr2XRL63bT4JxGSAARzWd4Z8BWkdxuudRT7wPX3r6h1v8AYpvPCumW2safcCZ3KhgN3fA78d67Bv2HdbtbRPEUEzzrLIiGNeMbsY6E/wAq9ijhrq1j5KrxJgva8nNc9C+C7eCNLuUfUNSjI4A5xjivoLxFonhy8s5ZNGu45lk54P8ASvzI/bF+Afjv9kX4J+IPjXdX3+j6ZPFHDGc5Yyg8jPHGMY/HtivzA/Zg/wCClXxk8cXltY2ug3VwtyMNKMbQvT0rveHcYWfQ8+vVjXm1SP19+IEH9jXbLIR5b5AAr179lyY6jqM1ttJWPgD04r4w17xVeav5msawHiJX5Yzxg4r7/wD2JPDFzb+FLnX70nfcqdhI9ulfL06KnXsd+O/cYXU+7PiKbeHwbbWKLuzMOB3+Wvyq+O3xJ+F3iGz134T/ABLgE8ENs11IBgGKFRy2ADjpX6YeNbiWUadpztuwVkPb7vav5VP2l/icvwk/4KSN4c8VyE6V4rszpswbhfKmflucgYFf2nl9D6tklNyWh/Ced1Y1s5nyPY+4/wBkj/glV8Bv2o/gXq/jLR70RSR6hJFayO2VWIfdBHfIr4t/aD/4Ix/FD4c3Ut94ZI1K2QHa8ceBjp71+5v/AATDvtP+F+q6/wDAG9PlWt80moaecgK0TEKm0jrx6V+mN1pdlHEbdomkliZs7iWHXGNp46V6OW8NYbGUb7HzuL4qxWGxXvbH+c949/Zm+J/gu5bSNctZIYVzkeV0/TmvkPxZ8HmglkklQnYRjEeMc4/u1/pQ+Ivgr8LvGd+f+Eq0WOfeeSEAwPyrwTxb+yF+ybfzm0HhgGSMNuxt5wvBxs9a+H4r4G+qxcoPQ/SOFuNY15csz+aL9g/4Mfs7XvwQsfBHxf1J7aK8djKgkMZwfmHb1ArzDw18F/A+lfFa60zwMN+m2zTLA7MG+RG464HQcVu/tQWWkeFviDqUmhSHTbO2uJIobb0CHAIwAPwr5S0fVV1jXYvNvdkczAMUJBAP0xX8B8YYfGLMp3furof2Nw9ChPARknY5X4pftC6z4j8eN8LdIsoIY4rnyXMkStI6g4xux/8Aqr+yD9jL4b2Hwg/Y48KaLZ7BNcRM8vAB+f5v06V/Mxo37M/wvtfEmiax4YYXV5dyhpWdtxB3A1/Tros11pvgLTPCNnMNkdqmDjABwOPav6r8GqlOph1yxsfgHiLXnKr7O90eDfFf4Yp4i1aW4lVLuJuWR8N+QqPwP8MofD+itf6TZBFHO2MBent2pNU8JeMIrme7a73Z+6o//XWXaz6raWElvJcMr4O7rgjuOvHFftFahFPRH5/CpUcOVM/Oj/gqP8bvHvwz8WeA9P8Ag0ok8QuXdZNm/ZiRW5wMcAHjNfSFr41n8caR4b+Jf7Te+51iVYo1htv3O+ThQ23np1x6VUs47z4tfEESajYxTW+jswhygJxnONx9MV6J8dPgN4x8fz6L4ttlW107TpY5FRR02EEjgjt7V5dalYyhWUnydT7I+N/hS5tPAPhrxZAfKXzIXEYXnywynB/CvdbTXdG1TT7a/ZTtmAKt+GMV3N14x8GeOPg5pnhbXY1heLTWkiOADmNeP5VzvwysvCHjjwZpdnpE6wXkQEcivznDdR07VNLHRpo8Cvl1Sc3Yo3dhYRBZICGDfwj9KZLo8dwVWNhHG2A20cZ9MV1fir4f3eja3JZ2LeYIxztPtTfDEOg6ZMr3kUk20h5Ez379q+YzHMVdygjqwmUyVlIt+C/Ab+CtRGrJbx3mmXTfv4JVBUDuUHO019SfEXwL8OYfBsllHZRRaTqVr5bBwMlThsk4HTGK53/hZXw/udBKLps0S8qo3cdMddteR/tJeN77UPgnFHo0y2pik2HdzmMLwB0qMDn068PYs8/HZVy1FKx+Jvxh8NeEPhjqN78MNQ083a3TNNbuecRN9xhxx6da/Nj9pPwPL8AdFXxXrUfkaHcIDFKcbc9cf0r9Pv2lbqbUtCsfHt46l4rZbQ5GMquCCD/TFfIf7YXw5uv2u/2Xf7FiP2aSxh2adFyPNnA6duwr5KGN9ljLSPraVOUsPbofz/eOP2uvA99cva2qFrdGwu1sZ4zn7vFeS6j+0D4W1BM258sDt/8AXxXyB8Rvht4u+Eni248GeNLZrO/tiUZGwQQCACuPX07VyGn6dcahdrbL+JHQCv2LB8XVadJeydkfPYjARk/ePtv+24/EFot7ZNujb3rCv5LrG1Bj8q+fRql1pn+g2khWJOMdOlPh8VMrgOzE/WunE8XVpQJpYRQ2R3+rWviG8lFtFMqI/Brq9HNn4Th/sTw3F9s1CQZkmXnb/hx715WPEMd5HtbI5Hf0r3j4R6lo7aiyMg3vwxHHavDqZnVqaM7VochJ4XutQb7Rr91gn+H/ACa6az0fwlo0KzXbbhXq/jP4bxXxe60he2fr/hXglz4R14IyyISiGuCeEfxMaq20Oum8c6FYr5Wkxjjpn/8AVXJ6p4om1IEscegGR/KuXvNHntDh/lP0qAwvCmGOT9K57vsL2h0Hh7xPq/hrVE1fRbh7WZSCTGxAJHqOa/Q7wf8AtV/D/wCJfh6LwX+0r4Zi1eFBsS6t0SCbGPlLSYycEA9RX5lQ5Dc8V0mmSxxTB2/M84/Pj9K0g9URJJK5+o2ofslfBv4gaal78CfHlppKbQwsLovI4bqQGBAGBXxz4m8O654S1yfw34jvW1B7NtolYuVx04zxiq3gLUlTUrdbeUx7nUYi+T9BXR/Edmh8QTIzl5H4y5JOMcEc/wBK+fzqq07JXPpOF6ictdDg7a3HkmeAbCSR+VaNldBb52l+bYg4psVs6oijgxqCaNKi2iSeX/loxA9hXxym22mj9CXu7M6S4kjNvBFE2GfLYx7dK63RJ5luw5+5GlcgUE2oxmMjbEnTH6Vv232qytZZh1k6D2rKSViHqdr4fvHkupb1+VPHNe5WdwWtLLT0QbpX54rwzwwsEi20M6Hk7mx3r6P8CaNbat41ghBJii/EDg/yrxqq1sdVGLSPuz4fb9N161j2gR6JCsjEDgGRNv4YzXrFmLmyeGxOC+nyvKwI6rcc/qDXB/DVRq2k3N/jCaqTAf8Atgfu/iB+Fd/pV2DqP9o3gz9pHkt9YuFH5CvSw75Y2Y5+89DctYUXVZtPbG2LDQMBgc/McfTpXd6NayXF2LhZMs/En0AriNOktnhSLo1mW3KeuGPXP04ruNCtDD5urucW0gwq9z2rkrVoJ8hrTwUpfCex/Duwa6vpo4BlPux555PFfo18LfBY07RBcX+LdYFLSSHjt0r4V+C8Vj/b0NtM4ihU72B7ADPt0xX6O/AfQof21/G914E+H0jWfhjw+6LqNwzY85lI4XGO4HrX55muDq42v7CGiPoI476lS5mj0b4K/BHXP2lvGgtvD8ZtfD9nj7RdbdvmY7D69O9fs78Mv2bvhn8ILd/+EasF88jaZ2w7Dj1OKzz4x+BH7K3gWDR57230nT7RAowQWcgdScd6/JT9p/8A4LE+Hl0268M/BS2aeVwUF31UH1xgdvev0jLMnwmX4VLTmPzvF4zGY+v2R037bHxG+BHwe8Vy6r8StTjmmGWitI5CCXHTIXI/ArXxd8O/2yP2bPjHcz6DBoP2fV7dPMjEgBEhHKhSEwOnX9K/F74oeL/EXxX8U3PirxtqRuby4J4fjGfRea99/ZR+Ofgf9ni+kuPF3hw6qZekiBVwAPVg39K8GEk6jfQ+xy/COhHR6n098Qv299N8LeIJtLs9KgtZrZjG6sgHzj0yoyMd64nRv+Cndvp96G1TR4byLPOFQHI7fMCK8L/ah1b4C/tX65K/hqF9G1iaPMT71VfM/hUqMd++fwr8j5/gT8TdK12fQp5mke1by3dTlSw9PwrX2EY6xR9Fh1RqQftWf1R+B/8Agtn4B8Oxx2X/AAiUKLwP3SQoT+Qr7BtP+C2nwZudBA8RaFLZl1GB5igfoK/iN1vSPAnwUvo9b+Id3LLcN80dvGwOO3I5/lXE+Kf2jJ/E/jWy8Ny6VNY2UyqYpXIOUPfGFI4r6TLMNOpGzWh+f55h8FTl7qP7hoP+Cpn7H3iIL/wlNzLou88SSXOBz7bc17V4Y+JP7PvxihF98G/HVpfyt963aXcT7YZgK/hg+IHwp/Ykk16x8S/FLxJdJtiUy2sV0/pzjb0/KvONM+Cp8ea3rnxA/wCCd2v6hBp/huEXN9BLcTOuwEDILeX6+le3TyxJrQ+Or1Y/YP7WvjF8KNa07xEniLT4AsrEiRVIIdcYyMdK/Cj9o3wQfDXxIvpkhb7NcnzGjA+6x4OP/wBVfMf7JX/BcnUvhlr1n8NPjFqTajHCfIuZJEY7THwQGIIr90PF/hf4Yftm+FU+I/wWmjubiWMO1srLuwcdOR+WK9d0fdsdWExXKrM/NvwroGj2elabrdhc7bqFuW7FCMFSPoa+s9FtPhp4rnhtFvEjnlwgXPRj3xXgPhrwTd/DH4kr8PviHbtbxXkm0bh/q+456dvb0rQ+M3wFn8N3J+Jehecr6KY5LiESFVZZDtG3HoDniojUcVoc2MXtJG78T/gp4O8GeI1k8SanbX19JEz21rt+YkDgLngV+Vfx/wDih8bvCPxPs/D19pculaNdRyYUqMDaMAjZ3PHHFfs94j/ZLX4+fDvSPjB8Jbq4OqaYqyfNIX3kYLDaTxgZHevzU/bK+KPxK+Bemad4/wDGujLf6Ddxyx38ZhBeKTIUYk2kjnHQCngJylNtFzqJU7RPgC5/4T7x7KNP0BZ7m9ck7DlioB69scc19e/Ar4Z/E34S6qmv+KE3wzId4ccgFSPXtXhf7HP7ZHwy8W/GnVvhdZCOIX7tLp8zAB18sAhCcDIb8K+0vjr47bx94WnhtZRaalpw8u5ji44/T09KvMcJ7em6NRaM+Vx8OeLuaPiMajcXI1rSnY2x+7tPGDx0zXqfw91Y2jxR3JId8r8xyvII6V8Lfsy+PbrXNPuvC9xLvltnITdyQor6zt9UttKu1cSbvLOT2r+buIeGqVKvKEEfC4ilyH0/458MW3hPwZLr8N8gV49wj9D7V+YNzBLrWpvqET5mkO5j2wD0x2r6U+KfxD1bxDoyeHfNDQv83XkDrj9K+ZbHTrkzm0s5PKAyc4z07dq5cuy32cdjzpxVipqlnJDZfZYuGZ857D2qv9ieOyDv8xQZ+uK6q4s729sDHZYaaPtjrVHw7cXmrXy6P5QEmQh4/iPG3FdmLtSpuUiKVNNH1/8ACWS60Hwrb6xbjYkhAJI6cfrX1l4U8drdJ8zAyxjI2jGR34+leA6hoGp+FNAt9P1xDDG9sk0eF4yVxivOIvF/9nzRyREj5QNq1+PYrBqpWlMicWmfoj4c8dadczfZpImSGX5WJPP5V6BqXhJNQ0uKPSFj5fJkYDOPz49K/OLTvFOo28/265B/e8AjoPwr37wD4tvheZklZojtyN3THtXyGYZHO7cEP0Poix0zU9JlYQjzUhx8qj8+B6Cu68KfG74Oavrdx4Mm8XWVjqloga5gLYZR2weOc9R6V+ZP/BRL/goP4W/ZL+CDwaWy/wDCUawHjgXPKg8bio56Z9K/ifsfiz448V+LNQ8b+INYvVubqRp5vKnkTO88Dg9BnpX7J4eeBU8woe3xWiPboZW5QUz/1f0VGuWUkRsvGmiNGcYLHHH/AI7XlfiX4E+EvGMb3XgmfyXPJRuOfbpX0zf/ABF8EajcsuvWX2NjwZeuD9MCptJ0nRtUuWk0x1vIByDHiM/TvXrPDe012OqliL7n5t6h4U+IXwuvRcTrJtU5SWL9On+NfRnhr4q+DfiV4aj8EfFS2DbhhbpflkRuxzivt3TfC2kXVvjU4x9nfgxSLkgezf8A1q8S+LH7Gllq9s/iH4aTbZWG/wAk9D7Dn09qw5alP4TGtVg9D5eutO+IHwB1Zb3RppLnQJP9TPG3RfUgZxX0n8Pv2v8ASJQNO8ZW630LHqQCduOOcetfN/hvxd4q+HV4fAfxDgebTmHlvFN/CP8AZYiuY+J3wrTQUTxv4FJu9DnYH5RzH/skAngfhX0GX5uo+7I8zEYZy0ifrF4Z8SfAbxPqcOu6HONOvExt5yQR04GOlZH7Q37J2h/F3TT47+HvktrMK7plT/lqByeOMZ696/JnSviDeaddW8XhzPnNjp0Hav0x+CP7RmleDNDTxH42v/skkB2OjEEvgf3eOK9vGUKValojzqWKngqiaPizTvC0un2cum6zam2u4PleNuCMcegr5x8Zy29pqBSXBVDX6kfFL4v/AA0/aLW48SeALVLW7iyrnKr5mPb5cV+RHxY0rxpp+oy6jcadIYATzH8/HTsK/M8yymrSl7h+tZNntPGU0m7HrHw0v0vdZjtwfk457Cvr34cT23iHxw3h6QsLecCMkHAQg8H35+lfFfwdlaw8PSeI5QPmAEanuwPT2r9Tfg58NtM8Q+GIYNJh8rxEg88kHO5XGRxxjFepw3g7z9883inMY06fLE+t/gncNpWjat8O9dcKluMxySdMbgB9OOetN8Ta5pFh4Wt7O6iE7MzLC+flIB54xxxWjoel2fivwVNfj5pR+6utvDDyuP8A0LFcte6LBJ8LdKePlI5pQGPXrX6jSn7OHKfhtSnz1uYz9B1H7DpkkFmdsc45Hp9K9c02+t73w7Fp0oDQyIyH3JFfP9vII7YRL0HFdZo+pywW8VuThVOVrinDmPVovlehT0jSEsfDPiXwbOuTETJCSOgxk8ewrN8FftMfDv4FfsiaP4++L17HaWEUUmxWwGd/MO0DkdCAPxrpviZrthongbVfEyny5ihjLf7ybf61/I5/wUT+N+s+NNC8L/Ca3vCbHTUnd7cH5d5bcCR07VhkmSzq1mm9DXNcU1TKH/BUD/grb+yd8dvFOm6r4K0N7TWrFWhmuA4/fDP3iuwfw8d6/H/V/wDgo1pelIBo2ns23vuHP4FR/Ovk/wDaI+E2o6pcf8JFpH7xwP3qbVGAPTAFfDtykifu5Bs2nGCOeK8XPMhjh6z5o6H0eVZ3KWGjFPY/V3/h6P4oWXbbaW4A7ZQ/oBX7yf8ABH/9ojV/2j7bV9e1OL7Otk5i2evyk56D8q/iuJQjawH0wP6Yr+tD/g3ktol+H3ia7PB+1YAHT7hr804njCFJ8qP0DhLFTnjFGT0P6B/GV6Vt4ZNwXY4PTtnpXQWutQS2HmBMdOa5XxZZpqenvbgcqDiuS0LxTusxa3LbPsy7Dxnp+VfkdWPNsfs7fK0dFr8wI3g8NXz74w0r7fYzpKMtt+WvUtU163vYA7NtYdBXGlJLtd8p4NfN4ujaVz6jBY/3eUxf2ddJm0jRbyOYfeckdq+jdESWRZFccV574NtTbCS3iAQt0HrXpunyiz+Rzkn0rVNyjZnZTxCUrnl3xGsT/YM8J4yCa/MTxj8EvDvxOkvLXW4BI5Hyk9u1fqz8TLbztMOWwrLXx7oOnWn9puxPfBFduCq+zR7VOrBo/LC3+A3jL4IXk9v4JVktpTu2gZ6HI7+1ffc3/BQ74i6Db+ELGLRPNm0mQLeOcYKcA4+XjFfUcnhbTtetTDdQpgDqRXjviX4G6X5DSW0SY7ACvosNi6TWopU6c/dZ7Z+0d/wV/wDhfqPirQ0sNFkmh2p9sfgBCEx6HvS+Hv8AgqN+zvrPjzS7a3sH+zxqVZjxglT2Ar4pvPglasSXs4j6fu1z/Ksux+BtpJKxSyQHthFH8lFenQxGH7HJU4PhUV4s/Y3xR/wUl/ZujtRp9mS4eRQc5wACPY165e/8FIfgDp/gOGLwlpU2r3F1MmEGV2kYH93t16ivxc0P4B2RmSSaxVmQg8ivuL4V+CLHSNirZx7RjK7Fx+HFdscXTWx4tTgalT95nqn7SGgfFH/gop4EX4U2Omy6V4e86GeZ3fIOxi2OcdQcd65/w3+w/wDCz9n7wgui+GrGF7m2j2F8DsPUCv0n+FfiG4XSU0fT4kto1XHyqvPHsBXB/H/bofgueeIHznDZIrgzTFpQ0PHox+rVuWOx+N+saHLqnjO28Iacu8u4L46euMfhX7DeBNJtPAHg2y8P20YikIUkenTNfFH7Nnwxk1bxK/jPWk+782T7V9k+I9bhOoPHF8z/AMPPRcYHanwVkFTH5pTpxWmh5HiVxNDDYJvm6foReKtckvL/ACn/ACx4B+gr+aL/AILg/s+ajc6/oP7RHh1WCwqltKy8kHcMtxjGBX9FN25fkHkjFeWfGX4W+F/jf8NdS+HfimJJYr2NlRmH+rYjAI/yPSv9DMy4OVTJ44fsj/PzL8/5c1lXezP5y/2Cf+Chd1YeKNF8O+PrwRajpeFsLxjnMSnAjbpx7549K/s3+DvxQsPjR4dg8ZaNcRSz7dlwiYI3YzuFf5vn7UP7Lnj79lv4qXvhPVoZIrVZi9lcISAYuwB7H8eK+v8A9iX/AIKs/GL9k3xLa6d4guJdS0pWQeWOf3fTB4OcetfgeCzepgK7wddWR+rZtk1LMqKq0dz+/wBubyaOe4/dqrAYU4HWvCfEp1DWbWaHTlSG7ddgJHDE8deMcV5Z+zh+35+zv+1V4Wi13QL6Kx1CQDzLWQgMCR0B4/lXe/GPUfDt/wDDnWEtz5LLFiCRGI2vuH8S4PT6V6ue5vh61FJS0ODI8lq4eZ+Ifxy/4J5fFS6TU77TLq31Oe6kkkaDy9zICd2Q2eBXwV+zn+xL4n8e+PX8OnRZZZoHKy7eFBU/Sv1m/Zx/aO8T6J8PL/xV8V3ks4IJZoJbwkvmCNtqfJz3xzmuu+An7Zul+BdX1G/+B6x6291mQTiEKTuPvnGPrX8z53w7l9bFOpKWh/QeAz2vHB8kd0fJ/if9jHWfhD4302XRbCSdrNszwrltgPc8dvpX6H2luE0q3mSMlwgG3OAOOhHtXhnxS/b68daD4hj0+yjitNb159t1vVHwvXj06eldvoevT6lp8d88oa6f5pPfI7dhX6lwTgsHhYWw8j4jMK9WrLnqbk+qyywM0cS4ZveuG1hIJLKWFQAzLjNa+o6j57tAxy57jtXC3t7bNfW9oD8yOC49u9fbVcRG5hhKHJFzkep+CvhdHovhm3123jAaZtzbRg4rU8X+KWj8JnTLBw0plGI+pwCOMV7p4O1Dw/q9ssdqwWGGI4UnjIWue8K+HfhpF4ol8VeIcTK5wsWcDP8AT8q46809D5vBUZ+3lUex8kr4k8SeJ9fh0/X3aI20JiRYuPlPRcCvS2u9S8Gy2unxg20qKG+VufavpHVfCfwXTxT/AG7pgSC5fDiP72PQdv5V8k/EPxLHqPjC6eIH5W2/QD+VeDiKcd2fSZVT9rPRHrOmfFHxPBffborwmUn+PnjHTt2r1/wb8ZIxdP8A8JJZfaCx/hwvFfCVvrtrcP5eMY6k12en3yXufJLALxnoK8HE2ekD6uOTpfEfrV4YvfCnjqw/sfT3itUkGQpHzZb0r5u/aE0fQbS8tPAGu6gsFvFiYju/8O3g/wCelea/DvVNVsE/tfzjHbWYDF+zbfavA/jZ4v0H4d2N9+0l8dNR/e7jFo1jnDSSjlQR6Ef7NTluCdC9SSPic3p3q+ygeKftGWWjeMviPafDrSQ0dnZW63bKvICj5Rnpz7VzXie+1HxJfQaVpUIj0rRI1eKBV2M8ijb1xxn6GvO/2cf2vPhf4n1PVPEnxYt/s+t3mZIbjGdqk8RYwOAO/wClfT3if4u+G7nwTN4w8N3MP24ApGgjUYx0bHf6cV+bYuNapjXNLQ9GNB0aHKz+Df8AaFTxF42/aG16B4ZvtEt9LCBKrDhXPduw/pVDVPDemfDqBtAlIk1F0y7dNufzr9zP+CpvjfwRc+HtF8W+EvDsekaiZP8ATbyNVw52cnAVcbj7mvwI8Y3o1GdNbW7Fw8pAIxg4xmv1jKk3TVzwK8UYttoF5fHzZCNrcHFD+Fbu3bBwo7Vl2mqahYlvsrkBuxGcVsnxO+oILe8X5vUcV7++hxcyKx0S/tzmMhh7Cuh8Kaxe6ZrKm2HfBqnE2oom6L5ou9T+HE8y+kAGWyKwnLlaKt0P0P0S+Or+H4lhb5yoBNWdF0DdbXFndjf07e9eNeGNZl0y1SJWxjFeu+G/FcDasomYYYHP5V2Ua0JaM4q1NrY4LxZ8L7q8Rriyj57cV4VqfgzWdLJN4n0r9Q9BtdF8R2Yt4XVZT0P0/wDrVgeIvhPFqUTrNDnb0OOtbTwKfwnLCry/EflA6NFL09sVMBLyT8uBX2fr3wSsRORFD5bA8cZzXk+u/CbVY0e4hi2quRjHoK8ytg+XVHoUMTF7nC+Ab6VdUt4ogWd3CqB154r+wHSf+CKvwz+On7Ofhf4gQT/2Xr+oWMUrM5JzvXOcDHpiv5Vv2b/hlqnjD9oLwl4Oit2cz6lbb1x/AXGf8K/0sfDMI8DeENG8HQN5Y0q0jtip/wBkcV9dwnwrHHfxEfNZ7xHLBz/dM/i++P8A/wAEaf2pvhXFLd+E4v7ctUQ4MalflHTqTX5k6/8ADX4hfDW5TTfHOjz2UkfDblzz+Ar/AEiRrUd0++6YMg7N8wx9Dx+leb+Pfg/8E/iZYSWvjTQbO8jcf88Y1P5hc/rU5x4RJzk6Z2ZL4pSirVD/ADmNP+ztLNOrZJbj29q2r7ztkNu3O8Zr+tn41/8ABEj9nrx/I+r/AAzuRoFxI5cjJYZPbGVxX5IfHD/gkH+1P8KtXe/8OQJ4g02Fco0R2nb9Pmr8pzrgLGYe/Kj9Gy3jzCV0tbH53+DI41nOR8saDqK+qvhBZQ2uh6trcI2yOMITz3HSvFNR8EeL/AkUml+J9LuLG6ZtpVo27e+AOK+t/hfpsVtpuhaJJASZ5d03+5g4z/KvzrE5fiKcvfgfa4bNaNWPuSPqTQrAeFNEt9MEe6SwEdywHGDOuP61q2kkMpZCmFI3oP8AbJzUWj341GEaldEb52e3kHtEcRj8BXR22n/ZEC7MyxNuDdsHjGPpXDXxvs9Jo97LsJz7M19I06En+071f3kg2lR046Vo6lq8VhbE9uoUHjjmtmG0ucNJZjehXken4180fGX4hWPhCyeziJFzIpC56A//AKq+SxeMdadoH19PLvYx5pLQ80+PP7TGp+GdIOg+Gbkxape/ulVDyoY7T09s19yfsdfEz4nfBb4YW+geF9Wkt5r9fOuDzudjzk4YGvw38CahZ/EL4/WWn3/+kSAuSOw2Cv3Z+E/hfzZ4kWMqjAgewUfhU4vEVKUFoeXVxMaknTex6t4w8VeNfGsv2nxHqNze57PK5UfRSSK8jutCu7djug/ddRg/4V9L3Ph2C2T9yVwF49+K8t11jZab5sUgTHXPNcEcXVqyVyY0YQXuo+e7yx0qC6drqMlj0A4xj8K565gTUrdntF+VRyG/zj9K6DVbqzmuvtU8qhwcBfXtXnr+MdJutI17WLSdEGh28kssbFVJMak4UZ56V9ZgaDn7ljycVi4QfNI43WdVTQLUyzkRSDoQFU8e+BXy98Vf2wdL+H3haafQ7xX1fBGCQ351+Vv7QX7YfxY+Jd3NHoMctlYjO3jqmeDkAY+lfG7+FPGOvaHP461KVzah/L3s3LNjPAr9AyrIlFXPgM4z58/LT0PqFf2tde0/x9cfEXxE39salcr8kRAMcXb7pDA8ewrF+Kv7Qnxi8f8Ak+OfEssUBA8u28pETCDoMLjGK+Jy0iYkDdfTjpRLd3cibZZWZR0BJwK+poYeCWiPmMTiqknqz6G8O/Ef4rXTDXrNvtPkHdI8i+YMD2xX9cH/AARQ+PyfFrS/EHw8+NGnQ2SarYLbW4it1txcL2HmYUDpk5zxX8ZnhP4heJvB1pJBokyokvUMM9K/aX9iD/gqPp/hS3t/g9+0VaLP4fkKol3bIsEkP+1uUFj+YqJ6PQMPJn9kVh/wSq/Yu8TfDS/abw/DaC6mkIztZmywziTAPUYGBX5D/Hj4efED/gmHrkPxZ+Blxcr4btWBnsJXaTCZCjB9Mkcba/Xr4JfH+9vPhI2peEbkeKYrS1WfRkVguSBjYT8wyqnBz16+1fD3xK+Ox/aw+C3iPwz8R7HyNWti6vbtt4AYDHGOh710YSlGd1I3qSaeh9OfA/8Aa4/Zq/4KOfDG3n8QPDpfiaWMbZxhP3i4wpHGOR1zX0pqHwt1zWvh03hzW0Wa/wBM8wSsOlxEwCpj/dX61/nyeKviD8R/2K/2grrSPBN1JFbEh/JyeM/3fTFf1of8Esv+Cp2ufEHXdM+G/wAYLVntL9RFFdy4IjZkIGTt55wMZFeXi4qMkuh20qjPov8AZx8feOf2ffG914N06djpb7sRyDPl7jzx7DivRv2jfCml/G3wnrej6sttd6RqEbsE2ACNgmfX+8B6Vb+O3gO68NfEK78RKw23Y3RsnClWB7fSvnX4deK7svqXgW4kLQ30MrAtzsODjH449K6MHGMNYkJH8SnxB0W9/Zx/aY83TGa0ktr1fLkBwCnmBTj8P5V+3K/EKz1PVY/Fm/dBrkDO+D1bb/TFeKft8fszeHfEHgo+MIZojq+kzE5jIJIaTvg9h2r5o+GXxd0PUfh/p+gNcCK/06MxHceuOp9uK9CNO6uzyMVFc1j7V+Buq3TfHiTw94dHk+er/jjjNfofqvhy/wBLkaTVYT97YD03e+O1fDf/AATu8OWPxL/a4tBNJ5qJaTSyY6LtHHP61+zP7Q1lonhu0u5rnbJ85COvGOPSv584slGWOtA+KzlWeh+aHiOW9bXDNAp2R/LtB7etVrHXbbz2tm/c7hhWIyCcV2EFzb6hABCm5n6uTjjP0rA1nw1OkH2myZRtPyVzdLHz3MTaXd6ppV3HdLIlyoYcqNpx9Oa9i+DOmWPir43abHPDst5pkdm7Bs45FeIaNqd75qws+2WM/dI44/KvsH9nzSda0/XF8VJZgpGwbeejYOcAdq+b4pq/uOVHVQitD9MPjf4WsdS0i3sRGkixRIqlR/CAa/Lfxp4ONnfzSafGRGgwcr/Kv0/0zXIfGFjkny7hRsMR5HHfPH8qxvFXgXQZrMQXsSMjL8zL3b+77Yr8gw2Yyi3FoqrFXsfm14H0bWZW8yS0aWNMEtngA8dMV7D4t8RWHwq8FX3xU1hRFpmlxGSQnpxx09iRX0H4W8PeHtJvJdGt+YZsIi/3efWvwe/4LXftBar8NPBNv+zX4TvfM/tBy1wsf3vJmUnn6EAf4V97wVlFTHY+KmvdHhMPerofz+/teftEeKP2kPjJqnjXXZ2kthPJHbRfwrGDhcemR7V4v4KtjDIzMhk39FPb/P0r6Xvv2SfGfw3+EenfGP4kp9ii1pmXT7V/9Y/lYDFl/hGDxxUPgHwskbyajfRBI0A7ZA3Cv7Y4eyuMaShHRI+tc9OU/9b9wtZ+Efgjxpbm88PTxzKR1DAH8q+UfFPwd8YfD+9OpeFZJAwOcc/TgdOld54m+Feq20I8T/BrV2Ma/MYt2CPYjP8ASsfwv+1Jq+g6j/wivxctGkCYUSkAL+eK+lrU23axx4WonHXQb4J/aSvtImTQfiVYkoCE8zG3b6Hoe9fbXhXUvBvjezE3h7UEDJgqAcfhj9K8f1P4e/Dr4t6T/b/hjypUI+fbwVr5/v8A4MfE74bahH4n+Hl07QKc7M/h0rSlaC5SarV9D7d8ffAjwt8T9MfTPE9ssV6y/uZwAMt2Havz0u/BnjD9m/Xp9E8TW7XGg3TbJARvTB4JHpxX2N8MP2l4dWvIfDPxNhNvdxkBJSO/p0FfVnjrwloHizRBpesRR3elXigJIMEo7d/wrmrYXm95GEsVOOjPwx+JvwNuvD9o3xV+Gyf2hpdwd6RR9Yx3BHPT8K/N3xvpfxB8Z+Jh4pivJIbiDpaDIXaP0J/Cv2p8O6lefs6fFO88B+IF+06BfOQgk5TyjxkDn8q6j4nfsl+G/Edx/bngaMQi5/fQqnTYen69q9bCYm8FFHHj4S5VJH4t+D/Feoadf7/FFrJbzKwwyMVX05AFfYnhv4q63p9zHELcSafcDDIybxIuOgJ6V7NpPwKtbv7Xo/iWxC31qMSRsOZB221V8E+C9E8Jah9mnjOreGb1/LJx+8tCPv5HP3Tx2zXuTpU3S95HkU8ZUoyvTdjx741634E8P+MfBvh7wIvk/wBo3qm8tiegKlsjjpx7V+sP7Fl6t/qOpeMpPm8uMQxj0Ctx+WK/Hn47/DqOz/ar0u0sH3eVBBcwop4EBB2Aj14r9Vf2KotQg0eWytgY5DcMkpIyMAmvNy3CRhU0R72bZr7TDLufYPiO2j8DDVNU0JdkOrJ/q88KdwZj+OPQVy/hhhqfwzWInP2Ysce7NXu/xQ0Sy/4RuKaMfKi4P16V4Z4Jtvs/hC+jxhew/EV7taomz5HDPU4fQrVNRuJLALgrzWbP51vKh3gKM/hziul+HsDT+IL6fHyrG2B+FedXl0sDt5jf6tm/nn9K4Z1GnY9FHh37YXxJj8P/AAourKOTb5iFj25AwK/jJ+K/jW68UeMrvUZ5NzeYcewHGK/oE/4Ke/Gn+xPBw0G1l/eXXyqB/vD+gr+Z+4kllczXB5Zj+NfY8M4Rw/eHk5viOZckQ1Szi1O3KzKCSOTjrXxr8U/grYauWvdMjEU49Bw38sV9kXUpgh56VyF5FBdRkYyfSvazXJ6eLjaxw4DHTw7SR+Teq+E9X0i5Ntdx7QDwcelf1W/8EFra48MfCPWdT1ICNLy7Ux89QyEf0r8RfGvhKC7ieJ4hhhjp61+kv7D37Rvg/wCFXgyL4cR3Jt7lGTKnoSoIr8B494NqQh+72P2fgjPaXtVVluj+pqRojIY5SNrDIx3r598QQyeGPFrxyyYt7pdykjA+lYXwa+Nej+PrRNPlnXz41Hcc/SvY/Hnhi18X6JJZNgTxJ8jdMelfz9LB1KU+Wasf0JDF069LmpnjM+qRG68x+Qp49MVuW94t5E06DZCP6V8nR+ML/QtYPhbxQxiaFtokxw1fQUGoi8sUtoJVdCowq8V5uNwaeqQYXFSg0mer6VLFdMBayYJHBr0HS5JIZRHN17Gvn/QReQXixJ8iDgLXv+l38CwFpyNyDkd68R0pxeh9HTxSeqOM+JEk94otomztHzD2r5rksE0zUvtKthGNfRuuW8Wtyte6a2WHDAnFeN6jBp1pO0eodui+ldMaLkjvpY2KaOm03U1iiBkwFIxXVu4ktlRFDAivHri5hdP9FGVHTmmWfiyex/cO3PbPalClUjsesqnMvdO/uLHyIvNMQP4Vz0urWVtbl9qROKpXPjZ2t/LMg/CvMta1bTruZnkchj0ruw8ZHs0nONO0T1W18Vsj5WQDJHSvor4faheX08b23KEj5q+HvC9ml1eIS5I3fpX6W/BXQ9LElvZFhtcrgdK9qhSb3Pm8xqVIux9k/D2K4gjjlUcdDx6Ct/x94fg8W6DcDUhtgX7reuO3tW5qdrP4f037JpsY5xhh/n0qxfafOPBsf9oSbRKflyOCScYrrq4Fza7HwOZZhOlLVnzVZQad4A8KSW7ssKr0YdSMZx7cV5touofbHk1S4P8ArP8AV/7navjX/gpB+1zo3wC0u08MWKm5vZJlaRE+6icA5IB7V4h8EP8Agoj8OfGFva6VIwhukVQFkXYAvsT1r+ifCHKaWAqLF4jrsfzn4nZtLHL2GHlsfqm0XmScn5cZ/wDrUgkjjHlx4A9T+led+H/iRpviazFzZTRTM5z5cRBOMe1dXJYXmrxBrdSi9WA5xiv6/wALmlGvCyaSP5vrZdiKckpRPnr9pf8AZg+HH7Tfg5/CPi2BWusE28/GVk+vHHbFfyPftZfsF/E/9mLxBPFrljJNpLuRFcLyMA8dPT61/ah4h8TeHPBunfbdXcKyD5U6kn6V+dXx18XL8abdvD/iOFJdIwdquOV/4Fiv5e8ZOIMrjU9lRd5H7f4cZdjZtc/wn8m3w8+LPxB+C2qQax4Jv5YGGH2KTg49RX7ffA3/AILPand+DpfAnxMlCPOojBYZ545ztr4x+OP7LPhUa1PN8PGDQpnfuO1QPQHmvgvxF4Bl0tzBgMyHG5R0/Gvw+hmDlHTQ/YamSpS5j+kTUv2lPhJbfBS90j4XajHJe6qT9qtzhh83JxuOBn6V6D+w94K8bzeFrq78OiC33rkvLJH8oJ6Ba/lRtbrxf4WkDaJdzW568/N/OvZfCP7WHx58A4/s/UpVxjleOB7CvAzTKZYle47HXRxcaDs4n7xfFj4ba3pvxgOq63dG5u1kyWUDav0xX294O16GDQ1ZJczKvuO2O4r+bHR/+CkvigXYXxaTeS8BywIPHuK+uPAP/BRfwBqyi1u4fKPAJLMP58V9bkMlgqKi3qc+M9nXd+Wx+2lj4rWK3kSXl36N6VzWlapp5177RdnJ+Ybu3KkDivjnwd+0/wDDXxTEltp+oQKzYAJYA5P416zoniTRtU1pdC0/UIbm8aKSZI42U58tS2ODxwK+op5tB6s5sZSpRo2aPrD4X6v4t8NS6jfalbtNYLu2c7cjHGOK4DWfG2if2h/aepag9kk7fJF2znpwaoeFvjRpJ8DR6R47nW3N2H+zhuN4Xg56Ywa8fu/Hnwk1u6i0O4nhimszuxuByRyMfUjFayxvM9D5zDU1G/Y+q5PH1hoF3aa5ZH7bPgYDfLwPqD2rxbVvF9zrPim91kgn7S+7auAB7CvmX49/tP8AhjStYTS7mdbPTbFhHJMMfNjGMAY/nVD4J/HSH9oL+2E+B1rFdx6LE7yyM6qf3aliRuGOgrz8ZiG/dPoskr0qd7o+wrG5udRwkMAV/wDbZUH59K6fV/HXwg+EFgPEXxl8TW2mwKAywRnz2fH8OIzxX40fEf8AbC0+yuBpnjTx3Lp6rL5UsMFsHA9srxxXwj+0RYfDfxR45tvFXwk1e51bS54R9pMrTIrSkfNgE7RXHTjGPxMyx2ZzlL93sfuL8Sf+CtPhK/iPhn4Oad51hCx8t8j5lxjPIB/Svzf+L/xh+Kn7TPiuPxL8Sr5mtLPH2W2Hyou0YXC5xkCvlzwN4Ugv1CWMYEUfUY6D0z1/WvprRfDbT+XBbLsReMDtxWWNzd8vs47HJlmWVHVdWZu+F4JRKsgwSDxX0Vb6re2diHuHJ44XOB6dK8r03Rl0do4WHzN0OK6PxVqGxI7eLsteXR2tynoZlKnJcp87ftcaTB46+DWsrdjZNZxNNGOvbGO1fz2wxqEVJCcxDZjtlcD+tf0v+KNJsPEngHUtKumzNdwOnT2r+eTWtHttE8U6jo1wm145349B/kV9hlNlDlZ8RmS5dEcNHbsx+UVpwaN0aXjPtXRrFbqPlUCqlxI/Y9Olexyo8OO5PpkjLvsZOB2H0qPwmm3XJRnjNc811JHc+czY+ldn4VjhnvjcLhR71wV10OqM9T1/zcKroc9KtWEl/wD2gGiB7/yqWxgs0RRJIpz+ldDbS2cVwohYHNYwp8ptOUWjuPCXiHXdJlVt54Nffnwf+K2j+I1/sHxCoEjDapI9B/8AWr4EhmiO2KPbn1ziut0fUptHvob+JgBuBOD0xXs4aokeTVw/NqfoLqnh7w7dTsrKMxn9O1cpdQ/Dfw5ZMNdeNmzvC8dB2/KvLdR8cTzWvnaMZJ5Jl/gUtjA74rwdPDHirx94zsfCxina81KZIYlwduZDtHPb8q1WLhUqKnHc5aEI68z2P2z/AOCSP7Pfhn41/tHS/GOLTjFo/h6J0SVh8puI23Jjp1H5Yr+nXXbqfVdZlmDcsT+GP/rV8wfsb/A3wz+yv+zho3wysYhHql1FHcalJ385Rgj2yDX0JqV9ZtEhsTsbv3z/ACr9k4bo/V6Sstz87zevGdayGr9rtASzZHpWrbxfa4C+4A1xi3siPhwXqRGnJ38x+nP9K+lWjueTW0VkdjA1/ZkzRkhPTjH8quW2qzrL843Dod/zD8uK4mPUp1ZU3nC/4VuWcl+XEg5WsK9OlNe8jko80HeJk+N/hP8AB74qW7ab480W3uI2GMqip056gE9q+LvGX/BNP4V317Prvw3n+wXGzbEmd236cjt7V90XUt59pZf4OOnFaVibi2b92x2+tfH5nwXQxSeiPpcm4qxFGdkz8S/F/wCyP8WvAQlgtbL7TaxfPvUg5PrgetcLB4c1FVjhmt3ik6S71I9sdK/ZXx/4u8Q+BZk12+tUawO4eaxGcYx0/wDrV4pp/wATPhL8SDIJU81IyC7CLbyTjGB6V/NPG/h7KM3Ggfv3CHiDypOqz8+9ft7rwtojwQII0KZaTr09scV+MH7TnxPjuLmVDJ/q9w3Aelf00fGv9n3wb4v8NfavBery2zToVAaJkxx2JOPav5sf22P+Ce37WHgDQ7nxpY6R/bmho3mSzxMXPlZBOQnTivx7AcGYvDYjmmtD9exviFRxFFQpn5XfCX4seJ/DfxtHizQLdrmKJm8wAHBU9cHHYCv6JfgZ+2t4R1GxSSezdkiAEy+Ww2568gH+Vfh14C+Pn7PXgfRFhuPDrRTom2UFZDluh+b/AOtXu2i/8FMvgV8PtA+w+EPA0M1w3DMzsM/+O19BmWQ1MRaMYHi0c4pr3pH9IXiL4i6XL4atfFnhCTfptyvzh8Js49Dyf0r4K+OH7UnhDQNN8mO9jDgHPTHFfhL8Vf8Ago/8ZfiVYf2JoMh0HRh/y7R4YY6j5tqsOcV8R+IPiL4l8W27wapqEsg9yRV4Hg107OTOfFcZR/h01qftDcftlweJtfTwx4MkN5qEp428LHnv0OcD6VX1LwnBDDe3fiG6e6vLokzAEqvI9A3Q9MV81fsQeBLDTfCt14rmhV7+Y7Ud+oTpxx6V9na3p8NtpDyOpZ8ZLGu32cac+SKOFVpVE5VT8xv2lPE+m+GtHXw7oUEVusnO1R07V8zfDrTNd+Jeo2fgm8vDaaMZ1eabkLHkYLEDr9K7H41WmsfET4p/2FoKPK6t5e0D7tfQfwv+F9/4S0+98P38QjuntWL4/h7df1r6/Cy5KWp83PCupNnx58Zvhfo3gLxjL4f8HaidbtEXeJ0QqvpjHP8AOvDnBXKEYYdR6V+lXgzwHFovw81y41O08y/DM8TsSxMY4/Cvzo1C4eW8lkkXDFiWHTHtXTRq6WPNxWHcNzNVcMozgVPHIo4ZeBznvj0pvyp1GaiBIz6GtWkcUZtbH9M//BDX9rbXLnWLz9nHxbfstvIok06Vvm8uU5J47jgcZHSv1Q8aajJ4a+IeteRGBLqC+UyKFGSuXLYxnkrmv41P2X/jVrf7P3xi0f4k6JO0JsplZwO64I/r6V/Yv8A/jR8K/jr8SfCHxJ12ETQ+JopoOuB50MT5PTHPpiopTcX7p6NCSkrs/nm/4KA+GbLXvHOn/EK8jAW6n8qUgdBHxjt9PavdP2b/ABeuly2L+H28iKxMbxBeuQR39q4z9uuIRL4n8Lf8tNEvZZIR/sSzDbgfTivKf2LNbm1jTY2OXntyNy/jgCvLzmMlG6NsHO8rM/tMPjSf4n/s8+HvHUzl5Y45Fm5z6YGeOmPSvlrRlez8TTtCcf6NMoP/AAH/AANfSv7Juixax+yZL4duBm6wzAY+7yGx+QrweG2aw8T+TP8AJuDR5PbzPlxWuDd6auOpVSbSP5ZP2qPGHivwv4o1bwlo9691b3VyfMY5zHhumP8A9Vfm3rN9Jaam32GXYY87yMru45xjNfor+2emt+Ff2y/G/wAO5one0urlfJjC7tvy4GPqSPpXrn7OH/BK/wAQ/Ey5HiD4t6n/AGHpRw8SAh3df93K4ozXiGlhadmfO4zHJbn3h/wRcsNC07S9d+LF4/lzq3kwlh95JI+QCcdPpX2x8ffHMmtXK6XZtugdyWzWHofhD4XfBnwNafDD4YAhbJR5txt++w7/ANK8U17xbo2paq1nqBZpIugA4z25r8NrVoYjEurY+MzHEOcjK1bdYbHjXbCoAJ6fpUUMaXAEVxKY42OVB7elbL2enaxaxyptYqQOuMH0x7VT1PTJJVe3ulG+L7hB4AHetaqgtDz3FEl9oN20MLW5WR3YKwHXb6195/DOPVtC+HhurO3DBOPvYx796+CfC96qyh70/Ivy/WvvLwx8QfBOmeD10yQFGkXaDnqT7dq+ZzXDKr7qN6Wx6j4M8fHStOXVdT5Zsj5e2Kx7741zNDIiSmOGVzsUj5s+tfMd948XRBdaNor/AGgvkoCMbe/vXk8ev6zrk/m6gSbpcgKo2gen59K+Pw/DH7185NVs+nde+O914Ss7nxNe3QSHT0Mp3AYbHb2r8MvhH4S0P9rL9o7V/wBsD9q5TF4B8OFk2ynCXSwPt2JyOzZ6cY6V6T+0n8Q/E3xf1i1/Zn+GP2hpdRYxajdJGQIoyOefYjHUZ9q8a/bB8baT8K/Cmi/AvR7NLXwdpXl+Zbxth7q6Me2VXOOhxuzzj0r+geCOG/YxU47vQ93LKGl0fMf7WH7QWs/tZ/GmfXbRBaeHbMi20+ziG2JI4AUDBfdNueK8i8Sa9B4f0E2mlfu2ZgH79OK838GeL9Dhu73yowk7sdik9FJzgenAH5VneLLxndZvvBiTX9AYLBQpUVy7npKmz//X/VD4ReLfCPxBszps9ydF8RWpKToeNxHX+6OR7V1fi74c6Pqls2lfE+wSW0fiC8hPmYz90ttAxzivCn0Hwh8bYE17w9cppfieNR5gHyrIR15GMZGe1bOk+O/ix8N7Z9H8QQtJFHxsb5lZR7kd/pX3VDGQrQ1PKxWHcdWeX6pp3xU/Zq1g+IvCN02raApyN3JVOnCrnse9feXwJ+N/gz406Ysmn3CQ3jgb7dzjp7cY6eleBeG/HXhTxxaS2ml7bK7lJD2TDMbZ65ZsdvYV8m+NPhd4i8E+J5fGXw/kOnX0DbnhyVjYDsp4zntgVkqSWkNjnhXXLeR+rvjn4R6B4plOIBbXiN1HH0x0zUfgjxr4m+Eeqp4T8WobnTDj537Z44615L+zX+05oHxp0z/hFvGch07xDY4G2UY3legPTAOOODX1rdQ6b4mtm8MeO4RDOcqkvbGOMHjNdMMN7jRxTrp6s+V/2qPhVrniWWD4g+Ebf+0tMiTI8s/MgyD2zn9K5r9nj4+adc30Xw58UP5eDmB34ZG/ukeg+te6/DrxD4j+DPj64+HOs5n024/1aycgo/Ax169K+KP21fC3hv4c/Fqx8ZeDMW4vGXzIV4w/tj0+leRGPsZ6HdhZ+1i4n6cePPhLp3jK0XVLBhba3ZDMUif8teOD27dq/OjxxHqfwd8YweNLNP8AiX6hJ9nv7RgNhccufbP04r9H/gV4rPxF+F1jqG7N5aAKGHXIHeuH+O3w00DxLpd3Fq1sJ1uIflQjjz+54r6Kbbgmj51waqWkfj5+0Xommab+0np3xM0a7VoL+zgjji3ZKkDsR2A4xiv1k+A8kGgeALfULWERvdP8zevf0r8AfjNqV3pnxb0bSCht47e4EAiJzt2g+tf0rfBSy8Pa/wDCzTtEiKpeQxq+PXcMe1PASd2bYmo+Wx6f4nvH1PwNtzn5d2f6V5h4ZgMXhXULeXgqox+OK73W7O50vwx9gmG1lO0g+lULezjk8NXl9FxlF+X6YFdnKmeVTdmrHlvw9tmgs9QvMcqrCvm/xDdqkdy7HBya+s/ByKPC2oTldpPGPxFfCXxHu/sLXBRum7gcVjOnaWp7FFXP5pf+Cj3xDHiX4yL4bglDR2KnenpX5vXWivfg3EI5XoK/UH9vr9l/xPpviaT42+GInurSXH2ogZ2g/j/Svz80m9069gFzZn5mGAO2R1+lfqHDdWEqaTPmM4puMro8kl028uG8iVMY4zWfJoz2hz1P0r1LWbuzsomYOGl7qO1eF+JPGkVu5Nu2W6Yr269GKu0zy8PVlayRmeJIoxFlh26V4Tqtu0cn2i2/dMpyGXgiupv/ABRd3zFJvlFc3czr5e3IavnsbRpTVpI93La0qMlI+pf2df2wvEfwv1y2tdemJijfCSe2Mc1/Tn8Bf2kvCXxo8J293a3CPc4AZVwc4/Kv4qNStQ6ELnjp7V7P+z/+0940+AHiiC8s7qQ2gcB4s8Y6V+Cce8D+0ftqCP3TgzjhJqjUeh/Yb8Uvhn4d8d6cbe4i8h1O5ZVxkHt6V8sX15q3wWto7TXy01uzfLOB27cc4/On/AL9rrwp8bPDMdxa3EQueAyk89Pwr3bXvD2n+MNHktLsCZcbSrdh7V+D18LUoz5KiP16tWp1KftKTOT0z4o6NqjQnTbkN5igqw7H3Fe6adrL3kCpKwMyDl84BH0r84PGHwj8QfDu6/tbwMWmh6tE3b6df5V1nw7+P5RhpviNTCV+Uhu2B64rysThV0DBZo1oz751GG1a1W9s5/KdOqpznt04rgdXjstThVY0LStwQeOlcRp/jW1uphc6PN5ueQoHH+cVpf8ACR/2lcNLtEeOwNOhhz1o5hEgh02W3uDbJJsPbjIrj/EpuIm2Mvze1dlJO+7zmXb0xzVGee1uL/yLxSQ4449KVaCWx9Jl+Zx0R4rff2ojB03L+tdDoPh2+1SUPMxOO2K9n07wrp92nmjDYxgYr1Xw/wCCtMtD5rDDcYFc8JW2PqY5lHlscxoPgObS7MXDoAFGc16Z4D17WLW5UqxAiccg+hrcvRClt5DP8uMbcVR8LrZadJuJB3N34xXbSzDl0aOWrmMZRsz9NPDHjKLWtCtbWdy8jYGO9Vvjt8Q7LwR4Ik1C/uVS00+JpGJxwyjOPwr508Ka5suIrmzOYwR06CvyC/4Kq/tfjRbm1+EPhCcStfKXvCh+58wG09eor9N4LyqeMxcYW0PwPxIzeGHpy5X0Pjjxr8aLb4vfE7VfEOv7b/Tb2QrGsnPyZxxxxXy98R/AWn+EtaFxppP9m3Lf6PKOPLY/wcenrx9KyfCN9DauI4W4wO3419BNa2PjHwdP4TvfmWQExnurHuK/tOpwzQqZWqEUrpH8j4TPvZY32rPKPAf7Q3xd+E99nwnq+825wbeRsh8eh9K++/hX/wAFZL3Vro6R8QIjpF5GAmAuVPHXdhRX416naT2/maVLGY9Q0tzBv7tGv8f5VdiuhNZCDUrVL6GQDLv94D8K/lTO80zDKMTKnzux/QuU5Ngc1pKrFK5/QyPilp3xRH/CTzapHOrDJVGBwPoK+aPiX8Tv7TMujaQ4htIT+9kYYOPavyp8LapceG/9H8DarLYAc7CT+XNe46P8Yb2G2XTPiTY/aLOT5Tdw8yEf7oA/nXxVbFQxdX2tTc+noYH6muWC0E8b65d62x0zQxvth8u5e5PrXkGvfDiOwsYrdk/et8zjFfWXhzSvhVr1xHB8OtTVtxyY58Rtu9NuT0rM8feC/EekXj3WqWUmxeFZRncPau2VCKXuj+uKT1Vj86vEnhHyZcSRZA9K4iT4f3N7E1wi7AvSvu2LwpbajIZZwF44Vuv0x7Vz2qeE7W3R4UXO78K8pznF6I76XspH55zfDa0hlN1Knzt044rnNQ8G/vPkjIx6dP0r9GNT+G8ElhbAxfu+pbHtWA/gKw2/Z44cj1x0rCeKs9jf+y1LVH51ReF9RtGWe0kmt8EHKs3avrv9kO58a+GPH0njqxvZLt7BHxHIzHOVIx198V3l/wCCLdE8uyh3sOwWvd/2c/hrbeG9Sk1nW3aO3uDwpGM//qrpwNWc5WWx42dZVaCOJ+JfxZ+J3j6O4g1UT2MMMoW2jQHATIcgEAdxUPgb4Xa7qGuW+v6pfyyxOA5HzDZj155x+FfdvirW9JljttK03S7K9iiVk3yOE3k9CQF4x9asfCqTw/ate6R420qztGdSsTxyk/Kwx06Divo6OJ5dD5p0NLHmP7b3we8I69+xdbeJfC0O69tLiCO6u1Ygs59vce9fjF8GfF3xv+B8N1/wq7UJdPh1OFo5wq53BwVPt0PpX7L/ABy1YQeCpPhFoeqNNpU08dxJAB8u5Onrmvl7S/BNjJGmm6fb7iOAoGT+Ary8VmTcuWC1PosuyOKp+0mfnlF8O/HXifWHlvJ5GWdw77h379wP0r6v8MfDbWLfR4PD8l00dkhDeUeefc/0xX3D4Y/Zk+KHiK0STw3orErydylf5ivpD4YfsB/HTxxq02l6naRaXGke5ZWkwc44AyBitKeU42rDna0NXDCUj4n8IeFNOsUFpbKc4xwOT+Fe3aXoFrogBmypPPzDafyr9M3/AGTo/wBkf4XPr2rWtv4o8R3zbIwHB8onvkBu3bAr87/Fmqap4rt5dU8UWp0y8tXIcMNgPbaq4GadPL6lH40Z08ypVXyUiCG5tpL9EVhJt/wqvqt7aag7skIzEdvX/wCtXE2c8FrdxXDZCuOOfauC8Ta/e2t7MiNxnK9q9jC1oNHzeKg1Vdjr9QWN9/RBjGM1+Kf7U3hA+GvifNqESbUulz071+rulrqupEalNJiAHrmvkH9srSLDVdHsdYsV3yQOQ5HpjFdmBxHv2PBx9Jvc/N2CcMnJ5qCZgOae8QjIf7oI/Ksa+ukjBUc19LUqRUE0eBSXvWKN3clG/dgZosLq6uUNvv2EenesC4MkzZHAosXEV7n0ri9pFnU4I7qO51q0by1nO0Vs6br2rQzqrSMxPTA/xIrmLe+R5fmyvT3rtNAt5Ne1ax0eyUCe8uYraLI4zK4QH261q5qxl7OR1dnc61NcYluhGf8AeHA/MV7Z4Ylfy/MuLnzxjgJz/wDqr+jf4P8A/BK79in4WeBNEf8AaF1OfWfEOpwJNLCYwYoi2NqB1YdyB0H0ra+Of/BM39nPTvDGo+OPANvLpGi6ayo2xCCeAdwUkZA6cVg60Yq5Vf8Ac0+eeiPxQ+CPxHvPCWp3WiaVF5015CwLjBMWVPQEGv0S/ZA+KXgjwR480+8+LFk12yXEf2a6MHKvu4OMdq/MxYtN0L4m3Vt4YkZILSZVhuEXHmr7jt+tfpF8NfBXxu+N3xC8J+CtMS1tInureeR4pV8xoRIv8O0YyB618XlvEClmHJF9T8izDiXDyxDhTmf1f6fqulaj4dsdetn84atEs4IGMBumfTpTZoYIkAT7x6cV00fgq18OaLYeG9u59NhWBiePuDt+NZ8kNwImjkXAHSv68ynSlD0PInO8uc52P7SX/cLhux/+tWzDl12X5/LimQ6fdFgU5Hpirs0MgwkgwK9kzdZMzJmFof8AR+R9K1dJ1Z4h/pRz6CrVnp8D8Ocg9sVPcaZFEmzbyeh6YqORIaqospcllIdR83Tmtu1eKOz2sMken8q5jRtLfzfOumLMv3Rjj0rrJ4obOP8A08COMjk54ArmrzXK2jKlJ87Pmf40RaH4w8V2nge7lXyrUeY4DcjKk4xms3wP4A8KeFvhhq3iq80xQzOfs5zgHy2HoO4qz4y0PwZqPjFb7w+yNeX8qqJGO0Yj5bnPHyg/yqT9ojx7pml/DS28FeEpDdiIbJBAu7Dlhkcelfl+NhFTlKx95l1N+zVjhNP8ar8QbCY3SrJpVgvzxAlUAAzy3sQMDHWvZ/gR8SbPxmz/AAl1jSYbHSNY3xrJN94xqNrABh/EtfNep+ENa8J/CvQvh1oZRb7UDI+okfeAyJIwR26Dv7V5l8cPH+vfDiTw1dae+zVJrqNUAPRNyqVGB39a/O+KXD2EpbOx9/w7Rm3a57B+0n/wbs/DD4mvfTfB1VSNzuEZVU+Zhu4Oef0r+IH/AIKAf8E7fif+x78XZfA+t2DKSXZH/hYA4GD0r/VN8E/GvV9B+H0WoCT7QXEKzk/8s8hV649/0r+V/wD4OU/Ct5/ZXhj4rSC3ksfK+SeJ+dzsVw3HtX5blON5m0tz7KdGS0kfw3WHwZ+JOpyKtvb4GMjJxX2l8Kf2BvFPiDwy/jXxtd/Y7aFd2CRyOnTI6V6t+zd4c134w/EvTvDWkbbiMTJ5m09FUgnj6V97/tQ/Db4t6b4tn8FeHNDvf7GtlVR9nidt3HONooxOdx5vZPc9PA5fCPvI+IfC3w28Sr4Pu5vhJqbebpqOVt+P3mwZ4OeM4x0NfP2l/tK/GzxDr8vwo/szztT3/ZyTnMZ6ZOFr6x8G+HPiN8LPEEOryaPqFrpySDzGlt3jUJ/FuLDHSv0g/Zg+EX7J8/jHxB8QvirqiaPfa5YzvaXKqrBZ3H7tc7gB9f0rKlXhHpqLMpuVlDofmn4a+EGgfBC0a1vWTUvGOqJunK/MEZxwo649KqeJNEurLVYtBgf/AE+52y3Df3Uxgr+Br6aufC3w5+FvizUvFet6omoskb/Ypc72ecfc4z9K8u+GGhDXdfvPE/ix/KluM3LBv4VP8IPHWuxY6TtGxhRxcY6Lc8k8b2zfD/whLe3sfF4DBGDxketfjB4kQ/27d4wD5jfLX7A/tN+NLXx5cPb6QGGn6au2FCuNzggcV7V8J/8Aggv+1d8f/gHJ+0T8O4bbUYZF84WiT5fZjuqqT7YxXr4WolozzMxrXP59ncZANOAGN1fUvxl/ZR+MPwM1abRviR4evdLliba3nQOqcejMBn8q+brrT2hbaAQpHy8dfwr2IUb9TxDNjf5xuOB7V+/f/BPj4lX1x8LPCmjac2Z/D97cSoc8gTAqR7cHFfgMY2ibD8N6V+kX7EHj+TwhD9mHHmSKo5x1cH0/Cj2aRdObjoj6k/4KHvGvx88Q6ap2pPZ20jj/AGjGH/mf0r5Z/YR+IVh4H+JKy63j+z5plikH1O0frivTf+CjviiOf9o7VpbJ8l9NsSw+sMYxXxb8MrG5i0yRo22SCVZFPTOGBx7dK8vONaZ6GHdnof6G37JMDQeDNRsdOIlt38uW2K8hkYAnntxxXB/GLw5baP4uj1myUi3uCGjK8Y2n5vyIxXnf/BFb42aF8dv2fofCVvcKfE3h39zNCxwzox2j64FfoR8ZPhlaXST6a6eWkqkwcZ2EH5h2/irmwMlOlyRM8QrXaPwB/an+DPwxsfj4nxX8S6d5l5rCtJDc4+4yAL06Hj6VcS+hl0oXqXhkMS4AX+79O2BXpn7ecF/4Z8GaTq10rA2G6KX5d2C7KBiviHwW93caOuradcZjlGWUHdweCMcYr834no1VUUeh8Pmu56zL411G9TyoZVNqmRgYy31riLi7iuZ2ntIgNnPTJz+lYETeHYdUkt9OllB/iBQgKf61oRWDW98YYJ/lI3Z7fSvnfY2R4BbjgtbmN7lZzCxXOzGPnPFWEl1OOGG2cNJKcKSO4rGu57sr5EkW9VOd6DpW5pWtapaRRzzJ8gI2Sdz/AMB7VjPUaR7p4c8H6bc2UU3lsFBwxx0b0rtj4QsLq/Sz0nO84BLdPwWsjw54kH2CLymy8hyUA/iPGa6bUNbsgRIr+VdQ9xwB/kV5NNuU3E2SstDxLWtJ1/SfE8sFrGqSI20kn7wH4cVp6e+sRasJDassspCqFGSSeOBivRL7wz4j8WahbXHhq3N/PcYAKAld3bdgfLX054di+F/wR0bVNa8aXv2rxRZ23nRxBQ0ULdPv5IGCcfdr6XJOG6mMl7y5Ujrw2BdSx+Zf7aXxO8GfsS/DaLxLGIYPFviDPlW3BlUcHLHbkZ69OK/BDwpp3i79oPTvEnxo+Nd8y6dpVv59ucYVpM7doGRz83X9K+yv+CiHw08efFC70b9pjxdcXGo2mr6nLYxtGpaNViXOFHQDHevPP+CgPgPWP2dfgJ4S+FtqWtTqH+kTxldpkhmi3Jke+f0r9uyTAqhBQp9D6zC4Tkjqfk3YzINcuLjTn3Izt5bHj5R3r0S7uXubSJd271rybS7e3DAy5C/yHH+FekwmGSzCKche47V9jQRnN2aP/9D0nwb8QtD1Epe2MzWVyhyu04OR+VfoP8MvjLofji2j8HfFOOPzioWK77kds8cdMda/MK8+Db6tG1z4blw/UbTisdNY8e/Dy4Ft4itp5YFAXcoycdiPpXZltf2dovY9TMMJGon0P03+Nv7Ndxo1oPFPgp94X94BH0x9Qfy4rgvhz8UrDxXaDwB8UyzOvywXLD95Cf04H8qrfAr9rJ9GgTTtZk+3aaQFMcn3x+GD0r3X4ofBPwX8YdDPxA+FVwkV/t3NDEQGyOcbeK+uoVoP4T4zFYLk3Z8O/tEfCzxV8KvEFv418JymV4mWWK+h6SID/Ew4zjjGOK/TD9kX9oDw7+1B4QXwl43ZYNesRiKRuCSBwM8dcYr4J8E/Fe88NzzfDT4qQGexJKMjL/qs8Fhn064ryvx7oOvfsvfFLSPir4Gla48OXUsTboui/MDhsZxx+Veth9NZbHk1Ie67H7l+NvBmpXbWc2pLuu9NfYJlH8K9j9K/J39sLxE/iD4iWlnG2fs7ZPfBHU/lX6YeCf2ibDxTpmmX2oMptdagVQ+eBNIc46dsY7V+R3xyF4PjNqOlT9pfl46jPavCz6CVnA9PJ2oRP0W/Y2+I7+G/DMemXvP2ufYnb+lfdfxOiMOhx6qq58lidvvjr/kV+UPgrVB4e8UeHvDlrgEbJfzHpX6rapdyeMfhxeMnEyBvfpx7V7WAjzUdTy8x/iKUT+Z3/gqDotx4B+Lfh/xLpg8s3M6OMcAsy5P6V+tXh7xZrOhfCnwZ8U/DzHyZUEFwVPG6NRX5r/8ABV7Sr3V/BvhTxJPy8F6ydOgSI96/Qn9hO8tvjL+xjP4ckPmSaW8jxA9j8op4WlytnPOaaP078I+KdF+LnhWLUYT/AKQqjcP84qvNatpug3Vq42kjA/MV8H/s0+MdU8Oa1N4cmkZXiO0Kc/ToAa+9vGXinSPDXhG58V+L7uLT7SCPczzEIrYxkLuxnj2rroJzaSRx2S1R59ocUsXhC+8tOgOW42jmvyn+P/xd+G3gNJT4s1+xtgNxP79N+O/y5r85f28v+C2NjbPf/CT9nqZ7a1Uukt9FjzAc4Ozgj2+lfzHfETx1dfFXVpNU8a6lf6pK+f8AWjAOfoRXvLJJSWppTzDl0sfu/wDtA/8ABYP9nTw74N1n4VaBbpqhu0eNbkgfISNvHBr8CrP49eEPsjjTJXWUsx6ccnPTtXOaN8C/DniMbhZ/ZYuu6YFD+BJNcRrXw08Aabqh0uxumaQcPsGVH45r1MBQnhlYKyjW1Z6UfjDbaiDAx2s38Z6H/CvPdd8YWEQIiG9j/EOgrkNf8CSaMgktJg6Y4z0rz83slnIEuDu7YHStq+YvYeHwcex1cmv387tv+4fwqzBqL3Pyr2rl/NUxGWRx7CqUV95bfu22Cs41lJe8XVwqWyPQpjF5BWWuOvoIXVl9Rx7Ufb/NXbuqFm3Dk1lWhCUOWxWHjKnJOJ2/wj+Mfif4N69HqGkTuIQw3LnHtX9Ev7NX7ZemfEXRYfPlDXPCsN3t9K/mKuYxtIHNdd8OviHr3w21xdT0uVliBG5AeK/GeNeEFUXPRWp+r8K8Wcv7qqf19X/xJ02+MkN79zpkYrwrxToHhnxXNI9swRkXIKjFfCPwa/aI0/xzoiS+aPN4DA9u1fVOjeILWOI3gcZcbcA9K/D8Rg50ZuFRH6tCUasFKmzjrXX/ABl8Mb9xZl7i1Y9D2H616toXxzsbuFbpkEJHVqx7zVIZ4TuQOSOD25rxu88MwOJTag88hR0FFGnTtsYVHKOp966X440/xHpn2lZgNg7HP6cV0Wg+LluIhbSsgfoN3Wvy+hu9f0qKS1t5Xi5GCD6EV2mkX/i21eO8lnMin/a5HFctfBqTtE6cLmrjqfqZoWrmItumXj0NenWPiryMPMQeOOf/AK1fljY+M/HEK77AZPYE8V2Vr8TfiQtvlgrMBwO38qyjlDvue5DiD3T9JJ/GVhcKJQ23HHtUMXiTTgkjt9/sO3+cV+a8Xij4n6q6PpuZHLD93Eckn6Yq1+1tpvxr+AH7LR+M3iG5e3uL11W3hL7W2yYGenb6V35fkDr1bM87MeJ1TpaH1t8df2zW+D/gSW38JbLy9kjdPLQ8xkjAPAPT8K/nJ1bxrr3j/wAV33i7xQzy315Lvbfn5QP4RXiHgH9oHxfa+JP+Eg8T3jXpumBcOSy46kYxgcV9raxoHhvxtp6eO/B/SVcyRDqp/wA+1f11wBw1h8NQVSL94/l/jTP6uKr8j2KXhG5LxgtxX0P4e1jyGVv7vpXzBpUn9nyCGX5fT0+lesaRrHl7TGN2cV+u5fWPzLGUFfVHGfHCMeHvG1r4ktgPI1FRFJxjnua8ev8AXrawvp9FkkMBHzRMO6+gr3n4z2D+IPATXVsN01rl09vavlzxbDa674L0vxCgxImLaR/V/SvxnxP4TjXftYo/TfDfiT2FT2WyOp0PUkv/AN7dStIYjwy4Fd4us6pp6faYrxbhGHEUhCgfhzXyrB4jufD0vlWHz7eGB+ldTF4ssNZgjlaERSJ1Y8AV/MuLyKcJtXP6Gw+bwqas9z0Sy0LV9Q/tuwnbS9SByGxtG725A9q+oPCfx3+MXhO1Gl+LBFrtrHyu98/J6D5TXyT4e1OxurJhOqXYxwCOBXSeHdfaSb7FpMjjYeYW4UfjXMsdVw2h3yy/D1/eWh9h6Brnwu+Jsk+o2122mX4Py20w8tM9wCcZ46cVauvhzqmTJqCAwfwsO47Yr5ruLvRL4qus2374fdYD5Rj3GK6E/Ej4g+H2gs9KkOoWAIygOVUDsetelh81VRe+eTicsq03+72PoHxba6dZaLY6dbDYf4sj0rz8WFs67bbY38/yrpdK+K/wy+JEy6R4nSXTblAF3KnAP5iu3f4TDR7FdR8OXqakmcgIdzY91GaupCEtjpw2YOmuWSPNB4StoYTKjLvYduor6C8L6D4e8RfD2HQdVIguCpMUwHof8K8auZIIVMGpxSQS+u0gDH1A69K9x8E+BNfj8P2+vMC1mkb7SOcbq1yyhyt2OHN8XzcqR8ga34H1zQPEUtu8hltoO4JIxWhbW1rrd2tnoETzTN8r+YGUD8a9b+xi4vbhmumEaE7Qe5rYgiuINKS4sB8wPzNgAED8K2rQlc4FRi9Dk/jX8LNV+Hdp4bGoBVOp2n2ghDuwqnv/AJFfo5+xB+zZ4SvvCUPxT8V2Ud9PeTRJYwEZBST5fMP+6egx+Nfmv8Q/E2teJrW1jvpGnksbd7eInsDyB7elfqb/AME+/jdaeK/h8PBVtJGuseG5YgkOceZbRglyBjqDz36V7XCOFpyr3qm+dKrGjGMdj9Zj4VHw6imXVYfOaJMpHtUKigZ4wPSuT0f4heE/GTrYXECRFxtLqcY9uPSvaofEVj480syxbZFmX94jn5gCMdv5V8ReOvAOv+CNZkvNCtUS0d+pOK/b6zhGilE/M6/NztSPZfFHw40TXHN1o82XiceWMZUkDHc8V+ZX7R/gTwrb6Lquu/EVX3Wis0EcaZO9e/GOPwr7N8G+PotE+3aj4mldLOJCxVfvcD+Ed/6CuR+Pd74M8beCYdahjZUv4xDIsq4byW6SYP8AD7189xFgqNTDXjo7HZkM5xre6fzg+IfEsH2RdRtWIH8GRj5e3HasKzvdM8URCR2y44NYfia/sY9b1nTbchreG8eKM+iocAD2rkbK9Sw/d2h2E1+QUbQnyH1uKilK73PUNdg/sex26dJ+6Vcla+N/ixqP9p+HLqDbkeXn1xyK9E8VeKtTkzZwyEFuMCucuNDW58OXcN6P3k0WFz+dd2Bl+8Pm8xPy3uJSMqG+5XL3kk8rdOBXReJbWTRtYubSfhlYjHtmuQ80mb73Hpivqqkk4JHzsaNncsxadlPN/iqk4+zymRea1IZ3LeUDjPeho1PQVjhoKTszUgW+Dn5l2jHOPav1O/4J0/s0xfG7xL/bVxxHCy/Z3PRJf4CfTDYr8t/9Wvb06fhX9O3/AATE8D3PhH4DQeJbFfJu711lyPRXHA/Cp9hNt2NqU4xep9h3Wt+IPC2sw/CL47CS2udMwlldsM28/dT5p24244HPIr3j4zfF7xb468C6J8FNJ1WO41C6sn33EbAoiZ2kZAAz5ef5V6p8eP2lP2dfFv7N9xoPxg0i3udVskKxNKuCpyAGBGCSO1fn1+zxomixeD18TaTM9zHcZ+zs/LRL3Uc8DFfOYrHOLdOTPy3xo4olRwip0NG9D84/H37PnizwD4jvLOOFr+3R/lkUZP6V9l/8E59VvfAf7RWl+JPFNnILWExw+bID8oz79MV9hadHH9tKFRNE+CwYA856V6honh7Qjo2o+VapBLGGYcAHpwBxX5xltH2OY+2v1P47y2tiJYtO+tz91Nd1mwbUBd2J8+LUP3sbDkbT0+lU5Ejk/wBbj6V+JPwB/bI1P4aa2uk+O5ZL/S7aExxj72054HTtX2rpn7f/AMI9Su5pZ7WaNtuEAjr+w8l44w31aCluf1rh+DsXPDwmuqPtovFFwuB6VXefdIAsW+vjTSv27vg0Q1rqCXO8HtHXWWf7ZvwVGZA9wB7x4/rX0tHi7CPdma4NxnY+rm2RWTXJXaFz29K5rWrlpAvzbPu4X1z0rxVP2o/hL44S08LeGr1o7u7l8v8Ae4ULmvVpLuz1PVYVjceXGohZv9tOPlHcVvTz6jVk1BkVeHqtL44mhp+o3en3/wBjuDyq7uOcA119pNp2r2T/ANpYkt84YN0IHP4dK4PSNQWGHUNVdRIHHlKe3ysBwa4jW7+7eGw0CzYxreS/vcHkDqP5VpUxKcbHmywfLK6JPGvwcgvtTTxT4WjiKy5SKEnABxyfy9q5uz+B/iLwdZ3KXn2aBLkhiyyhnBbnIH6fSvbtcu303wVGiRg3uCig9AFPLfiueK851OfxN4pAvtNtECxBFyxIOQOvtXyOMpxUrn0mBrVLJXOFsPhp4iXxBJ4t8Q3TTI3GF53ZICnb2218t+PtP0f4gfHHw54V8W3K6VCu8x3LkKFZc7eTwOg/lX3TceItb0HTyieW88ikMAeE4+lfkV+0rF4x+IXi3+woIsxR/NHOnA9cbh06V+K+JWLp0qejP0/hqDjaR++XwQ+DXxwh8SXnws8RXC33hK6gM6avE+7IgQkYxwN3B+92xX8wf/Bf74w+D7n4WeJfgzo+tfap9C1K2it4yR8ybwSwGf8Aa6e1fTvxX/4KkfF79gn9m9/hdc6j9oN/H5Vk4bMqgARv2Y87vwxX8a37QPxU8W/Hbxnc+OfGU3nTTTGUtuJPtnp/KvzjJ1SVP2sVZn09TGSnPlZ+zP8AwRz+FtjZXlv4p1KMefe/vBv7DI7/AEFf2i+D7PQNNhttd1a2gntl2sIyFO8r68Zr+Sf/AIJpCzl0rRFtiNscKjHb/Ir+kG/8bQaR4djhsv3ci4XI/mBXw2ZXniOeOh9Dh6SVNOJ9YeM/Fn7I3xX8Ia14N+IfhezSxaNzPGyfPkjGVAALfQYx1r+bX9pv4Efst6o03h74H25axRTshkjaPZInQ5JPA/Cvuv4xeK2ttMW9s4o31KTje7FSR07dOK+B9Z8STX63y32mi1uVibLjPPHUV9ZkkJStcl0eWLbP5uf207tvhL49sfD3hrVDM1vAJJ7ZW+VZM885PauT+F37Ues65qUeg69KqQsAhdm24X0zivnT9o99RuPjR4ie+kafbeSIrHk4U8D2q3+z/wDBLXvjN4pGj6VEGWPbvPIGPbpnFfeUsHC12fGuT9o2fV2qazY+LfitpHgvRJmuNNE6zXEqjgJnkcGv3H/ZX/4KG/G39kC6ltPhdqkk+jwkw/ZInypQHGSMHH0r8GvgVDodj+0RJ8PivkC0JtV45aRWxWz8M9P8a3vx98Qw215LDZ2N1Irqv3SAcbcdq8vFLkblsc2Iqyb1P7lNN/bq/Yt/bb0SDwv+2R4PsjLqEShNQRd0kbY7jagHT1r4r/aQ/wCDab4Q/GZY/H37Fnimz1K0mHmCzMiRlQ3TjzDj0xX8+2q+Pb+1v3stJnYAfLjPykf0r2T4Yft4/Hn9m7ULfVvhj4outPuIWVvKSUhWx/Dzn+Va4LML7sVNXR+UP7an7EPxk/ZC+Keo+B/iPpV1BHbAYn2ZiyT0DdOMV5z8ENTOh6rpkNwfLR3Zvm4zsPGP5/hX9SHxs/4LH+Af2tP2VPEXw6/a/wDA9jd62bTyrTWsNJMrgj5jgqv6fl1H8omo3Om6JapPpx228dxK0OOycAfTNfRSknFOJMnynrP7R/jeT4lfGzUfEBYCEwQRe37pFTrx/dzXMx6lJo2nxXligZRw2Ow6Z/CvA7zxFcaxq5aTID4H5V6vpV9Lp6C0I8yJgM5rzcYuZWZ6WF1R+k/7Bf7Yniz9j7426T8YfCk0kmnSTIt1CD1UgoxIwegOenav9Bb4b/FH4c/tk/ByP4ufCudLomPd5KEF0YgFsjjo3P4V/mFaCUgEkdvg28owV/u59BX6Z/8ABPj/AIKMfGj/AIJ+fEKPU/D80uo+F7mRftWnyNmNo+jYGD06/hXjUJeymuQ6/q/MtT+ub9rf4U+G/jT8F9V0vyhDf2Uqu2R9/wAsDO08elfz4yeHbrwjpH2XTEeERZBEfPINf1BfDP4ufBT9uD4aj4xfAa6gaW6tz9u0zIDxySDB2J+Pp0r+db9oXQvEfw7+LOs+EtSimsxHN+6G3GR1OB29K8niPDSqe+j4fOsJys8itNZEKQtqpaZpsf6pd34MOMV01zA9mcaaodJOUB/h9jWBZ+H72WIvpFwU8/533YA45x+la1iZzeNp8zeXIFyGHAyK+BSu2mfMOKH28upaPCjBvnmfaY9uR+ddkkD2s6iGLeXALKf6CuNaK/l0trXUZX85TuBXngflXrXg7R1vfCw1XUpBGsWWMrNyQvPtjpXPSwtWtLkpIzRDb3OrabeR3Omx+WnGd3Qetcj8QvjH4I+G1pJfePJQ7ycpChDcepIP6YqAfF658X+KrL4UeA4xfX15OiK6AFVDnHJwf5V2H/BSD/gni2i/s+WvjrwBcXGqeKIGIvrWJCcBcEgKoJIHsK/QeEvDqpUn7SvE7adFy2PDLT9r34u6BfpF8HLhdPsL2BZFkRgOCegBXr+PSus+Nvxhu/FNp4e+AvhKFF1vXZFOr3kbfO8Ui7zu4OPnA7+1fhf8Jv2hf+ENf/hB/iDFMn2bLRiRSjo/QqVIBxX2/wD8E3vGA+Jn7YUN3rhZhKywxPIPlCBuDz0wK/Q+JsLDC4aMKasfY5Bh7ysz+pqP9hSDx18Hvhr8LpbYDTdOvWmu0KjJV4z82PrX8zn/AAXm8JeLfFX7bsPwl8J776DStOs4reIKQFEaFBnAPav7I7v40N4V/aB0bw74WeS90+1trf7VkZiXPB5r+fb/AIOE7jw78Evj54S/ap+D94Hm1qeO0uoPlGdkbMRjB4/CvFyKvJI93GQS0R/Gtrul6j4e1OXQtYjNtdQcOjdm9OPpWr4XunMMkL/N/Kv0F8Xaj8Bv2rdds7fSR/wjviS6P798CON5OerNgc18v/F79nnxx+z/AOLjp+uo0tk4/dXIy0b8dmXK8fWvtMPUZ4WIon//0YtM8V6ro8qyWshUA9BX1t4B+MXhXWLdND8cWqTI/wAhJXJwfwr4pubOZnAQ4+lULe/1DSpjJNkY6H0rCjNu1z6PGU+ZH6FePf2OdP1PSD45+Edy8Skb/KB+XP5/0rw7wH8Q/Hnwm19IdY8y2uEOMr9xsev16V3H7Pn7Wd34CuU0/Ws3NjwroeeOnSvtLxJ4P+Bv7SOlNqvhC7jtrw8mOT5Rkc9Bz+lfV4GcbHwmYU2n7x5f4j0nwV+09oy3tq0Wm+JYVyc/Ism3nHbOQMV4L4bv9R0r+0PgR8XYGit74NFEZB9yWQbEkXPYccfqKydd8EfEP4Oa9smhm8uNt0dyqtjA9CQBXt1p43+Hvx30yDw18QbhbfVoABbagOJA3YMw6elfU4aalGzPFrOx4/4Mu/EPgrwxq/wo1AsX0W4e+sJB3hQfKR6DcPer3jbPi7xH4Z8Vyj99c26QzN6yHv8A/Wr0L4heA/EnhXT7bWtYg86SGL7CtxCN4e2znLNxznFY/hPUfCt98PZtS1aQR3OlXu63X+8FXj6VjmmGXItDDB4puXKa/hWeXWvjtp6254t2W2x6FeK/aDwbDFa3d14ZuBsMsJx7/hX4z/s5gar8ULPU5h80k/nfixr9prm4srrVrbU7NWM6bkZQOTj6f4V1ZXTfJYnGSZ+Sv/BQL4Tp4q+BmvWarmbSTJcR8fd6L+HWtX/gkbbz+Df2b7vX/EcyWlknmiSS4IWM9M819Jftx+OvhD8Jvhx4g1L4iavb2KahabBATiVmOMgBgP8A9VfxQ/HH/gpf401HwDL8GfAOoy6P4XiuZWUWpx5qtxh+nTANelg8M+ZpnmczP29/bA/4KqfBP9l/4pam3w2QeI75Wyqrlrff6FkwcD2/lX4D/tZ/8FSf2uP2zdSax12/OkaAP+XCwkYx47fLgEc471+euo/EzRLmUhIzKGO5ncEsSB3PvWPY/Fj+ynL6RZwxNnJbHX9K+mwuGpx2QWmepaN4H1ZMXupyiGM8kyn5vrXQ3/inwr4Qtt7bLmZRkBsFMivD734q6trHzamEkA7dvyxWTJ4p0DUbc22oW6rkYyo5r04uK2BQd02aWqfErxv8VfEK+G9BnKQY+ZUOEA7joOw4r6T8PfCPQbDRktbWJ5ZgMyOeea8g+FPin4a+BLeX7NCXuZv4nTiu51/45eO7ND/YdnAbcj/lgcnH5cV106icbGeIjO94HF+NPh9cQSMsIJB/hNfL3iHw6Wm8pSYnU+uBXsV/8XNQ1eVhq++OQdRjFZ1zJp/iC22thm7dq8PGxS2PTwMpW948AeK+sW/eqWC9COfanC9MjDzPkFdtfabf6ZMQ/wA8R7dqx72ytLqLziQjemK81Stsd7VzNjl2fNUhvOK57dLCWjkOQOlRG5X7ualYjoJRSOha73DGKrGTcfm6elYvnDsaVJiGGaiooWKg1GXMeufD3x9qvgPVUu9Pc+RuBaPPGK/YX4QfEi28YaIt/pTCVZcb06lTX4ZQyZwRXt3we+KeufCrXv7V0mVvJkYeZETlcewr8z4s4S+sQ9pS3P0LhXid05+zq/Cfu5a6hdRw5Y7jnG0dq29Iu5IJgtymQ/t04rhPg58RvBnxc0NL/Q5QJwP3qdwcV7pbeDb6QeYAZF9B1FfhOLw1TDVOWaP2ujSoYinzQZx2o+HtPuX+0bC2fQetXNL8EoGQ2wk+hHFe0aB4JV5UjkyP94cV9GeHPh9bsqKE3Y9BWEcd0M3lT+yfM+mfDrVJ4hAmVY4xj8/5V734b+B8mqaeBI7qMYbI/wD1V9F6J8NY0KzQxnJ7GvpPwV4NiYJa3KDt0Fbe1Rm8BKMTl/2Z/wBmTQtOngl+zJK6yK2SOfwrw7/gs3a+DrzQ/C/wX1GJZLdrZzJx3iYYwvb86/ar4PeEbDTxAiRjJdOgxxkf0r+Qz/gvB+1PrXw0/bqsfDlqoubDTopVeJu2SO1fUcOwcm+U+UztRSSkfnJ48/YLN9G2ofDC9KDepS3kO0HjsOa4bwhp/wAZv2fNTNj450ueS0lOxvKQsoXpX6QfsW/tffs3at4vs9Y+INwfJBCm3kAwGPt7V+/OkeHP2QP2h7a700TWyxyfPFuABxjO0AfSv1DI89rYOSVVaH55meTUJJyR/Jx4hjttqa1peLrTZ/nUR8vGfRhimaZr9iJEjimVU4PPX6V/TV4g/wCCRHhHxt4furj4YzrC1yrCGGMlUZv4d3pmv5uv2n/2YviN+zx4+vPAHji0azntnZY5VGFdVYDIPev2fJeIo17W0Py3HZTKM7vY3HkN7p8mmMwMc44P19q+YdM0ttR8P674PcfPaM91CPRhwBil8Pah4xi1eCIzPLb27bjnuB29q9IEFrB46TUbUfub9AsmOmSa9vM6MK9Jq3Q4MC1Qr3hofH3kC7todSuTt2xhJAP+eoPI/KoZr4yttj/1fTbT9WtJLTWNa0VM/JdvKq+gzisuJ47SJZB8zkZxX8tcQYL2eKcT93yPFKVFSOksL2+0iLz0mMfcKK7fwr4/MV75uqMfMbpsrxqS6nuZxvGT29q1lnt9Pj2ryzdx1FfN16HdHvU8c09EfXkvi+K+swbW4UrgZU8Gup8Oz3C2vm29yIJD/ADx+NfD8D3QOImIZulen+H/AIjtogjsr8CYfxPjnH0rw8VgHL4T6XA51yaNH10bqF5f+J1aQs+OJEG5v0xXQeHpdTstSXVfCWrNahP+WCudpPv6V812vjbTNVvFfSJ2jT+JSP5V7NYXFi1msi5tnI+/F1rhVKrS1PYc6WIXY+nh8ZbzVJI9O+Jml2yLHtCTxZJIHqTgfpX2h4d8Y6F4q+HU/hvwPfQJuUbFdtrdQSB+Ar8l31fzofsMv+nRHhw5y2Pbp06/hV2x0ufQ7ZJ/h7qj2dwDuKXDbPqFHPavUwObqL948XG5BJ603sfZEvhnxF4dd7XW7Jirtw+OD9DX0z8HvDfhPVfDd7f65t/0WNyE+intXxTY/H7x1oej29r4oiTU4ox85I3Pgf3eO1e4eGfiZ8PvFPhSW30PUP7IubkHMdxiHOfbmvb9vCfws8aUKlN2mj518R6jYvrNz9hYxxM52IR6HiuM0VPHnw38S2/jzwHcvZX0AO3yzt3jqQfYjj6V69f/AAh8WafGdWu0W7gHzRvAd/H6VxOo36XKhLgeW6cbD2xXk1HVoz54H0dOdOvR5Ox+kXwT/wCCoPhf9zYfFG1l0S9wBJJaLhJGHGWJwBX6S6B+118K/FukqBrOkXNvLyv2iePev1Ga/mE1Dwnaa0nlfJJuPQen5dq466+EOlxvstW8jHJZODX02D42rU4csz5+XC0JzUj+kjx38Rvg5DM+ralrOjeQgz5f2lDkemAf0r8k/wBrT/goJoevWN38O/g55l5czqbeW6kHyQR4xshYDG0dq/PzVvh7b58q7Y3AHADf/WrS0TwDp+nQ5lhCIPavNx/F1St7qPRw/D8aD52cALLU7fSIpriJsvgmQjhvXNZWrXj7VEAxxgEV3fjPWLqK0FjFJst0O0IK4HQ7O5uZfOul/dL0rHA1XueRmNJSd4lzQtBQob3Uxub+HPFY3ieeMxPar6cY7Vu6vqyDEI+UL2riJY5tVm2xn5O9ejCqou6PDqYXm3R8L/FnwHqV7dNqemx7tvLHHWvl+cT28xguh5bDtj0r9bvEOk2iWwtUXbkc5HWvlTxj8PtK1C4PkwAN616NPHXVjzKmX9EfH0F5Grba1o3j2jnrXpN58I7kMzhdgHSuQvPBd7a9OAM/oK7aGOjB6nBVwM47FXTYvtGpW1v/AHp0XHXjcK/ru/Znh0uy+DujWHhVgXs7YCaM8ZLD0r+Xb9mv4dz+NvjbpHh3UkLW0suSR/0zr+k/xro/iz4AJHP4Yj8yGQLtCdSMDtz2r3cFVvFyPMxcVb3dz49/bf8AGd/eeKrTw9I+2KP5mjQ45HOD69K8x+E/x++J3whk+3Sj7Tpk/At2+5jHAAr5m/aX+JOs+KPizNcXb+TsOGXuuV9OKl8E+I7lZbB9WY3NpFIpKdeB7V+QcT4lxrOx+HccUPrElCrsfqj4X/aoguQ2quXtFlw/lY+VcdR/hX358FPilD8RfBVxd+FFNxJMfLdpuCM8ZX6V+VD+PfgOmhMniuBrWS6IC+Wo3Ae3IrB+EXx2g8EfEJNK+G2o3EmltMq+VLxnPfHNfIUpOU1JHxmQcCxqYmMo90fdzJJZ65faZffK9tKVbHr6/wD1q6j7THBZGaJjvUcf/qrnNXjuNX1G41kcS3EgZx+FctqF5dl/stu2CuK/Q8JjWqaUj+/cryqNPCUqb6I7vRNVe4cXci5fODxXeztFcx/aQdpA/lXkmjLc+YqxsQBgnHtzXzN+0D+2VYfBfxGvgnUtMLPKBIJQmTsPpXpUJzbXKxYiVOnuj67jvJpNaXUtO3RvHxvXjGO+a+6/gN+1HrPg24i0Lxg5urM4jWU8lQT16fgfavyY/Zn/AGkfA/xxivNK0KF7e/tovNZJU25GccV9V2ZjtLdi7AOR9w9j0xXvYPM6mGmpXPn8bllDFRfun9CCjTrjwBpNr4amW5iupmmEiHIIYZx+FZNjpbX/AIwjRDlCBEhAyA4GT+gr8m/2cvj/AOI/hrePo2pztNY3XyKhOVhHqvp6V+wH7P8Aqui+Mdd1G40GZLq3022W4QAgkytwR7da/Tcq4jhWtdn47nvDNWhP3VodB8QZft/jODwvZMNzKvA/g2Lk5+uK5vUfE4gh1Se1KD7IAm1fu7h8vpS+Frz7VLqvxBmUC81aR7Wzic8hozhvpx7VwWt29/Z6s/gu4h8lVKvcy4xneMn/AAq80x8WnZnDgcFKLSaIPGx1C8+F+oyeH2iSTCI1xJ8uQ5Gdv06V+ft7CdOsodKa73TQ5ZmVhzmvov8Abd+J3hz4Q/B9LiC5dbTTlyEOAJGOOvPPtX4//B79tLxZ+0CG0r4OeEbW+1W3Voy1ynyHII+8M9unHWv5c8SM0pQqp15aH6TgUqVLQ/Jn/gqH4m0/xX+0vP4e0i8e6sNFyi5P3S6gkjBI+9X5s6hpn7p3KdFPTgHivsj9pn4I/Gj4bfE6+1L406YNO1LV3MgABCsFJ+5n2/lXzJqdldJaSx5AOxuvGOO1ePg8xoTpr2MioTfMmfuh/wAEqrS8uPA0ksz7HtnVIz6/4V+3GreNtY0y1X+0mjcIMcN0x36V+Kv/AATdvYdJ+EZkVzHLuUHHB6V+nupa+YtBGmeQs32nDPM33x3wPTpXkV3F1bn3WWVk4q5heKfEa+IvEC3l2+6Hb8ueFBryDWrm5kvipjmmFw3lZVdwCtxn8Kl8SWsqSGS1kZYwuAoryyfx7dWCtEbm4i8kcCT5RxX1uTVUrI9StRU4No/nX+O3wpu9W/aj1rwfaKVS6vWZ2H8CMRk/kK+t/DNh4a+El1psPgRzFa6MVmvZTgF9jDI/H9Kx/wBpjxPplt8UJPHfhi3a4eSIw3LouQGz1OPSvjbx78ZdS1XR38I6QiwyXUm4yYK/IRgg9a+xpVYJ+6z4Kth1GbTPO9c+J8lr+0Nd/Fbw2BsTUmuVA43JnJFffEf7Tf7PkHhae68OQTQ67qbPJcu6bRvfk898V+cGnfDjVkQqpimd+DtORjr7Yr0vw58AvF2tRtLa2wdFGee3Haox+EhiPiZxzoxaPpmw8d6bdaa13a5uGRd7bRk+1cN4O+FHjj4i6xN8Qtfu20vSo3zFuO0tjsNwx+hql4B8CeLfD1+NONu0kE5EcyqudozwfwOPpX6j/Ev9iX4meGvgRpUuh3t3q8XiL/jyy2UhfG4qCo7AVyU8BCmrIrDUT7b/AGvP+CdXw2+Fv/BKDT/jbBctLrmuGREeQKu4KsbZBHs3t0r+THX7We5t0t7iPb5YGQOnG0frX9O37Zvxb+K+vf8ABPDwl8Jjqaajb+FWlOowrJuaEeWicqBxgpX86Ws6fFqN21w42xlMqR0524GPpXbSxLgrM8zM3Z6HzZeQT2kvmbcY6V6r4U1CHU4hbOwDrxTbrw7HJNlxuUVgXPhy4tZ/P0o7D1qpYiMtDoy/F2VpH1B4L8K3c83+jEZbp+VdZeWmoaDdLY6zbsYD3K/L09a4f4N/Gfw54cj/ALL8XRMG6bguenvxX6jaF4f8AfErwJB4hs54biEgAoCC46Dla5JYW7umfTUK8O54p+zJ+0Z8Xf2VfHEHxD+CGpTW8Mbo89tG5EbAdRjkcjjpX9Pen/tFfs4f8FTfhvFf3txB4R+J+mWxV4pMRLdMOevGSVBA461/OF4j/Zmn0nT18QeCZyscnJXOB9K8+0SHWvBesx6ncedoupwsNlzb5U8dOc81rNc0eVnm5hgYVdD9MPEula58OPEUnhTxhbvBLA+ze46c4GPY/Srt/dQHVIpIznCjAIwp9K828IftUahcpHafHO2TV7U4H9pH57nbjr04x6V698QNW+CFr8NZPiN4L15IorMeb5N64Ryy/MFVec5FfEVuGJ4iv+6PiswyR09jl/FHj7S9I0qTV9Vb7D5AwwPGSO3avy9/aB/b38R6+g8GeEcW1lENr7Dw4HrgD0rwz46/tI+J/jFLLqwdoNPVjGkK8ZOMbiMDj0r4rudP1ONVuLrcd/QV+vcM8KUMDT5qkdTzMFgOd2Z9PeDv2uPil8P9fHiLwbciyvEGFkjOCMdK/QD4O/8ABaj47+CNRA+IVpBrdu7ASee7sSp4PTHU8/TivxY+xTou4qRVXfJbSMAM59RX2tLG+z+E9uGFVONrH66/toftF/sfftI+HYPiJ4K0U6F4ykmxdQwxbYmHqCea90/4JIWvhxfHb+ItTAMsMamIHj5g3T8q/AGW9SBwSxLDJGfYcCv2n/4JApp7eNNS8U+ML9bbTrWJdgc4HmZr8+4pryrvY9nK5ezR/bV8Cvhdda4sOrSh5PtMi+aqcsVGSBn0zj6Cv5kP+DjrwP8AEOP496VqcKJL4Ihigis5LY5jW4VG3huwYdM1/Th+yn+1J8GLWCaSy1uzu5NOj3m2WQM74GMKvGcdfwr+Cj9sH9sj4w/EL4t+KfC/xGvryTw7JqV29pZ3fCxAzNtMYxxx29K4+Gcubd6mxpi8U+Y/Nq9e9s7nzYSQYidjgjjnIPSvuL4T/tD2vxL8LQ/Az41y+bZooNpdyH50I5PPA6DFfJeqaItzEsvh8iW3xnB4PP8AOvNrtZrWbZkxuvTPGK+qq4Zx/hs5Z1G1qf/ShWOXeCBux6Vv29npuox+Ve27H8KxdJ8Y29i6x3MIOPbNevab8SPBkSLHLaqjDGSFrnwUeayZ7+Nk9kcUnwrt9TtRNpiyQydsU7T/AAf8SvCFyL/R5JoQg4MbEH0zxX054e+MvwxtQpuY+nbFep2P7QfwYji23VsZMdttfW4XC2joz5XFNR0Z5B4W+P8A8T9L07+x/FmnjWrYjDC7Bfj/AOtXo3h7VvgN41m3+ItLl0S4GBus49oBrurb9oX9nSSILd6YQT/sV3eifFP9lLXVjSaxlV84+VMZPavZwdTk3PnsZSunynV+GvCfhTxJ4em8BQ641zp86lYvOf8AeIW6V+fP7QHw8i+C3iOP4daVdpdxuguCUbJznGMV+o3h7x38ItL0+51fSNDWMWilo5DHjcyjIFfKH7ROm/ClvhlP8e/izLHp1wjkWyRnbJOv3sKOOnT6flXuexqYhWSPn4TVKV2fNXwN+I1t4C8d2HiTxBKLfTbSRWmZsAKi9eTxXm3/AAUR/wCC8Pwu+EU03gT9lyMapqs+fOvWAMaM39xlPb2r8TPj5+0D8Wvj7cXHhzwPI2h+HUdlQyfu5HTPTpzx+lfJekfA34f+HG+16kxvrpvv78EfhXv5ZkdWO5OKzGMnojyn41/tBftT/teeKZ9Z+IerahqiyPuWOSRmgi47dMDtjFcpo/7MWsXSLdeI7mOJSv3FPI/CvryK/i0m3FtocEVpEn9wcn61z13qE8675n3Zr6ihk0YK7OT60uiPEV/Zy8OQgKLgjHXBqvJ+zj4XZtxupPpmvYjfOnHGKpy37E8cV1UsBC2wfWJHkp+AXhO1GWlkYD1/wqT/AIVF4OhH7tTke1eiyXT5zuqjLdN3NZVsNBbITxErHleo/Bzw9ODJYyOjDpg4Fed33hfxH4VkIsmZ4R/Dnr+FfQ01xxtXgVQmxOuHwT2rCMUtjelXlY8ctLfQNdtvL1KzVJ/UDmuA1rwna2FwWspdvop4/SvXdZ0uW3l8+2Qrisq7tINetSk6hJ0GFI615+IV9ztoVWeCXdxdRDybsZU8VzGoWjSR5hGa7zULKeGdrS5Q5X1rARGjkII4/u15dWC2R6lOaaPNJrJi25R061UayyOmK9MuLFPvRr17VmvphlOFXiub2BlObTsjzsw+W3Apr52cV3M/h4hS6rjFcvcWUkcmGGMVXsmdFPYrWrkcntXSWdyNoPpXNLAyNgdKnt96tXPUi0ylJ7H0h8Kfib4h+Gmux6x4emK7mzIgPysMelf0I/ssfHrw58VrONopFF4iLvjfse/+cV/MFpd60Ry1fTPwd+KOteCNah1PRZjFLGQeDgHHtXyXEvBtHFU/aU1qfW8N8VTw0/Z1Nj+vXSNG06fEssKhsgV7Xovh6z2j7O208cCvzn/ZV/am0D4raXHpGpzKuoxqNxP8XHQdMV+hmjazFakGbjnAHT8q/As2yGthanLKOh+8ZNntHERXIe26PoBKBHYkDFe7+CNAddQiEaEjP9K8g8F3sV9MrL90e9fZngSC2maOKFfnYgZ9K8t0VF+8e7iK8XB8p734Pt/skYmGI1hXcW+gr/Ns/wCC3fxRm+KP/BRDxncWjeZFZT7UIPA4xj8xX+jF8VPHOm/DH4L6/wCML1/LWz024djjo3lNtH54r/J+/aQ+J178T/jl4g+IV27MNSvJGB9lYgD3r7jg9ctTyPx3jCrJr3Tg9Mvb2xf7cCbeTuyZGMdMelfWPwu/a4+L3wvnS70LVZJEXC4lkPHbjH8q8V+HUFjrm+CdAwA7+wr0RPB2gRne8ALZ7cYr95hlFOtTVz8vq4z2bP3T/ZK/4Lm/ED4beIok8YNdzR7PLJhBYD5cZGeP0r9tv2j/ABP8HP8AgpX+w/dfHPw48P8AwkPhq6iVpJQFl8pYyzIcYySRz6V/Fpoeh6XCvmx2y5XoT2x044r9APgz+1X4h8DfC6L4B+FillY6vqMVxdlOGbA2MPoQa9HAZQ6U48ux5GYZlKorGbpun2tpbSMNokuFbd+HAArz6O5lt7lbeTrC+cenpX0H498PDwz4neIN/osmDF7AjOK+efFUf2bXHK913fWv0f2HLSuj4+hNurqeBeKUnl+Lt5aWKbnuLHeAO5LDtXmX2eZ5tkoKzLkY9MHH8q9hXVo9N+P1nesoYR2ihge4zz+lJ8YtDbRNZk1TRUH2e9YuCO27+H8K/n/jHKJ2eIXc/VuFMx5VyM8onYWsWxcNIemKgtfMaQA8yHp6D/IrNSAmTbDnefve1XhKsS/ZbcYLdW9MV+dq20j9Ida8E4m/Le+Qgt4Ry3U+lVreGW5dghwB3qnaQ3H2jDfNGOp/Cr91IghFrbdD1I4rlnpsVTm3uai3UkarbwZDD+McV6N4W+IWu6Qm0/vYF+8H+leSWeOgDbR1q3NqQvpfs1qdsa9/WsatGM90dcK8lsfRfhD4h6Rf6q0ioICx5OOn06V7vqepWb6dHqIhWTbj94B8y9uP5V8I21ruUbyUA5JHHSum07xprsEwhsJma2XjB9hXkYjLoWske7g8eo6M+09B1nULzL2bGSLushwR7Ditq8m8P6tKjaxZSRXKHCzMu1QOwHNfPfhX4gWkMYfVpPIYfxHgelenaj4pvZbdLm1kgu4SOGPJ/D0ryXQnS+A9ZYilNWZ6tH8UfH3geZbXSHub2zOPkHKAe/tXRz/Fnwz42uEtfElrHbSrgM9sOV/3umK8U8PS3EsLX+mXbBz1ic/JV37VZNJ5ur2cdtL0Lwr8r9vmrpoZtVjpI45ZdFa0z6jsPBajTjfeCLqK/jb7yqdzL9fSvPddaSzTy72Fo5V6kDivMIdH8QW16ur+CNRms1x/qoW2xsf9oV22i/GHVLiZ9K+KGj+bHFwLi3TLY9Sf/rV68JU6yvscEsZUoaNXHaRZxzr9suz8v8Oa57xldyRaeUT5d3Ax7d69Unh8Ba/bhfDM/kMwykcjc/l/SvAfHtn4qtr+PT47WRo0GN2Plx61P1RJaF4vOFUp2aseRyWV7rOopGmTGvDHtxXSam50+3+y2/AXjpXSxB9KsMIgZpB823qtcDq2orP8kR2uBjDDGaum+RWPJUOZas4fV5X1CUQr1PFdDbaeui2glTkkVNY+H5IU/tG8XDdqTUbnMW5TwKXtuhgsOjgPEmpxXZ8tztrlotBjlHnt+tdNFo7a/eBnX90D8xHt0rX1ZVit/s0YG1Bj3/OuijWUXY561Cx4vrcUcYMW0flXAS+GxqJ8kIBnjIr0vU4xPP5fY9qWOzis4ueM11Td9znlTi9z6H/YJ8A+Hbz45QW+ojD+XL5IA53FT/LH5V+1njXUTpumTaDr8PmvbxvIk2MrhBnAb8K/n1+G/irUfB/jGz8SaE5huLYjBB688/mOK/VTxN+1j4R8dfDa7/tF0sdUitJYih+UMSuMqK+xwWOpxw3L1Phs0oeyk2tj8JvivqreIvjB4j1rI2Pc4HpgDjHSneHtVubAQ29vJnc2NtcFqE5M815Of3s85Y/TOK7Dw3Z/aL0Sk7QnI/Kvx/ii7q81tD8Y4ngpSu9j13W/EF1qmqQ6be2qz+QnAIz2r7T/AGYPAlpresP4kmtlWC2IXaBjDhSea+K/CVq73N5rV8xwi4RvU9sV+rX7Lmg3Fl8MPtVnA8lzqzrOQBk89h+Ap8NZfKrtG51+G+CjUxd3sj3Ga/kjY3CnA7Y/KsW3zJe+fkc/n+Vehp8Lvin4kkSz0Hw3qDj1WLIFeveHv2QfjNLMi6vHb6Xuxj7Wdhwf5V+h0uHcZOOsLJH9WxzCira7Hi1tAYjuBG0jpX5mf8FF/Dhuf7J+IVrGNsD/AGZ8dCFXOP0r9lPjP8B/E3wW0WLXdQlS8trg7fNt/mVSPX2FfnD+1R4bTxV8AtTKDzTaq12CPptyKxw9GdGfJNHBm06U4c0GfnP+yJ43ufAX7QWmOJNlvqzxwOzdArc/pX7/AHiTUlF1+7Ufvh5nToOgr+WfR7250fRdJ8cWrtv065GT7pgf1/Cv6TPA3iePxX4H0bX5DvE9lBk+4WtcWr7mWQxT91vQ9D0i82owlJTPvXunw4+LHj74XB9W8JXjQyzADapwDjpn1xXhtgtlO4V/uj0rW1UukDCzbG1eK4qeInD4WaYyhGpPktoe06T+1/8AFrw/4ti1W4aOVLSQvHExym6Tg9uMk19ReAf2mfHV9qj6x4miimuNR+Vlk5G0nIxx/DX5X2UA84NJkuxBx171986L4M1SHw5F4n1D5YtNjDApwR5g2/1rVZ/KMJSqPZHhZrktOnG8DxT/AIKaX1x8TNE034S+Dd1xrOtSIFt05xkjoPTAOfQV+137Fv7Gfw1/Yy+AWgeEZNEsZvFN5D5l1fCNSQw2nAfHUg4/SuU/ZH+A/gS98PW3xQ8Z6RFf6teu/wBiuLpdzxCMgYB7ZXP8q/QN79o2hGpol2jEHyHG5osHGVAxtzxX+dnjL4sSzDHywdJ2UT5yrWVlGJ+I/wDwWI/Zx8PfHD4c+HvFMXlW95ptzDBPJJhWVZpFXJwOABxX8+X7Z/8AwTs1L4HS2b/DsnXIbq1aeSSIb12KmWI54AH8q/s//ap+AfhH9pv4WXvw4FzJp9xJt8p4W2nevKhz9cfSvy4+JNp8Ovgl8O9O+HXxiupbvxF4Xs59P8iE7nuYZh6dyEzXueGXG3NCNFPUjnZ/K5+xn+0BD8G/HMnhHxlOf7L1Fx5bk5EZAIA6cc4Ffv8AaR4p07UNKEG/zI5gGimGNuCOK/mL/alt/hjqXxBux8LoLnTrRHJCTjZIjZzgj+tel/s3/t3eJfhM8PhD4m5vNMBEaS9XUdj+HFf0vLBOvQVWl8R9Bl+YKMdT989a+3WLNFOpAXnJHBHtXkXi3TYtc02YIpdmQgZ7HHFdt8Mfj58NviRoyT6BqEF6jAfumYNIOPTjpXe3mm+GL0+bGCmPoB+VaZfXrU1aaPrsHmsORo/BKwvD8LPi5qGheL7YXWnXeXMUgyvOc/8A1q9T8Sfs8fskfGbTxqXhrVJ9E1qb5FVsRRg/XPT8Kl/4Kdt4d8Irp954dTy7uXG9uMkZFflJpfxG8Q28qTq28xgbcnoRX1XsKnIqsNLHxGYY5e0Z3fxT/Zk+L/wi1KaWxuDqNrE3yyWjb8qOhOOleg/BX486zplhJ4c1nOSArFgPlPoau6F+0/4500/ZFjW5jKDzImGVI+nf9K6PQfDnib4z3b6l4b0K0sLfdma6KbIx9T/L3xShjZzVpnNh8SpvlsdonjyXQvHFvf2zo0LBSyn7vvnp2r+gX/gnv+1P4I+Lepy6HqU629rpUY+zWlxgRNODtPlqR3HNfzh+Jfh1Y+HYv+ET8P3suqardMUklkbzEhGOqnjaO1dt8MtS1L4SeLNJudDncLZXCtKWb/loFIfB9MV9FTnGFO57McM4n2f4jE/gbVPHGjeIT5tn4vnmhliJ4TDswK/XA9K/JnV9AnWaWzt48p5zhOP4QQF/ICv1a/aL8ReH/iT8Q7ZfApMxkt4XlC9BLt+auR8BfsjX3iaVx4iuY7HH3d5wx3HtXy+bcRU6Kdz5PH1F7Sx+Vl34avIW+zMn3sc1n3Ogqm6JFO1QMnFftm3/AATgvbrUXs11FJWZQyMH4qjqv/BNbXl0ueKK4WW62/ulDZ3Ee1fMUuOMO/idjhdVJaH4bXnheGYB3j+U9sVsaBqvjbwkxh8L3sluveNW2ofwr9NJ/wBgj4k2UAsr+BYr3+IPwD6ba+e/Hf7MnxL+HWqPFremyeWBzIFzGAeBz+lexlvFlGq7QkFHE6GH8Of20fiP4D8rTPEka39mGAZSu7A/rXsfiz9qn4aeKdXiu9TXybHb86kYZSRjgfXtXyNffDu7OXuYGCoR8y9K+jv2b/2BfGX7T/ipruO3Gl6BpwL6hqVx8kSIiliFbPXaOPfAr7PAVHWasenhsa7q59J/CXwrf+NtVji8OmO88PXA3yXUh/cwxEch2/hbHGK+D/2wNY8HWXj6fwJ8MdSmvdPhYxSMxzE02MfusE8DpX0f+1N+0h8PvAOgTfsw/swzvY6Do7eVdX8fEt02Pmbd3yRj6V+aOhaXHbsdfvV2xAYiBzy397nvmv0LK8vjT1sXja0amweJbg2UVnoULEbFUyc8hgOhrivEup6mskWyU7VHFdFNDJc3El5dMGkc5I9K5bxCduEr0cVX92xx0KTg9DAHiHVlI+fOO1aNrqWpai7Iqg1z4X94AK6PTgbSfcDgV51OTaN6u5zVysxnZJ+OcV6Bofj7xX4X0w6X4fvZLSMj5vLOMn8K4e/Q/aCdvJbINAYCQA857Vw1tzemklc+jfgd+0f8UPg38RLHx/oWpy3E1rKsjQzuTHJjjDD+Vfvz8P8Ax/8Asbf8FB/C7ad8SdNt/D3isY80lBGZHwcmPHX1r+ZS0VY/3ijaRXc6Brt9o92mraPOba6iIZXVipyPcGuqjBWsL2an7x+tfxo/4I9/GbwWbnxT8EL+LVtNXMiwbmM23t8gBx+dflV490D4gfDq/OlfFDQZtOlU4HnxFCcemRX9CX7Hv/BSmx8K/BqbV/iBfP8Aa9Iiwck7psfKuQeozivwy/bM/au8R/tXfFC88Y6lEkFtvIijjBVSoPGRmsnzU9ZDahsj/9Ora+EpL2Lzg2AvSvSfDPw10u4bdqMnXtn2rjRaX8ZAjY4PYdK2LCTVYPmlLYFcuH0Vke3jaivoe/eG/hZ8Owu6+y2OwNes6f4K+EVmipFaNK/Yda8w+HOn6dqFv5moS7Pqa+qPBWm+Dkl2x4uGi5/IV9fltF2Pkswd3qc9N8E9B8SacH07ShBGP4mXH+FeY6z8Ph4CY3Qsv3MPzs2OMD05r2n4pftJeGfh5pZe/kjigiXpnAwOOn8q/DP9pb9unxn8TLybR/CU7WeljKLt+Vm/HHT+lfdZRw1VxFmfMYvNqdJch99fEf8Ab0+HvgvT4dPC/aY7f51hiGSXHZh6f0r8gf2m/wBrrx3+0lrSXHiSTy9MtuLawxtiUDodoxzivm/UtQnvAZ9QffNJ6968+1F3RiE6HtX6Xl+UfVVaR83Wr8+pe1HWpZz5T42DgL2H0rkbi8Lgh+B7cVTuL1Uk2ucVjy3tqgLPIMV6rqK1kc6my7Ne7j5anAqhO+xQAc4qjNNbum6BgT2xWRc3bqQByfaudl6mtOxC9cVjTT7OprHv7+dVyM1gSX8xPNT7eysi0jpJL4BsVSlvR+FcxJcu59KQXBH3+RXn1qxsqJtvchhwajEr9qqwiK44iIpjfusk5GPasOZG3IktC7JM0g8uRciuUnghE/mR/LtrXMzg7gaz760iuUMtoPnHauGsdNDY5zxTpL6raJfxqPNX0FeWy6duIfHIr2zTbvejWU3fgCub1LQ1sXLEfe6VyOCOuLtseVvZncrqM+1aDaOdgMYwDW0YFjAVlyD+FdfpNhb3EP8AeFPkQ3I8jNqqyeW4qtqnhRJ4TLbL83biu51nSRaXhIXGOlRaffRhtk33aPYgsQ0j56uLCWzkaC4GG7VXjtiGr6X8UeCE1vTv7U0qP54xlh6V4Uts4zleVOMVxVYO50Uaye5hLCQwGf8AIrobSQxPwSo9qpJbEMQe/wClXEiZD8tZeza1Npt/ZPpf4U/FnV/B2qQ39jcvFJDjlTjOK/oV/Zc/bE0r4naTB4d8UzKt6vCOe+B9B6V/LfaSOH3DivfPhj8QtT8H6rFeWsrLhgeD0rgzTh+jjoW6nr5PxDVwkkf2z/DbV7mG7SDna/II5GMdq/Uf4T26W+mpfScvjIPpxX87/wDwT9/bC8K+NktvA/jmVY58KkEkmOuO5r+jXwXbWdroyR6cyuJVyCDxjpxX84cWcO18DWtJaH7tknEFLFUHZ62Pz0/4LIfGZfhn+xTrVrayeVe6z5axjOMpjDDpX+bT4x0kxXj28g+ddzY9yQf61/bn/wAF7/iN/beo6B8KIpMJb285mUdjuUrx7V/Gr8Q7Qf8ACQSyFcZJH4cf4V38OvlSTPGzrCpw5pnIfCm/e0upV+6egr6MtpGdzIx4wK+a/DEf2PU3I9a+iLbamm/aLj5VI/l0r9/yJ/ulc/Ec1pr2lkei6Tqun21s32o7cA1z3gjVpp/H39vsT5MJCxDrz0zXid5r82takunaY+0D7/fA/SvpfQfhprFx4ag13w8m/wAs5O3rxX1ODkpVNDzcTFwp6n6nXwt/H3w/ttQ+Vru0QZ9cCvkrxxGPtULqPmZMEenavY/gHr2oQ6XJBrEZXzYtmG9cV5d8To0tZ5JxwIGz+FfXYmo1RPlMN/FZ8feeNQ+NR28iK1AI+hxXW3fiNPFq6loLnjTkMwHXGDjFeKeGNeC+LNa8UOPkjVkU59Dnrj8Ko/BHUbjWL7xTqoY5e2cDPI69K/LuIsTGdB0kffZJStJF2XUthFraL838TeuR/StGz3TQlOGU/e7YrGtoZJf3W35sKSamnlW3k+y2Z5I5Nfhdek+c/W8PFeyReu9TaF1tNN+6v3jVyxeSeTbnKfxHpWfZwQhRGv3j1alkvoRixsBuz94jiueUUbw00RsXF1cZ8mxI8v8AirTsIIJrfgbET73FVbPT42XdAcAcsaqX2rPcyCzs8bOmRwOKxOhGnJeS3Ev2K2P7j+964/lXSaWbMqxn+WGPoenNZOnW8MkGxAAqdT0qtNcpqBFpHxCn8QqZK5tY1bj7RqFwFLboV/lXV6dd3GmW+6OZlgHRSePyrCtbCO0hEjt+7HWqj3r6rMFA/cJ92uV0k+hrGrJbHtPhX4lXEblNSjyo4BAwBXa3vicb4pbCbd5nWNvu14fbW1rbWhu5WIVRx6H8K5xbi+u7pb/cY4weFH+RXBXw524fM3HRn2zp1xE9sGs7loHxk84XNTf23drF9j1t1uEl+Uta/fA+vT/61eF6R43Gl2Cy6sMxkYAHWtfRNcsb/UBeQOwUniMcA/h3rzKtKex7dPERn8R7Fb6I9lYLd+E7kTylsbD/AK4AdhXRR+MfHGgaW11cQ/aeP3sUq5mUewrjLi80dIFe5WW0fOVMPy4qxp/ima7nEO/+0ETjKfNIR/tHjOKKeKqUdLk4rLqdbQS01nwJ4rszPY3X9n3jH545fl59hVSf4eahLjUbhRNbLz5i9Me/pXR6h4d8AeKofst262k/YRfK+Rz6e1Y9/Fd+DrSK20O/ZZzwftbboyPoK9GjjqctKiPBr5RKlrAxru4g4T/ln0A+lcFqVgbydbW1Hyt1x6V7+/jDwrFokel/EHTsT3A2i9gG2H61Vi8F+H7bdeeGbpdWDIMCDkp9c47V3xoU3rE4nipp2cTyqfQ7bRrBIoMZYc4ryLxBiMs0fFew+KLBrWXa5Ns5/gk68elec2+mTatM2+MhR3bj8q5502pJlt33OA0zSi4+0XXGelZupWcpQgc5xj2r0zUrFVH2dOFj71w99DulSCHO4HpXqR1RyYimktCvpvhe/lRZrQcgg8D3ri/i/fR22isk0m24HB5+avr7w9o76f4eF2ifPjP0r4i+LHi/SbfU7u1vYlaXPyZFa4aTR8LxLJumox3PlfVtXKTQRJuI21678NdRb7WLnUTiIdQa8D1O9+2agJHBVRwP4a7vR9fvNIjAXa6MO4zivK4goynDQ/Lc9y1VKPJHRn6MeA9AHjy903w3piq3229iiAUdA7AV/cR8EfgF8KfhX8JPDvh9NHs5by1sY1maRBnzFH6da/ja/wCCffh7U9Y8d2HiltPlvoLJ0udsQHWP5sAZ9q/p80r4sfG34h7bjwn4b1CCBhuBkQYCjj/PFfWcD0a9KGkLHo8A5FTw8Xyu7PvefxRomiJvtIobTb2QbQMdK8b8fX+h+OyUW723qrmMEjaW7Cvna+8H/GbWWNx4k1m002Jh92cFdv15rz/VvAHgXRZE1nxV47t52t8FUs5yrZH6V99Rr4vn96VkfrOHyHE1lalC6PYJvDOtXfhjU9I8baU7aRHAxnlkXKp6lTX8mHxo/bD0ew8SeMPhbotlLLoEMlxp8MwAIBRyuc++On4V/T3+0N+1z8PvCX7H3jPRvDV7NJM+myxRyyyhn8zb1Bx29MV/BBZeLPE2tm5sTLCU1Kd53ZxltzsW65FeZnyw7acZXZyY7CYjC/u6kTs9P8QaLH8MtStZnCSy3EjQxHrz04/Cv3Z/Yn16PxV+zxpcl4ctbsYT9YxjFfhz4f8Ah9Na6Ffyanbm4aRCtu6fd39a/Zv9gfSrzSvgH9jvzhlu5WI9+K+SzCKjFWN8iqNS0PuHTbCSLfcRj5B+lZurakrN5bts38A9qvrqg0ux2gbvM454ArgbHV7T7c9tqyGWMn5WxgLXjPY+0o047nqHgjSL7V/EMUdnCbiMcHaPQV9teCfD/jm/s5vBvihjDH4kk8uzXOMCB1/oM9umK8f+Cfg20tNKvb61uDBcTIDayMcLknBHtxkV+hv7Pvwz1TxH4z0YeJblXfwyWmYueCsw7fQcV8Hx7j44PKqlTZtM+azGrzS5GfoV4GsdW8K+FYfBenRh47KNSzcYUYGSD9RW9pumTSava+JNIm8yO2UrNk8k+h/l0rgvEq6d4x8faXZ6RrkdhLou77daI5Uyh/ugrj+7zXri25W9um02WJLBdrCNOCen51/l7xMm8c6z6nyOKw6hLmTLEl9Z6lfvc2UP2a46gMMLwP19vSvgL/goB+xRZftI+Drvxb8N5Y4PH9jETHvOFdAnOMYyduQPevvmVtBt9QgkZpHguBgrn5unY44rf8OWqhnNqctbq6xNJjzGHXH4Dj6V0cJ8R1cuxPtEZxknE/zLvjP8GfiX8MfFl3oPxTsJ7PUA7eYblf8AWnPVT3FfLXiHw2LqForqMhB904x+Vf6Xn7TP7GPwC/aq00ReP9Jit9RCFftEYCH8eOK/ny+Lf/BBC4bWLqy+G+rI1vktAs7Fse2AfSv7J4V8ZcLKlHndmZxk1sfyOaDq/j/wBf8Am+ENSuLTHRUbCmvfdC/bs/aF8MAWV1cibaNqlwfTFfZH7W3/AATX+N37Mj/2v4h06S508f8AL1CjeUuOoPBx7V+dl/oFvcBJiFPy7gO/pX7xknEmFzCnzwszuo1573Mz4vfGb4hfHTUYtV8aSqRbJtUDpXmVv5kHEoKpt6jpXpkWkafFIJWXKnqOwqrqOmW08UkIXjqAOBj0r3oYtO0XsROHM7vc6/4EHwL4k+I9h4d8cXHkWJZMtuxkdcdq/Vr9qP4j6B4T8E2mkfDa3WwsIV8iIWwCmbA+83rn9K/DG48MyxSreWBKTIcgjtiuq1Hxl4z1Kws9Lvbua48liVV2yBxWlanBu0Ga0p8m5+hPgfw/eeG/DyaprUUlxc6nguw5Kq3OPwqt4yGky+J7HRIZRDblQNx4Iz1Lcda8x+EX7VV/aXlv4W8YxxgRsqI+ztjbzX3p+zl4W0T4i/GS6uriwTUrKVAXYKGROw+nNeBnOZPDR986cVmHLG6Zz3wj0RLfxbPqWlSeaqovlsO+35SBx6Zr9AdDFm1i2qq+Z2CgCc5xyM44Hauht/g/4b0i0Nl4QgWyUysGMnXAOcDgY6Us/h4m1mMEkJEJAA+nWvx3N83hiZOMT5TFVeZ8yPrn4R2NvrlvA1tEbicrtVU+nr9K+tdP8D6Lujtr21kgu1U4OB3GOPwr89fhX4zvtGtJbLTlfzCBtMXBHrj8K+1/CfjjxHH4eGpardxSGHBhDf63Pp3/AP1V+Z5thZ39w4ZVHYp+KPhpeS6bJpDIJfLO6Njgyj2zjivzO/aMvETSpvDl+FLQrhvMHzdeK/QTxJ8abyzvpPFGsTpFOqnaoG1SMY5H0r8Z/wBsL9oDw9qF7N4u1SVEEYPyrxuxxX2XAOTYidRE0lN7Hwt4iuvB3gplvvGsrx2Yk3bEYKxXPIHHccdOlc1+0B/wU98T+JfhzF8A/wBnmyj8N+HBGY7ia2j8ue4b1dvoMV+f/wAdfjLefFrV45LZSlnBnYn+cVX8IeEdN0nSE8Ralghh8oPr0GK/sThPIZQinJnt8ijBFTS9Gew08ajrnSUhsZ+Zz/tfjUeoavPqFxvGPKThV7D8Kzta1e5vLszS/d6AdgPpVOyVJBnPNff1EoK1zWjS6muG3sZHA3etclr2JGHbFda0eyMtXGap88leTiFodKOfhT96G9K6SFQ3PTtWHFFhutbUZPlED0/pUUYqxNXc93+Bf7MHxR/aQ1DWNN+HqJPPotmbyWPuUHAA5FfOmo6VeaBrFxo+pJtntZDE4PGHXqMe1fqx/wAEkLnUJv2vbDwTpl6bNfEKw2L5baHDHOP0r4p/a48Dan4C/aX8beFtSjaJrfV7sruGMqJCvHtXm4rR6HXR2PEbV028jirKkRnIHFY0LMny1uWhWVeBkV1Ydt6IzrbnonhV31Dw/rFixOzyVwPTDA8flXz7KnlPs7pmvo3w+sWm+ENU1fos0flx9ssCMj8q+dIg003nN0xnFXm8vcjHqYYZ80z/1Pd9U+E3jDTAIobmGUD+6D/hRH8MPElzAI7i7hhXjJIIH514Zd+KfFskmITd7B28xsfzqxplx401M5Dzx84+ZyR+px+lclHERukke1Vw3NvofUmk+CfDuiQ7dT1uE7cbgjYP4Vo+Ifjt8M/hNoU+p287TlRgLu6np0xXzfqWhNomlTaz4k1BY44xkq+OcflX5Q/Gz4zW+s6jPFYyf6NE/wAgzxxX6/whlEqlqk9kfnvEmOVOLpx3PRfj3+0F4i+MeuS32oFLHS1bCKRt4HTP/wCqvj3V/G2mxy+RpEbXDLwWHI/CvB/G3xo8N2dw02o3BuZB/DE2APw5FeB6j+0nqG8podsscfqV5H4j/Cv16jUhSVoKx8DTwsqusj661G+1m+xJdSLbRDnnjFed65478G6KcX9wbh16hGx+XGK+W7345+Kr1vNlKgD/AGDWevxRuGbdcwQy565j5/IilUxrcTpjg3HqezXv7Q3hSBmg0+ylfHdwprn/APhpDTSwzppI/wBziuWtPiL4RuQItb0tGB7xoq4/IV0kOhfCXxRCslrKLaT+6xxXm/WprW5aw6Na2+Ofg68IXULOS23fxdAP0rqbHVvCuvNnQb5FLfwM3J/lXh3iH4RxIDPpd0sidgDXjN5pereHbls70x0K1y1c2ktDshhfd3PsTUra/sWK3Skq3QjkVkMyHkHg9K8Q8J/GfVbJv7F8RHzbc8bj1A7dq9ckktruzXU9IkzEeSg5xV0sXzxvsZKhbUtyYQ80Dgbl61VWb7ZGpA2t6VXTUEt7kRTjArByua8zJbiPIL2pIYdhRbeKo3kWy1MYxwK1ZbUmMT2NclrGmrexlowBKvSkiTtpoEeMS2x3KfSubuxeWMnnRfdHUfpXH+HPFVzolwbHVehOBmvUXW21a3FzA28EcgVM9ioO2xzIns7iRZbc7ZBXTTQrf2qNIPmxivPNSsJdLufOTgZr0jwteW98uD16UqcEzo52cle6EJE2KvNc7DZ6holwJo+UB5Fe8y6bHJlemKxLrSoyDgdKaosXtUclrlpaa/pgv7AZlUDIr561G5ksLtonGGBr6eg0eS1maS1+UN/DXk3xB8KSD/iYxLjjnC5q2pExUW7FjwR4rt8eRcP/AKwhWHtXM/E7wiui6yuo6aP9GuBleMDPevI9O1aXTdTRZePm+gr6OkvE8a+DJbaA7riz+ZR+lZy5JaI1lBw0ijwo26FWTHzDpVaOPD8iul063W42bjgqvlt7MO1Vryze1uvKI69K5qtG2zO+lO0SgkOTkcVt2wZAD1qmE24WnSXKwR7TwegrlhS5XdFQm2vI+xPgZ4w1DQ9Stru0l2ywsu0qcdOlf1m/8E9v26pPF1lY/Cr4jzbJlTFvctwPYHj29a/i5+HGoXunaik03KZzz04r9kf2RvAHxm+K1/FrXw2i8r+z2UmVsAYz1xnPA9q4eJ8qw2Kw9pb2PS4fzKrQraaRPdf+CuXiD/hK/wBpXW7vzA8drtRP+BKOlfzV/E+BIdbcuNoBr+0z9ob/AIJyar8dtEt/Evg/XYG1+8jRb1Z8ndKABgdMc1/Kj+25+y38Vv2ZvH//AAhfxXsHsp5laS2dhhZkHG5etfhtHKZ0K6XQ/YM0zilUw8Uj4c8PQxy37yDla2/Gfi0Qwrp1ocbQOB3rmYbtdF0/zX++3auV04Pf6kb+bBAOfm6cV+xZdLkopH5Fi6d6zk9j0zwZpQ2bpjsmm+Zjjp7V98fAG+1rR9RXS5P3lqwHy59a+TvCOhWfiW3LW1wkU5IwP84r6b+F2heN/B3iS2u5U821ZlGVweP5V9XlCSdzws6qe4kj710i80U2F6YU8t4iwC+mB9K+Xvjxcmy8J3F6TgtFg+561976V8GfHXi7wnqHxK8N6NLLpFuhW6lTBVHA6HHt7V+fP7Vd0uj/AA3lul43OFTPHb0r6bH4yn7Jxiz5jCYeXtUfnJd3J0b4aTM3+suZsE+3Wvav2W/C6XHgq9kuBsa8zGD7Gvl/U2udUsLLw3Fkz3LLKF9AeK/RX4PaNDolrZaSMbIlUOOnzY6V+b08A8TOaR9vUxawqSifNWpmTT72fSYRkqxGR/s8VFYxLCm1vnJ6npXqXxf+GureAfFTXBw9tfkyxsP9rnb+FeT6heRiH7Ja/wCuOM+1fjuZUJ0sTOnM/UsrxSqYeMh+o6mqEWdqNwbg4qzp2myRki0HXvVXTbB4FxbDcZOue1T3uofY1+wWJ2sfvH1/wrzdEtT0TTubz90NPtT8x4YitGx0pBCVUYU/pWfo9osgDDv1NTatfh3/ALO05snviudLoh+0tqWJpYLmUabA2AvBYd66610oW0XlygeWoyT0Ax/Oua0bR5BEroMj+PPB54rtLvSbjWbIaTaXsMEUeMlzz+lU8POxP11HK3epx6hJ5Nhnyk4J7Gt2yjt4V+U7Y059vzrbtfh3rlrp7XNgovbVB87xA4UdMmuL1IzXJXSdOB8iI8/SuVqUdGjuoSUldMu3V7ca3OIbLi3Tt64rr9OSKCDddD9yn3s8dKzNO0e3gjC2vyBcHmsvVtRfV7j+zLQ4C8HHfFJq5re71NSe8XWbrfB8sC8KPpXX2pjsLMXsnyRr0OOa5/S9JggjEBH7peT2qhqms3OqzfYLVf8ARoThcd8VxVkdMZ2PQNE+Iur3EkkF2qS2p4Xj5sCu+8MarZ29w13AyW6P7bc15VpWkwzgMB5ccYDGsvVdQudWvRZWKgW8XAI6nFedPDuW51QxNtEfVt5qcEkRuLq185ccNBgGtTQtSu7iGOdYkubcH5IpV3Sj6H/PFfPOlXF1BZbFldoAPnG7HSu08BeObOR2s4nKoDjYeT+fFctahPY9PD4xbHsElh4U1bVjNPJ5dwPvWs53Rcf3F4Aqj4n8O62lxFfeBD9n6ZjPQ/QDFYviHUb0JvmiUwnG0IPn6+tdF4bvtZt4vtFopK8YEnOPx7flWcas6OxtVp06mjRxeqatqGpaquheLrYSMFGRGuG49D+FbMHhvwxfr9l8N3Wy5A5gkbLfh0rrLnXoru4EutWXkuDkyMMZx0xiuH8WeDf7f1aDWoLWcI/SWzIQLgfxYzXfQzZPSZ4+Iyap/wAu2ch4m8L63pDrFqcRB6hh0xXO+G/Dq32q/bGXKg8jHSu3n1rxNb3f9n2Ug1i3jwJIl+Z0A7EnFd/4cTw4Q17cobGZv+WcnHP0r38LUjPrY8OvTqU9Jo1tWhg03w4zoMAp09K/Ib42yyLq8t1NFxu+9jpzX6++KLG4l0stb/PBjkj9K+TPE3ww03XLaVrgqx5+8KurWjSdkj5LFYNVZu5+Y1pEb1lk1KMyoxwnl17L4P0Lw9qdhPDd3KWxj4VZPvH6UniP4Ha7p9+03h1iEDZCHJX+lLovgj4kXso0rZErbuW2dKFUVS1z5bGZHKUrJaH1j+zd8dPiH8Jb2a0+Hpjlltv3uzaTnZ82Ovt+VfvL8N/2kPiz+1H4a03V/hvqklrqFqFt77T7RzHKXbqyrkcD+Vfkf8APgDpvgnws19e5n1G65kZjwAewH0rtNE1j4gfssfEyw+Mnw8YpHEyi9hA/dvEGyx2juFzXt5TjZ8/slKyP0PgzDf2cvacqZ/Qh4O/Zw+OGvwpNr099GrDLGeUnHbByTXq8/wCyloGh2wufEd7C3ljcRgA/1/lXpX7O/wC0j4e+P3wntvHnhm9y1yv72GNv9U56KR/+qqPjfUNVS1kiuz5rMCMdevav0/C8OUow9pJ3O/MuPMbOpywjyr0R+F//AAWM8ZeDvgz8JNP+Gnw02XOpeIJSJioU4R1xgYUYr+XDwb4K1a71qSz1OJoEtU3EnopBwa/oj/4Ki/Dy913S/wDhLHjkM1iPMTnoFxgYxX4N+H/iHaxeH9Q0+6ty17dQmESejHnP4DtXzOJo04VWuh8XmGPq1pXmz7k+B/grRNT/AGQPF/ibU5j5+nvctC27keWQFAPvmvsn/gn3Zyxfs/x398ZGaedzl+dxbB44HSvyJ0D4p+JIfhS/wf8ADkTq+oyNvx/HuxwBj2r+4L4X/wDBO7SLf9grwjDoEDQeJo7KK/2D5TJ5iDK7fb1/SuWeSVMVF+yVrCy7Gxoy9/qflnqOpmUiwtcMY+oxWVJFNP5cTwmJsgZI+U1natpd/p3iSXSPEkLWmoWEjJKpyoXHHPHI9K6jSZBqOq21tNIssO4cgcj8K+Hr06lOfs5LU/Rac4Spc0Gfd3w90uwm8MaV4WVSL1ySCPZc8flX6o/sqWmiPYahrE91HLJqS/Z9zsDtMPX8iOlfnH8GZ5LvSZNX1OEQW9nG/wBnuCMbSoxz+Ffmt4p/4KEeMvhZ41vfDPgyZTZ2lxJt2j5SW+9mvyfxby2tisF9Xp9j4fNaiTbR/VtZeGvCXh/xrfeO5biM6jqOyPY+CH2Lt+X0+WvX1sNPnt/7V0M/ZTDy8UxB3g8fL09a/k48Hf8ABWPxrpFmJPEkC3yBtysVBK/Q9q9sj/4LLWZCGyjKWxGy4WXDMQRj5Om3nHY1/FmbeFWPqteR8nObluf0gvrOnWt4i6pFsiUhkcY+X1H9K1bxI9VuF1K1u0WHcDH5Zwc+mffpX87Xhb/gqJ4b/s2Xw/rbu+m3hzEGb98nf72OR+Arvfh5/wAFHPAC6q/he4uZINPjbdFK579R245rw6vhtj6KtJXEnbY/cybUpbHUr28v3zCjiNz/AHcj+lZ3iRdLglg1axkeV1UHbHwSnduOnFfDvhb9s34WeIba5sftqv8AaMO2W4OB9K998KfGfwJq9hBe6PqMCSKpiCkg8EYx2rwpcLYvD3colKTNv4maV4A8VfCXxBdeJLAanosNrJM0Mo8wkqM/Ln/Cv89T4/6f4Y1P4pa1P4NtvsNh9ocQwMMELycAYHSv9ITwU9prck9tLpp+xXsRgugcGFkYYyijp+tfl5+0d/wQ5/Z6+K0+q6x8Pb7+y9Rv5DJHuYlA3ZQABj8/av13wx8RI5fL6viVY6ITa0R/B2mheYVili2c8g/pWdJo6rNIZFwqHFf0M/Fb/ghh+1n8P47i90mybWVgyP3S/fVTwRkgV+Wnjv8AZq+JfgbVJfD3izQbmynhBaQOn6cZr+m8u45wNVfGb87R89/B79n/AMafGvxnH4H8AWLXV/dsixqBn7xwK5X4p/AzxX8GfHNz4G8c2hg1C3+8hG0rztPr34r7s/ZU8V+Jfg/8btD8X+Fg8c9rcxFhg4IU9OcDiv6Gf21v+CXsv7UV/pnx68Aypaatq2nRyXFvIMmRm54HA6n1rzK/iJQw1V87ujnnUb3P459C+GyfbI766QnLAg9P1wf5V+u37B/ww+Idz8QLWTwnBItkrAXUu0hCnXOehxX6t/s0f8EqfA+i6AbD4/I51bzNiRRMFKj369q/Wfwv8AfBnwl8Or4Z+G+nxJpxjETSEBpEYdy3GR+VfB8ZeK1OrT5aZ52IrXXKfmH4l8Aa0l3JaQxiaNSx82NeFOe/pXnVv4WvE0xrG7tNyLJzKF4P4f8A16/W/wCIXwaXTvDc+q6SNsoAeZE6Ov3enuT+FfLF78MUuYnjlaRLbywfKBIZWPP4/pX5vlvFS5rnBJNRPzqnk1jQNdlllQW9omMcYGAa+hfCXjjT5it1p8yeWRja+MMcdAO1cb8TPA3iPTbZ2sU+0Qr97PzYXp0r5H1OXWvC0EkVqCYpz8n+wRz+FfouWOOJ1ucPtJPQ9p+PXxSgv42eS3S2+yK28MBtIA69q/lv/ai+LWp/Fjx1Pp1lIBZWzlVEfANfpV+1v8UNa8N/D+40ue4K3N98u9uuNw6enFfjBHbRLJHO7b2flj0r+kuBMoVKjzyR9FllH3dTKstK8idIEG+ZsLjHHX0r0DxJdvJFDoqkBLb7wFYeiSw2/iZZpB8pzj2+U4qlqzXA1W4EvBJzz3Hav2rBOMaaUTS/NU5X0MnUsyZCe2KdpJcEZ6Co5iRxUdjI6Tc9K1pbtHenbQ6mWXEe3HauPvwGkrqrgAwgg1yFwCXLelc9eTBFOJeeK0Yx8uPaqcQKtWrGpZelXQWhpKCPSfgh8Vdf+DHxd0P4q6C+290W5imj7cof8/Sv21/4Kqfs2aT8bPg14W/4KFfAtP7Q0/V4VtNbSL5mjulXzJpGA6DPsK/nvu5WtrhWU7cd6/pE/wCCIf7SHhDxYviX9gz41zpJ4a8fWv2Kz837sNxJ8xZM8A4XBwRxXm4ym7mlLY/nCEfknaw4zgH16f0rU0yyubu9js7McyHt7c19afti/sweIf2TPj/4k+Duv2zL9iupGsWP3Ht2b90VPf5cGvnWzuE8M6a08eDqFx97t5Y9v8iu3AWXvHLXbeiG/EXWLSy0i28LaacCD5pMf3j1ryfTVjPD9Kn1W6a8leWQ7pG+8ahsojsOK87GVvaVS8FD2e5//9XptS8FeMbFyIoSyDuKxYtG8VoWZ7WVY4l3u27aAB6dqhn+MPkW7T2U+1E+8H5x6+lflf8AtZf8FFdaFvP8PvD91HHBGSjtHwzDPqOlepkWRVcQ1PodvEGbQhC/U0v2pv2okW5l8JaBNJdNGxRlB64/McYr8qPFd/458WsW1G6/s+Ak7Ru/n0ryHxV8aNa1W6kTRo9nmfeb7xJ9c44rzSbUPEOoN5l7cHJ9zX7Zl+JVGl7KKPy53qz9pUPVo/h94YebOu6ujc87e/616DY+HfhLaKBDOrHHc18qtDOr5mlbd24JpGllg5aVuOnymuj65Imph017rPr1pNJszjQraK5UdtozWLf+LfD1uvl69oLKvdhjGPwFfMK69fWzKbeZwB26CupsviTfKAswSRVGORml9bfY5lhGup7DFpvwY8Vyf8S+Q2T9MOeM/Tiquo/B+7s/9J0m7E0f8PlnHH5mvKprnwdrpU3i/ZZj/wAtQcKPwArXs5PGvhKEX+jTm9tV446AevU/yqo42Nzf2bOusoPEOlPtMzME7N+Vbn2xdTjNtqUa8jGcVD4e+Jfh/wAU4s9RAt7ocHcMciuwvdIiDCTZlCOCprpcIzWiOefu7Hz14v8ABC2qm703lRya4zwn441Lwpf7JiWhJwUP0r6gk05WjaE8qw6V8++NfB5hk+0wjp6CvOq0ZQ17HVSqRe59C2N7b61YprOjEAEZdO4qvexxX8G+IfN2/CvlvwT46v8Awrqv2dv9STggnt09K+r4bi11G3XU9PI8sgHjtW9Crz6hUpK14nP+H/FDaXcmx1A5ycDNdtfWm+IXdvyreleceKdJS5QX1sMMvWrfgPxjGW/snUzubovPpXQcyIPEukLfRCWMYI/SuU8NeK7zw9c/Z7hvkB6GvcNY00xyGSP7kg6V494q8Oxr/pKjg9cVMtjeMFdHs8UmleKbPzYmBcLXN+H1uNG1MwzjCluK8Q8PeIrrQr3EZOzOMZxX01plxp/ia0WWEhZkH1/wq8MtSsRGy0PR42jkw6cgiq7RjJ4q1pkKwWCJIfmFSFcHB4zXqezXY8tOy1M2MpvwRVyXRbTVYPs8oyCMYrLuAYmyKltNW8qRVIx+NSqF9DP2ltT5G+M3wR1bSFOtaCDJF95gOMV5T8NPiE+ja0ltdkqWGxs8DOOhr9TLFrHUkMc8YlTGCD0/lXyl8a/2W01OGbxb4AAjmX948Xr9PpXiZhh5Um3TR7GUZvBvkZ45q88GleIJmsAPInxKy5+6TXRt9m1WEXEWCwHPtXyO+reINN1bydVD7ohsdW46V7P4R8QRwvLFI37uRQVbpXiYLEylP94e3jcLFw5kdrqlobeISfoKz9LsJ/NW4uF35+4CP5+lbIi+1SRyqdwHRfXNLquqR6IPsaL/AKQ4G49l+lezOV17h51Oo46IzfFXjaLwnbKbH5rt12hR91M8dO/H0r1v9kH40ftE/DP4iaX4j8LLfy2mpTImyN38vDNsPTjoa+bNe0S4ngkupPmMg5bHSv3d/wCCSGmv4i8CwWYihmewZf8AXRhzl246kYxXx2a06lz28JNNan9IPwn8SePtE0CwutShbzLxI5PlPKEgdeT0+lfD3/Ba/wCAF/8AtGfsu23xg0SHdrPhNY1ZVG52hf5nz34x/nFfpp4d+Gfi9NJe+FuYJETcGZwFIA/hBNcBD48vL0TeCfEFqlzYX6tZXEbAHKy/u89xwDXk1MMlFM9T2suXlP8AONvHglgE8xwV6KfXuPwp1g8Kxjy05bjr0r9BP+Cm/wCzLp37Mf7VWr+DtAiZNH1GVp7NW6Ko5OPavg3T7KI3gBOFBHH0r1cNJ6ROKq7xZ7J4X0fy7RBds6vJjbs4xX2n8KB4h0PieQz2yYKq/P4d/wD61fMfg+4kvL6KFkBiVRzjpX2X8NbOTUNftdOs8kYEki/7GcfhX32U4GU46HxuYYhJrmP7Uf8Agll8PX0z9izWbu/soNY0PxArJcxLGm6J3XlyeTgDjoK/mQ/4LP8A7F8n7PXgOPx5o0nm+HtT1BXt4+pQOPu9eMfSv3V/4JPeNbzSvh7r0A15NNgQPbLBNyj+wXcOew4r49/4OLd9r8D/AAj4amiKxyfZ7scgK6eu0E4r4zEzrU8XKkzuo+ycVJI/jj+Geifarz/hJ9SG3+CDPYAcCvuHwcpjtllAzLJjj3Hf8q+Y/DYtb50kUbbdSPYcegr3/wAJau8mr77f/j2jxj8K+yyDD+zdzlzStdaHsPx40TUdf+Hlrd2KedcWCGQgDke1fBFjphuFN2M+bxnj1HI/Cv048G65Hfar9nuDvgnKoy4z14r8+/HN3F4a8UahDbR5DTOqAcAZJ/kBivy3xHyynSre1hufc8FZjOcOSWyOSvL2bTk+zW/MrcDFP0yyXAe8/wBYe9S6NFDuN1eD536L161tX6/ZClqF3zy4CqO2a/K7uT1P0HnIrp3tytjp3zSvxgdq1LiDQ/AGmNq/i2RfNkG5Ywef8/hWd4h8Q6L8H9KW91ECfU7j7iZ+7n169q+LvFPjHWvGupte6vI2wH5B2Ar1MPgLtHlYzH2VkeieMPjlrmuF7LQv9Etjx8v3sDpzgeleTHxB4g5mN9MCeuGIrOS2+VmB47VIYkQAOeK+iw+Xw+0eFLFu259Wfsw/tCal8HPiFbanq7PfaVckQ3UErM4aOQFDgHIHX0461+hfx/8Ah/4Q8FeJ7Hxf8MZRP4e8UI1xaBTu2bQNwPpzxX4t2SEN58gIC88e1fpV4f8AFU9v+z3pNve5cwIIrbnlVJ+bHHfOfwryc3w8Fex7GTV56Iq+K9ZaLZo9guJSoLlegrN0WydIxHEuXbq1U/D1jI0AvS3mE/wt96uj1vV7bRLFDbcTycBfSvlD7FDdY1SUxjSNPfaxGGNa2gaVJaFA6ZXjn1rndDhWRRLqa8v0Irvtc1SHwnpCRyHc8o+Xtis5wVjcoeK9SEJGk6O3P/LTHp6U3QdMkRUij+V27fz/AErmvDcMdzM13efPJIfvdK9B1HUv+EZsN7pmRx8mOCM8elcYlEp+J9TghMeh6c3zD/WYOK0fD2iyoFjjXdnqwGCK5Tw5Yw6hN9queZ5T8wP6V6Pqmov4P0zYzDzp/lRfQfX6USOiKtsWNe8U3EM0Oi6XLu2feZhmvQvCuqZiEUjbWPUnJH5V4P4atftkzXF8fmkPWvSNWuJvD+j+dEAJZvlVfQev5VxVKUZbnRHESTPRtcvNThRvs91HNGMdskc/Xitfw/DNbwfb9JuPJlk+8jEsv4DjFeA+DnvEjZpDt8w5bdzXqT6xb+GLGLVNUOEnbagHBFedVoW2PYoYtHp630krm48SWIjkHSeLCp7bgoFYGueBofGkkVzFd7JYz8zD5Rj6ZrkdW1fzbFNSsLgBTj74JC549f6V1vhyJLm3W7tpWWfvIDhPyrhnKcWmju5IVFsVFsfiB4c1H7HpqtcWWMb2GV/KtSbUPDpcab4wtxZCTj7R0A+oAOPStSfUfEenJ5epMtzb9ivGPTpmsJtMi8U3qTaXfxwXAPzpIuT+AJAr1qGcNfGfN4/hmE3z09DqtH+Bk3jK4b/hFJVvbaMbvMGFA49M5rqtI+D2neF2eXVLEmTpvC8Z/KuMFz4g8G65DtEumnI23W79231VcDB6V97eB/2mfB0SW/hz4t2kMoIVRcooRWHbjB/nXtYPE0q1uh8djssr0elzwjRLGFrbymRo9p49CB7cVW8Q+HbDWtPawuU3K/XnAAr9INR+E3wn+KunQ618LrmOOY9YQwbP6rXzt4w+CvijwXeS22rWLdPlxyuPqK9+jgOVc0WaYTOeWHJNWPi79m3446/+xn8Vjd6a7zeFdQlH2qFvuoT8pkA54AP3f1r+ljTb7w/8TvDVt4t8MzpcWV7GJo/L7bxwOPbtX87HjD4XRa5aXEF3FsLqQUPGR6Y7Z6V6h+wX+1Nrn7Ovjo/BDx/O02hahIBaSSf8s5W4VcnPA6dq/RuEc+tahX2PLzWjzR54M/TT41fBTQPFemy6Z4ishPDMhQgjnBr8e/G//BJf4P6teT6hoSyWAmbcRuOB26Cv6NPFFjFrMIu2lTZ/C2cAgjOR7V5Rd3/we8EWv9q+O9Wgt0Tnr/8AqxX6JjcNg1+8bVj5hqbVrH4zfsw/8EUNCuPidpHifXNSBsdMnE4hO7LjBwOcCv6zNCutQ0e4sfD5xFa2UK2sDEcBEGAP6V+TGsf8FTv2TPhLF/xJ0GpSRrtUJJjJHsVIr5P8df8ABd+71x5dM+Gfh1sKfl8xlfH0+QV5tLijLMJflI/savWsj9H/ANsn9kG8+Il/ceN/DtpEdaC/KLdABOvptyOQOc+1flD8MfA+o2fjSS58RWLRvZfLPbf7SHGOlct4e/4KW/tb/EXxRbXN+y2lrC37qMoOOD1wR/KvsH4TTX3iLVbjWdenWC/1MgyErhSc7sgZ9q/J88xtDF4h1KCsfUYSNXDQ9lM7X476poHgv9nrVLmyn+xzeSzeWTtPzYIwPav5T7tNQvbibVpZC6yyknPO7NfvP/wU88QSeGNLi067J8q7gVEZflBxgHj6V+E8Wr2Vq/2QIfLZVKk9q/I+JK0pzcY9DwcyxGtmWtEjlVpRK3lxkcIef5/4VlrdLd289pcoD5RBV1ULnBHoK6W2e1mgn87hiAI2/wDrVkCGS2t2ghIfy8l+K+ZpYVW95Hjmbb61Pbn548swwGJPH0FbVjr2uxW224BKk9v4RTNKsJcLcs6nIJXcvt9aka5mGmvPbjJUgP6YyB0rlxGGp9UB3dh8YPF+mRrYaZcsIhwDnBr2rwH+1F8S/CsoFjesxjORuzjnjpXx7LZC4lDRudj9MDGDWhKNRs7iKKElmUj24/8A1V4WMyChiNHED+nj9jb/AIKFnxFFbeEfGF3zIufvEP8AL2B4x0r97Php410PX9Jjk0yRokJVzuct/UV/nueGvFMvh/UhNbs8FxEPkZT36+1fr3+yX/wUP8XeBJrPTvFF6LqISKrKeMIPz7V+FcZeGd5upQjY0jLU/s0guodbU29zO7OnMS7jtPHGc8fpXkniLwF8N9WvmsvF3hmz1C5lXaZDAgIzxjO30714/wDBn9pPwH8UPD0Wo6bMBOcOkinI246EYGK+vIF0rXLT+1eZB5Q37Tjn1r8m/f4J+zeljq5kfAMH7Gv7NmmeNZdbbwvBw2fL2IFB7fwkdfauq8e7ILiS30aT7KLS32Iu7Cqg6KoGBx9K941fTp9ItjcykPZzEkN0ZOPxr4w+Lepax4KMniiaP+3dIdOUhyjIPc4b+VGW1quIq3rT0MKy6I/OfxB+1VpvhXxedJ8RTG6SK5KGZThyem0nBr9KfC/jHS/E+j2Gs+b5dhdxqML/AHOuGwOvvivyb+L3wO8I+JfiVB4m8Nho9GuglxLHjLJI/Y/Q+1foN8Ftf0P4dQwafdcwyqI48/OOB1HGB9K9TPqMIRXIeTKl7yPsmSCw03T0uoV+2Wc/yIV6qvbPHQV438Q9AluftOqaL5b24Cmfao+6MDHtX0FYeH76700a7bSD7HcLgxjrjHXtj8q+FPFnjrxH4a8RXduq+Vpm8qN3Cn/e+vQVyZDhatR69CsTNcrSPmjxVY6PLqk8GnBltpx8zHkArz/SvkD4/wDwi0bWPC41jRJRFLHzmPo205OV7cV+gPibRLnxjpK+IPAwET2r/vrYrnKv8jY6die3FfGX7THh+X4a+DZdT8MRSfY54nMyM2/5iMcH+Hn29q/VeDvavEqL2ueKnbU/lL/bU1rU9Y8ZjT5pPMgtRtQZ49K+LFWPy8KQMADjtivrz9o3TtUtdduNR1RD5Fw2UO3p/F/TFfF2qMkYE9n93Ga/u7htf7Ej67BVF7NOI2aQRymTOGGMfhXQN5fieNZlIF3EPu+oH/1q8/ur4NCHxzVKDUpLMreW77XB5x3r7DAVko2kOcEpXR0ch+YqwwU4waLcAMDW3a3un+KowFAhuzwT2bH5YrOntJ9OuBa3S7ZB1HbH1r1YNPWJ0xstyxJJkD2rCkXLGtN5lDmP06VT8vnNcdUEVo0+YcYrTi2qOlVwgFPJwmBXVRikjZ7GTrCoxHp/Kug+GPj7W/hr420zxh4bneK70u4SaEocHeOK528X9yxY54rn7d/IwycNzyPpXHiVfcyU2tEf1Q/8FHvEPgL9u39i/wAF/tu+F/KHibQYhperomAWWzgSEuRx95+elfy+ajqct1M12zfNIOD7DFfQvw0/aN8U+EvhbrPwehkb+ydZV0MbnITeQxxx13KP5V81alaPaXLW78BR8o9uKxjLlVkJblVRuJcV0enWpK9KydPgaT5VGa7EzRadb7Dy35VlGjFO9jds/9b8Of2xP27o5XufAXwyxEodlkmQDnHoR06V+TunaJ4t+I2ofaNsk8snLE8ZNeufC/4Eax42mPifxIGjsyQct95vwzX2TYeDP7Mtjpvhm3W3g43N/Efoe1fv+Q8PTpK1j8xzvP1Ueh8k6P8ABfT9Bt1m8UXIhP8Azz6n88/0rbuj4G0ECHS7Azt/fPP9K+mf+Fc6du8/XD559+34Vbg8B+G2G1Lcba+rjlMV8KPIWZOatI+QLnxUIhiGwQjsCg/wrm5/GQMm24sUYf3dg/wr7kl+HHh6bjywooHwY8J3PEkSnNZ/2LI1jj4rRI+DZtT8CamhXVdLdCe6sFH8qw5vh34L1yNf+Ee1FbSUdI2+Yn26ivvjUP2cvCF6vyIqZ964m7/ZY0gbjp9yYz2A/wD11jUyeXKV9esfn54l+G3jXw0DLcQl4cfLIhyMfSud0fxfrGj3Hlwu20DBV/8ACvv6T4W+PPDC7bdheQD+GTnivPfEHwu0TxMWe/tDZ3I/iXpn/dwK8KrlU47HZQzSm9JI8Ft9b8K+KuL5Ra3K4xKvAz9OK9D0PX9c8NyC11hvtNi/3JR2H615J4w+EniPwxN5mwyQdUdR2+lZmheJNc0Jglyplg6eW3OPwqYV50uh1+zhNaH2PbT2V9ELq3bdC44YD+Y7Vn6xocFxbkbeccVwPhHX7G6b7To0mxj/AKyBun4fT6V6zayRXaDaMHuK9mhKNWN5HJKDjsfGnjXwjcWcjTxrjyznIFanw1+IEmmy/wBk6k2YmOAPSvpfXvDsWoxMDH26etfI3i7wjdaNfteWy7cHPArwK9CcKl1sdlKreNj61ureOWLzP+WMwHSvD9Z0+bRtUMtt2OQelWvhl8QEubVdB1RuSduTXbeMNImSHf1B+63rXoU6iaFCEVpI63wV4kh1u1+zXrbnxgCrOtaOYw0Uo+XHFfN+k6rNoeoCRDja3rX1To2uWPiSxRydzAYxWjlFqyCb5XofNeuaO9lOZNvBrc8D69Lpl6vz4UnGK9T8T+HXnhOB244rw5rZtNvQzDHzDis/eg9DTmTjqfbul3aXNkLk854Aq+rhnBavPvAWoy32iFT0Vq7fy5NuRXu4WcWtTxa25PPZmQ/JXC6vbXEEn7s816XbTIqgN1qO90b7fGWUc4rWre3ukHmml+KZ9PmEbnaO/PpXuHhfxzYTEeftx0wa+Y/Edle2UzoBtx0rkLHxXPp8ojf1rz1jOVpSRrTwv2oI+n/ij+zr4H+KtsdV0qFba+YE706N7YGMV+fHiD4Sa58P9d/sfUYm2IcAnpgelfcPgf4nmOVI3kxt96+hdQsvAvxPsVsdeRVm24jkA5B/SnVyiliPfhoarMKkfdlsfkf4j8evo7pZaXCR5QA34xXR+GvFPhzxZF9h1hfn4G7pzX0b8RPgY+hXzWOt24a2f/UzoOoPTI7fnXzNrvwp1Lwzdefpq7kHOV5ryZ4CrSfKj0KeLptG/wCIvAuuaRC0tk5urVl42/wg+3NfrV/wSV8YWfh/wX46l1GMzPYtbvGqHBGxSemPWvzC+GvjmaylGmaou9fusrenf9K/b3/gk98KvCur/FrxBpNoyDT/ABAsXyE85VCDgfr+FcGa5fPkPTwuJitj4S+Pn/BUX9rXxP4sv9A0HXWstMspGjjhUMGUDgZO4fyr9pP+CP3xc+I3x++HWr6t40d7q40maMLOwOx9wLZGfpjr/hXvfxE/4IGfDHxX8QP+E+t71LW0vZN08GxjvAPIHIAz9K/XL4IfAf8AZ2/Zu+C1v8IfhTYDTnh2rPIRuMrjuTxj9a8WnlNWStI9WGLTdj+UX/g4m+HUej+Mvh/46VALi5spxL7kyLzn9Olfzl6RZm5nyvf9OK/pQ/4OSviBFc+PfAXge3wDFYzswHbbIuBX80Oi3bJfxxfdQkZow2HjGbjfYdZ20R9gfDEWWnwhr1OUAGfUV+h3wF8GTadoEvj6/iws58qE9MqwJH5Yr86NGu4kSK1iIV9vP5V+xH7OmtWHjr4RDwwNqT6eqsq+6A/Sv1Phf4UfA57FJtn1n+yP4l0nQfjfoZ15pf7HluIS0UbbN0mfmyOleGf8FyPihpvj/wCLE3h7QY5I7HTrHciNL5g+Q4AHYcflXLpqM+mWs80v7uWAFh2+b1GMYxXw38YINT1vwtrHinU2ednjfDSEucdMAnpWub5HSU3VijjyzMXZU2fnL4Zlu79I42PkwoANo/yK990G9WziFpZriPo1fPuh3Ih/dDjIU/pXt3heOaeRX2kKOSPYelfMfW44d3qbH0So89qcY6n31+yN8NtT+K/xj8M+A9NjZn1K6VHwM7UPGT6Vf/4LHfsJP+xn+0bYWemIW0PV7K22Mv3RdMC0gzz0Ar+hr/ghx+xIfBmiSftKfEO2C3N3mLT45R84C4KsM9Mrntxivsz/AILUfsr237Tv7I+o+J9MtEl1zwsJL6HaoLliQgHboD/9av5/424njXxfs07o/XeHMheHoc7R/ngO66Zam/kGHKny19CDjH5c0WWqL4V0WTxv4k5mf/UKfXp+n0rPhs9RutZFrqwwY3aKYf3Xh+8Px/pXi3xr8Y/21riaLpj7rKzXCAdCcc14mEpKTTR247EckNjy7xP4m1DxdrMusajIXaVzjJ4A7YrLQeYu7njtVKNVVQx/ACtOy87IWFCxPGB1r6NVYwWp8xUpzqPQuJGxTe3yKO2K9d+G3wD+I/xdvI4PBtk8wdtucYA4r6u/Zf8A2K/E/wAYPI1fXImt7IkN8wzkenUV/SJ+zt+zD4H+E+jQ2ukwIr4G71zivGxWaKL0Z9Vk3C0qyTkj8ffg/wD8EdfGviTT47nxjqi2TyLnyypPb2NfovH/AMEnNMm8E6fpNprscTWKYAZWwSO/UV+svhyGxtP3bMQBjj6V6KPsd8gEfGOgBP8A+qvnMbmcp9T9Hy3hanFWcT+Yr4y/sO/Er4OQS6xYx/brONSVaMdce3OK/OqXTtW1HW3mvojGyD7jD7vav7V/FPhK21G1kN1EJo3XG1xkY/z7V+Q37Vf7FkepWjeKPh3apHIMvIijk88j8vavOWMfcrG5ByawPxk02JdOsft7D5E/vflXHzSyeJtQMl4Mxr0HpXQePJb601ceGrqNrYwHayEYGR+VXNE0gQlYyu4H72Owrrp1rqzPnaqcHYt2Njb2MH2pmxDGM7sVzTyaj4l1P7RC++OI/KP9noDVPxjrEssqaLpL/uVO1gPSug8JadLaFHtgVbIyfb0xScUUj0XTLWyt9PfUb9PIMXGfWvOLzUZPFWptczndDH8sY+lb/j/XTfQx+HrA/MMF9veqPhzR5oUW2SP6VmkbnYaPZ21tEt7KdscQ/pgVyt7qWq+JdaaaNv3SYVU9Mf59KPGeqJZhPD8JPbeR+lavhPRXsfLeL995npxj+dZ1IpPQT2PSPDENpsLaiNiRjLfh0/WuR1G4/wCEp8ROqtugjwqL2GO9WvHmuW+n2kWj6cf30oAlx2qLwZYmzCrIuS/esHBPc1oJHpWh2a2IaW5H+jxA9uOBWFonjhLzVZYreLEBbbnp09qi+IGvrp9hB4Yt+WnOXxwQOuP0qj4V8OF1RYvlfqorKWGi+h6NLFyhsz03XI55LNbzRpWT1JPy8e1N0CGw1Pa+pfvZgOXX5P5VzHxC1qTRtJh8L23MsnLEcY7/ANKl8HXMkVtDDPy7/KB0rz6uHkdtOvzO7PTYtS8T6UNkU0d9bL0ilUEgexJ7fSq00vhvxgDpmrE5bpH0dSOflbp29Olcz4lbTDONOiYi6xny92BVTwxNPuNnqSiXnpjbtH171x1KbhrE7JOD3R69pMfjzwDLb6h8N9UeAR43wly2fxyK+xtI/bm8caBZWsHjjTRqSIADnaGXHfJzn8q+E5R9im36PfmInGYjzu9uSOlczrF/o+tXgsPFVv5LjGyZWJTj1xgCvWy7iCdE+ex3DFLE+R+xUfxF+Anxx0+LV9JlSy1JhiRG+UZ9MELXx38cP2cdYe7W/wBBXzVU+ZFLEQdp9eK+Y7zSNXktoYtHcX1sg6xsImX6Yya9F8M/FXx58PdN8+zuzNFFy8Eo3Ngdgc/0r62hxJSq/Doz5PFcK4ig9HeJh+Of2hv2o20u28C3msPbW1inkpuDKxVf9oEHtXyl4wv/ABtLdW39vatc3IuCesjlQcehYiv0y0f4y/Ar4+rFZeNoV029jUZk24GfrgV3zfsdHxeVl8JeVq2nPjaEK5UfhmvXjmcpxUebQ8WspRfLyn58fDv4IaV4p0t5Lld06jJJIIb8McV674J+CFppt8IGthHIWwGwuD+lfWkfwBu/hrcR6Y9pJbKGwcnpX054b+DekavpYmsbhZJ1GcbcdOfWh4OVTWJtQzFUrRZ4vofwjXR7SCV1TcwBVgijGPpX6E/CvQvCHinQ4LnWCEv9OUnao+9hf6V8t4/s28jtdQVpBCdu0flX2NpE9h8KfhqvjTVy3k6kCqJtGcAf59KzlQdGLsY4zH3kfgv/AMFCfipqXj3xjBoN++6LS53VF/2cEdMV+f2rWsWuJaxaGo3Rff4xxX0p+0J4ysPG37Qer6rYWvm2O0bMYG1s8/X0rxaWGC11iXUbb90NvMY7ZGOv/wBavy3M69qzsfIYualU1M8adp8P/H/9wLxt9aqWrQWwMEEfmi44J6YA5/pW4Lm0uLQQWcWC/XJ6fpSLbvEY7XTow3djn0Ga8r2jOc5yd4Lm+hhY4WEYAHFb1zpomISyUBQOfwqCQ2Op3gjiiK3K8cdBium0y2iLS2l1+4lA4Y8j8uKwrgctB/ZqbPLXzcHHlkbefai71XbFM97ANqcJ2/pV640TSdUQw310LeWJwFdfrVG8t7zSrVtMviLgBhtfsRmoouyDniX9DtpLwfacKQynAP8ALNXjomq2MaXmluBIGDOo7AVzWn6mttu0y4JiycpJ2+ldzogvoo11K2nXcCOvII+lZ1YQkrMD75/ZB/bQ8XfBK+XSZZi+mzzAlHXJB6H8Pav6tvgT+0no3jvRbK50e5WP7RsznGDntiv4ZbjVtJMki3rGGZjlSi8Z9MCvuf8AZY/aP8W+B/F2l6VJO00QdAkOSM/jzj8q/EvELgeLg69JDR/bLb67p+uRXFtcooyCP9n5e/Tj/Ir5h8f6b4i0eF4tFKsJQ22HywyMp45FcT8HPj3D45tU0eJBHK6DzFbqDkcA4r6bvtU0mysRBeg3TpwWRcFF7Cv5dnKpRxHspDc2z4Y0r4eya1czamtmttPJhZ4yPlIA/h6AV6RpD6HBdwaRb6YDZ2Yw0r4O1+/GOnpzVbxh4k8UeF7uae4t/temz/6sxcFB74zWdpur6druiNr1rmxklXygh53gdOOMfWvoKEJ1VY4a830O5174naRoBOqW12IbJv3QVh8pZf8AZ7D0r8of2pvjiNPgPibTAzwrL+9C8BecKeevOO1ew/F3xzb2um3FkytFfWnzO38GwEYwMYzX4hftJ/FubxvqKWAv1+yDKuqjaTt56Z9q/auCOGHOF7HE4ye5+0n7MX7Q2mfEnSDPrc0duIY8AYA80Y5B6Y4+tfFX7anxZ8P28EvhPw8GS3ui2ctu256frX5c/DP432vhAXWnSPIbQDCYYoQw6evfFcHqvxVufHPiSc6iXlaPo3YCv1nh/hB0qt2c1ejZaHzX+1bLeP4cTRLCIXrTY3zhcbQuD059PWvzH1ebSk082Ef+uiGGPTv6V+knj/4oQ+H9fl0+52XFrL8rAjO2vjv4ifDaDxLePrnhUD5vmKr/AIV/U3DeWP6qoo6ctxkqS5amx8ml1LGFjxUbRgJ8vatXVNHvNMuHgvojEydj3rEMrRkcZz2r0K1B09LH0dNqfvRZLDPNC48j5T7cYr0zS/E9hqUCadrZy/RX9K8vL5GRwarq7A4Na0MwUFaxtLU9b1LSbmwTdF++j67lrGUhx8nbtWXoniq80cmNPmibhlbniuviOl62PM0phDIfvIe/48V0xqxnsYuTRjAArk8H0oGB97pVu5sruxUi4jPsRyKplcxlv0rrUZI1hNtGNqH3CR0Nc3jMWe3au/03Qp9Zudp+SCEbpGbgfQVyeqJYC/kgsf8AVJwp965K0WMSxxlUZq3dTH9pWiXQ+9H8rGuUj3RyKR2rqtIZGLW7fdlPT0rECKzdLKAS5zWHfXz3MvX8KS/ke2uXtT0Wszco7Vz1q1tiuY//1/x6urbw14bhW0hVXMY2qoGAK5WfxApIjSMYHoMV0WqS+G7B2k1GUBx+NePa58WPCOlO0VpE0zr0wP8A9df2XOcYaRPwRe8veO4MovGDGPFSxWVpEfMupFQe/FfO158T/HmtyGDw9YOiNwDs/wDrU+H4dfGfxZ+9ud0SH/gNYOu3okEYRie7XniDwfpjf6TdocdhXL3fxo8D6ZjyjvYdv8iuWs/2Ztau9s+s3row685/rXUWn7OGh2z+ZdTGT2NZ+zqm3t4GFL+0Bo7ZNvb59h/+qse6+PtuvC2hP+fpXrdv8EPCNom10DfhTpPg/wCEScLbLUeyqE+1geWWfx60iUH7ZbFF/l+lakHi/wABeLGImYRntxiuovfg54YIPl26p7iuD1L4MWMS77E7NtYypz6l80WXb7wlZyoTYlZrdh91ua+aPHnwdsrmRptLi8p+px/Svb18P+K9DbMUu+NO1bsOvxzhbPWIhuPG4DFcdfCKS2O2jiFF+6fm5feFtX8M3vmgMGB6jvXrXgfx3BIUsdSPluOAT9K+qdf8DafqluZYEEqn+LoRXyx4x+GsmnXBvLKMkA9uMV4U8LUj6HrwxEZqzPeTCLqESQEMMdq4DxT4Oh1a1ztwcc1x3gjxxPocv2DVn3JnGDxivopGtNRg+2WRDxOBwK6pU+eHKyHP2buuh+cHiHQ7rwxqvmwgxqGz+VfSngXxFa+MdFGkXzjzlGVP9K6z4lfD2HVLE3NunOOeK+U9OS+8L6yHg4wcenSvMjh5QdjpuqqujsfFvhy50i/kYxnA6ds03wn4mudHmCs2BnpXvNnLp3xB0nZOQLiJen0/KvAfEvhmbSL0nyyvPFZzvSloVSqKMeU+ptK16x1izClhu21534r8N+cn2uH+HnAFeP6D4jubCUKzY9q9x0vxBHqNm3m/xDFdcKqluTypLQ1vhxcyWmnvHJwc9K9WjvugzXk9gq2S4HGeldBFqBOMCvQoaI5Z01Y7+K8UtXSWeqFAAK8phu3DA1vWd86sCOK9PD1EccoNI63xFoMWuWrTRL2r5H8WaLdaZdFAuBn0r7B0zUAEwD1rlfF/hxNTtDOsYzjrXHj6Dkro7MFieXRnxnaavdWc5w2K9j8IfE67tCFuZfl/lXlvifQZ7KVmC7efSvOHvJdPfAOW7dq+cWY1KDserUwkaqP1m8HfFPQPEunDR9fVJY2G3L8kfTiuh1T4T6IbU3OmBZ7OQZwOqZ96/Lbw74+ubSRSGCYr7a+FPxskiRLKaQGM8MD3GK+uy7MKdeKR89icHOnrE43x9+zle2rNrGhDKNzle1dZ+zN8bPGP7PPxL07X7ORojbTIJOuNucN09q+tbHVbe4tv7R0bE9sRmSHH8v8A9VYGvfCTwb8R9NfVfDoEd0g+aP7pDD2rrxeWOovd6GOHx8k0mf3VfsnfGbSPjr8FdC8eRMPs0sYJYc4bjIwa4r9pDxv4P0B7jUI1SMwDIfAHI9q/Of8A4Ib/ABx0GD4Pah8BfGEwTWNNOIIZDjeM5G38BUv/AAUr1bxn4M0C71VLaT7KN+7Zk4x68cV8hnWKlhabSWp91lOF9o1K5/Hz/wAFdfjJN8ZP2q2macyRaf5saDsBxX5j6cUjvCW7dP6V63+0p4l/4SL426jqtwT88j7T+ROfwryjQrQ39/ujOUBGTXxuW0XUnz9z08xUaZ9P+CNNuL+FL244Y4/Svrv4XeP9R8D62JLOQqDgFRx7V4H4dtJdO0KG4Zdu4DA9K77QraaS9W9K+lfp2VSlRjZHwWYSjKWp99+JvFaa/YwGMgST9QPevJPizbi1+FV9anCqsLdeBVLwZPLquo75DhbccenSux8b6Ff+PtIHhDR22XN9+6T6mvYzSs4YZ1X2PKy+nzV1BH5DeHrUXDxNFGZHmAVUUZJ7YAr+hv8A4Jl/8E7r/wCIWp2fxY+Mto1noVnIrQ2zj5pivODnGAfoa7T9jL/gm78O/hO1r4q+KA/tbWSnmrG+NsZ7Y5I/QV+6fhTVILazisrFEggiGFjjG1RxjpX8o8Ycd1K0HRpPXY/pHhrg1QlGpNaWPvn4f65pWnadBpWjgQWduiIkKAAKEBC4x+FfQqrpnijS59H1OJZLa+i8qVGHDDrj9K+E/B2rrbQKQOtfU3hbXRdQRwxvsJ4Hse1fkDrNT5pPU/S3gU6fLFaI/wA7r9vL9nzTP2cv2yvEfwy1gixgvpGvIQy4BEzMeOfSvxe+KumaVovju7tNKbNup+UjnNf2j/8AB0X+zqNV0Pwt+0loMOJ4m8m9mQYOyGMqASPUkfSv4fGNzqN6Wn3MXbj+Inpiv0bLKkY0ua5+XZ3Kaq+ztoQqMt+6BLL0wK/SD9ir9lC8+JmsReKvEMJWxQ7huH3uOnaov2W/2LfEPjrVYfEviiHytObDc9SMdMce1fv78M/h3pHgfSodB0aBIoIgMYHtXPjszWyPe4a4cnNqpUWh6n8OvAmleE9Lt9L0mNIo4gMBR0wK97ttZitIwFbGOtecxTraW/lw4GR19MVmNqyFhs59a+VxWIvufr+X5bGOqR7XZeKw9yNjda9k8Ma+JCEZq+T9NkaVvkHSva/Ckcu8E8dK85Vuh9FOhFQ0R9a2cFtqdmLcntXB+IvDfmQm1kiUKAcD1HpXWeEwuF3HgV0fiK3jd129QKio5RPCdNczjI/DP9sL9kTS/FVo3ibw/ZJBOmXO1f8A9Vfib4uh1T4dq+i3yH7S+RjphegNf2NeI/DdtqCSQSIGVxja3SvxV/bU/ZN/ttx4q8M248+PIKgYG1a3oYpny2Z5XFvmSPxk8LaXG7/aLtcu9ej6rcL4Z0o3HHnSfKqen+fpWhpuh/Y5HW8URG0+8D7dq8q1i9vvEWuNJD88UbfL6elelTxF0fNzptMseGrRrm6a7mG2Vzn5u/8AhXqmp6zY+HtCe7m+WUr8o96w9FayiQJfJxGPmxxj0rz3xHqUPi7WvsFo37uI4X0/pRzss0fCt1Nqd4brVIw27kk9h2r3NBYeHdIk8Q252LjCqfXpxXn+i+Hbi3lSN07AFh0wOayPHGvjU76PQLfmKDuDx09KHK4GNpc0+p6rLf3q5E3PJ6AV7fpF1a6Rpr61ON0cY+X6ngVx+iaIJII1iXOVC49KzvFd/byTx+F9Ol2+X94VI07aFHTtTm8Ra6+p6gGxuwuRwBXumnxRabZS+JJn2xxjAHp2Fcn4V0GS3gitbuPzFfuPzrK+KGqR2scPhvSpeM/vB/TFAIxrLU5vEmqtqd2+QWwAecDtXuOkLZaTpMutXmAIlOzPHOOK8W8MaKscKxdGJGD/APWq/wDEzWGhsIPDFs+SeXANE9TphXtsYWn6jquua8+rXDfM7cEenavpC2NraeHX1LUTh4h2GC2K8V8DaI4MKlfQV03xS16GNIvDNkcSj72P8K45U0z0aNe46XxNaeJrLy1tPmxge/8AKui8JRS6fCLO5BiiJ+WNhv8A1NYPw48N3EpQlQ4GBz0q58SfHUlhrMOi6GNiw4Ew4xkdq5KmG0ujo54s7aaw0+C6+2afMbSQHGc8f/W9KZd+KJNPmH9uWxZDwJQQePoM5/So/CtpL4xsZGlTa2MjB68dO2K5bSreXS9UktVxa4b5kB37h+NefGHJqzo9qrcp6ZY6b4U1i3ZR5bCdcBjiIjj+levfCfV/iZ8Gbv8AtXwTrzG2GCYS24YHpz6V4Vf+HPC/iRRFqkW1gPldWK4x9Khj8O6/4XtTdeENSM8Sc+Uxxx6d61oZnUg1ynBi8thU6H7EeCf28Phj4xaHQvikFhuEO0ySIMMcevGK/QD4bXnwc1zTmm8MTQbbgDDowOP8K/kz8U/FjwfOI7fxt4akuJshcxh8fXKqK+gPhr8a9A+DqQap4dt7i1+0fdQtK+3PHQ8fpX3WU8W8i5ZnwmbcFTqe/TdrH9DfiD9nLWpPFSeJtObz7cHcAvTB46U740+K7LTPhzrXhHxJb7xoFr50ZIwq+YAvHbvXxD8Nf24fiM2h+bDvmt9vLMu3av4jsKX9t/8Aah0fxn+xiG0E7L7xBJLZSXARlYmEr8vIHA+9nPbFd2Y5/SrQap7nzVbKK+Gheqfhlq0d82s3WqQLh7ieTad2PlDYGPXg1LqH22OGOAxgu/V/WuOtNUK6da2upQbjCgKSK3KkgKeMd69Lsb3RtQhjg1O4MXlg7W257cCvyur79T3j4+s/euZCQLaxq8a+Yv8Ay0xxs9PXPNZ0b/Ybotaz7hn7v3evvWkkDIJLnw5OHc/eDHHH0qzPGL3Qt8MRlvARlfujqPasaqtsTzMs3HhvzAb3TpPLeRc/Qj34rLgtZ7ixjZn8y6jYbuRggGrml69rM8D2RhRnjGNp49qnNnpMtjmaNra7Q5OzkE9vTFcknfcOZmXcW1tFff6ZBkS+/TioNU0ySNTbRsWjjT5frWvN4e1C7jjltp8XSkbhjcCPzFM1SW2mulsklNtPCP3oxnOPTpSWisQkchp8rCNNP1NRKW7Yxx9e2BXX219pscZtLFSEj+6v938e9RWlxZaU7DV2eVZQTHJt4Bx0rR0oaPc3Ehdl3lMKg9elQ4KxopM1otS06W2EFwFhlVc7yM4/IV1ngnWtNXVrbUdO1HzLqNh0BXaV6YJGP5Vzg0XAj0+fa3mrtZgcEA1hC40zQY5tGkhMbQP+7fk5x3xXJi6Sq0+SRqf0rfAD4g6l4f1PQ31+dU+2QIFlB+8T6gdOK/bk218vh+31PTYRLBPjzXyDkY/Sv5APgt8abzUfCNlYyNuv4cJDIeMY9j04r95vhD+0D4xk8I6b4S1pQ0iIpaXJIIPGOBxX8meIHC1SGI5qURM+2tR1LQtZt59LWBdOWLjk71J9c8flivkfxz4js7eK4t9Gm/ewfKF2lQcddvbpXoniHUg+hTXwlFtbR5/ej74f6elfDPjj4w3Nrps8PiS5FxFYDzYmVQpYE7Rkde9c/C+TVptQkjz6sj5n/ar+PFlZeBJrZG2zqhXdj5t+ehr+f/xDcS6mZJtemeG8Z9yMucEHnpxjivrb9rv4z3msSzajpNsiRycHac4OeuMfpXwTrHxC1HUtEW7lAn8zap7bQOPSv604MymNGgro7HSXJdDNdvp2dDps48xfvjsa5HX/AIg+J/AVh9vSItFKpErDsOg7VlvqNvqI3WoC+T83XBFch4/+JUZ0GewcqTImwkjOenbtX6Zg8JTdtDm9m2zx3WPEq6zM+pW8guPM+bceMe2KxdD1XVtOvDNYSNg9V7V4XLfXVhcmSyJVcnjtXeeGfG9nHiK7Oxuma/S8gxKpLQ7sXg4yprmR7TdLoXjuJrPV0WC5xhW9x+VfOnjDwHqnhO5IukzEeUYc8V6Jq12PMF3bsBu6Fa0dN8WrcR/2T4nUSxyDAY9vSvsHWhV+M8/CUp0dtj5s8l8B+1V2QivS/FvhKfRZTeWS+ZaycgrzXBusfUH6cV83mFBRlotD26FRTVzPWXYRkVfimyQ6nYR6cVVeI4ytQbWB4OPauGlzQ2NHFM7qz8YatYhYZCJ09CK0v+E1tMhp7IF/XOB+WK88DtwPu+9SFJX5OSBXZRxtWbtELJHunh3W7DX9Kez1LbCm4gBeD7c15Lr+nHTdQa2QbYs/IfWslLuZIfsqEpznirE+o3N7b+Vctkx9DWLxtS7Ui4LQolwoxU9tcvHKrIelZrZzTcGudV5Ena6ho0+oWn9rW4yccqK40jBK9x2PFdHpGt3mluPJb5R2PSuyu9D0zxXarfaORHcj78eP/wBX8qbVxo//0Pwpg+GyXMgk1yaSRvTBI/nXX2XgLwrY7XTTFZx0Yn/61bv/AAvr4PRSeXDdHI6fJirkXxp+Fd8u1tR2k9A2AK/sKOOwV176PwlYLE7KBbtLm90uMQ6dp0aKOg4P/stXD4h1xJPMljH+6On8qda+M/B98PN0/UIH9AWx/wDWq3IEmIdJY5d3QIwP8q6ZYqi/gsYVMLiI6SiZ83i+8gH+lwfL9Krx+ONGmTEiqrHtU1xJFK5trkcehrkLvRtKnB2LyKpYqK0bOb6u+qsdc+vWsw8y22ZHQVzmp+JNStPuwgj2rzzVdKvrUmTTZCdvQVk2fja8sn+yaou7HHP/AOqpeI0LVKJ19z8Q57VsTW+f8/Sqf/Cf6VdOY7mPZ7/5FalrcaTrdt5qKpPpWNe6BZ7NpjH1rn9ozWK1LguNJ1EZt5F57Yrnb/SLYuTJGCPasOXQ3glPkMR6dqamo31g4S45xUGk4pPQtR2E1od8P3PSsPVNDttR+VV+f+7612drfWt3Fuzz6VVuIkJ+UbW7VjVpRaN6dVxeh8meOvhsd5vbOLay/eGPwrA8E+I7rwref2fdH92xxtJ6V9hGwF9EYrwZf19a8A8ceA4Ybj7ZAnzdRivHlTcdj0o1+ZanqsKWesWhnABVl6Cvlj4l/D5Uka4s0xnnpXovgnxLcaTM1penjoM16pq1pa6xYeeq7xt7VjWhzo2pzaeh8IeG9XvPD1+su/lTg9uOlfSElppnjew+12wBdVHHX/CvLvF3g9LbdPFHsyfyrG8JeJL3w3fqLc/u84bNeely+7PU6ZR6mb4i8GXNhOZlXAB5GOlVdGvJrKQBei19XQ22l+LrXzlxuK8ivD/FvgyfRrsyQxkLWn1S2sDqpSjy+8dZp91LdbMnoua2RIyHHWuZ8LhnQL/sflXS4x+8IrqpRdjjqOz0LySZXPStK1n+dQw4rBWTnFXIrgKwyMYreDsRKWh6BY8kFeK7m3KT2wt5OmK8z0u8iOO1eq6K1pPEPWvVo1Ezy62h5H4u8JW90CY4+RXyr4v8Jtazl1X8MV+j93oT3EJdRlcV4f4v8FJMhYx15GZ5b7T3kjuwOY8lrn5x6jDdWNxuXjFbnh7xvdaZcKUkxj9K9e8VeCDHIzBMfhXgGuaFJasWiG2vkf3lCV0rH0VOrGtufevwr+OVzZXCeVMFXupPB4+lfaNjqEfiq1TxV4IlEGoIMywhvlf19Mce1fhRoniO50m6+Y4xX2J8KvjHf6ZLFcQy4IPTtX1GWcQSXuyPPzLKFFKUT9X/AIY/HnVvD3iS28R6NdPo+vadKrb143bf4SPlyD0r+l/4PftO+D/23fhHceD/AB2ID4hitmjljJGJPl+90HOBmv5JSND+MenDVNJdbfWbdPnA4V/5VrfBn48eOvgn4/ttVtpDaXOnyJ5gBOGQHDfXK5rvzihDE0tjLI81lQrKM9j4m/4KcfBZvgr+0xqGl2kBt7W7mlMa+mCB0r5X8GaU8U1nABhZvmbj0r9rP+CylzoPxt0PwR+0f4cCsNajzdFeiP5qKE/Hrnj6V+duvfDy+8K2uhayItsVza7xx+lfn+SwqQxDpW0Pqs/xcXFSj1PatE0BdQ0yK2jXOxR+ldIljJpUQyvyngdq4zwP4muQnlnjPFehNcyarqMdogyi81+lYamn7sj4Ku7nqngy0+zaUGbhnr0/wFIU8Y2E8jYVJl/SuP0m0AtVBbAwB06V0Phx0TxBZkcjzgD+Fa8Rwf1Nw6W/QeSpfWo+qP228LawPIikQ8FAuT1HfrX0L4W1KQFdjdK+OPCd2osrdCcbgP5V7/oOpiMbVf0r+D8xo8tepfuf2fltVexgl2PtLwx4jaNBESDivofwb4knCqYiDgj8K+EPDmqYKknrXv3hnXVR0Abaq9fevLq0oy3PTpyag0jN/wCCp3wdT9pL9hLxd4SgiE17bWLSW3HSRnQZH4V/DV+zD+w1PHePqfj20GLeQja3rHhcfj19q/0XfCN5put6dLpmsKJre4Xa0R6Eelfmf8ff2AtJvNYfWvhOg+f55LU/IA3OTkfXpjtXp4PE8keQ8qOSRnPnkfjL4P8ABlho9gml6dCkEEIG0Aen5V6e7wWtosaoB6kV7ZrfwH+J3hgtZX2kMfK4zEC3t2WvINc8O+J9N+W8065Tb/0yb6dwKitCUtUfZYOFOEVGxhSajCeImziixTe7SAcGuVczQzOrLtx27/8A1q6TRo7pJVWTjPb8K8jEVZdj6jCSpuOx6Pokbhg6n8K978MLIRt9a8Z8MrvuFiK9K+hfC8I88DbgVnhou6uTiJpLQ9z8MRuLcMeOlbWtX2z5z2FS6ZCkdmjDjiub8RzBOVPSvQrq+h87Ufv3MqW4WedT156VyPxA8GadrWnSfaYwVYZwO1SSaoolEee9dXLNBJZhJfmBWuT2LitC6lNSjY/nA/bS+A2oeFbl9U8OQmOGdix2jrz0r8+fDdpcWTeVdR/Oeg6Y/Sv6pvi98P8AR/G+l/2bcgcDCcdK/Cb47/Cl/h5r11eSKViTITPANdOFqrZnxmY4Llfunyn45vrfTNOTSbPH2icfP2x3rjPDPh6WzhS4KZcnJ96fFYzeINWkvbvnpjHNes6Pax2MT3Fx/wAe8S9T7dq9I8aUXHRmfq3iWz0DRGjib99OoG08bea830DQ7iYnVX+fJyak1WS38U+INx/1f8GPavQtJ0u4sJ18n/UAc/TFAGhPqn/CP6G2rD5Sy4QenavIPDbvqOsSaher87fMx/lWn401u61nVRpulENbRce2fpXZeEtNiuiLOVBHLtxu7HHP4UAeqaVqMfh3RptVmfKbeFPqeBg14HbRtruryaxcg5Zvw9q6H4ga2kc0PhqJuE6lTkNjn8Olbng+OOG0SK4iDiXAwO1AHQWBi020a9vxtSNeMfpXkmn2v/CVeI5L6Vzlmwue1dr8TdchsFi0HRzuJA3im+DdNh8tBcKUbrkUCUEev6AknhfT5brUxtSNTtbHoOK+dHubrxH4ml1djncf07V6l8VPE19ZeHYfDsDqzSEexxkdvwrkfBUUMcsRuI87sA8YqeRHVDTY+i/BWpWfhzw3cXWpRfdQlSemR0r5is5h4m8RXOsyJkSHoOMHpXq/xW8QppWjQ6FD8wnOTjjA9KyfhroEd7cRz4xtxxjrScVY9Glqj2nSkHhXwg96QAQhx/KvAPC7Tarrh1AHa8r8k84Fei/GPW18Pacmi2zZ845Iz+lUvhjZwvAJZlHbivOr0kzeO53+szWvh+2S41CRXhbjPT9K524mM0C31lK8Cdmj5rhvjRe/a7630SzbaqnkCnW+var4S0C2ht/nOcYI61yvDSRpPFcuiO5t5viDPKJdOljvIeOJAi4/DnNeiad4p8SWupQw3mniYDglVzt47fKa8y8F+MPC3im8NldW/wBmvo/vHsPx4FfRvhtNMvtQS0tdbmhbIAWJA39a8+tGWwUqiPqbwBpz6/pH2W9sftUVyu0wsCgPHA+XHQ185/t3fE/RvEHi/TPhb4ahjg0fRI1McaP8qSMoEnHAJB4r7K13XNO+D/wcm8bPd+bLbxnyXcYZm+707da/FVLy18T6zPrXiHfcG8kaSNz0HmfMQfpSoy9lsfmnHOdN/uosz7+wn8NT/aLYLcLcD5MkADj8au6TcRyW7wSHbcYBDLyPoPwqaGKxt7ybTbmNREBiNnbHX0qrH4T8vQnNrP8AvY33RbOc+35U6eurPzOCvuQMbC5km82J7a9iHyyKM5/l2rX0++vI9DSSCdmYZyCuM8cVnx6nfDShqEfyXMPDgjqOnX/61a9rMdR0ZNTgmVWXOYjjnsayricUWNGtLae0W+1STZIxIJX9K3vD2i3sd3Lbu4kRwdrN3GPSuaOnWH9jC8t5vNDkAjptORWyYojZrtuXjnthnAXII9M5GOK4jI0I7W2sJZdP1F2gGNyTDnkc4qW+DPaw6pBEt3KCAz4wSvTpz2pmmahaazYfYdX2qrEYcnpz06VDcO3hfX10UlmiK70ZBuU8dKTAlSaymMtnqUX7puVjx93HPWuasPDOm6ZqP2uykEryncAx2kf7OOa6vak98brOVxn5vlwe3FVL6A6hZrcxwhbpJRl1/u544rLmYF+6zIkcsQP2hXw2OAp9KW9lvrW4cX8f8IKyKAfpVv7bJbaNNLZeXK+SHR+Du6ZrM07WrqeAS3Nt5csa4YYJXA75x/StqVNPctSYzRfEGr6ZEdaG7duxvXtjpgCvuDwH+3N4o8J6Vb6BcXxgkhQFJcfN6bfyr4PtL+9KPp8WEVnMoPqD2x2rmL86Jr2oGC5k8u5g/h9a8vNcip11aRqfsxH+3p4q8S2cdvc3rOy8M+OGTHTGMD6180fGf9ovTvEkZvfDUzTXMI2yIf4geNv+RX5yw+IvF/h/UJIrQb4G4A9vyrLvtcn0rU01ATY+0dcdF4rz8s4Vo0Zc1jKVGPY1fH93qupas8tuBHBLGHdGOdpJ6CvB5rq5tLmZI1AhX7o7Ht0r1DVtemvNOklvVwwP3gfvL/SvIdRvNLMcclnvkaQ424wFP1/+tX3mEgopRidNKKcbHG6hJMl201unl5++AeP5V5F4wSN1KqdyDt6V6fql232h7WX5XxzjnNeP6xHh5Nu4j3FfUYHoVyo8kvrQtlR0Fc3cL5TYAx716VNArqQtcvqWnMnzAbhX02GrW2NvaN6MoabrU9tiJm3L6GuwjvI7iMeWdwPWvNZbfa2VHSp7O/kspAV4Fe5DFS5bXLlFNWZ67p13qNqfKAM1seqH09q1b3wZomtp52iusUneNv1rN0jV9Nu7dSrbWHpVu6Kowe2OG7dq68Nir2jM5HhpQvLoeaa54evtIujBL0HfHFYa2odC45Ir6D0bXNL18LoXiKNQW+UP06f/AKqreIvhXqfhmX7daoLqykGQ6en69K73gOZXpHHHM+V2qHz4FTB3cEV6f4GvfDdlAx1wBq4rUbJVuG8scVlbEiHz8ntXBhq8sPKXMtT17KcFKDNPxHdWl9q0k+mLshPQCsYQszbl/KpA/HyrxU3mFONtc8qntdRWkkUPIkZsAU77NIOvArWh4T3pxJYbTWSopbsuG12Zirt966HTLbVon+1WAIY9x0qvp9mb64SCP5izBdoHavuT9nv4PXXxS+J+j/DLSoTsmyWI/h+U1hOdmctStbRH/9H75X/giN+wVPIGTw9Cv0iX/HFY+s/8EHP2E9XjKxaaLb3WJOK/YfYFXCkU5Wxwf0r42XEWJmrwlY/Qf7FoPTlP52fH/wDwbu/BW/LzfDHX7iwZR8gVY0x/kV+efxc/4IxftffBaOXUPh7qjatax/MqSSDkdMcAmv7PYpEVeRmtK3ZHO1xlT2ODj9K7MDxxjcO1abPOxHCtB7o/zn/FF/8AG74Q37aL8Y/Dt1b7ODKsZI49DgV0ek+LdC8QW8cukTpucDKscMPbFf3x/FT9m74PfF7SJdM8b6Pb3pnBUvJGCwB9MY6V/OR+2N/wQtn0cT/ET9nC5NvIhZ/sudinbzxyf5V+m8MeLFp2xT0Pg894E5rumj8V7uWcNgqUAOD6Vy1/p9rqAaN0HPeqWr6n4x+HHiOb4dfGbT5bC+g4E0iHaecYDcZ/KtqeARfvLUhwRuBU8YNfv2U57h8ZSVSkz8jzPKKmGnyyR520V94cuPMgyE9K77S9cXV4AoIDCsyaZbg7J1yfSuI1CKfR7pb+04UcnFesqqOONDU9OnQqf3lZciCT5WANRaX4h0/W7VSGCyrwR1/wq8YWUhjWvPEK0Vc5a6sXtW8+2OCKuWOoi7j+yXRwx6H6V0zW6Sx8/lXn2uWptpxJGOnpxXPObvYhG68txppxcjKHoRVDVbe31OAGPqKrWGvecnkXZHHHNaC2HlKbmy5HcVEqaZ0RdtjwbxJ4f+zTGZVxitHwr4ge0xaynjpg161eaZbasuMgMOoxXlur+GpLGUyqu3HSuGpRsbLEGl4o8Px6nF59uN24flXzb4k8NtYOWVcZr6V8M6vt/wBBu+c8elWPE3he0uogQM7uc4rCWH00PQpV11Pmfwh4kn0a5xuIXOMV9MWa2HjGx8qYAnb/AEr581zwpPYzfaI02qD6V0XhLVbrTZg6kj+nHpVYdNRtIyq1ve906afw8mh6mbdFwNtMa0ONgrutbvIL6e3lQZZoxWDcKIyQB0rS1loVzt7nLvGIzhj+lV/MQNtrbktxJWNcW4Q+hrE0547FuG4EQyvFdhoevCGRRurz5WA461W814mDx8VpTqcrM3SifYWgeI7eaMQyHjFbuoaJFqEAePBWvkvSvE1zaMCTgV7T4Y8coypHM3617FHFJ6HFXps5jxX4JjZWTy8/hXyr4u8CBXdPL4r9Nlj0zXYAqEbiK8g8afDhmSSWJQRjtXBj8EqmyLw2LlS0PyP8UeEpbaUywJjFchpuuXujXIVm27T0r7v8V+BSqN5keMV8oeM/Aojdri3XDCvjMZg6tOXu7H1mCxkKsbTPcfhf8Y7zSJ4jZzcoR7fnX6G2N94Z+NmkCe1KRapFH16ByB07Y4r8JrW/vtBufM/hB5FfVnwm+MV1pVzFPDJ5ZVh8ufSvRy3N1f2UzDMsobSnTP0f8ZHUdZ/ZS1n4b64nmXWkalY/Zyf4Y15baPet258PSeLvgjoWozp/x62yxgkds5/pWh4F8X6D8WPCl5ZIUW9NuWYdAzRxtiuj0XXZrj4QWXgm3jK3dnFiQY4+XNfQ5Xl8VKVRHkZriZckab6HyjY6PFYZuRgIuf0Fev8Aw90wNbPq065D/dryW3tdUvtRXw2yYBf5mA9+mPwr6Z0a3trRotIsxxDx+npXrYbDLmTZ49TEa2L1zdR2Ntk8ZqTwtc+Zfxf9dQQa53xde4u108Dhepp2jXkcLxvD/CRV55rRkvI2yebWIR+vmh6h5OnWcynAEK/yr0fw94nuJZN2QAOMV83eF9SeTwxYzb+sQrsdJ1AwyCVW5FfwnntH/aprzP7QyiPNRpy8j7k8NeICQsUp4r3rw7qMUjfujketfCfhvxG7hSzYFfS/g3xFH5cUSt9ffivIq00tj2kuh+gvwz1JvtMe9uB/hVb4jeP7/wANeK0ktpAint68Vw/w61ASYPT/APVXAftGpdpaHUI/vRLkHp6V5VSdnc7csppy5T0zUvj3pgu0WTy23j5lIH/1q3LXxZ8OPFsQ+22MEm77wxX4tXPxXubvXvsly3ypnPPtXrXhP4i/ZUDQSbfpXfQx6sfWPKIcnMfon40/ZM+A3xPtjeaXbpp10Rw0K45/MV8G/E79izx54At21DSkN/aqc7lPzbc4HAzX0r8PvjeY4UhvW9gc/wBMV9eeHfijpVxY7YWWbcOVfkUVqilscvs509j8RfDWlXlhdeRcxNHIpwUcYxX0J4esFRxt5PsK++vE3w0+HPxCZrkQLbzn+KMd/wBK8M1f4Kal4Tk3WWZIRyCPT6VyRqJbGFbFvsYsKGO0XdwAK8+1rdOrHtXc3LyxJ9nkBBAxj6Vwd4XRdjDGarmbOXmTPLb6JhcZBxitpLyWWEJ0xxVfUU8ubPas+SfyxheK1lsddPYm1O2s5IQsrc+tfF/7THwQsPid4Rm8mHN3CCR2yPWvquW78yTD84PT6Vl6jdSXG50wW6e23+7ivLnLld0cuJoRlFto/mG1PwXq3gXWZNIliKyo+3B9AaxPHuoiHS4tGhbZM7ZcD0Pav1+/aq+A0GrWM3jvw5CftNum+RFHuB/WvxYmh1e78SSSalE2B2IwRjtXsYbFKS1Picdhmnck8L6LJbsZH4OMLxXfa9q8/h/QPs83+ulGAB1x9PpXRaLBZzgXPyhIRk59q8a8Sa2/iPxIfK4SNtqY6cf/AFq7Dzix4P0hZw1w6Y5J546+1eoyTx+F9Gk1idQdi/Jkdc/L/WrPgm1tr3Fq0QZF+83SvP8A4peIVvNXHh+3O63h44oA4rRZG1XVTd3a4WQ5GfSvoHTNNj0exfWtwSKJT157YFcL4b0nTpIoBMu08Dj9KtfFHU5tDsYvDsRz5vXB7fSgaOAit5fFOvPqcbbsn/61fQnhRDp8Ty38YKQg9uuBXjXgvSxHHE1r+7k9D0OP5V6Z4911tN0BbODEVxKONpyT+npQa8qPINb1KDxZ4wknY7VT7i+navonwPpSrbj+1YwY0GQwHYCvA/BOlXRKzXUQYscE/wAVe+eJNd/4RLwOzJw0n7vB4IB4zSZpHdHi2t6jNr/i2UAhraJ9qfhX1V4G8NxW+nLeMvlnGa+Tfh3DHqmpJnqz/wAXA5r7A8aam/gnwQ8s/JZdiFOfasXJ2O+GmiPljxrND4i8aSrK+9YWKgevpXrXg+yfSELzjCom76V4j4P09tQuRqLPuaVsnPBFe9+I9Q/sjwLM10Ak02Y0JOM1z7s3PEryK98TeMprq1O5AcKOtdH4iuDDcLBMOYEwQOxp3ww0C9tYW1xireSu5ua5XxHqkralJORzcucfT0rab0OWstdDr/A+mLdiS9njUg+v9cV9m/AP4esLiXWo5GWBDuII4wPTNfM3gzRc2EEeltiSYjIbgV+gPgPSXsbm1XVLpotO0yNLi7Kcq4/uEcY5x/hXiVXqRi6nsqV0cR+2x4rbwz4Z8O+ErdluIXnaSeNT8wXA2Ar2z1/Cvh/R9P0OOEwajLiEZKpjH3jn9Kj+MPxA1L4tfEzUfFzKYYlb7PCq8qUiJVH6DqMcdqoaXNcW0Uaa7bq5XnJ6FcfT0rnnTTPwvO67q17sl8QWsF1OtjZW6XFtGu5JV+8OOmKxrDVbKy0n7LEskU6tkAjg+35V1QuNFksxeeGwhQuQ4X76celZ1tcWP2pIdYB+U8Z4z+FRB8qszgWmwz7ba6zorWUyCOWTaC2cdxVXVbaXws1npaxxy787XB46dxitzVdFtpbk3Gmuoikxx6YrmYNeXQ9bNtq9uZrZ+Bxu2jHauatJ3A2rKw0nVS1vcSeTKuCyx8px+Vbiz6bYTtaSScsMbiOKwb17LQbyPULPD2Vz0C/eGfb2rbtrfTdQlaC7XNo2PLYfeB7ZFczIcUZUFlbTafd2OSFzyR1x2wPrityzs7u902DTbS7MjwKCpbGSB1H5Vn29jLpGsTJPIhGzauTgHPH6VWsdKurSN9ZedR5B6KeSPpWakZF+0MmoiSKWT51fZkdR26VTtY9TFjPdhmVbRtrcfeUfxe30qbTXsY71tUs9wW7XduI4B9MVb1y5/s2KO6BDxTjZLFnqDwf0q+RAXLKzsZUXU3m3C4TdE0fzc+/pVX+09ZtdWH9ms8myP95FIuEI7/pUXh6/tntpdI0m1WFI+ImA6V1VrJNq9qtrdSKlxny5GXpjtzVx0A4fU21K6vY3uIjBKTuCIMgR/pWN4i8NQazq8Nxp37qYDk9AcD9K7iXULa11E6XfuySxfuxIRlWHYZ7Vj30pvJEW2DR+XJtk3enYj1pqUehakcab+9sJjZzxZKjaD69q5/8AsNbeG4OrDPnD5F/uen+eK7vWJdA1m5+zxT+VcQ8c8CuLvtD1FW2NIWf65GBXRRinua88djzm40vUEmbTL590O35XX/Cudu3i0+2fTtOTzCO54rsdTunsrdEXJdXIYtwMVyF69xFvaMoTIOMV6ENGPmstDzDUVWM/aMfOfvmvM/EUsQYrG3Ufd9a9JME0uoSi44Q9sVyGu22nmb5FJI74r2sPXsa03dHmEMDmAy927elZEpKhlkrtJrKfG6AcHt6VnTaUdweXjA/pXr0MSVsed3NrG2Hj4z2rnri0dZM16NJZCNSlZVzZgxkYr16OMVh+2RxsdzcWrAwfLiuqtfEbugim496yLm02KT6VkSooXgc1306qe51e3dSPKtj0+GL7am9enqK9f8GfEK/8PW66Rd/6VZnhg3UD26183aLrM2nkLKcpXq2k3dvfxiS3II717mCx7pax6Hj5lgFWXKj0j4hfDfTtdsF8SeCsMjDc6DqPwr5cksHDlJRgqcHPFfQWj6vqXhTUhNaufIlOJFPPB44r27w/8BrPx/4otdWtnEWnTEM7Yx9cc1WdZpSlT9otzx8PiZ4Z+zZ8s2HwR+Iep+G/+Eo02xMtqem3OSPbivPLnSr2zn+zXsLwuo5Djb/PFf0Q2+geEvB+h22naBcP9mt1Ee1UB5x1PPfpXOv8D/hF8R2OneN9OVJLnlLuNAWUdenAr81XFMOe0j1Keb3Wp/PqibSCvzD27VE/zNwcV+0Xxx/4JWeOfB+lDxb8MLwazpsqeYsMxVZ1U9MRoCR+dfn1pn7Knxt1HVk0h/DGoI0rbcm3cLx6NgDtXdHijCSV3PY7IY6HKec/C/QXvr2a9K4EPK57/Sv6Bv8Agn78LtF+DmiSfHXxiA15Oq/Y06n7wz/47kdK8q/Z3/4JZ/FvxVpMOo+I4BpGm2+GYv8ALLxzgA4r9Kf+FSaDpfg8eFtGKvNYAR5Y4K4wN3tnpXzebcf0IO0Dx6+Iu/dP/9L+mYnbS5wu7FRqj+djsKuiPzIyoGK/Mudn61zMrRqZG64rXtlKkYqhFE0b4rZtYTuBNRLXczkjUtEbeCWx9K6doYrqPy7hFKEdxWNbxHAxXUwYWMblzU8iehk3dWPyw/br/wCCaPwv/as8JTT/AGWK11mONjBdRqA+76jGK/jD+L3wc+J/7IvxFm+F/wATIHe1Ulbe6cH5h256frX+kjEvn4SEDIPpxx/9avzK/wCCjX7Cng79rb4WXNulqq6vaK7wy4A+YcgZGPSvuOEOMKuCqxpyfunxee8PqumfxAzx7wlwvKOMg4rKu7NZ4vKkOV+lWrvwz4q+D3ja9+D3xEUx3lg7Im7PKg8dqW5Rra4aIjcPT+Vf1nkeb08ZR9pA/Ac4wdTC1vZs8BuJLjwrrjYyqsw2+mP/ANVe0xeKInEU0h/dSADNcZ8QNIa5sjeAfNGODj8K5nw3dNd6LJZzDJjXK16M6rTOaNNSWp9CwGOXDwuGX2rH1ux8wb15GOa8f8NeNH05/sl70DY+levz6h59sl1ZjzYSPmx/hXVCae5n7Gx5ndWf2eQt/wDWq7p2u3NkwiJG2t+S1h1QEREBv7p4rktR0h7Zj8p4rVEPY9CW1t75Bd2XDd6S5sIbqHy7hfm7VwWlavcWPyjgDtXpNvqNrdwKxwGrRwTMDyTWfD5tpfOgXp6Vq6HqRuYv7PvBnPA/CvQ720+0x4UZFcTeaT9ll82H7w9ql0o2NY1GtDI1LSI3bZcx/Kelea3OgTWN2/lr8vavfbJ7e7X7Be8seFNU9T8OvB+7ZMsB+lcyom6qJHmdvvKRlxnAxVm5tvNcgHFX5rKS1RGYcZqZ0+bPtWdWjYpVjlJ7doeAf0qn9mWYfMK6S6g38jjFUIoSMjFczgraGkZanL3Fjscbay5rZl/Cu9nhQ4BrHnt8N0zXO4ysdSqHGsJV+7Vy11eaxkUv0FWbqBlyw4rJnRW6iojUcdi2u57X4Y+Iv2Uhmfp2r3zRfG+na3AIbjbyOa+CFeSGT5enpXVaZ4ju7HGOAK9XC5n0mjjr4Tm2PsPxJ4Bs9as2msQrcdBXxJ43+HN5aXEplQqi/wCz+FfRfhP4rPZbI7hht7/lXs7nwf8AEmx2yOscpGBx3/StcVCnWTSJwsnTsfi1428EIiGW2TBHtXiEcl1pF1tjONp+nSv1U+Lnwb1Xw6WmeDfC7cEdMV8KeO/BSwl5rOL5h6dK/OsyyqVGfNBH2GCzCMkos9B+EXxgvdEuonjl2NnBAOMj06V+y3wG8VeEvidYmAFYr8DpnrgdO1fzcWs9xplzuA2sp/Kvsb4HfGrUfDWpxXcUpSRHU8HHSvdyDPYxfsqhy5zkvND2kD9atf0PT/CevXkl7EIZV3OoPoBWN8NA2sxXOs9mJKHr7Yq/4iTUvj3pVt4h8PMJbl4glwBxgYr0r4eeEbnwZoS6RNbn5RzkV+mYCEJapn53iFUg7tHnsfgnU9avZrhlyD04rH1rwlqGhKJUjYAYzxX2HpN5ZaeV+0KiAjJ4rX1fU/AOpWf2adkLEY7VvnGBpKg5X6HTl2Il7Re6WPAd+8ng6y38ERiu/wBMvmVxzXkHh27ghg+y2zhooztUiu3s7lVI5r+CuIqTji6na5/bnDdR/Vafoe/+HtRO8RswGK+gfCmtmLy9hHBr4102+kjbcnfivZfDGutEAP4hivmq59NSgmfqX8KNcaSWOEt1Ir1b48+GzrPhkzQjP7vaRXw18NPHz6dcpO7bdtfUHin4jHUfBEupNNhVU8V4lddDroU3B3ifh74xgm0Hxld2RGMMQD+NaWj+Ip7MKd/A7Vd8f6lZ6vrc16V+dmJzXnbSIrYTisVBJaH3FJfukz6k8N+OJJYVTcFYdPwr6C8L/Eu5s4wolwT2r88rbWPL2qGxj0r1DRfFaRGIMcfjTjVktCZK5+q3gj4oCPaM8+pP9MV9JaV4vtNSiCyMpyOc1+RmiePbW0AJlr3bwj8X7KL5WnBA7VcUeZiKB946l4H0DxKGC7UOOor588Z/B/WtPT7Rp371R29K6Hwl8ZNLmPllgc+le36f408P60u122YHfpXQeJVo8ux+ZPiFb3TLry7xDGV9a4mTXkuHMKkHH9Pwr9MfGvw58MeMIGMqBWxwyivhv4k/s6+K9Hc6h4bbzIT/AA55/Km56G1Ko7Hgd1qoS5/cndV+C5jlyU5wOlcFcWOu6DcNDqtpLC4OMyLgfhWzZ6hlme3YYA5rjqOLR20+RrU0bn7Nfq8MyhlYEMD0xX5Z/tS/s4Cxvz4w8IplJ+WCLjv0xX6m2tzACCNrlu1ZutaFZ67ZyWt1GCsg27fSuehPkaseZjsHCSdkfzU+Pr+XQdPGj2y+VLL8r46iuP8ACtkLRUa4H44r7l/as/Zy1Twd4nXWbKEyWUxyGA4z6fhXzjpmkwPKsAABiXLe2BX01Cpzq6PhK1Llm0i1NOfCuhS6hAwUzrhR0ry3w5pcuoSyXl6Q5YhtxHqelUvGGv8A9r61/ZwZhbxfKoHSvQ/CunvCkf2ZPMAABFamSO60nSrDS9Nm1SbAhUfqOn64r53mmm8S+J5LstvH8Oewr1/4meLI4dIj8NadgO/38dq4bwnosLeU8o2M/FBryo9h8Kabbxx5vFAyOPbFeKeM5ZPEnihrSBh5VucAr1r2vxJfR+EfC8krYaVgFTPHUgfyrwzwcrzXjXd0mC7/AHvrSZR7N4KsprFkgcblOOcciuW+LPiA6jq6aHbIHjixvr3jSzptloUupS4Xy1ODjvjivmKytL7Vdekv2w3nN+lZczKhuj1HwBoNrLCvkqPftz2rN+Lms6nHcW3hqCYvsI3KTgYHP9K9e0LT7Wy0l7uYbTEOMcdBXzPqE1v438XG4ebaYz1P8qk7j1n4faRaXkeCoVi2FNZHxo1JJ9StfCf3kiCkgeteneEdAm0q2Ms4zEg3qw6Dj1r53uI7/wAReOZrkguvmdfQDpSjBDc2duWbw74RWK2k2SXBKYxjjFee2XkarqsdnPz5Kjn3r0L4iarbT/Z9OsgoS2UFz3z6VyngbTTcX0t2B948H0GKdWcIrUx5m2fUnw78MXN3rlmnymJCrH0Ar658Xtp+lfBS8KSmC616SS0hxwcr2HrwM186fDDSp4rR3TPmXP7uL6j0ryn/AIKIeOfE2l6v4d8B+Cy8T6RFDenbx+9dDuGK8SkueTPJ4pxXJRSPnXV4tZ8Hsmn3sjpLG+1o34yuMZ/rXWazqd1odtbXN7GZrdcE454IqkvjO1+Kvw/g1TxZH5eu58pyByVHftWn5Cto5eMs8UaKrB+gxgVFXTY/HcRBXuRS2OnXlqms+GpVtBcHLqxwM/0/KnJbTRzNZawBI7rlHHIrNmitlaHSJNptrjlW7KRz/Su2s5NQl/0DSliuDCNoI56e1cdRXVzkKdhqX9n2jaTdQRCT+A9z9K6qG80m+0lrbVYwH/hKdeOlYep3lprUcANrs1C04kwPX5ePzqrpEmi6fdPp+rM0ch5BPT8K4veb1AivdNa6szd3GIDbcgDuK09PJ0SL+39LYTxXC4K/eIPTpUN/r+mfb1toZI5rdeCufmGeOnf9Ko22pQ28lxo+nQOGc7kZV4wvzYHpwKirpohPY3o7G0mSFvER8trhgI2HQZ9fSuRvLOxjv7zTFmMb27ZB/hYe34Vsxa9BqafY9ajICDKgdFPbP41XTVNOAFtqseFY4SYDHPbNYmBpP4e8Wano0M3hgxmM4yCfTtjHFZ2mql7qEuh+KYikoUhWH3QcV0GkWmo6QHl02+WRw24w7v4fYVi+LdWm1i9tptJwj7gJQatSYCJCumQHTROAV6MpweOelXFuUv7dbDzfsrx/MGX+L61j67/YIzqVs+7Z8j7efmA5FJYeVrVsGtEJRk2s3TbWj2A3J7W8mi/s9me5aP5weCD/APqp2nXRuoZ7AKWmjUHB6rXPWyyadK1ms8m6Nfkx3/yKksr6SC6lbTGDTlBu5/T2rAT2MPV7eG5gN9awZu4/ldPp3rDv7q6k08S3bmFjwO3Sui19o7ecarZSkSFB5i+jdxWQL618T6d9m1YoiJ93B+bj8sV3YaTNqUEYmow6dqWj75hu+UD8j1rhf7I0u604+R/rI+/TFdtqMUVnZLbjJVehA7Vxk09nGzwwgp5nrXpos8uvGhmBtZZACvce1cde6Rch1uLc/u++a9Nvre3jzDFCCT/FWetnPfp5N2iqq9COK6Y1Utioux45e6bcxXHmScA9hVO4s1eA+d8vSvTdR0x5SyIQyJXL3Vk8qDgcdq9GhWVjRyVjgJ7CFhmHnFZUtg2dpFelCwS3GXUKuPT8qjj0ljELlhnd0HpXXGvbY5nBWPKZNIaQHI/DFcxeaNLG3zJt9K+hH0ozLtjXb6VnHRTKHjuVAIHBPFdEMwkuoUqrhsfOk+nzRt8oyPpVjSrq50mcNzj0r3ePw3A1v9llT5uxAzms+Pwtpryss0ZBX2r1aOaOxv8AWraoteHbmPWLu2hlI2uwBz0r9MfhjrGhf2QPCIgXz4MFG/g9etfAngzStItrsW84KDqCOMV9T+G9Xfw+Ei8pZomYESfxV4eY4yUnoz53Fw5ndH21pGs6bpOjvPFZ+bN0kUDjA9K3vBl8Lq6Ot6G6TW+BvtpeGQ+w74/CvnTSvEbzPHe/aDCFflc8EdORXpel6isOqG6QKhc5LR9P0r47G4PnvynnxoW2P2q/Z38RSeJtES31rS4CwG2Kb/lpgDgdq+19O0mKHTLez1S3ijd3PkTcYUgZw3pwK/CD4e/GvWvA9z9rtroFiMojHAGB6V91fDT9q6w8c3fk+J5I4BsAVG+VS474r8zzXhjFud6J3UKbPui61q+0QvD4+jEmnr/qpLcBk+rYxivhL4iadFZeKb3dCLQTsD8x2h425TZ6+tewaj+0hdJDJ4PstNivYU5LAbodp/vGvL/Euqah8Q9WTX9atRKYlCxx2w3RoANo9Nvy8V6WTcIVFrjHodnson//0/6dA6j+Gr1tGvWs2ta2+7X5TzM/XuREohUNurWgjULn0rOrUg/1dHMw5EbdnEpIrTWbbKI1FUbLqP8AParH/L0KOZnNOC5WaavhfLHG4dqjuY45oim3A24pR94fSnN9w/SpqTapux4cps/j/wD+C+vwM8H+Fda0b4x+Hl+y6jcOUlCKAHx6kf4V+HFpdm8soZpB85jUk+uRX9GH/Bwr/wAk90H/AK7NX84ek/8AINh/64x/yr+pfB6tKWCfN2PxnjKnH2jdhNWjFzp8sTdCteK+DpNuqTQY+UZWvbr3/jzk/wB014Z4Q/5DU/8AvGv1GpNnwVKXQ47xSfsWvSpF2r0LwZ4mv7MJCvzA8c9Oled+Nf8AkYZfwrofDH+sj+v9KuhUdzolse8azaJLZjUrc+U4APH+RWZo+pvqsDx3i7vLwAa3tQ/5AR+g/pXG+FvuTfUV6POzhHaxYRRSbo+KyIL+S0bYBn9K6XXPvCuLk/1lV7WRPIj03StTlmjAI4rfuLaOSDzehFcZon+rWu7f/jzP4U/asORHITWsW5cfeU5zXb6ZM19bMLr5sDH5VyM3366jQP8AUP8AQ041XcORHHeJdOhit0dO5rknwea73xT/AMekX1rgm+7UVpuw1FFOVRtzVQKoHSrsv+rNU68j2si+ZkE6blzVNYlJwavy/wCrNVU+9S9oxxkzNubaMrk1jyWsA7dK6C5/1dY8veoOqNR3sY9xZQ7SwGKwZ4c/uwcV1M3+qNc7L/rapyO6DtoioYzDHuB6fhW1oniPVNNuEW1kIAOcZ9KyZ/8AUmq9l/x8r+P8q2oza0Ry14pxPtb4ceNb3xdF/YPiKJbmGf5fm7DH09q+Xv2hPhro/hPWpbXTWIiI3BMYxn8a9s+Cn/IWt/8Ae/oa5n9qz/kYJP8ArmK0rv3H6GeAf7xI/JjxhpcFvdLNB8uSeK5KxvLm2cyxNgjHSvQPGv30+przaDo34V+b1ny1U0fokfgsfdHwE+Pfj3wXOG0m4bB42k8dPTFfoMP2n/HOpaQHuY03beo4/pX5G/DL/WJ/ntX27p3/ACBR/uiv0TJ8VU9m9T5vMcNTvsbvin9oTx0Z2cydgBg9OfpXBt8Z/GU48zziPxrhPFH+sP4Vz8X+qqMxxtX2Enfoc+EpR9pFWP1p+Aevahd+CY7m6cu0pyc19N6beOyg18lfs9/8iDbf57V9UaV9wf57V/LHEbvNtn9YcOQSw8Uj1zRZXwuK9R0a5dGDY5NeVaH0SvTNK/gr5OvFcrZ9LSVnoexWmrXMCLs4BH8q9Hm8T6nN4HksWb5HFeSRf6tPp/Su4/5lQ/Q187Jnow3PjPWJpftkxz904/WsTzy/ykcVrax/x9XH1/rWEn3qx5mfQwqyskTKo3g1owyP5igHGKoJ96rlv/rRSRq5s6WK+uC4VTjj+Vb2ha3exXfytXKW/wDrR9D/ACrT0f8A4+63Oec3Y+oPBfiC/Ew5/wA4r3rS/GOo2sZYD06HFfNPgz/XL9P6V7Rbf6n8qrmZ5lTVHrtp8XvE+n3SWqHcvoT/APWr3/wt8Sb/AFtI1u7aPnj/ADxXxVJ/yEk+n9K+jPh90iqZydjiTtoe7a54V8L+LbZ4tWsUfaBycHv244r5c+If7O3guJGn05ntjjPyD/69fYFp9yb6L/MV598Qf+PZv92vK9oyoyaWh+aGt+F4/DmLe3maQE/xD0rE06SRpxk9DXo3j3/j4T6mvN9M/wBf+Ipwd3YJVHysi8Z+D9E8d6TdeHdciDRGI7TjlW65H5V+DPxs8LWnw+1C90PSWyiEgNjDdfxr+g9f+Pq4/wCubfyNfgx+1V/yNl/9T/OvewcmrJHx2L+I+KPDunxO32iQ7sscA9q9t8JubTzr1efkOF9OK8h8N/6gf7x/lXrfh/8A48Zf90/yr3ORHHyo8ElvZtT8SzSXJyQ+K9/8JWcMt2m8fcxivnSz/wCRhn/3/wCtfSvg3/j7/AUciKOS+KN095q0emS/cjOa3PCei2RWKCVdyt+HTmuZ+I3/ACNFd74U/wBZb/57UciAi+JF3caVo40S0bEcmMn8RWb8P9OiQRgdCOatfFv70X4VN4B/5Zf57VEqUbFQ3R7ZrmiJD4UmSOTBZeuPWvCPB/hKzZlkmKsxYrnZg/zr6U8Q/wDIsv8A7grxjwh0T/frLkR3HoOuS3Xh3wDcG0kyGBTBFeAfDHcmotdyHeyrv9jz6V7949/5J/N/vGvAfhv/AK6X/rjVTglG6A5TxVqLahfzXDIF8yZsAdhjpXoPgq3WCwSIfXPT8K8s1r/XH/rsa9b8Jf8AHsn0/pXi4t3TbHTguZH6GfBDRrN/E2iRTDciyJLj/e4x+FfCnxx8R3Pi/wCI+uXWrIGeK5ltUPosLED/APVX6A/A/wD5GnRv+2X8xX5t/Ef/AJH/AF//ALCd3/6HXm4Oo1F2PlOMNdDlF8P2cAttSiyrbduB0+taNnfzW8skKcxScFD0q4//ACDLesWL/X/jWdSoz8wmrnbQaHZXmkPHjaY/mBHvxiuatrF/CevrPpk8mJYySpPHSu+0z/kHTf7o/mK5HXv+QtB/1yP8qx5mcsoqxX8Kahc65eXktw7I8HCshweePSukvoLb9zDexLcFTw7D5/zrjPh1/wAfOp/UfzFdvqf+vjqTk5mUPEGk6XpEH9oWVvGJG2gkj1IFSW92Ibq3WGNVQxtgDsdh7/0q540/5BS/8A/9CFY8f/Hzbf7j/wDoBqXBMOZmqs1rrdrHPLbpG8XBKcbgPWrWli1uw2kzwq0LvnB7d6ytC/5B7fU1p6D/AMhJfr/Sp9lEkpeLLa28O6zA+moFEgC+4/Guc8YQeRd2htT5fmsuce5FdV8Sv+QrZ/hXOeM/+PrT/wDeT+YpKmgNfT9M0/SIpLCOIPHNJls/3sdazzALF7mwtWKI2Tx0/L2rdm/14/66f0rJu/8AkIzf7tOUVYDltJ1aaG8KSjftG3PTpXWwQW+txHKCCVW+/Hxn0yK88sf+Qg/1Nej+G+kn1H8xXIgILtorTUDamNXVE5z3PrXmWrabaWl9/adsu3zzynbivSdW/wCQxJ/u/wBK4XXv9TBXoU4pNWNKb1scpq00xQ3KtgKOFHSqM9nb31nb3RG1x/hVrVf+PJvoKSD/AJBcFd51ciOZmby5xFgEfSmzvG8DRiMDIouv+PuopPuGhIORHG30At4mEWB+FctcfMyxqAuD6V2Gq/cauOl/1w+tdUHbYzlTSWhFq6qqLGeQapWLyPKLbPynOPbir2s/wVQ03/j9T8f5V0czOfmZsNAYolTdnaeuKmlsobrJIxjHFOn6flVmL7rfhShN3SJM17JIgJFP3ccCk+zQh3vMfeGMelXp/wDUmoD/AMen5V6cIqxLWhq+HLKGfUwsoB+U/oM17JZQrp7vbR/Mvlh1z2ycV5N4W/5Cq/7rf+gmvX3/AOPxv+uCfzFROlGxz8iOssLWLU7V92UITbx/Oq3hHxTrGgO2jrJ5yxtwWrR8Of8AHs/0rjLL/kNy/WslSiuhPson234WtYfE9pHdXahZBjBFfa3gD4WeGo7L/hIbtTPKidG+7x/KvjL4Y/8AINT8K/RjwT/yKb/7n+FelRoQ5OaxtGCS0OdHjq60vxTBothbxxW/ylkXowJxg17DrHxHvNM8TLpmlWsdpCUBKw/KDx34r5kvv+R/h/3U/wDQhXqfiT/kdk/65/8AstfC8R1pPRkPY//Z')) {
        // Photo will be replaced with actual base64 during build
        console.log('Photo placeholder detected - replace with actual image');
    }
}

// ===== STORAGE FUNCTIONS =====
async function saveToStorage() {
    try {
        // Save to Firebase (or localStorage fallback)
        await saveData('participants', participants);
        await saveData('teams', teams);
        await saveData('draftComplete', draftComplete);
        await saveData('signupClosed', signupClosed);
        await saveData('draftOrder', draftOrder);
        await saveData('draftedPlayers', draftedPlayers);
        await saveData('snakeDraftComplete', snakeDraftComplete);
        await saveData('draftInProgress', draftInProgress);
        await saveData('currentPickIndex', currentPick);
        
        console.log('âœ… Data saved successfully');
        return true;
    } catch (e) {
        console.error('âŒ Error saving:', e);
        alert('Error saving data!');
        return false;
    }
}

async function loadFromStorage() {
    try {
        // Load from Firebase (or localStorage fallback)
        const p = await loadData('participants');
        const t = await loadData('teams');
        const d = await loadData('draftComplete');
        const sc = await loadData('signupClosed');
        const draftOrd = await loadData('draftOrder');
        const drafted = await loadData('draftedPlayers');
        const snakeComplete = await loadData('snakeDraftComplete');
        const draftProg = await loadData('draftInProgress');
        const savedPickIndex = await loadData('currentPickIndex');
        
        if (p) participants = p;
        if (t) teams = t;
        if (d) draftComplete = d;
        if (sc) signupClosed = sc;
        if (draftOrd) draftOrder = draftOrd;
        if (drafted) draftedPlayers = drafted;
        if (snakeComplete) snakeDraftComplete = snakeComplete;
        if (draftProg) draftInProgress = draftProg;
        // CRITICAL FIX: Restore currentPick so draft doesn't reset to pick 0 on reload
        if (savedPickIndex !== null && savedPickIndex !== undefined) {
            currentPick = savedPickIndex;
        } else if (draftedPlayers && draftedPlayers.length > 0) {
            currentPick = draftedPlayers.length;
        }
        
        // AUTO-FIX: Check for invalid states and fix them
        let needsFix = false;
        
        // Fix 1: Signup closed but no participants
        if (signupClosed && participants.length === 0) {
            console.warn('âš ï¸ AUTO-FIX: Signup was closed with no participants. Reopening signup.');
            signupClosed = false;
            needsFix = true;
        }
        
        // Fix 2: Draft complete but no teams
        if (draftComplete && teams.length === 0) {
            console.warn('âš ï¸ AUTO-FIX: Draft marked complete with no teams. Resetting draft.');
            draftComplete = false;
            snakeDraftComplete = false;
            draftInProgress = false;
            needsFix = true;
        }
        
        // Fix 3: Draft in progress but no participants
        if (draftInProgress && participants.length === 0) {
            console.warn('âš ï¸ AUTO-FIX: Draft in progress with no participants. Resetting draft.');
            draftInProgress = false;
            signupClosed = false;
            needsFix = true;
        }
        
        if (needsFix) {
            console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Auto-fixes applied. Saving corrected data...');
            await saveToStorage();
        }
        
        console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Data loaded successfully');
        console.log('  Participants:', participants.length);
        console.log('  Signup closed:', signupClosed);
        console.log('  Draft in progress:', draftInProgress);
        console.log('  Draft complete:', draftComplete);
    } catch (e) {
        console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ Error loading:', e);
    }
}

// ===== REAL-TIME FIREBASE LISTENERS =====
function setupRealtimeListeners() {
    // Only set up listeners if Firebase is initialized
    if (typeof firebaseInitialized === 'undefined' || !firebaseInitialized) {
        console.log('âš« Firebase not configured - skipping real-time listeners');
        return;
    }
    
    console.log('ðŸ”§ Setting up Firebase real-time listeners...');
    
    // Listen for participant changes
    listenToData('participants', (data) => {
        if (data) {
            participants = data;
            updateParticipantsList();
            updateDraftView();
        }
    });
    
    // Listen for draft state changes
    listenToData('signupClosed', (data) => {
        if (data !== null) {
            signupClosed = data;
            updateParticipantsList();  // Update the join view
            updateDraftView();
        }
    });
    
    listenToData('draftInProgress', (data) => {
        if (data !== null) {
            draftInProgress = data;
            updateDraftView();
        }
    });
    
    listenToData('draftComplete', (data) => {
        if (data !== null) {
            draftComplete = data;
            updateAllViews();
        }
    });
    
    // Listen for draft order changes
    listenToData('draftOrder', (data) => {
        if (data) {
            draftOrder = data;
            updateDraftView();
        }
    });
    
    // Listen for drafted players (live draft picks)
    listenToData('draftedPlayers', (data) => {
        if (data) {
            draftedPlayers = data;
            if (Array.isArray(data) && data.length > currentPick) {
                currentPick = data.length;
            }
            updateDraftView();
        }
    });

    // Listen for currentPickIndex so all clients stay in sync
    listenToData('currentPickIndex', (data) => {
        if (data !== null && data !== undefined) {
            currentPick = data;
            updateDraftView();
        }
    });
    
    // Listen for team changes
    listenToData('teams', (data) => {
        if (data) {
            teams = data;
            updateTeamsView();
            updateTrackingView();
        }
    });
    
    console.log('âœ… Real-time listeners active');
}

function resetDraftOnly() {
    console.log('=== RESET DRAFT ONLY ===');
    
    const confirmed = confirm('ðŸ”¥ RESET DRAFT & SCORES?\n\nThis will:\nâ€¢ Clear the draft and all teams\nâ€¢ Reset all player scores to 0\nâ€¢ Reset missed cut status\nâ€¢ Keep all participants\nâ€¢ Keep signup status\n\nReady to redraft?');
    
    if (!confirmed) {
        console.log('Reset draft cancelled by user');
        return;
    }
    
    console.log('User confirmed draft reset. Clearing draft data...');
    
    try {
        // Clear draft-related data only
        teams = [];
        draftComplete = false;
        draftInProgress = false;
        currentPick = 0;
        currentRound = 1;
        draftedPlayers = [];
        pickTimer = 60;
        snakeDraftComplete = false;
        
        console.log('Draft data cleared');
        
        // Reset all golfer scores and cut status
        golfers.forEach(golfer => {
            golfer.score = 0;
            golfer.missedCut = false;
            golfer.rounds = [0, 0, 0, 0];
        });
        
        console.log('Golfer scores reset to 0');
        
        // Save to storage (keeps participants and draftOrder)
        saveToStorage();
        
        console.log('Storage updated');
        
        // Update ALL views
        updateAllViews();
        
        console.log('All views updated');
        
        // Force update again after short delay
        setTimeout(() => {
            updateDraftView();
            updateTeamsView();
            updateTrackingView();
            updateResultsView();
            console.log('Views force-refreshed');
        }, 100);
        
        alert('ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Draft Reset Successful!\n\nAll scores set to 0.\nTeams cleared.\nParticipants preserved.\n\nGo to Draft tab to redraft!');
        
        // Switch to draft tab
        switchTab('draft');
        
    } catch (e) {
        console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ Reset draft error:', e);
        alert('Error during draft reset: ' + e.message);
    }
}

function handleReset() {
    console.log('=== RESET BUTTON CLICKED ===');
    alert('Reset button was clicked! This is working.');
    
    const confirmed = confirm('âš ï¸ CLEAR ALL DATA?\n\nThis will:\nâ€¢ Delete all participants\nâ€¢ Clear the draft\nâ€¢ Reset all teams\nâ€¢ Cannot be undone\n\nAre you absolutely sure?');
    
    if (!confirmed) {
        console.log('Reset cancelled by user');
        alert('Reset cancelled.');
        return;
    }
    
    console.log('User confirmed reset. Clearing data...');
    
    try {
        // Clear memory variables
        participants = [];
        teams = [];
        draftComplete = false;
        signupClosed = false;
        draftOrder = [];
        draftInProgress = false;
        currentPick = 0;
        currentRound = 1;
        draftedPlayers = [];
        pickTimer = 60;
        snakeDraftComplete = false;
        
        console.log('Memory cleared');
        
        // Clear ALL localStorage - use simple approach
        localStorage.clear();
        
        console.log('localStorage cleared completely');
        
        // Re-initialize
        initializeGolfers();
        
        console.log('Golfers re-initialized');
        
        // Update ALL views
        updateAllViews();
        
        console.log('All views updated');
        
        // Force update again after short delay
        setTimeout(() => {
            updateJoinView();
            updateDraftView();
            console.log('Views force-refreshed');
        }, 100);
        
        alert('ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Complete Reset Successful!\n\nAll data has been cleared.');
        
    } catch (e) {
        console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ Reset error:', e);
        alert('Error during reset: ' + e.message);
    }
}

// ===== TAB NAVIGATION =====
function switchTab(tabName) {
    console.log('â†©ï¸ Switching to tab:', tabName);
    
    // Add "Tab" suffix to match actual IDs
    const tabId = tabName + 'Tab';
    
    // Remove active from all
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    
    // Add active to selected tab
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add('active');
        console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Activated tab:', tabId);
    } else {
        console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ Tab not found:', tabId);
    }
    
    // Find and activate the button - match based on onclick attribute
    const buttons = document.querySelectorAll('.nav-tab');
    buttons.forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick && onclick.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        }
    });
    
    // Update specific tab content
    if (tabName === 'draft') updateDraftView();
    if (tabName === 'teams') updateTeamsView();
    if (tabName === 'formguide') updateFormGuideView();
    if (tabName === 'leaderboard') updateTrackingView();
    if (tabName === 'results') updateResultsView();
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Tab switch complete');
}

// ===== UPDATE ALL VIEWS =====
function updateAllViews() {
    console.log('â†©ï¸ Updating all views...');
    updateFormGuideView();  // Load form guide first since it's default tab
    updateJoinView();
    updateDraftView();
    if (draftComplete) {
        updateTeamsView();
        updateTrackingView();
        updateResultsView();
    }
}

// ===== JOIN TAB =====
function joinSweepstake() {
    const nameInput = document.getElementById('yourName');
    const emailInput = document.getElementById('participantEmail');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    
    console.log('Join attempt:', name, email);
    
    // Validation: Name required
    if (!name) {
        alert('ÃƒÂ¢Ã‚ÂÃ…â€™ Please enter your name!');
        nameInput.focus();
        return;
    }
    
    // Validation: Name length
    if (name.length < 2) {
        alert('ÃƒÂ¢Ã‚ÂÃ…â€™ Name must be at least 2 characters long!');
        nameInput.focus();
        return;
    }
    
    if (name.length > 50) {
        alert('ÃƒÂ¢Ã‚ÂÃ…â€™ Name must be less than 50 characters!');
        nameInput.focus();
        return;
    }
    
    // Validation: Email required
    if (!email) {
        alert('ÃƒÂ¢Ã‚ÂÃ…â€™ Please enter your email address!');
        emailInput.focus();
        return;
    }
    
    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('ÃƒÂ¢Ã‚ÂÃ…â€™ Please enter a valid email address!');
        emailInput.focus();
        return;
    }
    
    // Check signup status
    if (signupClosed) {
        alert('ÃƒÂ¢Ã‚ÂÃ…â€™ Sorry, signup is closed! Draft order has been set.');
        return;
    }
    
    // Check capacity
    if (participants.length >= MAX_PARTICIPANTS) {
        alert(`ÃƒÂ¢Ã‚ÂÃ…â€™ Sweepstake is full (${MAX_PARTICIPANTS}/${MAX_PARTICIPANTS})!`);
        return;
    }
    
    // Check duplicate name
    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('ÃƒÂ¢Ã‚ÂÃ…â€™ That name is already taken!');
        nameInput.focus();
        return;
    }
    
    // Check duplicate email
    if (participants.some(p => p.email && p.email.toLowerCase() === email.toLowerCase())) {
        alert('ÃƒÂ¢Ã‚ÂÃ…â€™ That email is already registered!');
        emailInput.focus();
        return;
    }
    
    // Sanitize inputs (remove any potentially dangerous characters)
    const sanitizedName = name.replace(/[<>]/g, '');
    const sanitizedEmail = email.toLowerCase();
    
    // Add participant
    participants.push({ 
        name: sanitizedName, 
        email: sanitizedEmail,
        id: Date.now() 
    });
    
    // Clear inputs
    nameInput.value = '';
    emailInput.value = '';
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Participant added. Total:', participants.length);
    
    // Show success message
    alert(`ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Welcome, ${sanitizedName}!\n\nYou'll receive an email when the draft starts.`);
    
    saveToStorage();
    updateJoinView();
    updateDraftView();
}

function loadTestParticipants() {
    console.log('Loading test participants...');
    
    if (signupClosed) {
        alert('Signup is already closed!');
        return;
    }
    
    if (participants.length > 0) {
        if (!confirm('Clear existing participants and load test names?')) {
            return;
        }
    }
    
    // Load based on current need (aim for 8-10 for testing)
    const testCount = Math.min(10, MAX_PARTICIPANTS);
    participants = testNames.slice(0, testCount).map((name, i) => ({
        name: name,
        id: Date.now() + i
    }));
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Test participants loaded:', participants.length);
    
    saveToStorage();
    updateJoinView();
    updateDraftView();
    
    alert(`ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ ${participants.length} test participants loaded!\n\nClick "Close Signup" when ready to draft.`);
}

function closeSignup() {
    console.log('=== CLOSING SIGNUP ===');
    
    if (participants.length < MIN_PARTICIPANTS) {
        alert(`Need at least ${MIN_PARTICIPANTS} participants! Currently have ${participants.length}.`);
        return;
    }
    
    if (!confirm(`Close signup and randomize draft order for ${participants.length} participants?\n\nThis cannot be undone!`)) {
        return;
    }
    
    // Randomize draft order
    draftOrder = [...participants].sort(() => Math.random() - 0.5);
    signupClosed = true;
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Draft order randomized:', draftOrder.map(p => p.name));
    
    saveToStorage();
    updateJoinView();
    updateDraftView();
    
    alert('ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Signup closed! Draft order randomized.\n\nGo to Draft tab to start the snake draft.');
}

function updateJoinView() {
    // Update count
    const countSpan = document.getElementById('participantCount');
    if (countSpan) {
        countSpan.textContent = participants.length;
    }
    
    // Update grid
    const grid = document.getElementById('participantGrid');
    if (!grid) return;
    
    let html = '';
    
    for (let i = 0; i < 10; i++) {
        if (i < participants.length) {
            html += `
                <div class="participant-card joined">
                    <div class="icon">ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦</div>
                    <strong>${participants[i].name}</strong>
                </div>
            `;
        } else {
            html += `
                <div class="participant-card empty">
                    <div class="icon">ÃƒÂ¢Ã‹â€ Ã¢â‚¬â„¢</div>
                    <em>Spot ${i + 1} Open</em>
                </div>
            `;
        }
    }
    
    grid.innerHTML = html;
    
    // Update signup status UI
    const signupForm = document.getElementById('signupForm');
    const signupClosedMessage = document.getElementById('signupClosedMessage');
    const closeSignupSection = document.getElementById('closeSignupSection');
    const closeSignupCount = document.getElementById('closeSignupCount');
    
    if (signupClosed) {
        if (signupForm) signupForm.style.display = 'none';
        if (signupClosedMessage) signupClosedMessage.style.display = 'block';
        if (closeSignupSection) closeSignupSection.style.display = 'none';
    } else {
        if (signupForm) signupForm.style.display = 'block';
        if (signupClosedMessage) signupClosedMessage.style.display = 'none';
        
        // Show close signup button if we have enough participants
        if (closeSignupSection && participants.length >= MIN_PARTICIPANTS) {
            closeSignupSection.style.display = 'block';
            if (closeSignupCount) closeSignupCount.textContent = participants.length;
        } else if (closeSignupSection) {
            closeSignupSection.style.display = 'none';
        }
    }
}

// ===== DRAFT TAB =====
function updateDraftView() {
    const preDraftSection = document.getElementById('preDraftSection');
    const liveDraftSection = document.getElementById('liveDraftSection');
    const snakeDraftCompleteSection = document.getElementById('snakeDraftCompleteSection');
    const draftResults = document.getElementById('draftResults');
    
    if (!preDraftSection) return;
    
    // Check draft completion states
    if (draftComplete) {
        // Fully complete
        preDraftSection.style.display = 'none';
        liveDraftSection.style.display = 'none';
        snakeDraftCompleteSection.style.display = 'none';
        draftResults.style.display = 'block';
        return;
    }
    
    if (snakeDraftComplete) {
        // Snake draft done, need to finish auto-draft
        preDraftSection.style.display = 'none';
        liveDraftSection.style.display = 'none';
        snakeDraftCompleteSection.style.display = 'block';
        draftResults.style.display = 'none';
        return;
    }
    
    if (draftInProgress) {
        // Live draft happening
        preDraftSection.style.display = 'none';
        liveDraftSection.style.display = 'block';
        snakeDraftCompleteSection.style.display = 'none';
        draftResults.style.display = 'none';
        renderLiveDraft();
        return;
    }
    
    // Pre-draft: show draft order or waiting message
    preDraftSection.style.display = 'block';
    liveDraftSection.style.display = 'none';
    snakeDraftCompleteSection.style.display = 'none';
    draftResults.style.display = 'none';
    
    const draftOrderDisplay = document.getElementById('draftOrderDisplay');
    const draftScheduleDisplay = document.getElementById('draftScheduleDisplay');
    
    if (!signupClosed) {
        // Waiting for signup to close
        draftOrderDisplay.innerHTML = `
            <div class="alert alert-warning">
                âš ï¸ <strong>Waiting for signup to close</strong><br>
                Need ${MIN_PARTICIPANTS}-${MAX_PARTICIPANTS} participants. Currently: ${participants.length}<br>
                Go to Join tab to add participants, then click "Close Signup" when ready.
            </div>
        `;
        draftScheduleDisplay.innerHTML = '';
    } else {
        // Show draft order
        draftOrderDisplay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: var(--card-shadow); margin: 20px 0;">
                <h4 style="color: var(--augusta-green); margin-bottom: 20px; font-size: 1.5em;">
                    ðŸ† Draft Order (Randomized)
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div>
                        <strong style="color: var(--text-light);">ROUND 1 â›³</strong>
                        ${draftOrder.map((p, i) => `
                            <div style="padding: 12px; margin: 8px 0; background: #f5f5f5; border-radius: 8px; border-left: 4px solid var(--augusta-green);">
                                <strong>${i + 1}.</strong> ${p.name}
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        <strong style="color: var(--text-light);">ROUND 2 â†©ï¸ (Snake)</strong>
                        ${[...draftOrder].reverse().map((p, i) => `
                            <div style="padding: 12px; margin: 8px 0; background: #f5f5f5; border-radius: 8px; border-left: 4px solid var(--masters-gold);">
                                <strong>${draftOrder.length + i + 1}.</strong> ${p.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        draftScheduleDisplay.innerHTML = `
            <div style="background: linear-gradient(135deg, #fffde7 0%, #fff9c4 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid var(--masters-gold);">
                <h4 style="color: var(--augusta-green); margin-bottom: 15px;">
                    ðŸ“… Draft Ready!
                </h4>
                <p style="font-size: 1.1em; color: var(--text-primary); margin-bottom: 15px;">
                    ${draftOrder.length} participants locked in.<br>
                    Draft order has been randomized (see above).
                </p>
                <p style="color: var(--text-light); font-size: 0.95em; margin-bottom: 20px;">
                    â° Each pick: 12 hours | ðŸŒï¸ 2 rounds snake draft + auto-pick remaining
                </p>
            </div>
        `;
        
        // Show start draft button
        const startBtn = document.getElementById('startDraftBtn');
        if (startBtn) {
            startBtn.style.display = 'block';
        }
    }
}

// TODO: Next Session - Complete these functions
function renderLiveDraft() {
    const liveDraftSection = document.getElementById('liveDraftSection');
    if (!liveDraftSection) return;
    
    // Calculate current picker
    const totalPicks = SNAKE_DRAFT_ROUNDS * draftOrder.length;
    const currentRound = Math.floor(currentPick / draftOrder.length) + 1;
    const posInRound = currentPick % draftOrder.length;
    
    // Snake logic: even rounds go reverse
    const pickerIndex = (currentRound % 2 === 1) ? posInRound : (draftOrder.length - 1 - posInRound);
    const currentPicker = draftOrder[pickerIndex];
    
    // Get available golfers (not yet drafted)
    const availableGolfers = golfers.filter(g => 
        !draftedPlayers.some(dp => dp.golferId === g.id)
    );
    
    // Calculate time remaining
    const pickStartTime = localStorage.getItem(CONFIG.storageKeys.currentPickStartTime);
    let timeRemaining = PICK_TIME_LIMIT;
    let timeDisplay = '12:00:00';
    
    if (pickStartTime) {
        const elapsed = Math.floor((Date.now() - parseInt(pickStartTime)) / 1000);
        timeRemaining = Math.max(0, PICK_TIME_LIMIT - elapsed);
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;
        timeDisplay = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // SMART RE-RENDER: If the draft UI is already built for the same picker,
    // only update the parts that change (timer + draft board) to preserve
    // the search input value and scroll position
    const existingPicker = liveDraftSection.getAttribute('data-current-picker');
    const existingPickNum = liveDraftSection.getAttribute('data-pick-num');
    if (existingPicker === currentPicker.id && existingPickNum === String(currentPick)) {
        // Just update timer
        const timerEl = document.getElementById('pickTimerDisplay');
        if (timerEl) timerEl.textContent = '\u23f0 ' + timeDisplay;
        // Just update draft board
        const boardEl = document.getElementById('draftBoardContainer');
        if (boardEl) boardEl.innerHTML = renderDraftBoard();
        return;
    }
    // Full rebuild needed (new picker or first render) - store marker attributes
    liveDraftSection.setAttribute('data-current-picker', currentPicker.id);
    liveDraftSection.setAttribute('data-pick-num', String(currentPick));
    
    liveDraftSection.innerHTML = `
        <div style="padding: 30px;">
            <div style="background: linear-gradient(135deg, var(--augusta-green), var(--shadow-deep)); 
                        padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px; text-align: center;">
                <h2 style="margin-bottom: 15px;">ðŸŽ¯ ${currentPicker.name}'s Pick</h2>
                <div id="pickTimerDisplay" style="font-size: 3em; font-weight: bold; font-family: 'Courier New', monospace; 
                            background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; margin: 20px 0;">
                    â° ${timeDisplay}
                </div>
                <p style="font-size: 1.2em; opacity: 0.9;">
                    Pick ${currentPick + 1} of ${totalPicks} | Round ${currentRound} of ${SNAKE_DRAFT_ROUNDS}
                </p>
                <p style="margin-top: 10px; opacity: 0.8;">
                    Email: ${currentPicker.email}
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px;">
                <!-- Available Golfers -->
                <div>
                    <h3 style="margin-bottom: 15px; color: var(--augusta-green);">
                        Available Golfers (${availableGolfers.length})
                    </h3>
                    <input type="text" id="golferSearchInput" placeholder="Search golfers..." 
                           onkeyup="filterLiveGolfers()"
                           style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #ddd; 
                                  border-radius: 8px; font-size: 1em;">
                    <div id="availableGolfersList" style="max-height: 600px; overflow-y: auto; 
                                                          display: grid; gap: 10px;">
                        ${availableGolfers.map(g => `
                            <div class="golfer-card" onclick="selectGolfer(${g.id})" 
                                 style="padding: 15px; background: white; border: 2px solid #ddd; 
                                        border-radius: 8px; cursor: pointer; transition: all 0.2s;
                                        display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="font-size: 1.1em;">${g.name}</strong>
                                    <div style="color: #666; font-size: 0.9em; margin-top: 4px;">
                                        Rank: ${g.rank} | Tier: ${g.tier}
                                    </div>
                                </div>
                                <button style="padding: 8px 16px; background: var(--augusta-green); 
                                              color: white; border: none; border-radius: 6px; 
                                              font-weight: bold; cursor: pointer;">
                                    SELECT
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Draft Board -->
                <div>
                    <h3 style="margin-bottom: 15px; color: var(--augusta-green);">Draft Board</h3>
                    <div id="draftBoardContainer" style="max-height: 600px; overflow-y: auto;">
                        ${renderDraftBoard()}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Start timer if not already running
    if (!pickTimerInterval) {
        startPickTimer();
    }
}

function filterLiveGolfers() {
    const search = document.getElementById('golferSearchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.golfer-card');
    
    cards.forEach(card => {
        const name = card.textContent.toLowerCase();
        card.style.display = name.includes(search) ? 'flex' : 'none';
    });
}

function renderDraftBoard() {
    let html = '<div style="display: grid; gap: 8px;">';
    
    draftOrder.forEach(participant => {
        const picks = draftedPlayers.filter(dp => dp.participantId === participant.id);
        html += `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; 
                        border-left: 4px solid var(--augusta-green);">
                <strong>${participant.name}</strong>
                <div style="font-size: 0.85em; color: #666; margin-top: 4px;">
                    ${picks.length} pick${picks.length !== 1 ? 's' : ''}
                </div>
                ${picks.map(p => `
                    <div style="font-size: 0.9em; margin-top: 4px; padding: 4px; 
                                background: white; border-radius: 4px;">
                        ${p.golferName}
                    </div>
                `).join('')}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function startPickTimer() {
    // Clear any existing timer
    if (pickTimerInterval) {
        clearInterval(pickTimerInterval);
    }
    
    // Set start time if not already set
    if (!localStorage.getItem(CONFIG.storageKeys.currentPickStartTime)) {
        localStorage.setItem(CONFIG.storageKeys.currentPickStartTime, Date.now().toString());
    }
    
    // Update every second - only update the timer element, NOT the full UI
    // (rebuilding full UI every second breaks the search box and scroll position)
    pickTimerInterval = setInterval(() => {
        const pickStartTime = parseInt(localStorage.getItem(CONFIG.storageKeys.currentPickStartTime));
        const elapsed = Math.floor((Date.now() - pickStartTime) / 1000);
        const remaining = Math.max(0, PICK_TIME_LIMIT - elapsed);
        
        if (remaining === 0) {
            // Time expired - auto-pick best available golfer
            autoPickForTimeout();
        } else {
            // Just update the timer display element - no full re-render
            const hours = Math.floor(remaining / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            const seconds = remaining % 60;
            const timeDisplay = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            const timerEl = document.getElementById('pickTimerDisplay');
            if (timerEl) {
                timerEl.textContent = '⏰ ' + timeDisplay;
            }
        }
    }, 1000);
}

function selectGolfer(golferId) {
    const golfer = golfers.find(g => g.id === golferId);
    if (!golfer) return;
    
    // Get current picker
    const totalPicks = SNAKE_DRAFT_ROUNDS * draftOrder.length;
    const currentRound = Math.floor(currentPick / draftOrder.length) + 1;
    const posInRound = currentPick % draftOrder.length;
    const pickerIndex = (currentRound % 2 === 1) ? posInRound : (draftOrder.length - 1 - posInRound);
    const currentPicker = draftOrder[pickerIndex];
    
    // Confirm selection
    if (!confirm(`Select ${golfer.name} for ${currentPicker.name}?`)) {
        return;
    }
    
    // Record the pick
    draftedPlayers.push({
        participantId: currentPicker.id,
        participantName: currentPicker.name,
        golferId: golfer.id,
        golferName: golfer.name,
        pickNumber: currentPick + 1,
        round: currentRound,
        timestamp: new Date().toISOString()
    });
    
    currentPick++;
    
    // Clear pick start time and timer for next pick
    localStorage.removeItem(CONFIG.storageKeys.currentPickStartTime);
    
    // Clear the timer interval so it restarts for the next pick
    if (pickTimerInterval) {
        clearInterval(pickTimerInterval);
        pickTimerInterval = null;
    }
    
    // Check if snake draft is complete
    if (currentPick >= SNAKE_DRAFT_ROUNDS * draftOrder.length) {
        completeSnakeDraft();
    } else {
        // Save and continue
        saveToStorage();
        renderLiveDraft();
        
        // Send email notification to next picker
        const totalPicks = SNAKE_DRAFT_ROUNDS * draftOrder.length;
        const nextRound = Math.floor(currentPick / draftOrder.length) + 1;
        const posInRound = currentPick % draftOrder.length;
        const nextPickerIndex = (nextRound % 2 === 1) ? posInRound : (draftOrder.length - 1 - posInRound);
        const nextPicker = draftOrder[nextPickerIndex];
        
        if (typeof sendPickNotification === 'function') {
            sendPickNotification(nextPicker, currentPick + 1, totalPicks, 12);
        }
    }
}

function autoPickForTimeout() {
    console.log('ÃƒÂ¢Ã‚ÂÃ‚Â° Time expired! Auto-picking...');
    
    // Get current picker info before making the pick
    const totalPicks = SNAKE_DRAFT_ROUNDS * draftOrder.length;
    const currentRound = Math.floor(currentPick / draftOrder.length) + 1;
    const posInRound = currentPick % draftOrder.length;
    const pickerIndex = (currentRound % 2 === 1) ? posInRound : (draftOrder.length - 1 - posInRound);
    const currentPicker = draftOrder[pickerIndex];
    
    const availableGolfers = golfers.filter(g => 
        !draftedPlayers.some(dp => dp.golferId === g.id)
    );
    
    if (availableGolfers.length === 0) return;
    
    // Pick best available (lowest rank)
    const bestAvailable = availableGolfers.reduce((best, current) => 
        current.rank < best.rank ? current : best
    );
    
    // Send auto-pick notification
    if (typeof sendAutoPickNotification === 'function') {
        sendAutoPickNotification(currentPicker, bestAvailable.name);
    }
    
    selectGolfer(bestAvailable.id);
}

function completeSnakeDraft() {
    snakeDraftComplete = true;
    clearInterval(pickTimerInterval);
    pickTimerInterval = null;
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Snake draft complete! Starting auto-pick phase...');
    
    saveToStorage();
    updateAllViews();
    
    alert('ðŸŽ‰ Snake draft complete!\n\nNow assigning remaining golfers by tier...');
    
    // Automatically run auto-pick
    executeAutoPick();
}

function executeAutoPick() {
    console.log('=== AUTO-PICK PHASE ===');
    
    // Get all golfers not yet drafted
    const availableGolfers = golfers.filter(g => 
        !draftedPlayers.some(dp => dp.golferId === g.id)
    ).sort((a, b) => a.rank - b.rank); // Sort by rank
    
    // Initialize teams with their manual picks
    teams = draftOrder.map(participant => {
        const manualPicks = draftedPlayers
            .filter(dp => dp.participantId === participant.id)
            .map(dp => {
                const golfer = golfers.find(g => g.id === dp.golferId);
                return { ...golfer };
            });
        
        return {
            participantId: participant.id,
            participantName: participant.name,
            participantEmail: participant.email,
            players: manualPicks
        };
    });
    
    // Distribute remaining golfers in tiers
    let golferIndex = 0;
    const golfersPerTeam = Math.floor(availableGolfers.length / teams.length);
    
    // Assign in tiers - each team gets one from each tier
    for (let tier = 0; tier < golfersPerTeam; tier++) {
        // Randomize team order each tier
        const teamOrder = [...teams].sort(() => Math.random() - 0.5);
        
        teamOrder.forEach(team => {
            if (golferIndex < availableGolfers.length) {
                team.players.push(availableGolfers[golferIndex]);
                golferIndex++;
            }
        });
    }
    
    // Assign any remaining golfers
    let teamIdx = 0;
    while (golferIndex < availableGolfers.length) {
        teams[teamIdx % teams.length].players.push(availableGolfers[golferIndex]);
        golferIndex++;
        teamIdx++;
    }
    
    draftComplete = true;
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Auto-pick complete!');
    console.log('Teams:', teams.map(t => `${t.participantName}: ${t.players.length} players`));
    
    saveToStorage();
    updateAllViews();
    
    // Send draft complete emails to all participants
    if (typeof sendDraftCompleteNotification === 'function') {
        teams.forEach(team => {
            const participant = {
                name: team.participantName,
                email: team.participantEmail
            };
            sendDraftCompleteNotification(participant, team);
        });
    }
    
    alert('ðŸ Draft Complete!\n\nAll golfers have been assigned.\nCheck the Teams tab to see your roster!');
}

function startSnakeDraft() {
    if (!signupClosed) {
        alert('Please close signup first!');
        return;
    }
    
    if (draftInProgress) {
        alert('Draft is already in progress!');
        return;
    }
    
    if (!confirm(`Start the live snake draft?\n\nParticipants: ${draftOrder.length}\nRounds: ${SNAKE_DRAFT_ROUNDS}\nTime per pick: 12 hours\n\nReady to begin?`)) {
        return;
    }
    
    draftInProgress = true;
    currentPick = 0;
    draftedPlayers = [];
    
    // Set start time for first pick
    localStorage.setItem(CONFIG.storageKeys.currentPickStartTime, Date.now().toString());
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Live draft started!');
    
    saveToStorage();
    updateAllViews();
    
    // Send email to first picker
    const firstPicker = draftOrder[0];
    const totalPicks = SNAKE_DRAFT_ROUNDS * draftOrder.length;
    
    if (typeof sendPickNotification === 'function') {
        sendPickNotification(firstPicker, 1, totalPicks, 12);
    }
}

// Temporary function for testing
function skipToAutoDraft() {
    if (!confirm('Skip snake draft and auto-assign all players randomly?\n\nThis is for testing only.')) {
        return;
    }
    
    console.log('=== QUICK AUTO-DRAFT ===');
    
    try {
        // Initialize teams
        teams = draftOrder.map(p => ({
            participantId: p.id,
            participantName: p.name,
            players: []
        }));
        
        // Calculate players per team
        const totalPlayers = golfers.length;
        const numTeams = teams.length;
        const basePlayersPerTeam = Math.floor(totalPlayers / numTeams);
        const extraPlayers = totalPlayers % numTeams;
        
        console.log(`Distributing ${totalPlayers} players to ${numTeams} teams`);
        console.log(`Base: ${basePlayersPerTeam} players per team, ${extraPlayers} teams get +1`);
        
        // Shuffle all golfers
        const shuffledGolfers = [...golfers].sort(() => Math.random() - 0.5);
        
        let playerIndex = 0;
        for (let teamIndex = 0; teamIndex < numTeams; teamIndex++) {
            const playersForThisTeam = basePlayersPerTeam + (teamIndex < extraPlayers ? 1 : 0);
            
            for (let i = 0; i < playersForThisTeam; i++) {
                teams[teamIndex].players.push({
                    ...shuffledGolfers[playerIndex],
                    tier: Math.floor(playerIndex / 10) + 1 // Approximate tier
                });
                playerIndex++;
            }
        }
        
        draftComplete = true;
        
        console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Auto-draft complete!');
        
        saveToStorage();
        updateAllViews();
        
        alert(`ðŸŽ‰ Auto-Draft Complete!\n\n${numTeams} teams created with ${basePlayersPerTeam}-${basePlayersPerTeam + 1} players each.\n\nCheck Teams tab!`);
        
    } catch (e) {
        console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ Auto-draft error:', e);
        alert('Error running auto-draft!');
    }
}

function completeAutoDraft() {
    // TODO: Next Session - Implement tier-based assignment of remaining players
    alert('ðŸ”¨ This will be implemented next session after snake draft is complete.');
}

// ===== TEAMS TAB =====
function updateTeamsView() {
    console.log('=== UPDATE TEAMS VIEW ===');
    console.log('Draft complete:', draftComplete);
    console.log('Teams:', teams.length);
    
    const container = document.getElementById('teamsDisplay');
    console.log('Container found:', !!container);
    
    if (!container) {
        console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ teamsDisplay container not found!');
        return;
    }
    
    if (!draftComplete || teams.length === 0) {
        console.log('Showing "complete draft first" message');
        container.innerHTML = '<p style="color: #999; font-style: italic;">Complete draft first!</p>';
        return;
    }
    
    console.log('Rendering', teams.length, 'teams...');
    let html = '';
    
    teams.forEach((team, teamIndex) => {
        const activePlayers = team.players.filter(p => !p.missedCut);
        const bestScore = activePlayers.length > 0 ? 
            Math.min(...activePlayers.map(p => p.score)) : 999;
        
        // Find ALL players tied for best score
        const bestPlayers = activePlayers.filter(p => p.score === bestScore);
        const isTied = bestPlayers.length > 1;
        
        const cutCount = team.players.filter(p => p.missedCut).length;
        const playerCount = team.players.length;
        
        html += `
            <div class="team-roster">
                <div class="team-roster-header" onclick="toggleTeamRoster(${teamIndex})">
                    <div class="team-name-section">
                        <span class="collapse-icon" id="icon-${teamIndex}">â–¼</span>
                        <h4>
                            ${team.participantName}
                            <span class="player-count-badge">${playerCount} players</span>
                        </h4>
                        ${team.participantEmail ? `<div style="font-size: 0.85em; color: #666; font-weight: normal; margin-top: 4px;">ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â§ ${team.participantEmail}</div>` : ''}
                    </div>
                    <span class="team-score">${formatScore(bestScore)} ${isTied ? 'ÃƒÂ¢Ã…Â¡Ã‚Â¡' : ''}</span>
                </div>
                
                <div class="team-roster-content" id="roster-${teamIndex}">
                    <div style="margin-top: 16px;">
                        ${team.players.map(p => {
                            const isBestPlayer = p.score === bestScore && !p.missedCut;
                            return `
                                <div class="player-row ${p.missedCut ? 'missed-cut' : ''} ${isBestPlayer ? 'best-player' : ''}">
                                    <span>
                                        <span class="tier-badge tier-${p.tier}">T${p.tier}</span>
                                        ${p.name}
                                        ${isBestPlayer ? '<span style="color: #FFD700; margin-left: 6px;">ÃƒÂ¢Ã…â€œÃ¢â‚¬Â</span>' : ''}
                                    </span>
                                    <strong style="font-size: 1em;">${formatScore(p.score)} ${p.missedCut ? 'ÃƒÂ¢Ã…Â¡Ã‚Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â' : ''}</strong>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                            <div style="text-align: center; padding: 12px; background: #e8f5e9; border-radius: 8px;">
                                <div style="font-size: 1.5em; font-weight: 700; color: #2e7d32; font-family: 'Lato', sans-serif;">${activePlayers.length}</div>
                                <div style="font-size: 0.75em; color: #2e7d32; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">Active</div>
                            </div>
                            <div style="text-align: center; padding: 12px; background: #fffde7; border-radius: 8px;">
                                <div style="font-size: 1.5em; font-weight: 700; color: #f57f17; font-family: 'Lato', sans-serif;">${formatScore(bestScore)}</div>
                                <div style="font-size: 0.75em; color: #f57f17; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">Best</div>
                            </div>
                            <div style="text-align: center; padding: 12px; background: #ffebee; border-radius: 8px;">
                                <div style="font-size: 1.5em; font-weight: 700; color: #c62828; font-family: 'Lato', sans-serif;">${cutCount}</div>
                                <div style="font-size: 0.75em; color: #c62828; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">Cut</div>
                            </div>
                        </div>
                        
                        ${bestPlayers.length > 0 ? `
                        <div style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; border-left: 3px solid var(--augusta-green);">
                            <div style="font-size: 0.8em; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                                ${isTied ? 'Best Players (Tied)' : 'Best Player'}
                            </div>
                            <div style="font-size: 1em; color: var(--text-primary); font-weight: 600;">
                                ${bestPlayers.map(p => p.name).join(' & ')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Toggle team roster visibility
function toggleTeamRoster(teamIndex) {
    const content = document.getElementById(`roster-${teamIndex}`);
    const icon = document.getElementById(`icon-${teamIndex}`);
    
    if (!content || !icon) return;
    
    const isExpanded = content.classList.contains('expanded');
    
    if (isExpanded) {
        content.classList.remove('expanded');
        icon.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        icon.classList.add('expanded');
    }
}

// Toggle all teams expand/collapse
function toggleAllTeams() {
    if (!teams || teams.length === 0) return;
    
    const button = document.getElementById('toggleAllBtn');
    const firstContent = document.getElementById('roster-0');
    
    if (!firstContent) return;
    
    // Check if first team is expanded to determine action
    const shouldExpand = !firstContent.classList.contains('expanded');
    
    // Toggle all teams
    teams.forEach((team, index) => {
        const content = document.getElementById(`roster-${index}`);
        const icon = document.getElementById(`icon-${index}`);
        
        if (!content || !icon) return;
        
        if (shouldExpand) {
            content.classList.add('expanded');
            icon.classList.add('expanded');
        } else {
            content.classList.remove('expanded');
            icon.classList.remove('expanded');
        }
    });
    
    // Update button text
    if (button) {
        button.textContent = shouldExpand ? 'ðŸ“ Collapse All' : 'ðŸ“‚ Expand All';
    }
}

// ===== BULK SCORE UPDATE FUNCTIONS =====

/**
 * Update scores from bulk paste
 */
function updateBulkScores() {
    const input = document.getElementById('bulkScoreInput');
    const statusDiv = document.getElementById('bulkUpdateStatus');
    const text = input.value.trim();
    
    if (!text) {
        showBulkStatus('ÃƒÂ¢Ã‚ÂÃ‚Â Please paste some scores first!', 'error');
        return;
    }
    
    console.log('=== BULK SCORE UPDATE ===');
    showBulkStatus('ÃƒÂ¢Ã‚ÂÃ‚Â³ Processing scores...', 'info');
    
    const lines = text.split('\n').filter(line => line.trim());
    console.log(`Processing ${lines.length} lines`);
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    const notFoundPlayers = [];
    
    lines.forEach((line, index) => {
        try {
            const result = parseBulkScoreLine(line);
            
            if (!result) {
                console.log(`Line ${index + 1}: Skipped (no valid data)`);
                return;
            }
            
            const { playerName, score, isCut } = result;
            
            // Find matching golfer
            const golfer = golfers.find(g => 
                normalizePlayerName(g.name) === normalizePlayerName(playerName)
            );
            
            if (golfer) {
                golfer.score = score;
                golfer.missedCut = isCut;
                updated++;
                console.log(`ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Updated: ${golfer.name} = ${score} ${isCut ? '(CUT)' : ''}`);
            } else {
                notFound++;
                notFoundPlayers.push(playerName);
                console.log(`   Not found: ${playerName}`);
            }
            
        } catch (error) {
            errors++;
            console.error(`ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ Error on line ${index + 1}:`, error.message);
        }
    });
    
    // Save and update
    if (updated > 0) {
        saveToStorage();
        updateAllViews();
    }
    
    // Show results
    let message = '';
    let type = 'success';
    
    if (updated > 0) {
        message = `ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Updated ${updated} player${updated > 1 ? 's' : ''}!`;
        
        if (notFound > 0) {
            message += `\nâš ï¸ ${notFound} player${notFound > 1 ? 's' : ''} not found: ${notFoundPlayers.slice(0, 5).join(', ')}${notFoundPlayers.length > 5 ? '...' : ''}`;
            type = 'warning';
        }
        
        if (errors > 0) {
            message += `\nÃƒÂ¢Ã‚ÂÃ‚Â ${errors} error${errors > 1 ? 's' : ''}`;
        }
    } else {
        message = 'ÃƒÂ¢Ã‚ÂÃ‚Â No players updated. Check player names match the database.';
        type = 'error';
    }
    
    showBulkStatus(message, type);
    
    console.log(`=== BULK UPDATE COMPLETE: ${updated} updated, ${notFound} not found, ${errors} errors ===`);
}

/**
 * Parse a single line of bulk score input
 * Handles multiple formats: "Player Name -12", "Player: -8", "Player | -6", etc.
 */
function parseBulkScoreLine(line) {
    line = line.trim();
    
    if (!line || line.startsWith('#') || line.startsWith('//')) {
        return null; // Skip comments or empty lines
    }
    
    // Common separators: space, colon, pipe, comma, tab, parentheses
    const separators = /[\s:|\,\t()]+/;
    
    // Try to split into parts
    const parts = line.split(separators).map(p => p.trim()).filter(p => p);
    
    if (parts.length < 2) {
        return null; // Need at least name and score
    }
    
    // Last part should be score or "CUT"
    const lastPart = parts[parts.length - 1].toUpperCase();
    
    let score = 0;
    let isCut = false;
    
    // Check if it's a cut indicator
    if (lastPart === 'CUT' || lastPart === 'MC' || lastPart === 'MISSED' || lastPart === 'WD') {
        isCut = true;
        // Score might be second-to-last
        if (parts.length > 2) {
            const scoreStr = parts[parts.length - 2];
            score = parseScoreString(scoreStr);
        }
    } else {
        // Try to parse as score
        score = parseScoreString(lastPart);
    }
    
    // Everything except last part (or last 2 if cut) is player name
    const namePartsCount = isCut && parts.length > 2 ? parts.length - 2 : parts.length - 1;
    const playerName = parts.slice(0, namePartsCount).join(' ');
    
    if (!playerName) {
        return null;
    }
    
    return { playerName, score, isCut };
}

/**
 * Parse score string (E, -12, +5, etc.)
 */
function parseScoreString(str) {
    if (!str) return 0;
    
    str = str.trim().toUpperCase();
    
    // Handle "E" or "EVEN"
    if (str === 'E' || str === 'EVEN' || str === '-') {
        return 0;
    }
    
    // Remove any non-numeric characters except +/-
    const cleaned = str.replace(/[^0-9+-]/g, '');
    
    if (!cleaned) return 0;
    
    // Parse number
    const num = parseInt(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Show example bulk input
 */
function showBulkExample() {
    const input = document.getElementById('bulkScoreInput');
    const example = `Scottie Scheffler -12
Rory McIlroy -8
Jon Rahm -6
Viktor Hovland -5
Xander Schauffele -4
Collin Morikawa -3
Bryson DeChambeau -2
Patrick Cantlay -1
Ludvig ÃƒÆ’Ã¢â‚¬Â¦berg E
Tommy Fleetwood +1
Tiger Woods +2 CUT`;
    
    input.value = example;
    showBulkStatus('ðŸ“Š Example loaded! Click "Update All Scores" to test', 'info');
}

/**
 * Clear bulk input
 */
function clearBulkInput() {
    document.getElementById('bulkScoreInput').value = '';
    showBulkStatus('', '');
}

/**
 * Show status message for bulk update
 */
function showBulkStatus(message, type = 'info') {
    const statusDiv = document.getElementById('bulkUpdateStatus');
    if (!statusDiv) return;
    
    if (!message) {
        statusDiv.innerHTML = '';
        return;
    }
    
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    // Convert newlines to <br> for display
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    statusDiv.innerHTML = `<div class="alert ${alertClass}">${formattedMessage}</div>`;
}

/**
 * Normalize player name for matching
 */
function normalizePlayerName(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z\s]/g, '')        // Remove special chars
        .trim()
        .replace(/\s+/g, ' ');
}

// ===== CSV SYNC FUNCTIONS =====

/**
 * Connect to Google Sheet CSV
 */
function connectGoogleSheet() {
    const input = document.getElementById('csvUrl');
    const url = input.value.trim();
    
    if (!url) {
        alert('ÃƒÂ¢Ã‚ÂÃ‚Â Please enter a Google Sheets CSV URL');
        return;
    }
    
    // Validate URL
    if (!url.includes('docs.google.com') && !url.includes('spreadsheets')) {
        alert('ÃƒÂ¢Ã‚ÂÃ‚Â Invalid URL. Must be a Google Sheets URL.');
        return;
    }
    
    // Save URL
    CONFIG.sheetsUrl = url;
    localStorage.setItem(CONFIG.storageKeys.csvUrl, url);
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Google Sheet connected:', url);
    
    // Enable sync buttons
    document.getElementById('syncButton').disabled = false;
    document.getElementById('autoSyncButton').disabled = false;
    
    // Update status
    updateSyncStatus('Connected - Ready to sync', 'info');
    
    // Try initial sync
    syncScoresNow();
}

/**
 * Sync scores from CSV now
 */
async function syncScoresNow() {
    if (!CONFIG.sheetsUrl) {
        alert('ÃƒÂ¢Ã‚ÂÃ‚Â Please connect a Google Sheet first');
        return;
    }
    
    console.log('=== SYNCING SCORES FROM CSV ===');
    updateSyncStatus('Syncing...', 'info');
    
    const syncButton = document.getElementById('syncButton');
    syncButton.disabled = true;
    syncButton.textContent = 'ÃƒÂ¢Ã‚ÂÃ‚Â³ Syncing...';
    
    try {
        const data = await fetchCSVData(CONFIG.sheetsUrl);
        
        if (!data || data.length === 0) {
            throw new Error('No data received from sheet');
        }
        
        console.log(`ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Fetched ${data.length} rows from CSV`);
        
        // Parse and update scores
        const updated = updateScoresFromCSV(data);
        
        // Save last sync time
        const now = new Date();
        localStorage.setItem(CONFIG.storageKeys.lastSyncTime, now.toISOString());
        
        // Update views
        updateAllViews();
        
        updateSyncStatus(
            `ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Synced ${updated} players at ${now.toLocaleTimeString()}`,
            'success'
        );
        
        console.log(`ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Updated ${updated} player scores`);
        
    } catch (error) {
        console.error('ÃƒÂ¢Ã…â€œÃ¢â‚¬â€ Sync error:', error);
        updateSyncStatus(`ÃƒÂ¢Ã‚ÂÃ‚Â Sync failed: ${error.message}`, 'error');
    } finally {
        syncButton.disabled = false;
        syncButton.textContent = 'ðŸ”„ Sync Now';
    }
}

/**
 * Fetch CSV data from Google Sheets
 */
async function fetchCSVData(url) {
    try {
        // Add cache busting to force fresh data
        const cacheBuster = '?cb=' + Date.now();
        const response = await fetch(url + cacheBuster);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        return parseCSV(csvText);
        
    } catch (error) {
        console.error('Fetch error:', error);
        throw new Error('Failed to fetch data. Check URL and sheet permissions.');
    }
}

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('CSV has no data rows');
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length === 0) continue; // Skip empty lines
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        data.push(row);
    }
    
    return data;
}

/**
 * Parse a single CSV line (handles commas in quotes)
 */
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    values.push(currentValue.trim());
    return values;
}

/**
 * Update golfer scores from CSV data
 */
function updateScoresFromCSV(csvData) {
    let updatedCount = 0;
    
    csvData.forEach(row => {
        const playerName = row['Player Name'] || row['Name'] || row['Player'];
        
        if (!playerName) return;
        
        // Find matching golfer (case-insensitive, normalized)
        const golfer = golfers.find(g => 
            normalizePlayerName(g.name) === normalizePlayerName(playerName)
        );
        
        if (!golfer) {
            console.log(`   Player not found in database: ${playerName}`);
            return;
        }
        
        // Parse score
        const scoreStr = row['Score'] || row['Total'] || '0';
        golfer.score = parseScore(scoreStr);
        
        // Parse rounds
        golfer.rounds = [
            parseInt(row['R1'] || 0),
            parseInt(row['R2'] || 0),
            parseInt(row['R3'] || 0),
            parseInt(row['R4'] || 0)
        ];
        
        // Parse cut status
        const cutStr = (row['Cut'] || 'No').toLowerCase();
        golfer.missedCut = cutStr === 'yes' || cutStr === 'cut' || cutStr === 'true';
        
        updatedCount++;
    });
    
    // Save updated golfers
    saveToStorage();
    
    return updatedCount;
}

/**
 * Parse score string (handles E, +5, -12, etc.)
 */
function parseScore(scoreStr) {
    scoreStr = scoreStr.trim().toUpperCase();
    
    if (scoreStr === 'E' || scoreStr === '' || scoreStr === '-') {
        return 0;
    }
    
    // Remove + sign and parse
    return parseInt(scoreStr.replace('+', ''));
}

/**
 * Normalize player name for matching
 */
function normalizePlayerName(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z\s]/g, '')        // Remove special chars
        .trim()
        .replace(/\s+/g, ' ');
}

/**
 * Toggle auto-sync on/off
 */
function toggleAutoSync() {
    isAutoSyncEnabled = !isAutoSyncEnabled;
    
    const button = document.getElementById('autoSyncButton');
    
    if (isAutoSyncEnabled) {
        // Start auto-sync
        startAutoSync();
        button.textContent = 'ðŸ”„ Auto-Sync: ON';
        button.style.background = '#4caf50';
        updateSyncStatus('Auto-sync enabled (every 5 minutes)', 'success');
        localStorage.setItem(CONFIG.storageKeys.autoSync, 'true');
    } else {
        // Stop auto-sync
        stopAutoSync();
        button.textContent = 'ðŸ”„ Auto-Sync: OFF';
        button.style.background = '';
        updateSyncStatus('Auto-sync disabled', 'info');
        localStorage.setItem(CONFIG.storageKeys.autoSync, 'false');
    }
}

/**
 * Start auto-sync timer
 */
function startAutoSync() {
    stopAutoSync(); // Clear any existing timer
    
    // Sync now
    syncScoresNow();
    
    // Set up recurring sync
    autoSyncTimer = setInterval(() => {
        console.log('Auto-sync triggered');
        syncScoresNow();
    }, CONFIG.autoSyncInterval);
    
    console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Auto-sync started (every 5 minutes)');
}

/**
 * Stop auto-sync timer
 */
function stopAutoSync() {
    if (autoSyncTimer) {
        clearInterval(autoSyncTimer);
        autoSyncTimer = null;
        console.log('ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Auto-sync stopped');
    }
}

/**
 * Update sync status display
 */
function updateSyncStatus(message, type = 'info') {
    const statusDiv = document.getElementById('syncStatus');
    const statusText = document.getElementById('syncStatusText');
    const lastSyncTime = document.getElementById('lastSyncTime');
    
    if (!statusDiv || !statusText) return;
    
    statusText.textContent = message;
    
    // Update styling based on type
    statusDiv.className = 'alert alert-' + type;
    
    // Update last sync time
    const lastSync = localStorage.getItem(CONFIG.storageKeys.lastSyncTime);
    if (lastSync && lastSyncTime) {
        const date = new Date(lastSync);
        lastSyncTime.textContent = `Last sync: ${date.toLocaleString()}`;
    }
}

/**
 * Load saved CSV URL and auto-sync setting on page load
 */
function initializeCSVSync() {
    const savedUrl = localStorage.getItem(CONFIG.storageKeys.csvUrl);
    const savedAutoSync = localStorage.getItem(CONFIG.storageKeys.autoSync);
    
    if (savedUrl) {
        CONFIG.sheetsUrl = savedUrl;
        const input = document.getElementById('csvUrl');
        if (input) input.value = savedUrl;
        
        // Enable buttons
        document.getElementById('syncButton').disabled = false;
        document.getElementById('autoSyncButton').disabled = false;
        
        updateSyncStatus('Previously connected', 'info');
        
        // Restore auto-sync if it was enabled
        if (savedAutoSync === 'true') {
            isAutoSyncEnabled = true;
            const button = document.getElementById('autoSyncButton');
            button.textContent = 'ðŸ”„ Auto-Sync: ON';
            button.style.background = '#4caf50';
            startAutoSync();
        }
    }
}

// ===== TRACKING TAB =====
function updateTrackingView() {
    const teamLeaderboard = document.getElementById('teamLeaderboard');
    const playerLeaderboard = document.getElementById('playerLeaderboard');
    
    if (!teamLeaderboard || !playerLeaderboard) return;
    
    if (!draftComplete || teams.length === 0) {
        teamLeaderboard.innerHTML = '<p style="color: #999;">Complete draft first!</p>';
        playerLeaderboard.innerHTML = '<p style="color: #999;">Complete draft first!</p>';
        return;
    }
    
    // Team standings
    const teamScores = teams.map(team => {
        const active = team.players.filter(p => !p.missedCut);
        const best = active.length > 0 ? Math.min(...active.map(p => p.score)) : 999;
        
        // Find ALL players tied for best
        const bestPlayers = active.filter(p => p.score === best);
        
        return {
            ...team,
            totalScore: best,
            bestPlayers: bestPlayers,
            isTied: bestPlayers.length > 1
        };
    }).sort((a, b) => a.totalScore - b.totalScore);
    
    let teamHTML = '';
    teamScores.forEach((team, idx) => {
        const pos = idx + 1;
        
        // Position badge HTML
        let badgeHTML = '';
        if (pos === 1) {
            badgeHTML = '<div class="position-badge gold">ðŸ¥‡</div>';
        } else if (pos === 2) {
            badgeHTML = '<div class="position-badge silver">ðŸ¥ˆ</div>';
        } else if (pos === 3) {
            badgeHTML = '<div class="position-badge bronze">ðŸ¥‰</div>';
        } else {
            badgeHTML = `<div class="position-badge" style="background: #f5f5f5; color: var(--text-primary);">${pos}</div>`;
        }
        
        // Calculate score percentage (for progress bar)
        const bestScore = teamScores[0].totalScore;
        const worstScore = teamScores[teamScores.length - 1].totalScore;
        const scoreRange = Math.abs(worstScore - bestScore) || 1;
        const scorePercentage = team.totalScore === bestScore ? 100 : 
            Math.max(20, 100 - ((Math.abs(team.totalScore - bestScore) / scoreRange) * 80));
        
        // Movement indicator (simulated - can be real when we have historical data)
        const movementHTML = pos === 1 ? 
            '<span class="movement-indicator up">" Leading</span>' :
            pos <= 3 ? '<span class="movement-indicator steady">â›³ Steady</span>' :
            '<span class="movement-indicator down">" Chasing</span>';
        
        const bestPlayerText = team.isTied 
            ? `${team.bestPlayers.map(p => p.name).join(' & ')} (TIED ÃƒÂ¢Ã…Â¡Ã‚Â¡)`
            : team.bestPlayers[0] ? team.bestPlayers[0].name : 'None';
        
        teamHTML += `
            <div class="team-performance-card">
                <div class="leaderboard-header">
                    ${badgeHTML}
                    <div style="flex: 1; margin-left: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="font-size: 1.6em; margin: 0; font-family: 'Playfair Display', serif; color: var(--augusta-green);">
                                ${team.participantName}
                            </h4>
                            <div style="font-size: 2.2em; font-weight: 700; color: ${pos === 1 ? 'var(--masters-gold)' : 'var(--augusta-green)'}; font-family: 'Playfair Display', serif;">
                                ${formatScore(team.totalScore)} ${team.isTied ? 'ÃƒÂ¢Ã…Â¡Ã‚Â¡' : ''}
                            </div>
                        </div>
                        
                        <!-- Score Progress Bar -->
                        <div class="score-bar-container">
                            <div class="score-bar ${pos === 1 ? 'leader' : ''}" style="width: ${scorePercentage}%"></div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                            <p style="color: #666; margin: 0;">
                                <strong>Best:</strong> ${bestPlayerText}
                            </p>
                            ${movementHTML}
                        </div>
                    </div>
                </div>
                
                <!-- Player Grid with Cut Line -->
                <div style="margin-top: 25px; padding-top: 25px; border-top: 2px solid rgba(0, 103, 71, 0.1);">
                    <h5 style="color: var(--text-light); font-size: 0.9em; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">
                        Team Roster
                    </h5>
                    <div class="player-grid">
                        ${team.players.map(p => {
                            const isBest = p.score === team.totalScore && !p.missedCut;
                            return `
                                <div class="player-mini ${p.missedCut ? 'missed-cut' : ''} ${isBest ? 'best-player-mini' : ''}">
                                    ${p.name}: ${formatScore(p.score)} ${isBest ? 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Â' : ''} ${p.missedCut ? 'ÃƒÂ¢Ã…Â¡Ã‚Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    teamLeaderboard.innerHTML = teamHTML;
    
    // Cut Line Visualization
    const cutLineDiv = document.getElementById('cutLineVisualization');
    if (cutLineDiv) {
        // Collect all players with their status
        const allPlayersForCut = [];
        teams.forEach(team => {
            team.players.forEach(p => {
                allPlayersForCut.push({...p, ownerName: team.participantName});
            });
        });
        
        allPlayersForCut.sort((a, b) => a.score - b.score);
        
        const madeCutCount = allPlayersForCut.filter(p => !p.missedCut).length;
        const missedCutCount = allPlayersForCut.filter(p => p.missedCut).length;
        
        cutLineDiv.innerHTML = `
            <div class="cut-line-container">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px;">
                        <div style="font-size: 3em; margin-bottom: 10px;">ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦</div>
                        <div style="font-size: 2em; font-weight: 700; color: #2e7d32;">${madeCutCount}</div>
                        <div style="color: #2e7d32; font-weight: 600; text-transform: uppercase; font-size: 0.9em; letter-spacing: 1px;">Made Cut</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-radius: 12px;">
                        <div style="font-size: 3em; margin-bottom: 10px;">ÃƒÂ¢Ã‚ÂÃ‚Â</div>
                        <div style="font-size: 2em; font-weight: 700; color: #c62828;">${missedCutCount}</div>
                        <div style="color: #c62828; font-weight: 600; text-transform: uppercase; font-size: 0.9em; letter-spacing: 1px;">Missed Cut</div>
                    </div>
                    <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); border-radius: 12px;">
                        <div style="font-size: 3em; margin-bottom: 10px;">âš ï¸</div>
                        <div style="font-size: 2em; font-weight: 700; color: #f57f17;">~50</div>
                        <div style="color: #f57f17; font-weight: 600; text-transform: uppercase; font-size: 0.9em; letter-spacing: 1px;">Cut Line</div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <h4 style="color: var(--text-light); font-size: 1em; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">
                        ÃƒÂ¢Ã…Â¡Ã‚Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â CUT LINE ÃƒÂ¢Ã…Â¡Ã‚Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â
                    </h4>
                    <div class="cut-line"></div>
                    <p style="color: var(--text-light); font-size: 0.9em; margin-top: 15px;">
                        Players above this line continue to the weekend
                    </p>
                </div>
                
                <div style="display: grid; gap: 10px; max-height: 400px; overflow-y: auto; padding: 10px;">
                    ${allPlayersForCut.slice(0, 60).map((p, i) => {
                        let status = '';
                        let statusClass = '';
                        
                        if (i < 45) {
                            status = 'SAFE';
                            statusClass = 'safe';
                        } else if (i < 52) {
                            status = 'BUBBLE';
                            statusClass = 'bubble';
                        } else {
                            status = 'CUT';
                            statusClass = 'cut';
                        }
                        
                        if (p.missedCut) {
                            status = 'CUT';
                            statusClass = 'cut';
                        }
                        
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: ${p.missedCut ? '#ffebee' : 'white'}; border-radius: 8px; border-left: 4px solid ${statusClass === 'safe' ? '#4caf50' : statusClass === 'bubble' ? '#fbc02d' : '#f44336'};">
                                <div>
                                    <strong>${i + 1}. ${p.name}</strong>
                                    <span style="color: #999; margin-left: 10px; font-size: 0.85em;">(${p.ownerName})</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <strong style="font-size: 1.1em;">${formatScore(p.score)}</strong>
                                    <span class="player-status ${statusClass}">${status}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // Individual leaderboard
    const allPlayers = [];
    teams.forEach(team => {
        team.players.forEach(p => {
            allPlayers.push({...p, ownerName: team.participantName});
        });
    });
    
    allPlayers.sort((a, b) => {
        if (a.missedCut && !b.missedCut) return 1;
        if (!a.missedCut && b.missedCut) return -1;
        return a.score - b.score;
    });
    
    let playerHTML = '<div style="display: grid; gap: 12px;">';
    allPlayers.forEach((p, i) => {
        playerHTML += `
            <div class="player-row ${p.missedCut ? 'missed-cut' : ''}" style="margin: 0;">
                <span>
                    <strong>${i + 1}.</strong> ${p.name}
                    <span style="color: #999; margin-left: 12px; font-size: 0.9em;">(${p.ownerName})</span>
                </span>
                <strong>${formatScore(p.score)} ${p.missedCut ? '(CUT)' : ''}</strong>
            </div>
        `;
    });
    playerHTML += '</div>';
    
    playerLeaderboard.innerHTML = playerHTML;
}

// ===== RESULTS TAB =====
function updateResultsView() {
    const winnerSection = document.getElementById('winnerSection');
    const finalStandings = document.getElementById('finalStandings');
    const tournamentStats = document.getElementById('tournamentStats');
    
    if (!winnerSection || !finalStandings || !tournamentStats) return;
    
    if (!draftComplete || teams.length === 0) {
        winnerSection.innerHTML = '<p style="color: #999;">Complete draft first!</p>';
        return;
    }
    
    const teamScores = teams.map(team => {
        const active = team.players.filter(p => !p.missedCut);
        const best = active.length > 0 ? Math.min(...active.map(p => p.score)) : 999;
        
        // Find ALL players tied for best
        const bestPlayers = active.filter(p => p.score === best);
        
        return {
            ...team,
            totalScore: best,
            bestPlayers: bestPlayers,
            isTied: bestPlayers.length > 1
        };
    }).sort((a, b) => a.totalScore - b.totalScore);
    
    const winner = teamScores[0];
    
    // Winner announcement
    const winnerPlayerText = winner.isTied 
        ? `${winner.bestPlayers.map(p => p.name).join(' & ')}`
        : winner.bestPlayers[0] ? winner.bestPlayers[0].name : 'None';
    
    winnerSection.innerHTML = `
        <div class="winner-announcement">
            <!-- Confetti Animation -->
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            <div class="confetti"></div>
            
            <div class="trophy">ðŸ†</div>
            <h2 style="font-size: 3.5em; margin: 20px 0;">
                ${winner.participantName}
            </h2>
            <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; margin: 20px 0; backdrop-filter: blur(10px);">
                <p style="font-size: 1.2em; color: white; font-weight: 400; margin-bottom: 10px; text-shadow: 1px 1px 3px rgba(0,0,0,0.2);">
                    ${winner.isTied ? 'ðŸ… Champion Players ðŸ…' : 'â­ Champion Player â­'}
                </p>
                <p style="font-size: 1.8em; color: white; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                    ${winnerPlayerText}
                </p>
                <p style="font-size: 2.5em; color: white; font-weight: 900; margin-top: 15px; text-shadow: 3px 3px 6px rgba(0,0,0,0.4);">
                    ${formatScore(winner.totalScore)}
                </p>
            </div>
            ${winner.isTied ? `
                <p style="font-size: 1em; color: rgba(255,255,255,0.95); margin-top: 20px; font-style: italic; background: rgba(0,0,0,0.2); padding: 12px 20px; border-radius: 10px; display: inline-block;">
                    ÃƒÂ¢Ã…Â¡Ã‚Â¡ Multiple players tied for team's best score
                </p>
            ` : ''}
            <p style="font-size: 1.1em; color: rgba(255,255,255,0.9); margin-top: 25px; font-weight: 500; letter-spacing: 2px;">
                ðŸŽ‰ MASTERS CHAMPION 2026 ðŸŽ‰
            </p>
        </div>
    `;
    
    // Standings
    let standingsHTML = '';
    teamScores.forEach((team, idx) => {
        const pos = idx + 1;
        let posClass = pos === 1 ? 'first' : pos === 2 ? 'second' : pos === 3 ? 'third' : '';
        
        const topPlayerText = team.isTied 
            ? `${team.bestPlayers.map(p => p.name).join(' & ')} (TIE)`
            : team.bestPlayers[0] ? team.bestPlayers[0].name : 'None';
        
        standingsHTML += `
            <div class="leaderboard-item">
                <div class="leaderboard-header">
                    <div class="leaderboard-position ${posClass}">${pos}</div>
                    <div style="flex: 1;">
                        <h4 style="font-family: 'Playfair Display', serif; font-size: 1.5em;">${team.participantName}</h4>
                        <p style="color: #666;">Top: ${topPlayerText}</p>
                    </div>
                    <div class="team-score" style="font-family: 'Playfair Display', serif;">${formatScore(team.totalScore)} ${team.isTied ? 'ÃƒÂ¢Ã…Â¡Ã‚Â¡' : ''}</div>
                </div>
            </div>
        `;
    });
    
    finalStandings.innerHTML = standingsHTML;
    
    // Stats
    const best = teamScores[0].totalScore;
    const worst = teamScores[teamScores.length - 1].totalScore;
    const avg = (teamScores.reduce((s, t) => s + t.totalScore, 0) / teamScores.length).toFixed(1);
    const madeCut = golfers.filter(g => !g.missedCut).length;
    const teamsWithTies = teamScores.filter(t => t.isTied).length;
    
    tournamentStats.innerHTML = `
        <div class="stat-card">
            <span class="stat-icon">ðŸ†</span>
            <h4>Champion Score</h4>
            <div class="stat-value">${formatScore(best)}</div>
            <p style="color: var(--text-light); font-size: 0.85em; margin-top: 10px;">Winning Performance</p>
        </div>
        <div class="stat-card">
            <span class="stat-icon">ðŸ“Š</span>
            <h4>Average Score</h4>
            <div class="stat-value">${formatScore(parseFloat(avg))}</div>
            <p style="color: var(--text-light); font-size: 0.85em; margin-top: 10px;">Field Average</p>
        </div>
        <div class="stat-card">
            <span class="stat-icon">ðŸ”¥</span>
            <h4>Last Place</h4>
            <div class="stat-value">${formatScore(worst)}</div>
            <p style="color: var(--text-light); font-size: 0.85em; margin-top: 10px;">Bottom Finisher</p>
        </div>
        <div class="stat-card">
            <span class="stat-icon">ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦</span>
            <h4>Made Cut</h4>
            <div class="stat-value">${madeCut}</div>
            <p style="color: var(--text-light); font-size: 0.85em; margin-top: 10px;">Players Advancing</p>
        </div>
        <div class="stat-card">
            <span class="stat-icon">ÃƒÂ¢Ã…Â¡Ã‚Â¡</span>
            <h4>Teams With Ties</h4>
            <div class="stat-value">${teamsWithTies}</div>
            <p style="color: var(--text-light); font-size: 0.85em; margin-top: 10px;">Tied Best Players</p>
        </div>
        <div class="stat-card">
            <span class="stat-icon">ðŸ“…</span>
            <h4>Total Teams</h4>
            <div class="stat-value">${teamScores.length}</div>
            <p style="color: var(--text-light); font-size: 0.85em; margin-top: 10px;">Participants</p>
        </div>
    `;
}

// ===== UTILITY =====
function formatScore(score) {
    if (score === 0) return 'E';
    if (score === 999 || score === undefined) return '-';
    return score > 0 ? `+${score}` : `${score}`;
}

// ===== CSV IMPORT FOR SCORES =====
function importScoresFromCSV() {
    const csvInput = document.getElementById('csvInput');
    if (!csvInput) return;
    
    const csvText = csvInput.value.trim();
    if (!csvText) {
        alert('Please paste CSV data first!');
        return;
    }
    
    try {
        const lines = csvText.split('\n').filter(line => line.trim());
        let updates = 0;
        let errors = [];
        
        lines.forEach((line, index) => {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length < 3) {
                errors.push(`Line ${index + 1}: Invalid format (need Name, Score, MissedCut)`);
                return;
            }
            
            const name = parts[0];
            const scoreStr = parts[1];
            const missedCutStr = parts[2].toLowerCase();
            
            // Parse score
            let score;
            if (scoreStr.toLowerCase() === 'e' || scoreStr === '0') {
                score = 0;
            } else {
                score = parseInt(scoreStr.replace('+', ''));
                if (isNaN(score)) {
                    errors.push(`Line ${index + 1}: Invalid score "${scoreStr}"`);
                    return;
                }
            }
            
            // Parse missed cut
            const missedCut = missedCutStr === 'true' || missedCutStr === 't' || missedCutStr === 'yes';
            
            // Find and update golfer
            const golfer = golfers.find(g => 
                g.name.toLowerCase().includes(name.toLowerCase()) || 
                name.toLowerCase().includes(g.name.toLowerCase())
            );
            
            if (golfer) {
                golfer.score = score;
                golfer.missedCut = missedCut;
                updates++;
            } else {
                errors.push(`Line ${index + 1}: Golfer "${name}" not found`);
            }
        });
        
        if (updates > 0) {
            saveToStorage();
            updateAllViews();
            
            // Update admin table if it exists
            if (typeof updatePlayerTable === 'function') {
                updatePlayerTable();
            }
            
            let message = `ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Updated ${updates} golfer${updates !== 1 ? 's' : ''}!`;
            if (errors.length > 0) {
                message += `\n\nâš ï¸ ${errors.length} error${errors.length !== 1 ? 's' : ''}:\n${errors.join('\n')}`;
            }
            
            // Show in admin status if available
            if (typeof showStatus === 'function') {
                const statusType = errors.length === 0 ? 'good' : 'warning';
                showStatus('csvStatus', message.replace(/\n/g, '<br>'), statusType);
            } else {
                alert(message);
            }
            
            // Clear input on success
            if (errors.length === 0) {
                csvInput.value = '';
            }
        } else {
            const errorMsg = 'ÃƒÂ¢Ã‚ÂÃ…â€™ No scores updated.\n\n' + errors.join('\n');
            if (typeof showStatus === 'function') {
                showStatus('csvStatus', errorMsg.replace(/\n/g, '<br>'), 'error');
            } else {
                alert(errorMsg);
            }
        }
    } catch (e) {
        console.error('CSV import error:', e);
        alert('Error parsing CSV data. Please check the format.');
    }
}

// ===== API & SHEETS INTEGRATION (To be implemented) =====
// TODO: Add Google Sheets integration for live score updates
// TODO: Add Masters API integration when available

async function fetchScoresFromSheets() {
    // Placeholder for Google Sheets integration
    console.log('Google Sheets integration - coming soon');
}

async function fetchScoresFromAPI() {
    // Placeholder for Masters API integration
    console.log('Masters API integration - coming soon');
}

// ===== FORM GUIDE TAB =====

function updateFormGuideView() {
    console.log('â†©ï¸ Updating Form Guide view...');
    
    const formGuideDisplay = document.getElementById('formGuideDisplay');
    if (!formGuideDisplay) return;
    
    // Get form guide data (check if it exists)
    if (typeof formGuideData === 'undefined') {
        formGuideDisplay.innerHTML = `
            <div class="alert alert-warning">
                <p><strong>Form Guide data not loaded</strong></p>
                <p>Make sure formGuide.js is included in index.html</p>
            </div>
        `;
        return;
    }
    
    // Get filtered and sorted data
    let displayData = [...formGuideData];
    
    // Apply filters (this will be handled by filterFormGuide function)
    displayData = applyFormGuideFilters(displayData);
    
    // Apply sorting (this will be handled by sortFormGuide function)
    displayData = applyFormGuideSorting(displayData);
    
    // Render the form guide
    renderFormGuide(displayData);
}

function renderFormGuide(data) {
    const formGuideDisplay = document.getElementById('formGuideDisplay');

    if (data.length === 0) {
        formGuideDisplay.innerHTML = `<div class="alert alert-info"><p>No golfers match your filters</p></div>`;
        return;
    }

    let html = `
        <div style="margin-bottom:10px;font-size:0.85em;color:#666;">
            Showing ${data.length} player${data.length !== 1 ? 's' : ''} — click any row to expand full details
        </div>
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.92em;">
            <thead>
                <tr style="background:var(--augusta-green);color:white;text-align:left;">
                    <th style="padding:10px 8px;">Player</th>
                    <th style="padding:10px 8px;text-align:center;">Rank</th>
                    <th style="padding:10px 8px;text-align:center;">Tier</th>
                    <th style="padding:10px 8px;text-align:center;">Form</th>
                    <th style="padding:10px 8px;text-align:center;">2025 Masters</th>
                    <th style="padding:10px 8px;text-align:center;">2026 Wins</th>
                    <th style="padding:10px 8px;text-align:center;">SG Total</th>
                    <th style="padding:10px 8px;text-align:center;">Augusta Best</th>
                </tr>
            </thead>
            <tbody id="formGuideTableBody">
    `;

    data.forEach((golfer, i) => {
        const formRating = golfer.formRating || 0;
        const formColor = formRating >= 8 ? '#28a745' : formRating >= 6 ? '#e6a817' : '#dc3545';
        const masters2025Pos = golfer.masters2025?.position
            ? `T-${golfer.masters2025.position}`
            : (golfer.masters2025?.madeCut === false ? 'MC' : 'N/A');
        const sgTotal = golfer.strokesGained?.total;
        const sgDisplay = sgTotal != null ? (sgTotal >= 0 ? '+' : '') + sgTotal.toFixed(2) : 'N/A';
        const sgColor = sgTotal != null && sgTotal > 0 ? '#28a745' : '#dc3545';
        const bestFinish = golfer.augustaHistory?.bestFinish;
        const bestFinishDisplay = bestFinish === 1 ? '🏆 Champion' : bestFinish ? `T-${bestFinish}` : 'Debut';
        const rowBg = i % 2 === 0 ? '#fff' : '#f8f9fa';

        const fieldPlayer = typeof masters2026Field !== 'undefined'
            ? masters2026Field.find(p => p.name === golfer.name)
            : null;
        const tier = fieldPlayer ? fieldPlayer.tier : '-';

        html += `
            <tr data-golfer-id="${golfer.golferId}"
                onclick="toggleFormRow('${golfer.golferId}', '${rowBg}')"
                style="background:${rowBg};cursor:pointer;border-bottom:1px solid #e0e0e0;"
                onmouseover="this.style.background='#e8f5e9'"
                onmouseout="this.style.background=this.dataset.open==='1'?'#f0f7f0':'${rowBg}'">
                <td style="padding:10px 8px;font-weight:600;color:var(--augusta-green);">${golfer.name}</td>
                <td style="padding:10px 8px;text-align:center;">${golfer.seasonStats?.worldRank || 'N/A'}</td>
                <td style="padding:10px 8px;text-align:center;">${tier}</td>
                <td style="padding:10px 8px;text-align:center;">
                    <span style="background:${formColor};color:white;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:0.9em;">${formRating.toFixed(1)}</span>
                </td>
                <td style="padding:10px 8px;text-align:center;">${masters2025Pos}</td>
                <td style="padding:10px 8px;text-align:center;">${golfer.seasonStats?.wins ?? 0}</td>
                <td style="padding:10px 8px;text-align:center;color:${sgColor};font-weight:600;">${sgDisplay}</td>
                <td style="padding:10px 8px;text-align:center;">${bestFinishDisplay}</td>
            </tr>
            <tr id="formDetails-${golfer.golferId}" style="display:none;background:#f0f7f0;">
                <td colspan="8" style="padding:0;">
                    <div id="formDetailsContent-${golfer.golferId}" style="padding:20px;"></div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    formGuideDisplay.innerHTML = html;
}

function toggleFormRow(golferId, rowBg) {
    const detailRow = document.getElementById('formDetails-' + golferId);
    const contentDiv = document.getElementById('formDetailsContent-' + golferId);
    const headerRow = document.querySelector('[data-golfer-id="' + golferId + '"]');
    if (!detailRow || !contentDiv) return;

    const isOpen = detailRow.style.display !== 'none';

    if (isOpen) {
        detailRow.style.display = 'none';
        if (headerRow) { headerRow.dataset.open = '0'; }
    } else {
        // Lazy-render details only when first opened
        if (!contentDiv.dataset.rendered) {
            const golfer = formGuideData.find(g => String(g.golferId) === String(golferId));
            if (golfer) {
                contentDiv.innerHTML = renderFormDetails(golfer);
                contentDiv.dataset.rendered = '1';
            }
        }
        detailRow.style.display = 'table-row';
        if (headerRow) { headerRow.dataset.open = '1'; }
    }
}

function renderFormDetails(golfer) {
    let html = '';
    
    // 2025 Masters Performance
    if (golfer.masters2025) {
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="color: var(--augusta-green); margin-top: 0;">2025 Masters Performance</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    <div>
                        <strong>Position:</strong> ${golfer.masters2025.position}${getOrdinal(golfer.masters2025.position)}
                    </div>
                    <div>
                        <strong>Score:</strong> ${formatScore(golfer.masters2025.score)}
                    </div>
                    <div>
                        <strong>Result:</strong> ${golfer.masters2025.madeCut ? 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Made Cut' : 'ÃƒÂ¢Ã‚ÂÃ…â€™ Missed Cut'}
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <strong>Rounds:</strong> 
                    ${golfer.masters2025.rounds.map((r, i) => `R${i+1}: ${r}`).join(' | ')}
                </div>
                ${golfer.masters2025.notes ? `<p style="margin: 10px 0 0 0; font-style: italic; color: #666;">${golfer.masters2025.notes}</p>` : ''}
            </div>
        `;
    }
    
    // 2026 Season Performance
    if (golfer.season2026 && golfer.season2026.length > 0) {
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="color: var(--augusta-green); margin-top: 0;">2026 Season (Recent Tournaments)</h4>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                        <thead>
                            <tr style="background: var(--augusta-green); color: white;">
                                <th style="padding: 8px; text-align: left;">Tournament</th>
                                <th style="padding: 8px; text-align: center;">Date</th>
                                <th style="padding: 8px; text-align: center;">Finish</th>
                                <th style="padding: 8px; text-align: center;">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${golfer.season2026.map((t, i) => `
                                <tr style="background: ${i % 2 === 0 ? 'white' : '#f8f9fa'}; border-bottom: 1px solid #ddd;">
                                    <td style="padding: 8px;">${t.tournament}</td>
                                    <td style="padding: 8px; text-align: center;">${formatDate(t.date)}</td>
                                    <td style="padding: 8px; text-align: center; font-weight: bold;">
                                        ${t.position}${getOrdinal(t.position)}
                                    </td>
                                    <td style="padding: 8px; text-align: center; font-weight: bold;">
                                        ${formatScore(t.score)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Season Stats
    if (golfer.seasonStats) {
        const stats = golfer.seasonStats;
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="color: var(--augusta-green); margin-top: 0;">2026 Season Statistics</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--augusta-green);">${stats.wins || 0}</div>
                        <div style="font-size: 0.85em; color: #666;">Wins</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--augusta-green);">${stats.top10s || 0}</div>
                        <div style="font-size: 0.85em; color: #666;">Top 10s</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--augusta-green);">${stats.avgFinish?.toFixed(1) || 'N/A'}</div>
                        <div style="font-size: 0.85em; color: #666;">Avg Finish</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5em; font-weight: bold; color: var(--augusta-green);">${stats.scoringAverage?.toFixed(2) || 'N/A'}</div>
                        <div style="font-size: 0.85em; color: #666;">Scoring Avg</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Strokes Gained
    if (golfer.strokesGained) {
        const sg = golfer.strokesGained;
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="color: var(--augusta-green); margin-top: 0;">Strokes Gained Statistics</h4>
                <div style="display: grid; gap: 10px;">
                    ${renderStrokesGainedBar('Total', sg.total, 3)}
                    ${renderStrokesGainedBar('Driving', sg.driving, 1.5)}
                    ${renderStrokesGainedBar('Approach', sg.approach, 1.5)}
                    ${renderStrokesGainedBar('Around Green', sg.aroundGreen, 1)}
                    ${renderStrokesGainedBar('Putting', sg.putting, 1)}
                </div>
            </div>
        `;
    }
    
    // Augusta History
    if (golfer.augustaHistory) {
        const history = golfer.augustaHistory;
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="color: var(--augusta-green); margin-top: 0;">Augusta National History</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
                    <div>
                        <strong>Appearances:</strong> ${history.appearances}
                    </div>
                    <div>
                        <strong>Best Finish:</strong> ${history.bestFinish}${getOrdinal(history.bestFinish)} (${history.bestFinishYear})
                    </div>
                    <div>
                        <strong>Top 10s:</strong> ${history.top10Finishes}
                    </div>
                    <div>
                        <strong>Cuts Made:</strong> ${history.cuts}/${history.appearances}
                    </div>
                    <div>
                        <strong>Avg Finish:</strong> ${history.avgFinish?.toFixed(1)}
                    </div>
                    <div>
                        <strong>Avg Score:</strong> ${history.avgScore?.toFixed(1)}
                    </div>
                </div>
                ${history.strengths && history.strengths.length > 0 ? `
                    <div style="margin-bottom: 10px;">
                        <strong style="color: green;">Strengths:</strong> ${history.strengths.join(', ')}
                    </div>
                ` : ''}
                ${history.weaknesses && history.weaknesses.length > 0 ? `
                    <div>
                        <strong style="color: #dc3545;">Weaknesses:</strong> ${history.weaknesses.join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Notes
    if (golfer.notes) {
        html += `
            <div style="padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <strong>Analysis:</strong> ${golfer.notes}
            </div>
        `;
    }
    
    return html;
}

function renderStrokesGainedBar(label, value, max) {
    const percentage = Math.min(Math.abs(value) / max * 100, 100);
    const isPositive = value >= 0;
    const color = isPositive ? '#28a745' : '#dc3545';
    
    return `
        <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: bold;">${label}</span>
                <span style="font-weight: bold; color: ${color};">${value > 0 ? '+' : ''}${value.toFixed(2)}</span>
            </div>
            <div style="width: 100%; height: 20px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: ${color}; transition: width 0.3s;"></div>
            </div>
        </div>
    `;
}

function toggleFormDetails(golferId) {
    const details = document.getElementById(`formDetails-${golferId}`);
    const button = details.previousElementSibling;
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        button.textContent = 'Hide Form Guide â–²';
    } else {
        details.style.display = 'none';
        button.textContent = 'View Full Form Guide â–¼';
    }
}

function applyFormGuideFilters(data) {
    const searchTerm = document.getElementById('formGuideSearch')?.value.toLowerCase() || '';
    const filterType = document.getElementById('formGuideFilter')?.value || 'all';
    
    let filtered = data;
    
    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(g => g.name.toLowerCase().includes(searchTerm));
    }
    
    // Apply filter
    switch(filterType) {
        case 'highForm':
            filtered = filtered.filter(g => g.formRating >= 8.0);
            break;
        case 'majorWinners':
            filtered = filtered.filter(g => g.augustaHistory?.bestFinish === 1);
            break;
        case 'augustaWinners':
            filtered = filtered.filter(g => g.augustaHistory?.bestFinish === 1);
            break;
        case 'topStrokes':
            filtered = filtered.filter(g => g.strokesGained?.total >= 2.0);
            break;
    }
    
    return filtered;
}

function applyFormGuideSorting(data) {
    const sortBy = document.getElementById('formGuideSortBy')?.value || 'rank';
    
    let sorted = [...data];
    
    switch(sortBy) {
        case 'rank':
            sorted.sort((a, b) => (a.seasonStats?.worldRank || 999) - (b.seasonStats?.worldRank || 999));
            break;
        case 'form':
            sorted.sort((a, b) => (b.formRating || 0) - (a.formRating || 0));
            break;
        case 'masters2025':
            sorted.sort((a, b) => (a.masters2025?.position || 999) - (b.masters2025?.position || 999));
            break;
        case 'strokesGained':
            sorted.sort((a, b) => (b.strokesGained?.total || 0) - (a.strokesGained?.total || 0));
            break;
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    return sorted;
}

function filterFormGuide() {
    updateFormGuideView();
}

function sortFormGuide() {
    updateFormGuideView();
}

// Helper functions
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ===== UI FEEDBACK HELPERS =====

/**
 * Show a temporary status message to the user
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - How long to show (ms), default 3000
 */
function showStatusMessage(message, type = 'info', duration = 3000) {
    // Remove any existing status messages
    const existing = document.querySelectorAll('.status-message');
    existing.forEach(el => el.remove());
    
    // Create new status message
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    // Auto-remove after duration
    setTimeout(() => {
        statusDiv.style.opacity = '0';
        setTimeout(() => statusDiv.remove(), 300);
    }, duration);
}

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...') {
    // Remove existing overlay if any
    hideLoading();
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 20px; font-size: 1.1em;">${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Sanitize user input
 */
function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, '');
}
// ==============================================
// NEW TAB VISIBILITY AND CONTROL FUNCTIONS
// ==============================================

// DISABLED: All tabs now always visible for better UX
// Update tab visibility based on current state
function updateTabVisibility() {
    // Function disabled - all tabs are now always visible
    // This provides better user experience and avoids tab visibility bugs
    return;
    
    /* ORIGINAL CODE COMMENTED OUT
    // Use global variables instead of reading from localStorage
    // (Global variables are kept in sync by Firebase listeners)
    
    // Join tab - HIDE when signup closes
    const joinTab = document.getElementById('tab-join');
    if (joinTab) {
        joinTab.style.display = signupClosed ? 'none' : 'inline-block';
    }
    
    // Draft tab - SHOW when signup closes (to display draft order and conduct draft)
    const draftTab = document.getElementById('tab-draft');
    if (draftTab) {
        draftTab.style.display = signupClosed ? 'inline-block' : 'none';
    }
    
    // Teams tab - show when draft is complete
    const teamsTab = document.getElementById('tab-teams');
    if (teamsTab) {
        teamsTab.style.display = draftComplete ? 'inline-block' : 'none';
    }
    
    // Leaderboard tab - show when draft is complete
    const leaderboardTab = document.getElementById('tab-leaderboard');
    if (leaderboardTab) {
        leaderboardTab.style.display = draftComplete ? 'inline-block' : 'none';
    }
    
    // Results tab - only show when tournament is concluded
    const resultsTab = document.getElementById('tab-results');
    if (resultsTab) {
        resultsTab.style.display = tournamentConcluded ? 'inline-block' : 'none';
    }
    
    // Auto-switch tabs if needed
    if (signupClosed && document.getElementById('joinTab') && document.getElementById('joinTab').classList.contains('active')) {
        switchTab('draft');
    }
    */
}

// Toggle between sweepstake and tournament leaderboards
function toggleLeaderboard(view) {
    const sweepstakeDiv = document.getElementById('sweepstakeLeaderboard');
    const tournamentDiv = document.getElementById('tournamentLeaderboard');
    const sweepstakeBtn = document.getElementById('toggleSweepstake');
    const tournamentBtn = document.getElementById('toggleTournament');
    
    if (view === 'sweepstake') {
        sweepstakeDiv.style.display = 'block';
        tournamentDiv.style.display = 'none';
        sweepstakeBtn.style.background = '#006747';
        sweepstakeBtn.style.color = 'white';
        tournamentBtn.style.background = 'transparent';
        tournamentBtn.style.color = '#333';
        renderSweepstakeLeaderboard();
    } else {
        sweepstakeDiv.style.display = 'none';
        tournamentDiv.style.display = 'block';
        sweepstakeBtn.style.background = 'transparent';
        sweepstakeBtn.style.color = '#333';
        tournamentBtn.style.background = '#006747';
        tournamentBtn.style.color = 'white';
        renderTournamentLeaderboard();
    }
}

// Render sweepstake leaderboard (teams ranked by best player)
function renderSweepstakeLeaderboard() {
    const container = document.getElementById('teamStandings');
    if (!container) return;
    
    if (teams.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No teams yet. Complete the draft first!</p>';
        return;
    }
    
    // Get scores for each team
    const teamScores = teams.map(team => {
        const activePlayers = team.players.filter(p => !p.missedCut);
        const cutPlayers = team.players.filter(p => p.missedCut);
        const bestPlayer = activePlayers.length > 0 
            ? activePlayers.reduce((best, current) => current.score < best.score ? current : best)
            : team.players[0];
        
        return {
            team: team,
            bestPlayer: bestPlayer,
            bestScore: bestPlayer.score,
            activePlayers: activePlayers.length,
            cutPlayers: cutPlayers.length,
            totalPlayers: team.players.length
        };
    });
    
    // Sort by best player score (lowest first)
    teamScores.sort((a, b) => a.bestScore - b.bestScore);
    
    let html = '<div style="max-width: 800px; margin: 0 auto;">';
    
    teamScores.forEach((ts, index) => {
        const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#006747';
        const scoreColor = ts.bestScore < 0 ? '#28a745' : ts.bestScore > 0 ? '#dc3545' : '#666';
        const scoreDisplay = ts.bestScore === 0 ? 'E' : (ts.bestScore > 0 ? '+' : '') + ts.bestScore;
        
        html += `
            <div class="team-card" style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid ${rankColor};">
                <div onclick="toggleTeamDetails('team-${index}')" style="cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 1.5em; font-weight: bold; color: ${rankColor}; margin-right: 10px;">#${index + 1}</span>
                            <span style="font-size: 1.2em; font-weight: bold;">${ts.team.participantName}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.8em; font-weight: bold; color: ${scoreColor};">${scoreDisplay}</div>
                            <div style="font-size: 0.9em; color: #666;">Best Player</div>
                        </div>
                    </div>
                    <div style="margin-top: 10px; color: #666; font-size: 0.95em;">
                        <strong>${ts.bestPlayer.name}</strong> â€¢ 
                        ${ts.activePlayers} active â€¢ ${ts.cutPlayers} cut
                        <span style="float: right;">â–¼ Click to expand</span>
                    </div>
                </div>
                <div id="team-${index}-details" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                    <h4 style="margin: 0 0 10px 0; color: #006747;">Full Roster:</h4>
                    ${ts.team.players.map(p => {
                        const pScoreColor = p.score < 0 ? '#28a745' : p.score > 0 ? '#dc3545' : '#666';
                        const pScoreDisplay = p.score === 0 ? 'E' : (p.score > 0 ? '+' : '') + p.score;
                        return `
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                <span style="${p.missedCut ? 'text-decoration: line-through; color: #999;' : ''}">${p.name}</span>
                                <span style="font-weight: bold; color: ${pScoreColor};">${p.missedCut ? 'CUT' : pScoreDisplay}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Toggle team details
function toggleTeamDetails(teamId) {
    const details = document.getElementById(teamId + '-details');
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
}

// Render tournament leaderboard (all golfers)
function renderTournamentLeaderboard() {
    const container = document.getElementById('mastersLeaderboard');
    if (!container) return;
    
    // Get current golfer data with scores
    const storedScores = localStorage.getItem(CONFIG.storageKeys.playerScores);
    let currentGolfers = golfers;
    
    if (storedScores) {
        try {
            currentGolfers = JSON.parse(storedScores);
        } catch (e) {
            console.error('Error parsing stored scores:', e);
        }
    }
    
    // Sort by score (lowest first)
    const sortedGolfers = [...currentGolfers].sort((a, b) => {
        if (a.missedCut && !b.missedCut) return 1;
        if (!a.missedCut && b.missedCut) return -1;
        return a.score - b.score;
    });
    
    let html = '<div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += `
        <thead>
            <tr style="border-bottom: 2px solid #006747; color: #006747;">
                <th style="padding: 12px; text-align: left;">Pos</th>
                <th style="padding: 12px; text-align: left;">Player</th>
                <th style="padding: 12px; text-align: center;">Score</th>
                <th style="padding: 12px; text-align: center;">Status</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    sortedGolfers.forEach((golfer, index) => {
        const scoreColor = golfer.score < 0 ? '#28a745' : golfer.score > 0 ? '#dc3545' : '#666';
        const scoreDisplay = golfer.score === 0 ? 'E' : (golfer.score > 0 ? '+' : '') + golfer.score;
        const rowBg = index % 2 === 0 ? '#f8f9fa' : 'white';
        
        html += `
            <tr style="background: ${rowBg}; border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: bold;">${index + 1}</td>
                <td style="padding: 12px;">${golfer.name}</td>
                <td style="padding: 12px; text-align: center; font-weight: bold; color: ${scoreColor};">${golfer.missedCut ? '--' : scoreDisplay}</td>
                <td style="padding: 12px; text-align: center;">${golfer.missedCut ? '<span style="color: #dc3545;">CUT</span>' : '<span style="color: #28a745;">Active</span>'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Render teams tab (just rosters, no scores)
function renderTeamsTab() {
    const container = document.getElementById('teamsDisplay');
    if (!container) return;
    
    if (teams.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No teams yet. Complete the draft first!</p>';
        return;
    }
    
    let html = '<div style="max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
    
    teams.forEach((team, index) => {
        html += `
            <div class="team-roster-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div onclick="toggleTeamRoster('roster-${index}')" style="cursor: pointer; border-bottom: 2px solid #006747; padding-bottom: 10px; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #006747;">${team.participantName}</h3>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9em;">${team.players.length} golfers â€¢ Click to expand</p>
                </div>
                <div id="roster-${index}-details" style="display: none;">
                    ${team.players.map(p => `
                        <div style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            ${p.name}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Toggle team roster
function toggleTeamRoster(rosterId) {
    const details = document.getElementById(rosterId + '-details');
    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
    }
}

