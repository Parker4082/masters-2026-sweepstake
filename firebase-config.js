/* ============================================
   FIREBASE CONFIGURATION & INITIALIZATION
   Multi-user real-time database for Masters 2026 Sweepstake
   ============================================ */

// ========================================
// TODO: REPLACE THIS WITH YOUR FIREBASE CONFIG
// ========================================
// Get your config from: https://console.firebase.google.com
// 1. Go to Project Settings
// 2. Scroll to "Your apps" section
// 3. Click the </> icon to add a web app
// 4. Copy the firebaseConfig object
// 5. Paste it below to replace the placeholder

const firebaseConfig = {
  apiKey: "AIzaSyDmq4HnAAHSoqMyRN75TxoiRzvC7Jhkqss",
  authDomain: "masters-2026-sweepstake.firebaseapp.com",
  databaseURL: "https://masters-2026-sweepstake-default-rtdb.firebaseio.com",
  projectId: "masters-2026-sweepstake",
  storageBucket: "masters-2026-sweepstake.firebasestorage.app",
  messagingSenderId: "1024936985932",
  appId: "1:1024936985932:web:f87765cb9f19661f4a3be9"
};

// ========================================
// FIREBASE INITIALIZATION
// ========================================

// Initialize Firebase
let app, database;
let firebaseInitialized = false;

try {
    // Check if Firebase config is set up
    if (firebaseConfig.apiKey === "YOUR-API-KEY-HERE") {
        console.warn("⚠️ Firebase not configured yet. Using localStorage fallback.");
        console.warn("📝 See firebase-config.js for setup instructions.");
        firebaseInitialized = false;
    } else {
        app = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        firebaseInitialized = true;
        console.log("✅ Firebase initialized successfully!");
    }
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    console.warn("📝 Falling back to localStorage");
    firebaseInitialized = false;
}

// ========================================
// DATABASE HELPER FUNCTIONS
// ========================================

/**
 * Save data to Firebase or localStorage fallback
 * @param {string} path - Database path (e.g., "participants", "draftState")
 * @param {any} data - Data to save
 * @param {number} retries - Number of retry attempts (default: 3)
 */
async function saveData(path, data, retries = 3) {
    if (firebaseInitialized) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await database.ref(path).set(data);
                console.log(`✅ Saved to Firebase: ${path}`);
                return { success: true, location: 'firebase' };
            } catch (error) {
                console.error(`❌ Firebase save error (attempt ${attempt}/${retries}): ${path}`, error);
                
                if (attempt === retries) {
                    // Final attempt failed - use localStorage fallback
                    console.warn(`⚠️ Falling back to localStorage for: ${path}`);
                    localStorage.setItem(`masters2026_${path}`, JSON.stringify(data));
                    return { success: true, location: 'localStorage', error };
                }
                
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
        }
    } else {
        // Use localStorage as fallback
        localStorage.setItem(`masters2026_${path}`, JSON.stringify(data));
        console.log(`💾 Saved to localStorage: ${path}`);
        return { success: true, location: 'localStorage' };
    }
}

/**
 * Load data from Firebase or localStorage fallback
 * @param {string} path - Database path
 * @returns {Promise<any>} - Retrieved data
 */
async function loadData(path) {
    if (firebaseInitialized) {
        try {
            const snapshot = await database.ref(path).once('value');
            const data = snapshot.val();
            console.log(`✅ Loaded from Firebase: ${path}`, data ? 'Data found' : 'No data');
            return data;
        } catch (error) {
            console.error(`❌ Firebase load error: ${path}`, error);
            // Fallback to localStorage
            const stored = localStorage.getItem(`masters2026_${path}`);
            return stored ? JSON.parse(stored) : null;
        }
    } else {
        // Use localStorage as fallback
        const stored = localStorage.getItem(`masters2026_${path}`);
        const data = stored ? JSON.parse(stored) : null;
        console.log(`💾 Loaded from localStorage: ${path}`, data ? 'Data found' : 'No data');
        return data;
    }
}

/**
 * Delete data from Firebase or localStorage
 * @param {string} path - Database path
 */
async function deleteData(path) {
    if (firebaseInitialized) {
        try {
            await database.ref(path).remove();
            console.log(`🗑️ Deleted from Firebase: ${path}`);
        } catch (error) {
            console.error(`❌ Firebase delete error: ${path}`, error);
            localStorage.removeItem(`masters2026_${path}`);
        }
    } else {
        localStorage.removeItem(`masters2026_${path}`);
        console.log(`🗑️ Deleted from localStorage: ${path}`);
    }
}

/**
 * Listen for real-time updates from Firebase
 * @param {string} path - Database path
 * @param {function} callback - Function to call when data changes
 */
