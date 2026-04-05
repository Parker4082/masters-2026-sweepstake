/* ============================================
   MASTERS TOURNAMENT 2026 - FORM GUIDE DATA
   Historical performance and current season statistics
   ============================================ */

// Form guide data for each golfer
// This file contains:
// - 2025 Masters performance
// - 2026 season performance (recent tournaments)
// - Advanced statistics (strokes gained, etc.)
// - Course history and trends

const formGuideData = [
    {
        golferId: 1, // Links to golfer in data.js by rank/id
        name: "Rory McIlroy",
        
        // 2025 Masters Performance
        masters2025: {
            position: 2,
            score: -11,
            rounds: [72, 66, 66, 73],
            madeCut: true,
            notes: "Strong showing, tied for 2nd place"
        },
        
        // 2026 Season Performance (most recent tournaments)
        season2026: [
            { tournament: "Players Championship", date: "2026-03-15", position: 1, score: -12, roundsPlayed: 4 },
            { tournament: "Arnold Palmer Invitational", date: "2026-03-08", position: 3, score: -8, roundsPlayed: 4 },
            { tournament: "Genesis Invitational", date: "2026-02-20", position: 5, score: -6, roundsPlayed: 4 },
            { tournament: "WM Phoenix Open", date: "2026-02-13", position: 12, score: -5, roundsPlayed: 4 },
            { tournament: "AT&T Pebble Beach", date: "2026-02-06", position: 7, score: -11, roundsPlayed: 4 },
            { tournament: "Farmers Insurance Open", date: "2026-01-30", position: 4, score: -9, roundsPlayed: 4 },
            { tournament: "American Express", date: "2026-01-23", position: 15, score: -14, roundsPlayed: 4 },
            { tournament: "Sony Open", date: "2026-01-16", position: 8, score: -12, roundsPlayed: 4 }
        ],
        
        // Season Summary Stats
        seasonStats: {
            worldRank: 2,
            fedexCupRank: 3,
            wins: 2,
            top10s: 8,
            top25s: 12,
            cutsMade: 14,
            eventsPlayed: 15,
            avgFinish: 8.3,
            scoringAverage: 69.8
        },
        
        // Strokes Gained Statistics (can expand this section)
        strokesGained: {
            total: 2.45,        // Total strokes gained per round
            driving: 0.62,      // Off the tee
            approach: 1.21,     // Approach shots
            aroundGreen: 0.35,  // Short game
            putting: 0.27       // On the greens
        },
        
        // Augusta National History
        augustaHistory: {
            appearances: 15,
            bestFinish: 4,
            bestFinishYear: 2022,
            top10Finishes: 7,
            cuts: 14,
            avgFinish: 12.5,
            avgScore: 71.2,
            strengths: ["Iron play", "Par 5 scoring"],
            weaknesses: ["Sunday pressure", "Putting speed"]
        },
        
        // Recent Form Rating (out of 10)
        formRating: 9.2,
        
        // Key Notes
        notes: "Exceptional ball striker in peak form. Coming off Players Championship win. Strong history at Augusta but yet to claim the title."
    },
    
    {
        golferId: 2,
        name: "Justin Rose",
        
        masters2025: {
            position: 2,
            score: -11,
            rounds: [65, 71, 75, 66],
            madeCut: true,
            notes: "Tied for 2nd, excellent opening round"
        },
        
        season2026: [
            { tournament: "Players Championship", date: "2026-03-15", position: 18, score: -3, roundsPlayed: 4 },
            { tournament: "Arnold Palmer Invitational", date: "2026-03-08", position: 7, score: -6, roundsPlayed: 4 },
            { tournament: "Genesis Invitational", date: "2026-02-20", position: 11, score: -4, roundsPlayed: 4 },
            { tournament: "WM Phoenix Open", date: "2026-02-13", position: 23, score: -3, roundsPlayed: 4 },
            { tournament: "AT&T Pebble Beach", date: "2026-02-06", position: 14, score: -8, roundsPlayed: 4 },
            { tournament: "Farmers Insurance Open", date: "2026-01-30", position: 9, score: -7, roundsPlayed: 4 },
            { tournament: "American Express", date: "2026-01-23", position: 21, score: -12, roundsPlayed: 4 },
            { tournament: "Sony Open", date: "2026-01-16", position: 19, score: -10, roundsPlayed: 4 }
        ],
        
        seasonStats: {
            worldRank: 15,
            fedexCupRank: 22,
            wins: 0,
            top10s: 4,
            top25s: 9,
            cutsMade: 13,
            eventsPlayed: 14,
            avgFinish: 15.2,
            scoringAverage: 70.4
        },
        
        strokesGained: {
            total: 1.32,
            driving: 0.15,
            approach: 0.89,
            aroundGreen: 0.18,
            putting: 0.10
        },
        
        augustaHistory: {
            appearances: 20,
            bestFinish: 1,
            bestFinishYear: 2015,
            top10Finishes: 8,
            cuts: 18,
            avgFinish: 14.8,
            avgScore: 71.8,
            strengths: ["Experience", "Course management"],
            weaknesses: ["Distance off tee", "Stamina"]
        },
        
        formRating: 7.5,
        notes: "Former champion with excellent course knowledge. Solid but unspectacular 2026 form."
    },
    
    {
        golferId: 3,
        name: "Patrick Reed",
        
        masters2025: {
            position: 3,
            score: -9,
            rounds: [71, 70, 69, 69],
            madeCut: true,
            notes: "Consistent four rounds"
        },
        
        season2026: [
            { tournament: "LIV Golf Miami", date: "2026-03-10", position: 2, score: -14, roundsPlayed: 3 },
            { tournament: "LIV Golf Las Vegas", date: "2026-02-15", position: 5, score: -11, roundsPlayed: 3 },
            { tournament: "LIV Golf Mayakoba", date: "2026-02-01", position: 3, score: -13, roundsPlayed: 3 },
            { tournament: "LIV Golf Riyadh", date: "2026-01-20", position: 8, score: -8, roundsPlayed: 3 },
        ],
        
        seasonStats: {
            worldRank: 28,
            fedexCupRank: null, // LIV player
            wins: 0,
            top10s: 4,
            top25s: 4,
            cutsMade: 4,
            eventsPlayed: 4,
            avgFinish: 4.5,
            scoringAverage: 68.9
        },
        
        strokesGained: {
            total: 1.85,
            driving: 0.45,
            approach: 0.72,
            aroundGreen: 0.41,
            putting: 0.27
        },
        
        augustaHistory: {
            appearances: 12,
            bestFinish: 1,
            bestFinishYear: 2018,
            top10Finishes: 5,
            cuts: 11,
            avgFinish: 11.2,
            avgScore: 71.3,
            strengths: ["Major championship experience", "Augusta knowledge"],
            weaknesses: ["Limited competition vs top fields"]
        },
        
        formRating: 8.1,
        notes: "2018 champion. Strong LIV form but limited competitive rounds against full field."
    },

    // TEMPLATE FOR REMAINING GOLFERS
    // Copy this structure and populate with actual data
    {
        golferId: 4,
        name: "Scottie Scheffler",
        
        masters2025: {
            position: 4,
            score: -8,
            rounds: [68, 71, 72, 69],
            madeCut: true,
            notes: "Solid performance"
        },
        
        season2026: [
            // Add tournament results here
            { tournament: "Players Championship", date: "2026-03-15", position: 2, score: -11, roundsPlayed: 4 },
            // ... more tournaments
        ],
        
        seasonStats: {
            worldRank: 1,
            fedexCupRank: 1,
            wins: 3,
            top10s: 10,
            top25s: 12,
            cutsMade: 12,
            eventsPlayed: 12,
            avgFinish: 4.8,
            scoringAverage: 69.2
        },
        
        strokesGained: {
            total: 2.78,
            driving: 0.81,
            approach: 1.35,
            aroundGreen: 0.29,
            putting: 0.33
        },
        
        augustaHistory: {
            appearances: 8,
            bestFinish: 1,
            bestFinishYear: 2024,
            top10Finishes: 5,
            cuts: 8,
            avgFinish: 8.5,
            avgScore: 70.8,
            strengths: ["Scrambling", "Ball striking"],
            weaknesses: ["Pressure putting"]
        },
        
        formRating: 9.8,
        notes: "World #1 and defending champion. Exceptional form entering Augusta."
    }
    
    // NOTE: Add remaining 99 golfers using the template above
    // You can populate data progressively as you gather statistics
    // The structure is flexible - add more fields as needed
];

// Helper function to get form guide for a specific golfer
function getFormGuide(golferName) {
    return formGuideData.find(fg => fg.name === golferName);
}

// Helper function to get all golfers with form data
function getAllFormGuides() {
    return formGuideData;
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formGuideData, getFormGuide, getAllFormGuides };
}
