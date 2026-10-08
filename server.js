const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcryptjs");

const {
    createUser,
    findUserByEmail,
    findUserById,
    calculateLevel,
    getXPForNextLevel,
    saveGameScore,
    getUserStats,
    getGameStats,
    getFavorites,
    toggleFavorite,
    getAchievements,
    unlockAchievement,
    claimDailyReward,
    getLeaderboard
} = require("./database");

const app = express();

const PORT = 3000;

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    session({
        secret: "tictoc-toy-games-secret-2026",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

function requireLogin(req, res, next) {

    if (!req.session.userId) {

        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    next();
}


app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {

            return res.json({
                success: false,
                message: "Please fill all fields."
            });
        }

        if (password.length < 6) {

            return res.json({
                success: false,
                message:
                    "Password must contain at least 6 characters."
            });
        }

        const existing =
            findUserByEmail(email);

        if (existing) {

            return res.json({
                success: false,
                message:
                    "This email is already registered."
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const user =
            createUser(
                name,
                email,
                hashedPassword
            );

        req.session.userId =
            user.id;

        res.json({
            success: true,
            message:
                "Welcome to TicToc!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Registration failed."
        });
    }
});


app.post("/api/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const user =
            findUserByEmail(email);

        if (!user) {

            return res.json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        const valid =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!valid) {

            return res.json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        req.session.userId =
            user.id;

        res.json({
            success: true,
            message:
                "Login successful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Login failed."
        });
    }
});


app.post("/api/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({
            success: true,
            message:
                "Logged out successfully."
        });

    });

});


app.get("/api/me", (req, res) => {

    if (!req.session.userId) {

        return res.json({
            loggedIn: false
        });
    }

    const user =
        findUserById(
            req.session.userId
        );

    if (!user) {

        return res.json({
            loggedIn: false
        });
    }

    res.json({
        loggedIn: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
});


app.get(
    "/api/profile",
    requireLogin,
    (req, res) => {

        const user =
            findUserById(
                req.session.userId
            );

        const stats =
            getUserStats(
                req.session.userId
            );

        const gameStats =
            getGameStats(
                req.session.userId
            );

        const favorites =
            getFavorites(
                req.session.userId
            );

        const achievements =
            getAchievements(
                req.session.userId
            );

        const level =
            calculateLevel(user.xp);

        const nextLevelXP =
            getXPForNextLevel(user.xp);

        res.json({

            success: true,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                xp: user.xp,
                coins: user.coins,
                level,
                nextLevelXP
            },

            stats,

            gameStats,

            favorites,

            achievements

        });
    }
);


app.post(
    "/api/score",
    requireLogin,
    (req, res) => {

        const {
            game,
            score,
            won
        } = req.body;

        if (
            !game ||
            score === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Game and score are required."
            });
        }

        const numericScore =
            Math.max(
                0,
                Math.floor(
                    Number(score)
                )
            );

        const result =
            saveGameScore(
                req.session.userId,
                game,
                numericScore,
                Boolean(won)
            );

        const stats =
            getUserStats(
                req.session.userId
            );

        const user =
            findUserById(
                req.session.userId
            );

        let unlocked = [];

        if (
            stats.gamesPlayed >= 1 &&
            unlockAchievement(
                req.session.userId,
                "First Game"
            )
        ) {
            unlocked.push("First Game");
        }

        if (
            stats.uniqueGames >= 3 &&
            unlockAchievement(
                req.session.userId,
                "Explorer"
            )
        ) {
            unlocked.push("Explorer");
        }

        if (
            stats.uniqueGames >= 6 &&
            unlockAchievement(
                req.session.userId,
                "Game Collector"
            )
        ) {
            unlocked.push("Game Collector");
        }

        if (
            numericScore >= 500 &&
            unlockAchievement(
                req.session.userId,
                "Score Hunter"
            )
        ) {
            unlocked.push("Score Hunter");
        }

        if (
            user.xp >= 1000 &&
            unlockAchievement(
                req.session.userId,
                "Rising Star"
            )
        ) {
            unlocked.push("Rising Star");
        }

        res.json({

            success: true,

            xpReward:
                result.xpReward,

            coinReward:
                result.coinReward,

            newHighScore:
                result.newHighScore,

            unlocked,

            level:
                calculateLevel(
                    user.xp
                )
        });
    }
);


app.get(
    "/api/favorites",
    requireLogin,
    (req, res) => {

        res.json({
            success: true,
            favorites:
                getFavorites(
                    req.session.userId
                )
        });
    }
);


app.post(
    "/api/favorites",
    requireLogin,
    (req, res) => {

        const {
            game
        } = req.body;

        if (!game) {

            return res.status(400).json({
                success: false,
                message:
                    "Game name required."
            });
        }

        const favorite =
            toggleFavorite(
                req.session.userId,
                game
            );

        res.json({
            success: true,
            favorite
        });
    }
);


app.get(
    "/api/achievements",
    requireLogin,
    (req, res) => {

        res.json({
            success: true,
            achievements:
                getAchievements(
                    req.session.userId
                )
        });
    }
);


app.get(
    "/api/daily-challenge",
    (req, res) => {

        const challenges = [

            {
                game: "Snake",
                target: 15,
                reward: "100 XP + 50 Coins",
                text:
                    "Reach a score of 15 in Neon Snake."
            },

            {
                game: "Tic-Tac-Toe",
                target: 100,
                reward: "100 XP + 50 Coins",
                text:
                    "Win a Tic-Tac-Toe match."
            },

            {
                game: "Brick Breaker",
                target: 200,
                reward: "100 XP + 50 Coins",
                text:
                    "Score 200 points in Brick Breaker."
            },

            {
                game: "Pong",
                target: 3,
                reward: "100 XP + 50 Coins",
                text:
                    "Score 3 points in Cyber Pong."
            },

            {
                game: "Memory Match",
                target: 100,
                reward: "100 XP + 50 Coins",
                text:
                    "Complete Memory Match."
            },

            {
                game: "2048",
                target: 512,
                reward: "100 XP + 50 Coins",
                text:
                    "Reach a 512 tile."
            }

        ];

        const today =
            new Date();

        const index =
            (
                today.getFullYear() +
                today.getMonth() +
                today.getDate()
            ) % challenges.length;

        res.json({
            success: true,
            challenge:
                challenges[index]
        });
    }
);


app.post(
    "/api/daily-challenge/claim",
    requireLogin,
    (req, res) => {

        const date =
            new Date()
                .toISOString()
                .slice(0, 10);

        const claimed =
            claimDailyReward(
                req.session.userId,
                date
            );

        res.json({
            success: true,
            claimed
        });
    }
);


app.get(
    "/api/leaderboard/:game",
    (req, res) => {

        res.json({
            success: true,
            leaderboard:
                getLeaderboard(
                    req.params.game
                )
        });
    }
);


app.get(
    "/api/leaderboard",
    (req, res) => {

        res.json({
            success: true,
            leaderboard:
                getLeaderboard()
        });
    }
);


app.get("*", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});


app.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "======================================"
        );
        console.log(
            "       TIC TOC TOY GAMES V2"
        );
        console.log(
            "======================================"
        );
        console.log(
            `Running: http://localhost:${PORT}`
        );
        console.log(
            "Database: SQLite"
        );
        console.log(
            "XP + Coins + Achievements: ON"
        );
        console.log(
            "======================================"
        );
        console.log("");

    }
);