function listenToData(path, callback) {
    if (firebaseInitialized) {
        database.ref(path).on('value', (snapshot) => {
            const data = snapshot.val();
            console.log(`🔔 Firebase update: ${path}`);
            callback(data);
        });
    } else {
        // localStorage doesn't have real-time updates
        // Initial load only
        const stored = localStorage.getItem(`masters2026_${path}`);
        const data = stored ? JSON.parse(stored) : null;
        callback(data);
    }
}

/**
 * Stop listening to a Firebase path
 * @param {string} path - Database path
 */
function stopListening(path) {
    if (firebaseInitialized) {
        database.ref(path).off();
        console.log(`🔕 Stopped listening: ${path}`);
    }
}

// ========================================
// MIGRATION HELPER (One-time use)
// ========================================

/**
 * Migrate data from localStorage to Firebase
 * Run this once after setting up Firebase to transfer existing data
 */
async function migrateToFirebase() {
    if (!firebaseInitialized) {
        console.error("❌ Firebase not initialized. Cannot migrate.");
        return;
    }
    
    console.log("🚀 Starting migration from localStorage to Firebase...");
    
    const keysToMigrate = [
        'participants',
        'teams',
        'draftComplete',
        'playerScores',
        'signupClosed',
        'draftOrder',
        'draftedPlayers',
        'snakeDraftComplete',
        'draftInProgress',
        'currentPickStartTime',
        'autoPickComplete',
        'participantEmails'
    ];
    
    let migrated = 0;
    
    for (const key of keysToMigrate) {
        const localKey = `masters2026_${key}`;
        const stored = localStorage.getItem(localKey);
        
        if (stored) {
            try {
                const data = JSON.parse(stored);
                await saveData(key, data);
                migrated++;
                console.log(`✅ Migrated: ${key}`);
            } catch (error) {
                // Try saving as string if JSON parse fails
                await saveData(key, stored);
                migrated++;
                console.log(`✅ Migrated (as string): ${key}`);
            }
        }
    }
    
    console.log(`✅ Migration complete! ${migrated} items transferred to Firebase.`);
    alert(`Migration successful!\n${migrated} items moved to Firebase.\n\nYou can now safely clear localStorage if desired.`);
}

// ========================================
// FIREBASE DATABASE STRUCTURE
// ========================================
/*
masters2026/
  ├── participants/          Array of participant objects
  │   └── [id]/
  │       ├── name
  │       ├── email
  │       └── id
  │
  ├── draftOrder/            Array of participants in draft order
  │
  ├── draftState/            Current draft state
  │   ├── signupClosed       Boolean
  │   ├── draftInProgress    Boolean
  │   ├── draftComplete      Boolean
  │   ├── snakeDraftComplete Boolean
  │   ├── currentPick        Number
  │   ├── currentRound       Number
  │   └── currentPickStartTime  Timestamp
  │
  ├── draftedPlayers/        Array of draft picks
  │   └── [index]/
  │       ├── participantId
  │       ├── participantName
  │       ├── golferId
  │       ├── golferName
  │       ├── pickNumber
  │       ├── round
  │       └── timestamp
  │
  ├── teams/                 Array of team objects
  │   └── [id]/
  │       ├── participantId
  │       ├── participantName
  │       ├── participantEmail
  │       └── golfers/       Array of golfer objects
  │
  └── scores/                Golfer scores (synced from data.js)
      └── [golferId]/
          ├── name
          ├── score
          ├── missedCut
          └── rounds
*/

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseInitialized,
        saveData,
        loadData,
        deleteData,
        listenToData,
        stopListening,
        migrateToFirebase
    };
}

// ========================================
// CONNECTION STATUS MONITORING
// ========================================

let connectionStatus = 'unknown';
let statusIndicator = null;

/**
 * Monitor Firebase connection status
 */
function monitorConnection() {
    if (!firebaseInitialized) return;
    
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
        connectionStatus = snapshot.val() ? 'connected' : 'disconnected';
        updateConnectionIndicator();
        
        if (connectionStatus === 'connected') {
            console.log('🟢 Firebase connected');
        } else {
            console.warn('🔴 Firebase disconnected');
        }
    });
}

/**
 * Create and update connection status indicator in UI
 */
function updateConnectionIndicator() {
    // Create indicator if it doesn't exist
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'connection-status';
        statusIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            z-index: 9999;
            display: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.3s;
        `;
        document.body.appendChild(statusIndicator);
    }
    
    // Update indicator based on status
    if (connectionStatus === 'disconnected') {
        statusIndicator.style.display = 'block';
        statusIndicator.style.background = '#dc3545';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = '🔴 Offline - Changes saved locally';
    } else if (connectionStatus === 'connected') {
        statusIndicator.style.display = 'block';
        statusIndicator.style.background = '#28a745';
        statusIndicator.style.color = 'white';
        statusIndicator.textContent = '🟢 Connected';
        
        // Hide after 2 seconds
        setTimeout(() => {
            statusIndicator.style.display = 'none';
        }, 2000);
    }
}

// Start monitoring when Firebase is initialized
if (firebaseInitialized) {
    monitorConnection();
}
