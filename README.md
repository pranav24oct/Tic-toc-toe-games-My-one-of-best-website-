🎮 TicToc Toy Games
A creative and interactive browser-based gaming website where players can play mini-games, track progress, and compete on a leaderboard.
✨ Features
- 🎮 Multiple playable games
- 🏃 Neon Runner: original Three.js-inspired 3D endless runner
- 🔐 User login and registration
- 👤 User profile
- ⭐ XP and coins system
- 🏆 Global leaderboard
- ❤️ Favorite games and 🔎 game search
- 🎯 Daily challenges
- 🏅 Achievements and 📊 game statistics
- 🌌 Neon-style interface with 3D effects
- 📱 Responsive design
- 💾 SQLite database
- ⚡ Node.js + Express backend
🕹️ Available Games
Game	Type	Description
🐍 Snake Neon Rush	Arcade	Control the snake and collect food while increasing your score.
❌ Tic-Tac-Toe Quantum	Strategy	Play Tic-Tac-Toe with a modern neon design.
🧱 Brick Breaker Pulse	Arcade	Break glowing bricks and reach higher levels.
🏓 Pong Cyber Duel	Arcade	Challenge the computer in a futuristic Pong battle.
🧠 Memory Match Galaxy	Puzzle	Match the correct cards and improve your memory.
🔢 2048 Infinity	Puzzle	Combine matching numbers and try to reach 2048.
🏃 Neon Runner	3D endless runner	Switch lanes, jump, slide, avoid obstacles, collect energy coins, and beat your distance score.


🏃 Neon Runner
Neon Runner is an original endless-runner game built with Three.js and integrated into the TicToc Toy Games website. It uses original game code and generated 3D shapes rather than copying Subway Surfers' proprietary code or assets.
Gameplay features
- Three-lane running track with a neon-city style environment
- Lane switching, jumping, and sliding
- Obstacles and collectible energy coins
- Increasing speed and distance-based scoring
- Pause and restart controls
- Keyboard and mobile touch controls
- Local best-distance tracking
- Score submission through the existing /api/score endpoint for logged-in players
Controls
Action	Keyboard	Mobile touch
Move left/right	Left/Right arrows or A/D	Swipe left/right or use on-screen controls
Jump	Up arrow, W, or Space	Swipe up or use the jump control
Slide	Down arrow or S	Swipe down or use the slide control
Pause	P or Escape	Pause button


Three.js is loaded from a CDN, so an internet connection is required to load the game library.
🛠️ Technologies Used
- Frontend: HTML5, CSS3, JavaScript, Three.js
- Backend: Node.js, Express.js
- Database: SQLite
- Authentication: Express Session, bcryptjs
📁 Project Structure
TicToc-Toy-Games/
├── package.json
├── package-lock.json
├── server.js
├── database.js
├── README.md
└── public/
    ├── index.html
    ├── css/
    │   ├── style.css
    │   ├── games.css
    │   └── neon-runner.css
    ├── js/
    │   ├── app.js
    │   ├── game-common.js
    │   └── neon-runner.js
    └── games/
        ├── snake.html
        ├── tic-tac-toe.html
        ├── brick-breaker.html
        ├── pong.html
        ├── memory-match.html
        ├── 2048.html
        └── neon-runner.html
Your local project version may contain additional files or slightly different paths. Preserve your existing database, configuration, and game files when updating the project.
🚀 How to Run Locally
1. Install Node.js and verify it:
   node --version
   npm --version
2. Open a terminal in the extracted project folder.
3. Install dependencies:
   npm install
4. Start the server:
   npm start
5. Open http://localhost:3000 in your browser.
Use the Express server URL rather than opening index.html directly or using Live Server on port 5500; frontend API calls need to reach the Express backend.

To open Neon Runner directly, visit:
http://localhost:3000/games/neon-runner.html
Sign in to submit scores if the existing score API requires authentication. If scores do not appear, inspect the browser console and the response from /api/score.
🔐 User System
The platform includes registration, login, logout, profiles, game statistics, favorites, XP, coins, achievements, and leaderboard features. Passwords are stored using password hashing rather than plain text.
🏆 Achievements and Daily Challenges
Players can unlock achievements by playing games and improving their performance. Example achievements include First Play, Score Hunter, Arcade Rookie, Winner, Explorer, Master, and All Rounder.

Daily challenges provide an additional goal. Challenge information is supplied by the existing daily-challenge API; completion and rewards depend on the current backend implementation.
🎨 Design and Browser Support
The site uses neon-style effects, gradient backgrounds, animated elements, 3D-style game cards, smooth transitions, and responsive layouts. It is intended for modern browsers such as Chrome, Edge, Firefox, and Safari. Three.js requires a supported browser and an internet connection when loaded from its CDN.
⚠️ Important Notes
- Back up the project folder and database before replacing or modifying files.
- Keep the Express server running while using the website.
- If .env is missing, the development server may use a temporary session secret. Configure a persistent SESSION_SECRET in .env for stable sessions.
- For production, configure persistent sessions, environment variables, HTTPS, security headers, and suitable database hosting.
- Syntax and archive checks do not replace browser testing. Test gameplay, score saving, and all existing games locally before deployment.
👨‍💻 Project
Project Name: TicToc Toy Games
Type: Web Development / Gaming Platform
Main Technologies: HTML, CSS, JavaScript, Three.js, Node.js, Express.js, SQLite
Play. Challenge. Improve. Repeat. 🎮
<img width="1703" height="772" alt="Screenshot 2026-10-20 193742" src="https://github.com/user-attachments/assets/a6edd98e-5a53-4581-a930-84837b6112e3" />
<img width="1651" height="628" alt="Screenshot 2026-10-20 210106" src="https://github.com/user-attachments/assets/9a0703ac-22ed-4941-8a3c-e28e589cdc5e" />
<img width="877" height="605" alt="Screenshot 2026-10-20 210525" src="https://github.com/user-attachments/assets/72998d06-7491-423f-82ab-83eaebf96a00" />
<img width="877" height="588" alt="Screenshot 2026-10-20 210621" src="https://github.com/user-attachments/assets/edd794d7-8c98-4dbb-a4c0-dacd61c0cc6d" />

<img width="1837" height="886" alt="Screenshot 2026-10-20 214449" src="https://github.com/user-attachments/assets/6558fcb3-2755-4632-afa7-def1cad4e4da" />
<img width="1877" height="873" alt="Screenshot 2026-10-20 214707" src="https://github.com/user-attachments/assets/7152fa9e-30a8-445e-aca7-9ab3f220cf16" />


<img width="1906" height="902" alt="Screenshot 2026-10-20 214727" src="https://github.com/user-attachments/assets/cb546505-db2c-4487-b3ee-0a0d3edd583a" />
<img width="1787" height="925" alt="Screenshot 2026-10-20 214742" src="https://github.com/user-attachments/assets/b7f3f4e1-0166-42f9-9420-f9ecef3cef22" />
<img width="1832" height="855" alt="Screenshot 2026-10-20 214753" src="https://github.com/user-attachments/assets/51ffaf98-4ebf-4589-89dc-e8b403760fdb" />

<img width="1778" height="825" alt="Screenshot 2026-10-20 214804" src="https://github.com/user-attachments/assets/210f8171-5970-4b90-8502-6e2c4be3b252" />
