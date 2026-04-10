/* ============================================
   MASTERS TOURNAMENT 2026 - GOLFER DATA
   Data source: Official 2026 Masters field (91 players confirmed)
   Updated: April 10, 2026 – Round 2 in progress
   R1 complete. R2 scores reflect latest live updates (partial round for late starters).
   Cut line projected at +3. Top 50 and ties advance.
   ============================================ */

// Complete field of golfers for the Masters Tournament
// Each golfer has: name, score, rank, missedCut status, round scores, and tier
// Tiers based on OWGR at time of Masters (lower tier number = higher ranked player)
// score = total to par (R1 complete + R2 in progress where available)
const masters2026Field = [
    // TIER 1 - World top 10
    { name: "Scottie Scheffler", score: 0, rank: 1, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Tommy Fleetwood", score: -1, rank: 2, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Rory McIlroy", score: -5, rank: 3, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Cameron Young", score: 1, rank: 4, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Justin Rose", score: -4, rank: 5, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Collin Morikawa", score: 2, rank: 6, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Xander Schauffele", score: -2, rank: 7, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Russell Henley", score: 1, rank: 8, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Robert MacIntyre", score: 8, rank: 9, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },
    { name: "Chris Gotterup", score: 1, rank: 10, missedCut: false, rounds: [0, 0, 0, 0], tier: 1 },

    // TIER 2 - World 11-25
    { name: "Viktor Hovland", score: 3, rank: 11, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Ludvig Åberg", score: 2, rank: 12, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Patrick Cantlay", score: 5, rank: 13, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Tyrrell Hatton", score: -1, rank: 14, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Hideki Matsuyama", score: 0, rank: 15, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Justin Thomas", score: 0, rank: 16, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Shane Lowry", score: -2, rank: 17, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Akshay Bhatia", score: 1, rank: 18, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Sam Burns", score: -5, rank: 19, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Wyndham Clark", score: -5, rank: 20, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Min Woo Lee", score: 6, rank: 21, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Keegan Bradley", score: 0, rank: 22, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Jon Rahm", score: 6, rank: 23, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Matt Fitzpatrick", score: 2, rank: 24, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },
    { name: "Bryson DeChambeau", score: 4, rank: 25, missedCut: false, rounds: [0, 0, 0, 0], tier: 2 },

    // TIER 3 - World 26-45
    { name: "Corey Conners", score: 2, rank: 26, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Sepp Straka", score: 1, rank: 27, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Brian Harman", score: 7, rank: 28, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Jordan Spieth", score: -2, rank: 29, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Jason Day", score: -3, rank: 30, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Harris English", score: 1, rank: 31, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Max Homa", score: 0, rank: 32, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Tom McKibbin", score: 3, rank: 33, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Maverick McNealy", score: 4, rank: 34, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Andrew Novak", score: 3, rank: 35, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Ryan Fox", score: 5, rank: 36, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Ben Griffin", score: 0, rank: 37, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Harry Hall", score: 3, rank: 38, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Sungjae Im", score: 4, rank: 39, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Kurt Kitayama", score: -3, rank: 40, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Si Woo Kim", score: 3, rank: 42, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Brooks Koepka", score: -2, rank: 43, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "Cameron Smith", score: 2, rank: 44, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },
    { name: "J.J. Spaun", score: 1, rank: 45, missedCut: false, rounds: [0, 0, 0, 0], tier: 3 },

    // TIER 4 - World 46-65 / PGA Tour winners / other qualifiers
    { name: "Dustin Johnson", score: 1, rank: 46, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Patrick Reed", score: -3, rank: 47, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Jacob Bridgeman", score: 0, rank: 48, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Nico Echavarría", score: 7, rank: 49, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Aldrich Potgieter", score: 12, rank: 50, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Brian Campbell", score: -1, rank: 51, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Max Greyserman", score: 7, rank: 52, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Ryan Gerard", score: 0, rank: 53, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Jake Knapp", score: 1, rank: 54, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Nicolai Højgaard", score: 4, rank: 55, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Matt McCarty", score: 0, rank: 56, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Daniel Berger", score: 4, rank: 57, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Gary Woodland", score: 1, rank: 58, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Michael Kim", score: 3, rank: 59, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Johnny Keefer", score: 4, rank: 60, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Michael Brennan", score: -2, rank: 61, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Carlos Ortiz", score: 8, rank: 62, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Li Haotong", score: -1, rank: 63, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Marco Penge", score: 4, rank: 64, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Nick Taylor", score: -1, rank: 65, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Sam Stevens", score: 0, rank: 66, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Alex Noren", score: 5, rank: 67, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Davis Riley", score: 10, rank: 68, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },
    { name: "Aaron Rai", score: -2, rank: 69, missedCut: false, rounds: [0, 0, 0, 0], tier: 4 },

    // TIER 5 - Past champions / other invitees
    { name: "Adam Scott", score: 0, rank: 70, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Sergio García", score: 0, rank: 71, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Bubba Watson", score: 4, rank: 72, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Danny Willett", score: 4, rank: 73, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Charl Schwartzel", score: 3, rank: 74, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Mike Weir", score: 9, rank: 75, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Vijay Singh", score: 7, rank: 76, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "José María Olazábal", score: 2, rank: 77, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Zach Johnson", score: 3, rank: 78, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Fred Couples", score: 6, rank: 79, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Ángel Cabrera", score: 7, rank: 80, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Casey Jarvis", score: 5, rank: 81, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Naoyuki Kataoka", score: 12, rank: 82, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Rasmus Neergaard-Petersen", score: 5, rank: 83, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Kristoffer Reitan", score: 0, rank: 84, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Sami Välimäki", score: 8, rank: 85, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },
    { name: "Rasmus Højgaard", score: 6, rank: 86, missedCut: false, rounds: [0, 0, 0, 0], tier: 5 },

    // TIER 6 - Amateurs
    { name: "Mason Howell", score: 5, rank: 87, missedCut: false, rounds: [0, 0, 0, 0], tier: 6 },
    { name: "Jackson Herrington", score: 4, rank: 88, missedCut: false, rounds: [0, 0, 0, 0], tier: 6 },
    { name: "Ethan Fang", score: 2, rank: 89, missedCut: false, rounds: [0, 0, 0, 0], tier: 6 },
    { name: "Fifa Laopakdee", score: 7, rank: 90, missedCut: false, rounds: [0, 0, 0, 0], tier: 6 },
    { name: "Mateo Pulcini", score: 9, rank: 91, missedCut: false, rounds: [0, 0, 0, 0], tier: 6 },
    { name: "Brandon Holtz", score: 9, rank: 92, missedCut: false, rounds: [0, 0, 0, 0], tier: 6 },
];

// Export for use in other files (Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { masters2026Field };
}
