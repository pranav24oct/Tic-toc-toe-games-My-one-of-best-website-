# 🎮 TicToc Toy Games

A creative and interactive browser-based gaming website where users can play multiple mini-games in one place.

## ✨ Features

* 🎮 Multiple playable games
* 🔐 User Login & Registration
* 👤 User Profile
* ⭐ XP and Coins system
* 🏆 Leaderboard
* ❤️ Favorite games
* 🔎 Game search
* 🎯 Daily Challenge
* 🏅 Achievements
* 📊 Game scores and statistics
* 🌌 Modern 3D-style gaming interface
* 📱 Responsive design
* 💾 SQLite database
* ⚡ Node.js + Express backend

## 🕹️ Available Games

| Game                   | Type     | Description                                                     |
| ---------------------- | -------- | --------------------------------------------------------------- |
| 🐍 Snake Neon Rush     | Arcade   | Control the snake and collect food while increasing your score. |
| ❌ Tic-Tac-Toe Quantum  | Strategy | Play Tic-Tac-Toe with a modern neon design.                     |
| 🧱 Brick Breaker Pulse | Arcade   | Break glowing bricks and reach higher levels.                   |
| 🏓 Pong Cyber Duel     | Arcade   | Challenge the computer in a futuristic Pong battle.             |
| 🧠 Memory Match Galaxy | Puzzle   | Match the correct cards and improve your memory.                |
| 🔢 2048 Infinity       | Puzzle   | Combine matching numbers and try to reach 2048.                 |

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript
* CSS Animations
* Responsive Design

### Backend

* Node.js
* Express.js

### Database

* SQLite

### Authentication

* Express Session
* bcryptjs

## 📁 Project Structure

```text
TicToc-Toy-Games/
│
├── package.json
├── server.js
├── README.md
│
├── data/
│   └── games.db
│
└── public/
    │
    ├── index.html
    │
    ├── css/
    │   ├── style.css
    │   └── game.css
    │
    ├── js/
    │   ├── app.js
    │   └── game-common.js
    │
    ├── assets/
    │   ├── game-snake.svg
    │   ├── game-tictactoe.svg
    │   ├── game-brick-breaker.svg
    │   ├── game-pong.svg
    │   ├── game-memory.svg
    │   └── game-2048.svg
    │
    └── games/
        ├── snake.html
        ├── tic-tac-toe.html
        ├── brick-breaker.html
        ├── pong.html
        ├── memory-match.html
        └── 2048.html
```

## 🚀 How to Run Locally

### 1. Install Node.js

Install Node.js on your computer.

Check the installation:

```bash
node --version
npm --version
```

### 2. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 3. Open the Project

```bash
cd TicToc-Toy-Games
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
npm start
```

The server will run on:

```text
http://localhost:3000
```

Open that address in your browser.

## 🎯 How to Play

1. Open the website.
2. Create an account or log in.
3. Browse the available games.
4. Select a game.
5. Play and earn scores.
6. Complete daily challenges.
7. Collect XP and coins.
8. Check your profile and leaderboard.

## 🔐 User System

The website provides:

* Registration
* Login
* Logout
* Profile
* Game statistics
* Favorite games
* XP
* Coins
* Achievements
* Leaderboard

Passwords are stored using password hashing rather than plain text.

## 🏆 Achievement System

Players can unlock achievements by playing games and improving their performance.

Examples:

* 🟢 First Play
* ⭐ Score Hunter
* 🎮 Arcade Rookie
* 🏆 Winner
* 🌎 Explorer
* 👑 Master
* 💎 All Rounder

## 🎯 Daily Challenge

A daily challenge gives players an additional goal.

Players can complete the challenge by reaching the required score in the selected game.

Successful completion rewards additional XP and coins.

## 🎨 Design

TicToc Toy Games uses a modern gaming interface with:

* Glassmorphism
* Neon-style effects
* Gradient backgrounds
* Animated elements
* 3D-style game cards
* Smooth transitions
* Responsive layouts

## 📱 Browser Support

The website is designed to work with modern browsers such as:

* Google Chrome
* Microsoft Edge
* Mozilla Firefox
* Safari

## ⚠️ Important

The SQLite database is generated locally when the server runs.

For a production deployment, additional configuration should be added for:

* Persistent sessions
* Production database hosting
* Environment variables
* HTTPS
* Security headers
* Production authentication configuration

## 👨‍💻 Project

**Project Name:** TicToc Toy Games

**Type:** Web Development / Gaming Platform

**Main Technologies:** HTML, CSS, JavaScript, Node.js, Express.js, SQLite

---

### ⭐ If you like the project

Give the repository a ⭐ on GitHub and share it with other gamers and developers.

**Play. Challenge. Improve. Repeat. 🎮**
