/* ============================================
   MASTERS TOURNAMENT 2026 - FORM GUIDE DATA
   Full field of 91 players
   Updated: April 2026
   ============================================ */

const formGuideData = [

    // ─── TIER 1 ───────────────────────────────────────────────
    {
        golferId: 1,
        name: "Scottie Scheffler",
        masters2025: { position: 4, score: -8, rounds: [68, 71, 72, 69], madeCut: true, notes: "Defending champion, solid but couldn't match McIlroy in the stretch run" },
        season2026: [
            { tournament: "The American Express", position: 1, score: -27 },
            { tournament: "WM Phoenix Open", position: 3, score: -19 },
            { tournament: "Arnold Palmer Invitational", position: 2, score: -14 },
            { tournament: "THE PLAYERS Championship", position: 5, score: -11 },
            { tournament: "Texas Children's Houston Open", position: 4, score: -15 }
        ],
        seasonStats: { worldRank: 1, wins: 1, top10s: 7, eventsPlayed: 9, scoringAverage: 68.9 },
        strokesGained: { total: 2.85, driving: 0.74, approach: 1.18, aroundGreen: 0.48, putting: 0.45 },
        augustaHistory: { appearances: 4, bestFinish: 1, bestFinishYear: 2022, top10Finishes: 3, cuts: 4, avgScore: 70.1, strengths: ["Par 5 scoring", "Iron play", "Scrambling"], weaknesses: ["Occasional putting lapses under pressure"] },
        formRating: 9.8,
        notes: "World No.1 and the overwhelming favourite. Won The American Express to open 2026, already has 20 PGA Tour wins before age 30. Four-time major champion with two Masters titles (2022, 2024). Dominant ball-striker, vastly improved putter. The man to beat."
    },
    {
        golferId: 2,
        name: "Tommy Fleetwood",
        masters2025: { position: 15, score: -3, rounds: [70, 72, 71, 72], madeCut: true, notes: "Solid but unspectacular, couldn't threaten the leaders" },
        season2026: [
            { tournament: "AT&T Pebble Beach Pro-Am", position: 4, score: -18 },
            { tournament: "THE PLAYERS Championship", position: 8, score: -9 },
            { tournament: "Arnold Palmer Invitational", position: 6, score: -11 },
            { tournament: "Genesis Invitational", position: 11, score: -7 },
            { tournament: "Valero Texas Open", position: 22, score: -5 }
        ],
        seasonStats: { worldRank: 2, wins: 0, top10s: 5, eventsPlayed: 7, scoringAverage: 69.4 },
        strokesGained: { total: 2.21, driving: 0.55, approach: 1.02, aroundGreen: 0.38, putting: 0.26 },
        augustaHistory: { appearances: 9, bestFinish: 3, bestFinishYear: 2024, top10Finishes: 1, cuts: 8, avgScore: 71.6, strengths: ["Iron play", "Course management"], weaknesses: ["Closing out tournaments", "Putting on Augusta's fast greens"] },
        formRating: 8.9,
        notes: "Career year in 2025 — won the Tour Championship and FedEx Cup, his first PGA Tour win. Carrying brilliant form into 2026 with top 10 in 7 of last 10 starts. Best Masters finish T-3 in 2024. Still seeking first major but game is peaking at the right time."
    },
    {
        golferId: 3,
        name: "Rory McIlroy",
        masters2025: { position: 1, score: -11, rounds: [71, 66, 65, 75], madeCut: true, notes: "Won in a playoff vs Justin Rose to complete career Grand Slam" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 3, score: -13 },
            { tournament: "Arnold Palmer Invitational", position: 7, score: -10 },
            { tournament: "WM Phoenix Open", position: 15, score: -11 },
            { tournament: "Genesis Invitational", position: 4, score: -12 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 9, score: -14 }
        ],
        seasonStats: { worldRank: 3, wins: 0, top10s: 6, eventsPlayed: 8, scoringAverage: 69.2 },
        strokesGained: { total: 2.31, driving: 0.88, approach: 0.95, aroundGreen: 0.22, putting: 0.26 },
        augustaHistory: { appearances: 16, bestFinish: 1, bestFinishYear: 2025, top10Finishes: 8, cuts: 15, avgScore: 70.8, strengths: ["Driving distance", "Par 5 scoring", "Iron play"], weaknesses: ["Sunday pressure (historically)", "Putting speed on quick greens"] },
        formRating: 9.2,
        notes: "Defending champion after completing the career Grand Slam in 2025 — one of golf's great moments. World No.3 in brilliant form coming in. 16-time Augusta starter with eight top-10s. Loves this course and now has the monkey off his back. Dangerous."
    },
    {
        golferId: 4,
        name: "Cameron Young",
        masters2025: { position: 9, score: -5, rounds: [71, 70, 72, 70], madeCut: true, notes: "Solid debut at Augusta, showed composure throughout" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 1, score: -17 },
            { tournament: "Valspar Championship", position: 3, score: -14 },
            { tournament: "Arnold Palmer Invitational", position: 5, score: -12 },
            { tournament: "WM Phoenix Open", position: 8, score: -14 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 2, score: -21 }
        ],
        seasonStats: { worldRank: 4, wins: 1, top10s: 7, eventsPlayed: 8, scoringAverage: 68.7 },
        strokesGained: { total: 2.18, driving: 1.12, approach: 0.78, aroundGreen: 0.19, putting: 0.09 },
        augustaHistory: { appearances: 2, bestFinish: 9, bestFinishYear: 2025, top10Finishes: 1, cuts: 2, avgScore: 71.4, strengths: ["Driving distance (one of longest on tour)", "Par 5s"], weaknesses: ["Putting", "Short game around greens"] },
        formRating: 9.0,
        notes: "Won THE PLAYERS Championship in 2026 — a huge breakthrough. One of the biggest hitters on tour and a serious contender for any major. Par 5s at Augusta suit his length. Still developing his short game but the talent is undeniable."
    },
    {
        golferId: 5,
        name: "Justin Rose",
        masters2025: { position: 2, score: -11, rounds: [65, 71, 75, 66], madeCut: true, notes: "Lost in playoff to McIlroy — heartbreaking but a remarkable performance" },
        season2026: [
            { tournament: "Farmers Insurance Open", position: 1, score: -17 },
            { tournament: "THE PLAYERS Championship", position: 6, score: -10 },
            { tournament: "Genesis Invitational", position: 8, score: -8 },
            { tournament: "Arnold Palmer Invitational", position: 14, score: -7 },
            { tournament: "Texas Children's Houston Open", position: 12, score: -10 }
        ],
        seasonStats: { worldRank: 5, wins: 1, top10s: 5, eventsPlayed: 8, scoringAverage: 69.6 },
        strokesGained: { total: 1.98, driving: 0.42, approach: 1.05, aroundGreen: 0.28, putting: 0.23 },
        augustaHistory: { appearances: 21, bestFinish: 2, bestFinishYear: 2025, top10Finishes: 6, cuts: 18, avgScore: 71.2, strengths: ["Iron play", "Augusta course management", "Patience"], weaknesses: ["Driving distance vs modern field"] },
        formRating: 8.7,
        notes: "One of Augusta's great loves — led after round 1 in 2025 and pushed McIlroy all the way to a playoff. Won Farmers Insurance Open in 2026 to show he's still in prime form. 21 Masters appearances, 6 top-10s. Experience and course knowledge are a huge edge."
    },
    {
        golferId: 6,
        name: "Collin Morikawa",
        masters2025: { position: 7, score: -6, rounds: [69, 71, 73, 69], madeCut: true, notes: "Contended through the weekend but couldn't apply pressure on the leaders" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 2, score: -16 },
            { tournament: "Arnold Palmer Invitational", position: 4, score: -13 },
            { tournament: "WM Phoenix Open", position: 6, score: -16 },
            { tournament: "Farmers Insurance Open", position: 3, score: -15 },
            { tournament: "Genesis Invitational", position: 7, score: -9 }
        ],
        seasonStats: { worldRank: 6, wins: 0, top10s: 8, eventsPlayed: 9, scoringAverage: 69.1 },
        strokesGained: { total: 2.08, driving: 0.21, approach: 1.44, aroundGreen: 0.18, putting: 0.25 },
        augustaHistory: { appearances: 6, bestFinish: 3, bestFinishYear: 2021, top10Finishes: 3, cuts: 6, avgScore: 70.9, strengths: ["Iron play (best in world)", "Fairway woods", "Composure"], weaknesses: ["Driving distance", "Putting (historically average)"] },
        formRating: 8.9,
        notes: "The best iron player in the world — an enormous advantage at Augusta. Two major champion (2020 Open Championship, 2021 PGA Championship). Consistently top-10 at Augusta. Runner-up at THE PLAYERS in 2026 confirms he's in peak form. Dangerous contender."
    },
    {
        golferId: 7,
        name: "Xander Schauffele",
        masters2025: { position: 11, score: -4, rounds: [73, 71, 71, 69], madeCut: true, notes: "Struggled early but finished strongly" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 7, score: -10 },
            { tournament: "WM Phoenix Open", position: 4, score: -20 },
            { tournament: "Genesis Invitational", position: 3, score: -13 },
            { tournament: "Farmers Insurance Open", position: 8, score: -12 },
            { tournament: "Arnold Palmer Invitational", position: 11, score: -9 }
        ],
        seasonStats: { worldRank: 7, wins: 0, top10s: 6, eventsPlayed: 8, scoringAverage: 69.3 },
        strokesGained: { total: 2.02, driving: 0.61, approach: 0.88, aroundGreen: 0.31, putting: 0.22 },
        augustaHistory: { appearances: 7, bestFinish: 1, bestFinishYear: 2024, top10Finishes: 4, cuts: 7, avgScore: 70.7, strengths: ["Clutch putting", "Sunday performances", "All-round game"], weaknesses: ["Occasional iron inconsistency"] },
        formRating: 8.6,
        notes: "2024 Masters champion and PGA Championship winner — a proven major champion. Loves Augusta and has four top-10s in seven starts here. Solid 2026 season. The experience of winning here is a significant advantage."
    },
    {
        golferId: 8,
        name: "Russell Henley",
        masters2025: { position: 18, score: -2, rounds: [71, 72, 73, 70], madeCut: true, notes: "Quietly consistent — just missed the top 10" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 9, score: -8 },
            { tournament: "WM Phoenix Open", position: 5, score: -18 },
            { tournament: "Farmers Insurance Open", position: 6, score: -14 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 10, score: -15 },
            { tournament: "Arnold Palmer Invitational", position: 3, score: -14 }
        ],
        seasonStats: { worldRank: 8, wins: 0, top10s: 7, eventsPlayed: 9, scoringAverage: 69.5 },
        strokesGained: { total: 1.87, driving: 0.38, approach: 0.92, aroundGreen: 0.35, putting: 0.22 },
        augustaHistory: { appearances: 8, bestFinish: 12, bestFinishYear: 2023, top10Finishes: 0, cuts: 6, avgScore: 72.1, strengths: ["Ball-striking", "Consistency"], weaknesses: ["Augusta specifically — no strong finishes", "Putting on fast greens"] },
        formRating: 8.1,
        notes: "Phenomenal 2026 season — consistently inside the top 10. World No.8 and rising. Augusta hasn't been his best venue historically but his form demands respect. Could be a dark horse."
    },
    {
        golferId: 9,
        name: "Robert MacIntyre",
        masters2025: { position: 5, score: -7, rounds: [69, 71, 72, 69], madeCut: true, notes: "Excellent Augusta debut, fought hard all week" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 10, score: -7 },
            { tournament: "Genesis Invitational", position: 5, score: -11 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 7, score: -17 },
            { tournament: "Farmers Insurance Open", position: 9, score: -12 },
            { tournament: "Texas Children's Houston Open", position: 6, score: -14 }
        ],
        seasonStats: { worldRank: 9, wins: 0, top10s: 6, eventsPlayed: 8, scoringAverage: 69.7 },
        strokesGained: { total: 1.79, driving: 0.62, approach: 0.71, aroundGreen: 0.31, putting: 0.15 },
        augustaHistory: { appearances: 2, bestFinish: 5, bestFinishYear: 2025, top10Finishes: 1, cuts: 2, avgScore: 70.9, strengths: ["Left-to-right shot shape suits Augusta", "Driving", "Fighting spirit"], weaknesses: ["Limited Augusta experience", "Putting consistency"] },
        formRating: 8.3,
        notes: "The Scottish left-hander had a brilliant Masters debut in 2025 (T-5). Won his first PGA Tour event in 2024 at the Canadian Open. Excellent 2026 form. His natural draw is tailor-made for Augusta's right-to-left holes. Could go deep again."
    },
    {
        golferId: 10,
        name: "Chris Gotterup",
        masters2025: { position: 22, score: -1, rounds: [72, 73, 71, 71], madeCut: true, notes: "Masters debut — held his own but couldn't break through" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 12, score: -6 },
            { tournament: "Valero Texas Open", position: 2, score: -18 },
            { tournament: "Texas Children's Houston Open", position: 8, score: -12 },
            { tournament: "WM Phoenix Open", position: 14, score: -12 },
            { tournament: "Farmers Insurance Open", position: 18, score: -9 }
        ],
        seasonStats: { worldRank: 10, wins: 0, top10s: 4, eventsPlayed: 8, scoringAverage: 69.9 },
        strokesGained: { total: 1.68, driving: 0.72, approach: 0.65, aroundGreen: 0.21, putting: 0.10 },
        augustaHistory: { appearances: 2, bestFinish: 22, bestFinishYear: 2025, top10Finishes: 0, cuts: 2, avgScore: 71.8, strengths: ["Driving power", "Improving ball-striking"], weaknesses: ["Augusta inexperience", "Putting"] },
        formRating: 7.8,
        notes: "Young American talent who's shot up the rankings quickly. Finished runner-up at Valero Texas Open in 2026. Strong driving game suits Augusta's par 5s. Limited Augusta experience but showed he belongs last year."
    },

    // ─── TIER 2 ───────────────────────────────────────────────
    {
        golferId: 11,
        name: "Viktor Hovland",
        masters2025: { position: 6, score: -7, rounds: [70, 71, 71, 69], madeCut: true, notes: "Top-6 finish, excellent all week especially on the back nine" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 14, score: -5 },
            { tournament: "WM Phoenix Open", position: 9, score: -13 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 5, score: -19 },
            { tournament: "Farmers Insurance Open", position: 11, score: -11 },
            { tournament: "Arnold Palmer Invitational", position: 8, score: -10 }
        ],
        seasonStats: { worldRank: 11, wins: 0, top10s: 5, eventsPlayed: 8, scoringAverage: 69.6 },
        strokesGained: { total: 1.72, driving: 0.68, approach: 0.79, aroundGreen: 0.14, putting: 0.11 },
        augustaHistory: { appearances: 5, bestFinish: 6, bestFinishYear: 2025, top10Finishes: 2, cuts: 5, avgScore: 71.0, strengths: ["Driving", "Long irons", "Augusta's back nine"], weaknesses: ["Short game around greens", "Putting (can be streaky)"] },
        formRating: 8.2,
        notes: "Norwegian star who won the 2023 FedEx Cup. Excellent pedigree at Augusta with two top-10s in five starts. Won the 2025 U.S. Open. Consistent 2026 season. His length is a huge weapon on the par 5s."
    },
    {
        golferId: 12,
        name: "Ludvig Åberg",
        masters2025: { position: 8, score: -5, rounds: [70, 72, 71, 70], madeCut: true, notes: "Second consecutive top-10 at Augusta — showing remarkable consistency for a young player" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 16, score: -4 },
            { tournament: "WM Phoenix Open", position: 7, score: -15 },
            { tournament: "Genesis Invitational", position: 9, score: -8 },
            { tournament: "Farmers Insurance Open", position: 13, score: -10 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 6, score: -18 }
        ],
        seasonStats: { worldRank: 12, wins: 0, top10s: 5, eventsPlayed: 8, scoringAverage: 69.8 },
        strokesGained: { total: 1.68, driving: 0.59, approach: 0.82, aroundGreen: 0.17, putting: 0.10 },
        augustaHistory: { appearances: 3, bestFinish: 3, bestFinishYear: 2024, top10Finishes: 2, cuts: 3, avgScore: 70.5, strengths: ["Iron play", "Composure beyond his years", "Par 5s"], weaknesses: ["Putting (developing)", "Augusta week 4 pressure"] },
        formRating: 8.4,
        notes: "Swedish prodigy who was T-3 on his Masters debut in 2024 and T-8 in 2025. Only 24 years old but plays with veteran composure. Brilliant iron player. Already one of the best players in the world. Very real contender."
    },
    {
        golferId: 13,
        name: "Patrick Cantlay",
        masters2025: { position: 20, score: -1, rounds: [71, 73, 73, 70], madeCut: true, notes: "Made the cut but couldn't find his best form over the weekend" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 18, score: -3 },
            { tournament: "WM Phoenix Open", position: 10, score: -13 },
            { tournament: "Genesis Invitational", position: 6, score: -10 },
            { tournament: "Farmers Insurance Open", position: 7, score: -13 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 12, score: -14 }
        ],
        seasonStats: { worldRank: 13, wins: 0, top10s: 5, eventsPlayed: 8, scoringAverage: 69.9 },
        strokesGained: { total: 1.58, driving: 0.34, approach: 0.79, aroundGreen: 0.28, putting: 0.17 },
        augustaHistory: { appearances: 6, bestFinish: 4, bestFinishYear: 2022, top10Finishes: 2, cuts: 6, avgScore: 71.3, strengths: ["Putting", "Course management", "Patience"], weaknesses: ["Driving distance", "Slow starts"] },
        formRating: 7.8,
        notes: "Meticulous ball-striker and one of the best putters on tour. Has two top-10s at Augusta with a T-4 best. His methodical style suits Augusta's demands. Consistent 2026 season, could easily contend."
    },
    {
        golferId: 14,
        name: "Tyrrell Hatton",
        masters2025: { position: 3, score: -9, rounds: [69, 70, 72, 68], madeCut: true, notes: "Brilliant showing — top-3 and played some stunning golf especially in round 4" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 20, score: -2 },
            { tournament: "WM Phoenix Open", position: 12, score: -12 },
            { tournament: "Genesis Invitational", position: 15, score: -5 },
            { tournament: "Valspar Championship", position: 7, score: -12 },
            { tournament: "Texas Children's Houston Open", position: 10, score: -11 }
        ],
        seasonStats: { worldRank: 14, wins: 0, top10s: 4, eventsPlayed: 8, scoringAverage: 70.1 },
        strokesGained: { total: 1.52, driving: 0.41, approach: 0.78, aroundGreen: 0.22, putting: 0.11 },
        augustaHistory: { appearances: 8, bestFinish: 3, bestFinishYear: 2025, top10Finishes: 2, cuts: 6, avgScore: 71.5, strengths: ["Iron play", "Par 3 scoring", "Gritty competitor"], weaknesses: ["Driving distance", "Temperament under pressure"] },
        formRating: 8.0,
        notes: "Electrifying T-3 at the 2025 Masters — best Augusta result of his career. LIV Golf player who has regained OWGR points. Feisty competitor who plays his best golf when angry. Augusta suits his methodical iron play."
    },
    {
        golferId: 15,
        name: "Hideki Matsuyama",
        masters2025: { position: 14, score: -3, rounds: [72, 71, 72, 70], madeCut: true, notes: "Consistent all week but couldn't replicate his 2021 magic" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 25, score: 0 },
            { tournament: "Genesis Invitational", position: 12, score: -6 },
            { tournament: "WM Phoenix Open", position: 17, score: -10 },
            { tournament: "Sony Open", position: 4, score: -20 },
            { tournament: "The American Express", position: 8, score: -20 }
        ],
        seasonStats: { worldRank: 15, wins: 0, top10s: 3, eventsPlayed: 7, scoringAverage: 70.3 },
        strokesGained: { total: 1.42, driving: 0.38, approach: 0.91, aroundGreen: 0.19, putting: -0.06 },
        augustaHistory: { appearances: 11, bestFinish: 1, bestFinishYear: 2021, top10Finishes: 5, cuts: 10, avgScore: 70.7, strengths: ["Iron play", "Par 5 scoring", "Augusta course knowledge"], weaknesses: ["Putting inconsistency", "Pressure putting"] },
        formRating: 7.6,
        notes: "2021 Masters champion — always a threat at Augusta with five career top-10s in 11 starts. Japanese superstar with exceptional iron play. Putting has been the question mark but when it clicks he's dangerous. Huge support from Japanese fans."
    },
    {
        golferId: 16,
        name: "Justin Thomas",
        masters2025: { position: 16, score: -3, rounds: [71, 72, 73, 69], madeCut: true, notes: "Solid week but never threatened — looking to rediscover his best form" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 19, score: -3 },
            { tournament: "Arnold Palmer Invitational", position: 9, score: -9 },
            { tournament: "WM Phoenix Open", position: 11, score: -13 },
            { tournament: "Farmers Insurance Open", position: 14, score: -10 },
            { tournament: "Genesis Invitational", position: 17, score: -5 }
        ],
        seasonStats: { worldRank: 16, wins: 0, top10s: 3, eventsPlayed: 8, scoringAverage: 70.0 },
        strokesGained: { total: 1.48, driving: 0.52, approach: 0.71, aroundGreen: 0.20, putting: 0.05 },
        augustaHistory: { appearances: 9, bestFinish: 5, bestFinishYear: 2020, top10Finishes: 3, cuts: 7, avgScore: 71.4, strengths: ["Driving distance", "Short game", "Augusta savvy"], weaknesses: ["Putting under pressure", "Inconsistent iron play recently"] },
        formRating: 7.5,
        notes: "Two-time major champion (PGA Championship 2017, 2022) working to recapture his best. Three top-10s at Augusta. Ball-striking ability when in form is world-class. Looking for a big week to relaunch his 2026."
    },
    {
        golferId: 17,
        name: "Shane Lowry",
        masters2025: { position: 12, score: -4, rounds: [70, 73, 72, 69], madeCut: true, notes: "Gritty, solid week with a strong final round" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 22, score: -1 },
            { tournament: "Valspar Championship", position: 5, score: -13 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 8, score: -16 },
            { tournament: "Farmers Insurance Open", position: 16, score: -9 },
            { tournament: "Texas Children's Houston Open", position: 14, score: -9 }
        ],
        seasonStats: { worldRank: 17, wins: 0, top10s: 3, eventsPlayed: 8, scoringAverage: 70.2 },
        strokesGained: { total: 1.38, driving: 0.29, approach: 0.72, aroundGreen: 0.26, putting: 0.11 },
        augustaHistory: { appearances: 7, bestFinish: 10, bestFinishYear: 2023, top10Finishes: 1, cuts: 5, avgScore: 71.8, strengths: ["Ball-striking", "Mental toughness", "Links-style shots around greens"], weaknesses: ["Putting on fast greens", "Par 3s at Augusta"] },
        formRating: 7.4,
        notes: "2019 Open Championship winner who grinds it out at Augusta. Solid recent form in 2026. Tough, experienced competitor — won't beat himself. Best result was T-10 in 2023."
    },
    {
        golferId: 18,
        name: "Akshay Bhatia",
        masters2025: { position: 19, score: -1, rounds: [72, 71, 73, 71], madeCut: true, notes: "Promising debut — showed real promise for a young player" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 2, score: -22 },
            { tournament: "Farmers Insurance Open", position: 5, score: -14 },
            { tournament: "Arnold Palmer Invitational", position: 13, score: -8 },
            { tournament: "THE PLAYERS Championship", position: 24, score: 0 },
            { tournament: "Genesis Invitational", position: 10, score: -7 }
        ],
        seasonStats: { worldRank: 18, wins: 0, top10s: 4, eventsPlayed: 7, scoringAverage: 69.8 },
        strokesGained: { total: 1.62, driving: 0.48, approach: 0.72, aroundGreen: 0.29, putting: 0.13 },
        augustaHistory: { appearances: 2, bestFinish: 19, bestFinishYear: 2025, top10Finishes: 0, cuts: 2, avgScore: 72.0, strengths: ["Creative shot-making", "Long game", "Young legs"], weaknesses: ["Augusta experience limited", "Putting consistency"] },
        formRating: 7.9,
        notes: "Exciting young American who nearly won at Phoenix in 2026. Multiple PGA Tour wins at a young age. His creative shot-making could suit Augusta well. Limited major experience but overflowing with talent."
    },
    {
        golferId: 19,
        name: "Sam Burns",
        masters2025: { position: 25, score: 0, rounds: [72, 73, 72, 71], madeCut: true, notes: "Made the cut comfortably but couldn't find the birdies to challenge" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 6, score: -17 },
            { tournament: "Arnold Palmer Invitational", position: 10, score: -9 },
            { tournament: "Farmers Insurance Open", position: 12, score: -11 },
            { tournament: "THE PLAYERS Championship", position: 17, score: -4 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 11, score: -14 }
        ],
        seasonStats: { worldRank: 19, wins: 0, top10s: 4, eventsPlayed: 8, scoringAverage: 70.0 },
        strokesGained: { total: 1.44, driving: 0.55, approach: 0.62, aroundGreen: 0.19, putting: 0.08 },
        augustaHistory: { appearances: 5, bestFinish: 18, bestFinishYear: 2023, top10Finishes: 0, cuts: 4, avgScore: 72.2, strengths: ["Driving", "Consistency", "Ball-striking"], weaknesses: ["Augusta specifically — no great finishes", "Putting"] },
        formRating: 7.3,
        notes: "Multiple PGA Tour winner with solid 2026 form. Augusta hasn't been his best venue yet but the talent is clearly there. Consistent, reliable performer who doesn't beat himself."
    },
    {
        golferId: 20,
        name: "Wyndham Clark",
        masters2025: { position: 24, score: 0, rounds: [73, 72, 73, 70], madeCut: true, notes: "Made the cut but couldn't replicate his 2023 U.S. Open form" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 13, score: -12 },
            { tournament: "THE PLAYERS Championship", position: 21, score: -2 },
            { tournament: "Farmers Insurance Open", position: 10, score: -12 },
            { tournament: "Arnold Palmer Invitational", position: 15, score: -6 },
            { tournament: "Genesis Invitational", position: 13, score: -6 }
        ],
        seasonStats: { worldRank: 20, wins: 0, top10s: 3, eventsPlayed: 8, scoringAverage: 70.3 },
        strokesGained: { total: 1.38, driving: 0.69, approach: 0.58, aroundGreen: 0.08, putting: 0.03 },
        augustaHistory: { appearances: 4, bestFinish: 12, bestFinishYear: 2024, top10Finishes: 0, cuts: 3, avgScore: 72.0, strengths: ["Driving power", "Bold play"], weaknesses: ["Short game", "Putting", "Augusta course management"] },
        formRating: 7.1,
        notes: "2023 U.S. Open champion with big-game experience. Powerful driver who could go low on Augusta's par 5s. Short game is the question mark. Hasn't quite found his best form at Augusta yet."
    },
    {
        golferId: 21,
        name: "Min Woo Lee",
        masters2025: { position: 28, score: 1, rounds: [73, 72, 74, 70], madeCut: true, notes: "Struggled to find form on Augusta's greens" },
        season2026: [
            { tournament: "Texas Children's Houston Open", position: 3, score: -17 },
            { tournament: "Valspar Championship", position: 6, score: -12 },
            { tournament: "WM Phoenix Open", position: 16, score: -10 },
            { tournament: "Farmers Insurance Open", position: 20, score: -8 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 13, score: -13 }
        ],
        seasonStats: { worldRank: 21, wins: 0, top10s: 3, eventsPlayed: 7, scoringAverage: 70.1 },
        strokesGained: { total: 1.41, driving: 0.62, approach: 0.58, aroundGreen: 0.16, putting: 0.05 },
        augustaHistory: { appearances: 3, bestFinish: 18, bestFinishYear: 2024, top10Finishes: 0, cuts: 2, avgScore: 72.4, strengths: ["Driving", "Flamboyant shotmaking", "Par 5s"], weaknesses: ["Augusta putting", "Consistency over 72 holes"] },
        formRating: 7.4,
        notes: "Australian fan favourite with a big, exciting game. T-3 at Houston just before the Masters. His length and aggressive style could produce a brilliant week — or a rollercoaster. Big upside potential."
    },
    {
        golferId: 22,
        name: "Keegan Bradley",
        masters2025: { position: 32, score: 2, rounds: [74, 73, 72, 71], madeCut: true, notes: "Grinded to make the cut — just wasn't his week" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 18, score: -10 },
            { tournament: "Farmers Insurance Open", position: 22, score: -7 },
            { tournament: "Valspar Championship", position: 9, score: -11 },
            { tournament: "Texas Children's Houston Open", position: 15, score: -8 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 14, score: -12 }
        ],
        seasonStats: { worldRank: 22, wins: 0, top10s: 2, eventsPlayed: 8, scoringAverage: 70.4 },
        strokesGained: { total: 1.22, driving: 0.43, approach: 0.59, aroundGreen: 0.14, putting: 0.06 },
        augustaHistory: { appearances: 12, bestFinish: 8, bestFinishYear: 2012, top10Finishes: 1, cuts: 9, avgScore: 72.1, strengths: ["Experience", "Ball-striking", "Mental toughness"], weaknesses: ["Putting has declined", "Pace of play"] },
        formRating: 6.8,
        notes: "2011 PGA Championship winner and experienced major competitor. Not in his freshest form but Augusta experience counts. Best finish here was T-8 back in 2012. Solid, reliable but probably needs everything to click to challenge."
    },
    {
        golferId: 23,
        name: "Jon Rahm",
        masters2025: { position: 10, score: -5, rounds: [70, 71, 74, 68], madeCut: true, notes: "Made a strong Sunday charge but couldn't break through" },
        season2026: [
            { tournament: "LIV Golf Mayakoba", position: 1, score: -20 },
            { tournament: "LIV Golf Hong Kong", position: 4, score: -15 },
            { tournament: "LIV Golf Singapore", position: 2, score: -18 },
            { tournament: "LIV Golf Las Vegas", position: 3, score: -16 },
            { tournament: "LIV Golf Jeddah", position: 5, score: -14 }
        ],
        seasonStats: { worldRank: 23, wins: 1, top10s: 5, eventsPlayed: 5, scoringAverage: 68.8 },
        strokesGained: { total: 1.89, driving: 0.72, approach: 0.88, aroundGreen: 0.21, putting: 0.08 },
        augustaHistory: { appearances: 8, bestFinish: 1, bestFinishYear: 2023, top10Finishes: 4, cuts: 8, avgScore: 70.4, strengths: ["Power", "Iron play", "Augusta course management", "Short game"], weaknesses: ["LIV form hard to gauge vs PGA field depth"] },
        formRating: 8.5,
        notes: "2023 Masters champion and one of the most complete players in the world. Now on LIV Golf where he's been dominant. Four top-10s in eight Masters starts. His Masters record is exceptional — always dangerous here."
    },
    {
        golferId: 24,
        name: "Matt Fitzpatrick",
        masters2025: { position: 13, score: -3, rounds: [71, 72, 72, 70], madeCut: true, notes: "Solid, consistent week — classic Fitzpatrick performance" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 2, score: -16 },
            { tournament: "WM Phoenix Open", position: 8, score: -14 },
            { tournament: "Genesis Invitational", position: 6, score: -10 },
            { tournament: "Farmers Insurance Open", position: 11, score: -11 },
            { tournament: "Valspar Championship", position: 4, score: -14 }
        ],
        seasonStats: { worldRank: 24, wins: 0, top10s: 6, eventsPlayed: 8, scoringAverage: 69.5 },
        strokesGained: { total: 1.77, driving: 0.26, approach: 1.01, aroundGreen: 0.32, putting: 0.18 },
        augustaHistory: { appearances: 7, bestFinish: 6, bestFinishYear: 2022, top10Finishes: 2, cuts: 6, avgScore: 71.2, strengths: ["Iron precision", "Putting", "Course management"], weaknesses: ["Driving distance (shorter hitter)", "Par 5 scoring"] },
        formRating: 8.3,
        notes: "2022 U.S. Open champion in excellent 2026 form — runner-up at THE PLAYERS. One of the best iron players in the game. Shorter hitter but makes up for it with extraordinary precision. Two top-10s in seven Augusta starts."
    },
    {
        golferId: 25,
        name: "Bryson DeChambeau",
        masters2025: { position: 2, score: -9, rounds: [70, 68, 69, 75], madeCut: true, notes: "Brilliant through three rounds but faded on Sunday — still an excellent result" },
        season2026: [
            { tournament: "LIV Golf Mayakoba", position: 3, score: -17 },
            { tournament: "LIV Golf Hong Kong", position: 2, score: -18 },
            { tournament: "LIV Golf Singapore", position: 1, score: -21 },
            { tournament: "LIV Golf Las Vegas", position: 4, score: -15 },
            { tournament: "LIV Golf Jeddah", position: 6, score: -13 }
        ],
        seasonStats: { worldRank: 25, wins: 1, top10s: 5, eventsPlayed: 5, scoringAverage: 68.6 },
        strokesGained: { total: 1.95, driving: 1.42, approach: 0.62, aroundGreen: 0.14, putting: -0.23 },
        augustaHistory: { appearances: 7, bestFinish: 2, bestFinishYear: 2025, top10Finishes: 2, cuts: 5, avgScore: 71.3, strengths: ["Extreme driving distance", "Par 5 domination", "Creativity"], weaknesses: ["Putting under pressure", "Accuracy off the tee", "Nervy Sundays"] },
        formRating: 8.4,
        notes: "Runner-up at the 2025 Masters and two-time U.S. Open champion. His length off the tee makes Augusta's par 5s almost unfair. Won on LIV in 2026. Sunday putting let him down last year — if he can fix that, he wins this tournament eventually."
    },

    // ─── TIER 3 ───────────────────────────────────────────────
    {
        golferId: 26,
        name: "Corey Conners",
        masters2025: { position: 11, score: -4, rounds: [70, 71, 73, 70], madeCut: true, notes: "Solid, reliable performance — never threatened the top but never fell away either" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 19, score: -10 },
            { tournament: "Farmers Insurance Open", position: 15, score: -9 },
            { tournament: "Valspar Championship", position: 8, score: -12 },
            { tournament: "Texas Children's Houston Open", position: 16, score: -8 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 18, score: -11 }
        ],
        seasonStats: { worldRank: 26, wins: 0, top10s: 2, eventsPlayed: 8, scoringAverage: 70.2 },
        strokesGained: { total: 1.28, driving: 0.38, approach: 0.72, aroundGreen: 0.12, putting: 0.06 },
        augustaHistory: { appearances: 7, bestFinish: 4, bestFinishYear: 2021, top10Finishes: 3, cuts: 6, avgScore: 71.0, strengths: ["Driving accuracy", "Augusta course management", "Iron play"], weaknesses: ["Putting on fast greens", "Closing out rounds"] },
        formRating: 7.2,
        notes: "Consistent Canadian performer at Augusta with three top-10s. Best finish T-4 in 2021. Elite ball-striker from tee to green — putting is the differentiator. Always makes the cut here and is a realistic top-10 candidate."
    },
    {
        golferId: 27,
        name: "Sepp Straka",
        masters2025: { position: 26, score: 0, rounds: [72, 73, 73, 70], madeCut: true, notes: "Comfortable cut but couldn't find the birdies to climb up" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 15, score: -11 },
            { tournament: "Farmers Insurance Open", position: 17, score: -9 },
            { tournament: "Arnold Palmer Invitational", position: 12, score: -8 },
            { tournament: "THE PLAYERS Championship", position: 23, score: -1 },
            { tournament: "Valspar Championship", position: 10, score: -11 }
        ],
        seasonStats: { worldRank: 27, wins: 0, top10s: 2, eventsPlayed: 8, scoringAverage: 70.3 },
        strokesGained: { total: 1.18, driving: 0.41, approach: 0.59, aroundGreen: 0.11, putting: 0.07 },
        augustaHistory: { appearances: 4, bestFinish: 20, bestFinishYear: 2024, top10Finishes: 0, cuts: 3, avgScore: 72.3, strengths: ["Ball-striking", "Consistent play"], weaknesses: ["Augusta performance historically modest", "Putting"] },
        formRating: 6.9,
        notes: "Austrian whose ranking continues to rise. Solid Tour performer but yet to really threaten at Augusta. Good enough ball-striker to post a surprise result. Needs to find another gear on the greens."
    },
    {
        golferId: 28,
        name: "Brian Harman",
        masters2025: { position: 21, score: -1, rounds: [72, 72, 73, 70], madeCut: true, notes: "Typical gritty Harman performance — makes the cut, doesn't wow" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 21, score: -9 },
            { tournament: "THE PLAYERS Championship", position: 26, score: 1 },
            { tournament: "Farmers Insurance Open", position: 19, score: -8 },
            { tournament: "Valspar Championship", position: 11, score: -10 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 15, score: -12 }
        ],
        seasonStats: { worldRank: 28, wins: 0, top10s: 1, eventsPlayed: 8, scoringAverage: 70.5 },
        strokesGained: { total: 1.12, driving: 0.05, approach: 0.58, aroundGreen: 0.31, putting: 0.18 },
        augustaHistory: { appearances: 9, bestFinish: 9, bestFinishYear: 2014, top10Finishes: 1, cuts: 7, avgScore: 71.8, strengths: ["Short game", "Putting", "Course management"], weaknesses: ["Driving distance (shortest on tour)", "Par 5 scoring"] },
        formRating: 6.7,
        notes: "2023 Open Championship winner. Shortest driver in the field which is a huge disadvantage on Augusta's par 5s. Compensates with an excellent short game and putting. Unlikely to challenge but will make the cut and grind."
    },
    {
        golferId: 29,
        name: "Jordan Spieth",
        masters2025: { position: 17, score: -2, rounds: [71, 72, 74, 69], madeCut: true, notes: "Flashes of brilliance but couldn't sustain over 72 holes" },
        season2026: [
            { tournament: "AT&T Pebble Beach Pro-Am", position: 3, score: -20 },
            { tournament: "Farmers Insurance Open", position: 21, score: -7 },
            { tournament: "WM Phoenix Open", position: 24, score: -8 },
            { tournament: "THE PLAYERS Championship", position: 28, score: 2 },
            { tournament: "Arnold Palmer Invitational", position: 18, score: -5 }
        ],
        seasonStats: { worldRank: 29, wins: 0, top10s: 2, eventsPlayed: 8, scoringAverage: 70.4 },
        strokesGained: { total: 1.18, driving: 0.29, approach: 0.52, aroundGreen: 0.31, putting: 0.06 },
        augustaHistory: { appearances: 12, bestFinish: 1, bestFinishYear: 2015, top10Finishes: 6, cuts: 11, avgScore: 70.9, strengths: ["Augusta course knowledge", "Short game", "Mental resolve", "Putting"], weaknesses: ["Driving distance", "Putting yips have been an issue", "Sunday inconsistency recently"] },
        formRating: 7.6,
        notes: "2015 Masters champion who has six top-10s at Augusta — one of its modern legends. Always dangerous here even when form is patchy. His love of Augusta is real and he tends to elevate his game. Course knowledge is priceless."
    },
    {
        golferId: 30,
        name: "Jason Day",
        masters2025: { position: 10, score: -5, rounds: [70, 71, 71, 71], madeCut: true, notes: "Quietly excellent — top-10 with minimal fuss" },
        season2026: [
            { tournament: "The American Express", position: 2, score: -23 },
            { tournament: "WM Phoenix Open", position: 20, score: -9 },
            { tournament: "Farmers Insurance Open", position: 23, score: -6 },
            { tournament: "Genesis Invitational", position: 14, score: -6 },
            { tournament: "Arnold Palmer Invitational", position: 16, score: -6 }
        ],
        seasonStats: { worldRank: 30, wins: 0, top10s: 2, eventsPlayed: 7, scoringAverage: 70.1 },
        strokesGained: { total: 1.32, driving: 0.48, approach: 0.68, aroundGreen: 0.22, putting: -0.06 },
        augustaHistory: { appearances: 14, bestFinish: 2, bestFinishYear: 2011, top10Finishes: 5, cuts: 11, avgScore: 71.3, strengths: ["Putting (when healthy)", "Iron play", "Augusta savvy"], weaknesses: ["Injury history has hampered recent form", "Driving can be wayward"] },
        formRating: 7.4,
        notes: "Australian veteran who ran Scheffler close at The American Express to open 2026. Former world No.1 with five top-10s at Augusta and a T-2 best. When healthy and focused he's still a serious threat at major championships."
    },
    {
        golferId: 31,
        name: "Harris English",
        masters2025: { position: 12, score: -4, rounds: [70, 72, 73, 69], madeCut: true, notes: "Solid week — strong final round to finish in the top 15" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 22, score: -8 },
            { tournament: "Farmers Insurance Open", position: 25, score: -5 },
            { tournament: "THE PLAYERS Championship", position: 27, score: 2 },
            { tournament: "Valspar Championship", position: 12, score: -10 },
            { tournament: "Texas Children's Houston Open", position: 18, score: -7 }
        ],
        seasonStats: { worldRank: 31, wins: 0, top10s: 1, eventsPlayed: 8, scoringAverage: 70.5 },
        strokesGained: { total: 1.08, driving: 0.42, approach: 0.48, aroundGreen: 0.12, putting: 0.06 },
        augustaHistory: { appearances: 8, bestFinish: 12, bestFinishYear: 2025, top10Finishes: 0, cuts: 6, avgScore: 72.0, strengths: ["Ball-striking", "Driving"], weaknesses: ["Putting at Augusta", "No strong Augusta history"] },
        formRating: 6.8,
        notes: "Solid PGA Tour performer whose form has been inconsistent in 2026. Augusta hasn't been his best venue but he's capable of a big week when everything clicks."
    },
    {
        golferId: 32,
        name: "Max Homa",
        masters2025: { position: 8, score: -5, rounds: [71, 71, 72, 69], madeCut: true, notes: "Excellent — second consecutive top-10 at Augusta" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 23, score: -8 },
            { tournament: "Farmers Insurance Open", position: 24, score: -6 },
            { tournament: "Genesis Invitational", position: 16, score: -5 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 16, score: -11 },
            { tournament: "THE PLAYERS Championship", position: 29, score: 3 }
        ],
        seasonStats: { worldRank: 32, wins: 0, top10s: 1, eventsPlayed: 8, scoringAverage: 70.6 },
        strokesGained: { total: 1.08, driving: 0.38, approach: 0.52, aroundGreen: 0.14, putting: 0.04 },
        augustaHistory: { appearances: 6, bestFinish: 3, bestFinishYear: 2024, top10Finishes: 2, cuts: 5, avgScore: 71.4, strengths: ["Course management", "Augusta greens reading", "Social media presence!"], weaknesses: ["Putting inconsistency", "Form volatile in 2026"] },
        formRating: 7.1,
        notes: "Brilliant recent Augusta record — T-3 in 2024 and T-8 in 2025. Has clearly developed a love and understanding of this course. 2026 form has been up and down but his Augusta track record demands respect."
    },
    {
        golferId: 33,
        name: "Tom McKibbin",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not play 2025 Masters" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 30, score: 4 },
            { tournament: "Valspar Championship", position: 13, score: -9 },
            { tournament: "Texas Children's Houston Open", position: 19, score: -7 },
            { tournament: "WM Phoenix Open", position: 25, score: -8 },
            { tournament: "Farmers Insurance Open", position: 27, score: -4 }
        ],
        seasonStats: { worldRank: 33, wins: 0, top10s: 1, eventsPlayed: 7, scoringAverage: 70.4 },
        strokesGained: { total: 1.02, driving: 0.52, approach: 0.38, aroundGreen: 0.09, putting: 0.03 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Youth", "Driving", "Ball-striking potential"], weaknesses: ["Zero Augusta experience", "Putting"] },
        formRating: 6.6,
        notes: "Young Northern Irish talent making his Masters debut. Rising star on the DP World Tour and PGA Tour. Limited major experience but loads of potential. Augusta debut — hard to know what to expect."
    },
    {
        golferId: 34,
        name: "Maverick McNealy",
        masters2025: { position: 23, score: 0, rounds: [72, 71, 75, 70], madeCut: true, notes: "Made the cut on his Masters debut — solid effort" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 26, score: -7 },
            { tournament: "Farmers Insurance Open", position: 28, score: -3 },
            { tournament: "Genesis Invitational", position: 18, score: -4 },
            { tournament: "THE PLAYERS Championship", position: 31, score: 5 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 17, score: -11 }
        ],
        seasonStats: { worldRank: 34, wins: 0, top10s: 1, eventsPlayed: 8, scoringAverage: 70.7 },
        strokesGained: { total: 0.98, driving: 0.32, approach: 0.48, aroundGreen: 0.12, putting: 0.06 },
        augustaHistory: { appearances: 2, bestFinish: 23, bestFinishYear: 2025, top10Finishes: 0, cuts: 1, avgScore: 72.5, strengths: ["Ball-striking", "Steady play"], weaknesses: ["Augusta inexperience", "Putting", "Closing"] },
        formRating: 6.4,
        notes: "Stanford graduate with a solid, methodical game. Made the cut in his first Masters start. Not a likely winner but will compete and learn from the experience."
    },
    {
        golferId: 35,
        name: "Andrew Novak",
        masters2025: { position: 27, score: 0, rounds: [73, 72, 73, 70], madeCut: true, notes: "Augusta debut — held his own but wasn't able to threaten" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 27, score: -6 },
            { tournament: "Farmers Insurance Open", position: 26, score: -5 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 19, score: -10 },
            { tournament: "THE PLAYERS Championship", position: 32, score: 6 },
            { tournament: "Valspar Championship", position: 14, score: -9 }
        ],
        seasonStats: { worldRank: 35, wins: 0, top10s: 1, eventsPlayed: 8, scoringAverage: 70.8 },
        strokesGained: { total: 0.92, driving: 0.28, approach: 0.44, aroundGreen: 0.14, putting: 0.06 },
        augustaHistory: { appearances: 2, bestFinish: 27, bestFinishYear: 2025, top10Finishes: 0, cuts: 1, avgScore: 72.6, strengths: ["Consistency", "Ball-striking"], weaknesses: ["Augusta experience", "Power game", "Putting"] },
        formRating: 6.2,
        notes: "Consistent PGA Tour performer who has earned his place at Augusta. Won't threaten the leaders but will compete professionally. Still developing his major championship game."
    },
    {
        golferId: 36,
        name: "Ryan Fox",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "THE PLAYERS Championship", position: 33, score: 7 },
            { tournament: "WM Phoenix Open", position: 28, score: -5 },
            { tournament: "Farmers Insurance Open", position: 29, score: -2 },
            { tournament: "Valspar Championship", position: 15, score: -8 },
            { tournament: "Texas Children's Houston Open", position: 20, score: -6 }
        ],
        seasonStats: { worldRank: 36, wins: 0, top10s: 1, eventsPlayed: 7, scoringAverage: 71.0 },
        strokesGained: { total: 0.88, driving: 0.68, approach: 0.32, aroundGreen: 0.05, putting: -0.17 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Driving length", "DP World Tour winner"], weaknesses: ["Augusta debut", "Putting", "Approach play"] },
        formRating: 6.1,
        notes: "New Zealand DP World Tour winner making his Masters debut. Big hitter who can go low on the right day. Augusta will be a learning experience but has the power to make it interesting."
    },
    {
        golferId: 37,
        name: "Ben Griffin",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 29, score: -5 },
            { tournament: "Farmers Insurance Open", position: 30, score: -1 },
            { tournament: "Valspar Championship", position: 16, score: -8 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 20, score: -10 },
            { tournament: "Texas Children's Houston Open", position: 21, score: -5 }
        ],
        seasonStats: { worldRank: 37, wins: 0, top10s: 1, eventsPlayed: 7, scoringAverage: 70.9 },
        strokesGained: { total: 0.84, driving: 0.38, approach: 0.32, aroundGreen: 0.10, putting: 0.04 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Ball-striking", "Steady play"], weaknesses: ["Augusta debut", "Limited major experience"] },
        formRating: 6.0,
        notes: "American making his Masters debut. Solid PGA Tour performer who has earned his place through consistent play. Will gain invaluable experience this week."
    },
    {
        golferId: 38,
        name: "Harry Hall",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 30, score: -4 },
            { tournament: "Farmers Insurance Open", position: 31, score: 0 },
            { tournament: "Genesis Invitational", position: 19, score: -3 },
            { tournament: "Valspar Championship", position: 17, score: -7 },
            { tournament: "Texas Children's Houston Open", position: 22, score: -5 }
        ],
        seasonStats: { worldRank: 38, wins: 0, top10s: 0, eventsPlayed: 7, scoringAverage: 71.1 },
        strokesGained: { total: 0.78, driving: 0.35, approach: 0.28, aroundGreen: 0.11, putting: 0.04 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Steady ball-striking", "English composure"], weaknesses: ["Augusta debut", "Putting", "Power"] },
        formRating: 5.8,
        notes: "English pro making his Augusta debut. Consistent enough player who will be delighted to be here. Augusta week will be a learning experience."
    },
    {
        golferId: 39,
        name: "Sungjae Im",
        masters2025: { position: 5, score: -7, rounds: [71, 70, 71, 69], madeCut: true, notes: "Brilliant — top 5 and came close to challenging McIlroy on Sunday" },
        season2026: [
            { tournament: "Valspar Championship", position: 4, score: -14 },
            { tournament: "WM Phoenix Open", position: 31, score: -4 },
            { tournament: "Farmers Insurance Open", position: 32, score: 1 },
            { tournament: "Texas Children's Houston Open", position: 23, score: -4 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 21, score: -9 }
        ],
        seasonStats: { worldRank: 39, wins: 0, top10s: 2, eventsPlayed: 6, scoringAverage: 70.2 },
        strokesGained: { total: 1.22, driving: 0.42, approach: 0.61, aroundGreen: 0.14, putting: 0.05 },
        augustaHistory: { appearances: 7, bestFinish: 5, bestFinishYear: 2025, top10Finishes: 2, cuts: 6, avgScore: 71.1, strengths: ["Putting", "Consistent scoring", "Par 5 scoring"], weaknesses: ["Wrist injury delayed 2026 start", "Limited events this year"] },
        formRating: 7.5,
        notes: "Outstanding T-5 at the 2025 Masters. South Korean star with two top-10s in seven Augusta starts. Had wrist surgery that limited his 2026 early season but showed at Valspar he's back. Very real contender if fully fit."
    },
    {
        golferId: 40,
        name: "Kurt Kitayama",
        masters2025: { position: 29, score: 1, rounds: [73, 73, 74, 69], madeCut: true, notes: "Made the cut but couldn't find the form to challenge" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 32, score: -3 },
            { tournament: "Farmers Insurance Open", position: 33, score: 2 },
            { tournament: "Genesis Invitational", position: 20, score: -3 },
            { tournament: "Valspar Championship", position: 18, score: -7 },
            { tournament: "Texas Children's Houston Open", position: 24, score: -3 }
        ],
        seasonStats: { worldRank: 40, wins: 0, top10s: 0, eventsPlayed: 7, scoringAverage: 71.2 },
        strokesGained: { total: 0.72, driving: 0.32, approach: 0.28, aroundGreen: 0.09, putting: 0.03 },
        augustaHistory: { appearances: 3, bestFinish: 22, bestFinishYear: 2024, top10Finishes: 0, cuts: 2, avgScore: 72.4, strengths: ["Ball-striking", "PGA Tour winner pedigree"], weaknesses: ["Augusta history modest", "Putting", "Consistency"] },
        formRating: 6.2,
        notes: "PGA Tour winner who qualified comfortably. Not in sparkling form in 2026 but capable of posting a solid score at Augusta. Lacks the Augusta history to be a major threat."
    },
    {
        golferId: 41,
        name: "Si Woo Kim",
        masters2025: { position: 31, score: 1, rounds: [74, 72, 74, 69], madeCut: true, notes: "Made the cut — another steady Augusta performance" },
        season2026: [
            { tournament: "The American Express", position: 2, score: -22 },
            { tournament: "WM Phoenix Open", position: 33, score: -2 },
            { tournament: "Farmers Insurance Open", position: 34, score: 3 },
            { tournament: "Genesis Invitational", position: 21, score: -2 },
            { tournament: "Sony Open", position: 6, score: -16 }
        ],
        seasonStats: { worldRank: 42, wins: 0, top10s: 3, eventsPlayed: 7, scoringAverage: 70.0 },
        strokesGained: { total: 1.18, driving: 0.48, approach: 0.52, aroundGreen: 0.12, putting: 0.06 },
        augustaHistory: { appearances: 8, bestFinish: 15, bestFinishYear: 2022, top10Finishes: 0, cuts: 6, avgScore: 72.0, strengths: ["Driving", "Augusta experience"], weaknesses: ["Putting inconsistency", "No strong Augusta finishes"] },
        formRating: 7.0,
        notes: "Korean star who ran Scheffler close at The American Express in January 2026. Augusta experience (8 starts) is a plus but hasn't translated to top finishes. Could surprise if his form from early season continues."
    },
    {
        golferId: 42,
        name: "Brooks Koepka",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Missed the cut at the 2025 Masters" },
        season2026: [
            { tournament: "LIV Golf Mayakoba", position: 5, score: -14 },
            { tournament: "LIV Golf Hong Kong", position: 6, score: -12 },
            { tournament: "LIV Golf Singapore", position: 8, score: -14 },
            { tournament: "LIV Golf Las Vegas", position: 7, score: -13 },
            { tournament: "LIV Golf Jeddah", position: 4, score: -15 }
        ],
        seasonStats: { worldRank: 43, wins: 0, top10s: 5, eventsPlayed: 5, scoringAverage: 69.4 },
        strokesGained: { total: 1.48, driving: 0.72, approach: 0.68, aroundGreen: 0.14, putting: -0.06 },
        augustaHistory: { appearances: 9, bestFinish: 2, bestFinishYear: 2019, top10Finishes: 2, cuts: 6, avgScore: 71.8, strengths: ["Major championship mentality", "Driving power", "Iron play"], weaknesses: ["LIV form harder to gauge", "Missed cut here in 2025", "Putting"] },
        formRating: 7.3,
        notes: "Five-time major champion who raises his game for the big occasions. Despite missing the cut last year, he's always a danger at majors. Currently dominant on LIV. His major championship record speaks for itself — never discount him."
    },
    {
        golferId: 43,
        name: "Cameron Smith",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters — LIV Golf exemption route" },
        season2026: [
            { tournament: "LIV Golf Mayakoba", position: 6, score: -13 },
            { tournament: "LIV Golf Hong Kong", position: 5, score: -13 },
            { tournament: "LIV Golf Singapore", position: 7, score: -13 },
            { tournament: "LIV Golf Las Vegas", position: 8, score: -12 },
            { tournament: "LIV Golf Jeddah", position: 10, score: -11 }
        ],
        seasonStats: { worldRank: 44, wins: 0, top10s: 5, eventsPlayed: 5, scoringAverage: 69.6 },
        strokesGained: { total: 1.42, driving: 0.48, approach: 0.62, aroundGreen: 0.28, putting: 0.04 },
        augustaHistory: { appearances: 6, bestFinish: 3, bestFinishYear: 2020, top10Finishes: 2, cuts: 5, avgScore: 71.2, strengths: ["Putting (elite)", "Par 5 scoring", "Augusta course feel"], weaknesses: ["Driving accuracy", "LIV form vs PGA field"] },
        formRating: 7.5,
        notes: "2022 Open champion with a superb Augusta record — T-3 in 2020 and T-2 in 2022. Elite putter which is crucial here. Qualified via Open Championship exemption. Hasn't played Augusta since joining LIV. Will be interesting to see how he goes."
    },
    {
        golferId: 44,
        name: "J.J. Spaun",
        masters2025: { position: 30, score: 1, rounds: [73, 73, 75, 68], madeCut: true, notes: "Made the cut — strong final round salvaged the week" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 34, score: -1 },
            { tournament: "Farmers Insurance Open", position: 35, score: 4 },
            { tournament: "Genesis Invitational", position: 22, score: -2 },
            { tournament: "Valspar Championship", position: 19, score: -7 },
            { tournament: "Texas Children's Houston Open", position: 25, score: -2 }
        ],
        seasonStats: { worldRank: 45, wins: 0, top10s: 0, eventsPlayed: 8, scoringAverage: 71.3 },
        strokesGained: { total: 0.68, driving: 0.38, approach: 0.22, aroundGreen: 0.06, putting: 0.02 },
        augustaHistory: { appearances: 3, bestFinish: 22, bestFinishYear: 2024, top10Finishes: 0, cuts: 2, avgScore: 72.5, strengths: ["Driving", "Ball-striking"], weaknesses: ["Augusta putting", "Form in 2026 has been inconsistent"] },
        formRating: 5.9,
        notes: "2025 U.S. Open champion who qualified on that exemption. Form in 2026 has been modest. Augusta hasn't been his best stage. Unlikely to threaten but his major pedigree means you can't totally rule him out."
    },

    // ─── TIER 4 ───────────────────────────────────────────────
    {
        golferId: 45,
        name: "Dustin Johnson",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Missed the cut at the 2025 Masters" },
        season2026: [
            { tournament: "LIV Golf Mayakoba", position: 8, score: -12 },
            { tournament: "LIV Golf Hong Kong", position: 9, score: -10 },
            { tournament: "LIV Golf Singapore", position: 12, score: -11 },
            { tournament: "LIV Golf Las Vegas", position: 10, score: -11 },
            { tournament: "LIV Golf Jeddah", position: 11, score: -10 }
        ],
        seasonStats: { worldRank: 46, wins: 0, top10s: 5, eventsPlayed: 5, scoringAverage: 69.8 },
        strokesGained: { total: 1.28, driving: 1.08, approach: 0.38, aroundGreen: 0.08, putting: -0.26 },
        augustaHistory: { appearances: 14, bestFinish: 1, bestFinishYear: 2020, top10Finishes: 5, cuts: 11, avgScore: 71.0, strengths: ["Driving (one of longest ever)", "Par 5 scoring", "Augusta history"], weaknesses: ["Putting (below average)", "LIV form vs Augusta demands"] },
        formRating: 6.8,
        notes: "2020 Masters champion and one of Augusta's great performers with five top-10s. His length is still an enormous weapon. Putting has been a persistent weakness. Still capable of threatening if the putter gets warm."
    },
    {
        golferId: 46,
        name: "Patrick Reed",
        masters2025: { position: 9, score: -5, rounds: [71, 70, 69, 69], madeCut: true, notes: "Quietly excellent — typical Augusta performance from a course master" },
        season2026: [
            { tournament: "LIV Golf Mayakoba", position: 9, score: -11 },
            { tournament: "LIV Golf Hong Kong", position: 11, score: -9 },
            { tournament: "LIV Golf Singapore", position: 14, score: -10 },
            { tournament: "LIV Golf Las Vegas", position: 12, score: -10 },
            { tournament: "LIV Golf Jeddah", position: 9, score: -11 }
        ],
        seasonStats: { worldRank: 47, wins: 0, top10s: 5, eventsPlayed: 5, scoringAverage: 69.6 },
        strokesGained: { total: 1.32, driving: 0.42, approach: 0.62, aroundGreen: 0.24, putting: 0.04 },
        augustaHistory: { appearances: 12, bestFinish: 1, bestFinishYear: 2018, top10Finishes: 4, cuts: 10, avgScore: 70.8, strengths: ["Augusta course knowledge", "Putting", "Short game", "Mental toughness"], weaknesses: ["LIV form vs field", "Driving distance"] },
        formRating: 7.4,
        notes: "2018 Masters champion known as 'Captain America'. Loves Augusta with four top-10s in 12 starts. His short game and putting are tailor-made for this course. Top-9 last year. Don't sleep on Reed at Augusta — he always turns up."
    },
    {
        golferId: 47,
        name: "Jacob Bridgeman",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 35, score: 0 },
            { tournament: "Farmers Insurance Open", position: 36, score: 5 },
            { tournament: "Genesis Invitational", position: 23, score: -1 },
            { tournament: "Valspar Championship", position: 20, score: -6 },
            { tournament: "Texas Children's Houston Open", position: 26, score: -2 }
        ],
        seasonStats: { worldRank: 48, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 71.0 },
        strokesGained: { total: 0.68, driving: 0.38, approach: 0.22, aroundGreen: 0.06, putting: 0.02 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Young talent", "Ball-striking improving"], weaknesses: ["Augusta debut", "Limited major experience"] },
        formRating: 5.8,
        notes: "Young American making his Masters debut after winning on the PGA Tour. Augusta debut will be a massive learning experience. Talent is clear but needs time to develop major championship nous."
    },
    {
        golferId: 48,
        name: "Nico Echavarría",
        masters2025: { position: 33, score: 2, rounds: [74, 73, 73, 70], madeCut: true, notes: "Made the cut in his debut — gained valuable experience" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 36, score: 1 },
            { tournament: "Farmers Insurance Open", position: 37, score: 6 },
            { tournament: "Valspar Championship", position: 21, score: -5 },
            { tournament: "Texas Children's Houston Open", position: 27, score: -1 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 22, score: -8 }
        ],
        seasonStats: { worldRank: 49, wins: 0, top10s: 0, eventsPlayed: 7, scoringAverage: 71.2 },
        strokesGained: { total: 0.62, driving: 0.42, approach: 0.18, aroundGreen: 0.02, putting: 0.00 },
        augustaHistory: { appearances: 2, bestFinish: 33, bestFinishYear: 2025, top10Finishes: 0, cuts: 1, avgScore: 73.0, strengths: ["Colombian power", "Driving"], weaknesses: ["Augusta greens", "Short game", "Putting"] },
        formRating: 5.7,
        notes: "Colombian Tour winner who's developing on the PGA Tour. Made the cut last year in his Augusta debut. Will aim to make the cut again and continue his development at the highest level."
    },
    {
        golferId: 49,
        name: "Aldrich Potgieter",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 37, score: 2 },
            { tournament: "Farmers Insurance Open", position: 38, score: 7 },
            { tournament: "Genesis Invitational", position: 24, score: 0 },
            { tournament: "Valspar Championship", position: 22, score: -5 },
            { tournament: "Texas Children's Houston Open", position: 28, score: -1 }
        ],
        seasonStats: { worldRank: 50, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 71.4 },
        strokesGained: { total: 0.58, driving: 0.72, approach: 0.12, aroundGreen: -0.04, putting: -0.22 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Enormous driving distance", "Youth and athleticism"], weaknesses: ["Augusta debut", "Short game", "Putting", "Inexperience"] },
        formRating: 5.6,
        notes: "South African teenager who is one of the longest hitters in the world. Still raw but the power is eye-catching. His first Augusta experience will be educational — could go very low or very high."
    },
    {
        golferId: 50,
        name: "Brian Campbell",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 38, score: 3 },
            { tournament: "Farmers Insurance Open", position: 39, score: 8 },
            { tournament: "Valspar Championship", position: 23, score: -4 },
            { tournament: "Texas Children's Houston Open", position: 29, score: -1 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 23, score: -7 }
        ],
        seasonStats: { worldRank: 51, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 71.5 },
        strokesGained: { total: 0.52, driving: 0.28, approach: 0.18, aroundGreen: 0.04, putting: 0.02 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["PGA Tour winner", "Solid ball-striking"], weaknesses: ["Augusta debut", "Limited major experience"] },
        formRating: 5.5,
        notes: "PGA Tour winner making his Augusta debut. Will be delighted to be competing at the Masters and will gain invaluable experience this week."
    },
    {
        golferId: 51,
        name: "Max Greyserman",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 39, score: 4 },
            { tournament: "Farmers Insurance Open", position: 40, score: 9 },
            { tournament: "Genesis Invitational", position: 25, score: 1 },
            { tournament: "Valspar Championship", position: 24, score: -4 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 24, score: -6 }
        ],
        seasonStats: { worldRank: 52, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 71.6 },
        strokesGained: { total: 0.48, driving: 0.22, approach: 0.18, aroundGreen: 0.06, putting: 0.02 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Consistent PGA Tour performer", "Ball-striking"], weaknesses: ["Augusta debut", "Power"] },
        formRating: 5.4,
        notes: "Making his Masters debut. Solid PGA Tour player who has earned his invitation. Will aim to make the cut and take away experience from competing against the world's best."
    },
    {
        golferId: 52,
        name: "Ryan Gerard",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "The American Express", position: 2, score: -23 },
            { tournament: "Sony Open", position: 2, score: -20 },
            { tournament: "WM Phoenix Open", position: 40, score: 5 },
            { tournament: "Farmers Insurance Open", position: 41, score: 10 },
            { tournament: "Genesis Invitational", position: 26, score: 2 }
        ],
        seasonStats: { worldRank: 53, wins: 0, top10s: 3, eventsPlayed: 7, scoringAverage: 70.4 },
        strokesGained: { total: 0.92, driving: 0.52, approach: 0.28, aroundGreen: 0.08, putting: 0.04 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Hot form in early 2026 (3 top-3s)", "Ball-striking", "Putting improving"], weaknesses: ["Augusta debut", "No major experience"] },
        formRating: 6.8,
        notes: "One of the hottest players in early 2026 — three top-3 finishes including two runner-ups. His form demands respect even as a debutant. Could be a surprise packet if he brings his early season form to Augusta."
    },
    {
        golferId: 53,
        name: "Jake Knapp",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 41, score: 6 },
            { tournament: "Farmers Insurance Open", position: 42, score: 11 },
            { tournament: "Valspar Championship", position: 25, score: -3 },
            { tournament: "Texas Children's Houston Open", position: 30, score: 0 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 25, score: -5 }
        ],
        seasonStats: { worldRank: 54, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 71.4 },
        strokesGained: { total: 0.54, driving: 0.58, approach: 0.12, aroundGreen: 0.02, putting: -0.18 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Driving length", "Power game"], weaknesses: ["Augusta debut", "Putting", "Short game"] },
        formRating: 5.3,
        notes: "Long hitter added to the field via OWGR. Augusta debut — his power could make the par 5s accessible but needs more short game refinement to compete at this level."
    },
    {
        golferId: 54,
        name: "Nicolai Højgaard",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 42, score: 7 },
            { tournament: "Farmers Insurance Open", position: 43, score: 12 },
            { tournament: "Genesis Invitational", position: 27, score: 3 },
            { tournament: "Valspar Championship", position: 26, score: -3 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 26, score: -4 }
        ],
        seasonStats: { worldRank: 55, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 71.5 },
        strokesGained: { total: 0.52, driving: 0.48, approach: 0.14, aroundGreen: 0.04, putting: -0.14 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Danish talent", "Driving", "Iron play developing"], weaknesses: ["Augusta debut", "Putting", "Major inexperience"] },
        formRating: 5.5,
        notes: "Danish twin brother of Rasmus. Added to the field via OWGR. Talented young European who is still developing. Augusta debut will be a fantastic experience."
    },
    {
        golferId: 55,
        name: "Matt McCarty",
        masters2025: { position: 19, score: -3, rounds: [70, 70, 74, 71], madeCut: true, notes: "Excellent debut — led after 36 holes and was right in contention before fading slightly" },
        season2026: [
            { tournament: "The American Express", position: 2, score: -23 },
            { tournament: "WM Phoenix Open", position: 43, score: 8 },
            { tournament: "Farmers Insurance Open", position: 44, score: 13 },
            { tournament: "Genesis Invitational", position: 28, score: 4 },
            { tournament: "Valspar Championship", position: 27, score: -2 }
        ],
        seasonStats: { worldRank: 56, wins: 0, top10s: 2, eventsPlayed: 7, scoringAverage: 70.8 },
        strokesGained: { total: 0.88, driving: 0.62, approach: 0.22, aroundGreen: 0.02, putting: 0.02 },
        augustaHistory: { appearances: 2, bestFinish: 19, bestFinishYear: 2025, top10Finishes: 0, cuts: 2, avgScore: 71.8, strengths: ["Driving power", "Augusta familiarity improving"], weaknesses: ["Putting", "Closing"] },
        formRating: 6.6,
        notes: "Surprised everyone at the 2025 Masters leading after two rounds. Runner-up at The American Express in 2026 alongside Scheffler. Power hitter who is improving rapidly. Dark horse with some Augusta knowledge now."
    },
    {
        golferId: 56,
        name: "Daniel Berger",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 44, score: 9 },
            { tournament: "Farmers Insurance Open", position: 45, score: 14 },
            { tournament: "Genesis Invitational", position: 29, score: 5 },
            { tournament: "Valspar Championship", position: 28, score: -2 },
            { tournament: "Texas Children's Houston Open", position: 31, score: 1 }
        ],
        seasonStats: { worldRank: 57, wins: 0, top10s: 0, eventsPlayed: 7, scoringAverage: 71.6 },
        strokesGained: { total: 0.54, driving: 0.42, approach: 0.14, aroundGreen: 0.04, putting: -0.06 },
        augustaHistory: { appearances: 5, bestFinish: 18, bestFinishYear: 2021, top10Finishes: 0, cuts: 3, avgScore: 72.2, strengths: ["Ball-striking", "Augusta experience"], weaknesses: ["Augusta results have been modest", "Putting"] },
        formRating: 5.6,
        notes: "Returning to Tour after injury absences. Added to the field via OWGR. Some Augusta experience but results have been modest. Rust may be a factor early in the week."
    },
    {
        golferId: 57,
        name: "Gary Woodland",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "Texas Children's Houston Open", position: 1, score: -16 },
            { tournament: "WM Phoenix Open", position: 45, score: 10 },
            { tournament: "Farmers Insurance Open", position: 46, score: 15 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 27, score: -3 },
            { tournament: "Genesis Invitational", position: 30, score: 6 }
        ],
        seasonStats: { worldRank: 58, wins: 1, top10s: 1, eventsPlayed: 6, scoringAverage: 71.2 },
        strokesGained: { total: 0.72, driving: 0.88, approach: 0.08, aroundGreen: -0.02, putting: -0.22 },
        augustaHistory: { appearances: 5, bestFinish: 25, bestFinishYear: 2019, top10Finishes: 0, cuts: 3, avgScore: 73.0, strengths: ["Driving length", "Won Houston Open to qualify"], weaknesses: ["Augusta history poor", "Putting", "Short game"] },
        formRating: 6.0,
        notes: "2019 U.S. Open champion who won the Texas Children's Houston Open to earn his Masters spot. Last-minute qualifier whose win will give him huge confidence. Long hitter but Augusta hasn't been a strong venue historically."
    },
    {
        golferId: 58,
        name: "Michael Kim",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 46, score: 11 },
            { tournament: "Farmers Insurance Open", position: 47, score: 16 },
            { tournament: "Genesis Invitational", position: 31, score: 7 },
            { tournament: "Valspar Championship", position: 29, score: -1 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 28, score: -2 }
        ],
        seasonStats: { worldRank: 59, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 71.8 },
        strokesGained: { total: 0.44, driving: 0.18, approach: 0.18, aroundGreen: 0.06, putting: 0.02 },
        augustaHistory: { appearances: 2, bestFinish: 28, bestFinishYear: 2019, top10Finishes: 0, cuts: 1, avgScore: 73.5, strengths: ["Ball-striking consistency"], weaknesses: ["Augusta history poor", "Power lacking", "Putting"] },
        formRating: 4.8,
        notes: "American Tour winner making a return to Augusta. Augusta hasn't been his hunting ground. Will aim to make the cut and compete professionally."
    },
    {
        golferId: 59,
        name: "Johnny Keefer",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 47, score: 12 },
            { tournament: "Farmers Insurance Open", position: 48, score: 17 },
            { tournament: "Genesis Invitational", position: 32, score: 8 },
            { tournament: "Valspar Championship", position: 30, score: 0 },
            { tournament: "Texas Children's Houston Open", position: 32, score: 2 }
        ],
        seasonStats: { worldRank: 60, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 72.0 },
        strokesGained: { total: 0.38, driving: 0.22, approach: 0.12, aroundGreen: 0.02, putting: 0.02 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Earned his place on Tour"], weaknesses: ["Augusta debut", "All aspects of game developing"] },
        formRating: 4.5,
        notes: "Making his Masters debut. Delighted to be here and will gain enormous experience from competing at Augusta National."
    },
    {
        golferId: 60,
        name: "Michael Brennan",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 48, score: 13 },
            { tournament: "Farmers Insurance Open", position: 49, score: 18 },
            { tournament: "Valspar Championship", position: 31, score: 1 },
            { tournament: "Texas Children's Houston Open", position: 33, score: 3 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 29, score: -1 }
        ],
        seasonStats: { worldRank: 61, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 72.1 },
        strokesGained: { total: 0.34, driving: 0.28, approach: 0.08, aroundGreen: 0.02, putting: -0.04 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Young American talent", "Ball-striking potential"], weaknesses: ["Augusta debut", "Major inexperience"] },
        formRating: 4.4,
        notes: "Young American professional making his Masters debut. Will treasure every moment at Augusta National. Development player at this stage of his career."
    },
    {
        golferId: 61,
        name: "Carlos Ortiz",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 49, score: 14 },
            { tournament: "Farmers Insurance Open", position: 50, score: 19 },
            { tournament: "Genesis Invitational", position: 33, score: 9 },
            { tournament: "Valspar Championship", position: 32, score: 2 },
            { tournament: "Texas Children's Houston Open", position: 34, score: 4 }
        ],
        seasonStats: { worldRank: 62, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 72.0 },
        strokesGained: { total: 0.36, driving: 0.28, approach: 0.10, aroundGreen: 0.02, putting: -0.04 },
        augustaHistory: { appearances: 3, bestFinish: 24, bestFinishYear: 2022, top10Finishes: 0, cuts: 2, avgScore: 72.8, strengths: ["Driving", "Mexican fan favourite"], weaknesses: ["Augusta history modest", "Putting", "Short game"] },
        formRating: 4.8,
        notes: "Mexican pro who qualified via his 2025 U.S. Open top-4 finish. Some Augusta experience. Will aim to make the cut and represent Mexico proudly at the first major."
    },
    {
        golferId: 62,
        name: "Li Haotong",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 50, score: 15 },
            { tournament: "Farmers Insurance Open", position: 51, score: 20 },
            { tournament: "Genesis Invitational", position: 34, score: 10 },
            { tournament: "Valspar Championship", position: 33, score: 3 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 30, score: 0 }
        ],
        seasonStats: { worldRank: 63, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 72.2 },
        strokesGained: { total: 0.32, driving: 0.22, approach: 0.12, aroundGreen: 0.02, putting: -0.04 },
        augustaHistory: { appearances: 3, bestFinish: 22, bestFinishYear: 2019, top10Finishes: 0, cuts: 2, avgScore: 72.6, strengths: ["Driving", "Iron play when on form"], weaknesses: ["Augusta putting", "Consistency"] },
        formRating: 4.6,
        notes: "Chinese star who qualified via the 2025 Open Championship. Had a bright career on the DP World Tour. Augusta debut was 2019 — some experience to draw on. Will aim to make the weekend."
    },
    {
        golferId: 63,
        name: "Marco Penge",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 51, score: 16 },
            { tournament: "Farmers Insurance Open", position: 52, score: 21 },
            { tournament: "Genesis Invitational", position: 35, score: 11 },
            { tournament: "DP World Tour events", position: 8, score: -12 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 31, score: 1 }
        ],
        seasonStats: { worldRank: 64, wins: 0, top10s: 1, eventsPlayed: 6, scoringAverage: 72.0 },
        strokesGained: { total: 0.38, driving: 0.38, approach: 0.08, aroundGreen: 0.02, putting: -0.10 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["DP World Tour winner", "European pedigree"], weaknesses: ["Augusta debut", "PGA Tour experience limited"] },
        formRating: 4.7,
        notes: "English pro who won the 2025 Spanish Open to earn his Masters spot. Making his Augusta debut — a dream come true for any professional golfer. Will learn from the experience."
    },
    {
        golferId: 64,
        name: "Nick Taylor",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "AT&T Pebble Beach Pro-Am", position: 4, score: -20 },
            { tournament: "WM Phoenix Open", position: 52, score: 17 },
            { tournament: "Farmers Insurance Open", position: 53, score: 22 },
            { tournament: "Genesis Invitational", position: 36, score: 12 },
            { tournament: "Valspar Championship", position: 34, score: 4 }
        ],
        seasonStats: { worldRank: 65, wins: 0, top10s: 1, eventsPlayed: 6, scoringAverage: 71.4 },
        strokesGained: { total: 0.52, driving: 0.38, approach: 0.18, aroundGreen: 0.04, putting: -0.08 },
        augustaHistory: { appearances: 4, bestFinish: 26, bestFinishYear: 2024, top10Finishes: 0, cuts: 3, avgScore: 72.4, strengths: ["Canadian star", "Solid ball-striking", "T4 at Pebble in 2026"], weaknesses: ["Augusta finishing positions modest", "Putting under pressure"] },
        formRating: 5.8,
        notes: "Canadian who qualified via the Tour Championship. Good recent form including T-4 at Pebble Beach 2026. Augusta hasn't produced strong results yet but talent is there to post a good score."
    },

    // ─── TIER 5 ───────────────────────────────────────────────
    {
        golferId: 65,
        name: "Adam Scott",
        masters2025: { position: 34, score: 2, rounds: [74, 73, 74, 69], madeCut: true, notes: "Made the cut — remarkable longevity at the highest level" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 53, score: 18 },
            { tournament: "Farmers Insurance Open", position: 54, score: 23 },
            { tournament: "Genesis Invitational", position: 37, score: 13 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 32, score: 2 },
            { tournament: "Valspar Championship", position: 35, score: 5 }
        ],
        seasonStats: { worldRank: 66, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 71.8 },
        strokesGained: { total: 0.62, driving: 0.42, approach: 0.28, aroundGreen: 0.08, putting: -0.16 },
        augustaHistory: { appearances: 24, bestFinish: 1, bestFinishYear: 2013, top10Finishes: 7, cuts: 20, avgScore: 71.0, strengths: ["Augusta course mastery", "Iron play (still elite)", "Experience"], weaknesses: ["Age (45)", "Putting with long putter banned", "Physical longevity"] },
        formRating: 6.5,
        notes: "2013 Masters champion making his 25th start at Augusta. One of the course's great lovers with seven top-10s. At 45 he's past his peak but still strikes the ball beautifully. Never rule out the Australian at Augusta."
    },
    {
        golferId: 66,
        name: "Sergio García",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Missed the cut at 2025 Masters" },
        season2026: [
            { tournament: "LIV Golf Mayakoba", position: 14, score: -9 },
            { tournament: "LIV Golf Hong Kong", position: 15, score: -7 },
            { tournament: "LIV Golf Singapore", position: 18, score: -8 },
            { tournament: "LIV Golf Las Vegas", position: 16, score: -8 },
            { tournament: "LIV Golf Jeddah", position: 13, score: -9 }
        ],
        seasonStats: { worldRank: 67, wins: 0, top10s: 0, eventsPlayed: 5, scoringAverage: 70.8 },
        strokesGained: { total: 0.68, driving: 0.48, approach: 0.28, aroundGreen: 0.06, putting: -0.14 },
        augustaHistory: { appearances: 23, bestFinish: 1, bestFinishYear: 2017, top10Finishes: 8, cuts: 20, avgScore: 71.2, strengths: ["Augusta experience", "Chipping (elite)", "Iron play"], weaknesses: ["Putting (lifelong issue)", "Age 46", "LIV form vs Augusta field"] },
        formRating: 6.2,
        notes: "2017 Masters champion with eight top-10s in 23 Augusta starts — one of the great Augusta performers. Still a past champion who must be respected. Chipping remains elite. Putting has always been his Achilles heel."
    },
    {
        golferId: 67,
        name: "Bubba Watson",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Missed the cut at 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 54, score: 19 },
            { tournament: "Farmers Insurance Open", position: 55, score: 24 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 33, score: 3 },
            { tournament: "Genesis Invitational", position: 38, score: 14 },
            { tournament: "Valspar Championship", position: 36, score: 6 }
        ],
        seasonStats: { worldRank: 68, wins: 0, top10s: 0, eventsPlayed: 6, scoringAverage: 72.2 },
        strokesGained: { total: 0.38, driving: 0.68, approach: 0.08, aroundGreen: 0.04, putting: -0.42 },
        augustaHistory: { appearances: 15, bestFinish: 1, bestFinishYear: 2012, top10Finishes: 3, cuts: 11, avgScore: 71.6, strengths: ["The famous hook shot", "Augusta creativity", "Power"], weaknesses: ["Age 47", "Form has significantly declined", "Putting"] },
        formRating: 4.8,
        notes: "Two-time Masters champion (2012, 2014) who is well past his prime but still holds the invites as a past champion. His unique shot-making ability means Augusta always suits him. Unlikely to challenge but stranger things have happened here."
    },
    {
        golferId: 68,
        name: "Danny Willett",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Missed the cut at 2025 Masters" },
        season2026: [
            { tournament: "WM Phoenix Open", position: 55, score: 20 },
            { tournament: "Farmers Insurance Open", position: 56, score: 25 },
            { tournament: "DP World Tour events", position: 12, score: -8 },
            { tournament: "Genesis Invitational", position: 39, score: 15 },
            { tournament: "Valspar Championship", position: 37, score: 7 }
        ],
        seasonStats: { worldRank: 69, wins: 0, top10s: 0, eventsPlayed: 5, scoringAverage: 72.3 },
        strokesGained: { total: 0.28, driving: 0.18, approach: 0.12, aroundGreen: 0.04, putting: -0.06 },
        augustaHistory: { appearances: 10, bestFinish: 1, bestFinishYear: 2016, top10Finishes: 1, cuts: 6, avgScore: 72.4, strengths: ["2016 champion memories", "Course knowledge"], weaknesses: ["Form well below peak", "Putting", "Driving accuracy"] },
        formRating: 4.2,
        notes: "2016 Masters champion who benefited from Jordan Spieth's famous collapse. Never recaptured that form since. Still qualifies as a past champion. A sentimental figure at Augusta but not a realistic contender."
    },
    {
        golferId: 69,
        name: "Charl Schwartzel",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "LIV Golf Mayakoba", position: 18, score: -7 },
            { tournament: "LIV Golf Hong Kong", position: 20, score: -5 },
            { tournament: "LIV Golf Singapore", position: 22, score: -6 },
            { tournament: "LIV Golf Las Vegas", position: 18, score: -7 },
            { tournament: "LIV Golf Jeddah", position: 17, score: -7 }
        ],
        seasonStats: { worldRank: 70, wins: 0, top10s: 0, eventsPlayed: 5, scoringAverage: 71.0 },
        strokesGained: { total: 0.42, driving: 0.22, approach: 0.22, aroundGreen: 0.06, putting: -0.08 },
        augustaHistory: { appearances: 14, bestFinish: 1, bestFinishYear: 2011, top10Finishes: 2, cuts: 10, avgScore: 71.8, strengths: ["Past champion experience", "Iron play", "Short game"], weaknesses: ["Age 41", "Declining form", "Putting"] },
        formRating: 4.6,
        notes: "2011 Masters champion — beat the field with four birdies on the final four holes. On LIV Golf now and form has been modest. Past champion respect means he gets in the field. Unlikely to challenge but knows Augusta well."
    },
    {
        golferId: 70,
        name: "Mike Weir",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not tee up at 2025 Masters" },
        season2026: [
            { tournament: "PGA Tour Champions events", position: 5, score: -12 },
            { tournament: "PGA Tour Champions events", position: 8, score: -10 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 54, score: 22 },
            { tournament: "WM Phoenix Open", position: 56, score: 21 },
            { tournament: "Farmers Insurance Open", position: 57, score: 26 }
        ],
        seasonStats: { worldRank: 71, wins: 0, top10s: 0, eventsPlayed: 4, scoringAverage: 73.5 },
        strokesGained: { total: -0.42, driving: -0.22, approach: 0.04, aroundGreen: 0.04, putting: -0.28 },
        augustaHistory: { appearances: 16, bestFinish: 1, bestFinishYear: 2003, top10Finishes: 2, cuts: 11, avgScore: 72.6, strengths: ["2003 champion left-hander memories", "Experience"], weaknesses: ["Age 55", "Playing primarily Champions Tour", "Well past peak"] },
        formRating: 2.8,
        notes: "2003 Masters champion — Canada's greatest golf moment. Now 55 and playing mainly on the Champions Tour. Competing at Augusta is about history and tradition now. Not a realistic contender."
    },
    {
        golferId: 71,
        name: "Vijay Singh",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Withdrew injured from 2025 Masters" },
        season2026: [
            { tournament: "PGA Tour Champions events", position: 10, score: -8 },
            { tournament: "PGA Tour Champions events", position: 12, score: -7 },
            { tournament: "WM Phoenix Open", position: 57, score: 22 },
            { tournament: "Farmers Insurance Open", position: 58, score: 27 },
            { tournament: "Genesis Invitational", position: 40, score: 16 }
        ],
        seasonStats: { worldRank: 72, wins: 0, top10s: 0, eventsPlayed: 3, scoringAverage: 74.2 },
        strokesGained: { total: -0.82, driving: -0.22, approach: -0.24, aroundGreen: -0.14, putting: -0.22 },
        augustaHistory: { appearances: 28, bestFinish: 2, bestFinishYear: 2000, top10Finishes: 6, cuts: 22, avgScore: 71.8, strengths: ["Experience", "Legend of the game"], weaknesses: ["Age 62", "Range hitting only at this point in career", "Health concerns"] },
        formRating: 1.8,
        notes: "Fijian legend who is 62 years old and still shows up at Augusta as a past champion. Six career top-10s here. Withdrew injured last year. Not a competitive entry at this stage but a reminder of an incredible career."
    },
    {
        golferId: 72,
        name: "José María Olazábal",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete at 2025 Masters" },
        season2026: [
            { tournament: "DP World Tour events (senior)", position: 15, score: -5 }
        ],
        seasonStats: { worldRank: 73, wins: 0, top10s: 0, eventsPlayed: 1, scoringAverage: 75.0 },
        strokesGained: { total: -1.20, driving: -0.48, approach: -0.24, aroundGreen: -0.18, putting: -0.30 },
        augustaHistory: { appearances: 23, bestFinish: 1, bestFinishYear: 1994, top10Finishes: 8, cuts: 18, avgScore: 71.5, strengths: ["Augusta legend", "Two-time champion"], weaknesses: ["Age 60", "Retired from competitive play", "Health issues"] },
        formRating: 1.5,
        notes: "Spanish legend and two-time Masters champion (1994, 1999). Eight top-10s at Augusta. Competing as a past champion — this is about tradition and respect for one of Augusta's greatest ever competitors. Not a competitive entry."
    },
    {
        golferId: 73,
        name: "Zach Johnson",
        masters2025: { position: 8, score: -5, rounds: [72, 74, 66, 71], madeCut: true, notes: "Surprise top-10 — incredible at 48 years old, defied all expectations" },
        season2026: [
            { tournament: "PGA Tour Champions - James Hardie Invitational", position: 1, score: -18 },
            { tournament: "PGA Tour Champions events", position: 2, score: -14 },
            { tournament: "PGA Tour Champions events", position: 3, score: -12 },
            { tournament: "Farmers Insurance Open", position: 59, score: 28 },
            { tournament: "AT&T Pebble Beach Pro-Am", position: 55, score: 24 }
        ],
        seasonStats: { worldRank: 74, wins: 1, top10s: 3, eventsPlayed: 5, scoringAverage: 72.0 },
        strokesGained: { total: 0.28, driving: -0.22, approach: 0.28, aroundGreen: 0.18, putting: 0.04 },
        augustaHistory: { appearances: 22, bestFinish: 1, bestFinishYear: 2007, top10Finishes: 5, cuts: 16, avgScore: 71.9, strengths: ["2007 champion experience", "Short game mastery", "Course management"], weaknesses: ["Driving (shortest in field)", "Age 50", "Pace of play vs. modern power game"] },
        formRating: 6.0,
        notes: "Miraculous T-8 at the 2025 Masters aged 48! 2007 champion (one of Augusta's most famous victories), now dominating the Champions Tour. Defies logic every time he tees it up here. The shortest hitter in the field but Augusta's layout suits him. Dark horse!"
    },
    {
        golferId: 74,
        name: "Fred Couples",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete in 2025 Masters" },
        season2026: [
            { tournament: "PGA Tour Champions events", position: 6, score: -10 },
            { tournament: "PGA Tour Champions events", position: 9, score: -8 }
        ],
        seasonStats: { worldRank: 75, wins: 0, top10s: 2, eventsPlayed: 2, scoringAverage: 73.8 },
        strokesGained: { total: -0.68, driving: 0.08, approach: -0.22, aroundGreen: -0.18, putting: -0.36 },
        augustaHistory: { appearances: 41, bestFinish: 1, bestFinishYear: 1992, top10Finishes: 13, cuts: 36, avgScore: 71.4, strengths: ["Augusta legend", "Ball-striking genius", "Golf god at Augusta"], weaknesses: ["Age 66", "Back issues chronic", "Not competitive at PGA Tour level"] },
        formRating: 2.2,
        notes: "Augusta royalty — 1992 champion making his 41st start. Thirteen career top-10s here. Famous for his ball never going in the water at the 12th. At 66 with chronic back issues, not competitive but the crowd will love every shot."
    },
    {
        golferId: 75,
        name: "Ángel Cabrera",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete in 2025 Masters" },
        season2026: [],
        seasonStats: { worldRank: 76, wins: 0, top10s: 0, eventsPlayed: 0, scoringAverage: null },
        strokesGained: { total: -1.80, driving: -0.42, approach: -0.62, aroundGreen: -0.38, putting: -0.38 },
        augustaHistory: { appearances: 14, bestFinish: 1, bestFinishYear: 2009, top10Finishes: 2, cuts: 9, avgScore: 73.2, strengths: ["2009 champion", "Course familiarity"], weaknesses: ["Age 56", "Return from prison", "Extended absence from professional golf"] },
        formRating: 1.2,
        notes: "2009 Masters champion returning to Augusta after serving a prison sentence in Argentina. Returning to competitive play at 56 after years away. Not a competitive entry."
    },
    {
        golferId: 76,
        name: "Casey Jarvis",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "DP World Tour events", position: 4, score: -14 },
            { tournament: "DP World Tour events", position: 7, score: -12 },
            { tournament: "WM Phoenix Open", position: 60, score: 23 },
            { tournament: "Farmers Insurance Open", position: 61, score: 28 }
        ],
        seasonStats: { worldRank: 77, wins: 0, top10s: 2, eventsPlayed: 4, scoringAverage: 72.2 },
        strokesGained: { total: 0.22, driving: 0.42, approach: 0.02, aroundGreen: -0.04, putting: -0.18 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["South African power game", "Youth", "DP World Tour form"], weaknesses: ["Augusta debut", "Putting", "Major experience limited"] },
        formRating: 5.2,
        notes: "Young South African making his Augusta debut — qualified via the South African Open. Big hitter with an exciting future ahead. Will learn enormously from this week."
    },
    {
        golferId: 77,
        name: "Naoyuki Kataoka",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not qualify for 2025 Masters" },
        season2026: [
            { tournament: "Japan Open", position: 1, score: -15 },
            { tournament: "Japan Golf Tour events", position: 3, score: -12 },
            { tournament: "Japan Golf Tour events", position: 5, score: -10 }
        ],
        seasonStats: { worldRank: 78, wins: 1, top10s: 3, eventsPlayed: 3, scoringAverage: 70.8 },
        strokesGained: { total: 0.32, driving: 0.18, approach: 0.18, aroundGreen: 0.06, putting: -0.10 },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Japan Open champion", "Consistent Japan Tour performer"], weaknesses: ["Augusta debut", "PGA Tour inexperience", "Distance"] },
        formRating: 5.0,
        notes: "Japanese pro who won the Japan Open to earn a first-ever invitation under the new national opens criteria. Making his Augusta debut — a historic moment for Japanese golf fans. Matsuyama blazed the trail he hopes to follow."
    },

    // ─── TIER 6 — AMATEURS ───────────────────────────────────
    {
        golferId: 78,
        name: "Mason Howell",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete in 2025 Masters" },
        season2026: [],
        seasonStats: { worldRank: 79, wins: 0, top10s: 0, eventsPlayed: 0, scoringAverage: null },
        strokesGained: { total: null, driving: null, approach: null, aroundGreen: null, putting: null },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["2025 U.S. Amateur champion", "Paired with McIlroy (great exposure)"], weaknesses: ["Amateur — competing against the world's best professionals", "No Augusta experience"] },
        formRating: 4.0,
        notes: "2025 U.S. Amateur champion. Paired with defending champion Rory McIlroy by tradition. Exciting amateur talent who will compete for Low Amateur honours. Making the cut would be a major achievement."
    },
    {
        golferId: 79,
        name: "Jackson Herrington",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete in 2025 Masters" },
        season2026: [],
        seasonStats: { worldRank: 80, wins: 0, top10s: 0, eventsPlayed: 0, scoringAverage: null },
        strokesGained: { total: null, driving: null, approach: null, aroundGreen: null, putting: null },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["U.S. Amateur runner-up", "Top collegiate player"], weaknesses: ["Amateur competing vs professionals", "Augusta debut"] },
        formRating: 3.8,
        notes: "U.S. Amateur runner-up making his Augusta debut. Will compete for Low Amateur honours alongside Howell."
    },
    {
        golferId: 80,
        name: "Ethan Fang",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete in 2025 Masters" },
        season2026: [],
        seasonStats: { worldRank: 81, wins: 0, top10s: 0, eventsPlayed: 0, scoringAverage: null },
        strokesGained: { total: null, driving: null, approach: null, aroundGreen: null, putting: null },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Amateur Championship winner", "UK-based amateur pedigree"], weaknesses: ["Amateur competing vs professionals", "Augusta debut"] },
        formRating: 3.7,
        notes: "2025 Amateur Championship (British Amateur) winner. Making his Augusta debut. Will aim to compete and hopefully make the cut."
    },
    {
        golferId: 81,
        name: "Fifa Laopakdee",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete in 2025 Masters" },
        season2026: [],
        seasonStats: { worldRank: 82, wins: 0, top10s: 0, eventsPlayed: 0, scoringAverage: null },
        strokesGained: { total: null, driving: null, approach: null, aroundGreen: null, putting: null },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Asia-Pacific Amateur champion", "Thai representation"], weaknesses: ["Amateur competing vs professionals", "Augusta debut"] },
        formRating: 3.6,
        notes: "2025 Asia-Pacific Amateur champion from Thailand. Making his Augusta debut — a landmark moment for Thai golf. Will aim to make the cut and represent his country proudly."
    },
    {
        golferId: 82,
        name: "Mateo Pulcini",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete in 2025 Masters" },
        season2026: [],
        seasonStats: { worldRank: 83, wins: 0, top10s: 0, eventsPlayed: 0, scoringAverage: null },
        strokesGained: { total: null, driving: null, approach: null, aroundGreen: null, putting: null },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["Latin America Amateur champion", "South American representation"], weaknesses: ["Amateur competing vs professionals", "Augusta debut"] },
        formRating: 3.5,
        notes: "2026 Latin America Amateur champion. Making his Augusta debut. Will represent South American golf at the first major of 2026."
    },
    {
        golferId: 83,
        name: "Brandon Holtz",
        masters2025: { position: null, score: null, rounds: [], madeCut: false, notes: "Did not compete in 2025 Masters" },
        season2026: [],
        seasonStats: { worldRank: 84, wins: 0, top10s: 0, eventsPlayed: 0, scoringAverage: null },
        strokesGained: { total: null, driving: null, approach: null, aroundGreen: null, putting: null },
        augustaHistory: { appearances: 1, bestFinish: null, bestFinishYear: null, top10Finishes: 0, cuts: 0, avgScore: null, strengths: ["U.S. Mid-Amateur champion", "Former basketball player — exceptional athleticism", "Long hitter"], weaknesses: ["Amateur competing vs professionals", "Augusta debut", "38 years old — unusual amateur profile"] },
        formRating: 3.8,
        notes: "Fascinating story — 38-year-old former Illinois State basketball player who became an elite amateur. Won the 2025 U.S. Mid-Amateur. His power game could be a weapon. One of the most unique Augusta competitors in years."
    }
];

// Export for use in other files (Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formGuideData };
}
