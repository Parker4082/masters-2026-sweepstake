/* ============================================
   MASTERS TOURNAMENT 2026 - APPLICATION LOGIC
   Main functionality for draft, teams, leaderboard, and results
   ============================================ */

// ===== CONFIGURATION =====
const CONFIG = {
    dataSource: 'local', // Options: 'local', 'sheets', 'api'
    sheetsUrl: '', 
    apiUrl: '', 
    autoSyncInterval: 5 * 60 * 1000, 
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
        tournamentConfig: 'masters2026_tournamentConfig'
    }
};

// ===== STATE MANAGEMENT =====
let state = {
    participants: [],
    teams: [],
    draftComplete: false,
    playerScores: {},
    signupClosed: false,
    currentTab: 'home'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    console.log('⛳ Initializing Masters 2026 App...');
    
    // 1. Load data from storage/Firebase
    await loadInitialData();
    
    // 2. Setup navigation
    setupNavigation();
    
    // 3. Render current view
    renderCurrentTab();
    
    // 4. Start sync interval
    setInterval(syncData, CONFIG.autoSyncInterval);
}

// ===== DATA FUNCTIONS =====
async function loadInitialData() {
    // Attempt to load from Firebase if available, else local
    if (typeof getData === 'function') {
        const cloudParticipants = await getData('participants');
        const cloudTeams = await getData('teams');
        
        if (cloudParticipants) state.participants = cloudParticipants;
        if (cloudTeams) state.teams = cloudTeams;
    } else {
        const localParticipants = localStorage.getItem(CONFIG.storageKeys.participants);
        if (localParticipants) state.participants = JSON.parse(localParticipants);
    }
}

async function syncData() {
    console.log('🔄 Syncing data...');
    // Refresh scores and leaderboard logic here
}

// ===== NAVIGATION & RENDERING =====
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.getAttribute('data-tab');
            switchTab(tab);
        });
    });
}

function switchTab(tabId
