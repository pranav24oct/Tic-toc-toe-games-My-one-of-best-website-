const Database = require("better-sqlite3");

const db = new Database("tictoc.db");

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game TEXT NOT NULL,
        score INTEGER NOT NULL,
        won INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game TEXT NOT NULL,
        UNIQUE(user_id, game),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement TEXT NOT NULL,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, achievement),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS daily_rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        challenge_date TEXT NOT NULL,
        UNIQUE(user_id, challenge_date),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);

function createUser(name, email, password) {
    const result = db.prepare(`
        INSERT INTO users
        (name, email, password)
        VALUES (?, ?, ?)
    `).run(
        name.trim(),
        email.toLowerCase().trim(),
        password
    );

    return findUserById(result.lastInsertRowid);
}

function findUserByEmail(email) {
    return db.prepare(`
        SELECT *
        FROM users
        WHERE email = ?
    `).get(email.toLowerCase().trim());
}

function findUserById(id) {
    return db.prepare(`
        SELECT
            id,
            name,
            email,
            xp,
            coins,
            created_at
        FROM users
        WHERE id = ?
    `).get(id);
}

function calculateLevel(xp) {
    return Math.floor(xp / 500) + 1;
}

function getXPForNextLevel(xp) {
    const level = calculateLevel(xp);
    return level * 500;
}

function addRewards(userId, xp, coins) {
    db.prepare(`
        UPDATE users
        SET
            xp = xp + ?,
            coins = coins + ?
        WHERE id = ?
    `).run(xp, coins, userId);
}

function saveGameScore(userId, game, score, won) {
    const previousBest = db.prepare(`
        SELECT MAX(score) AS best
        FROM scores
        WHERE user_id = ?
        AND game = ?
    `).get(userId, game);

    const oldBest = previousBest.best || 0;

    db.prepare(`
        INSERT INTO scores
        (user_id, game, score, won)
        VALUES (?, ?, ?, ?)
    `).run(
        userId,
        game,
        score,
        won ? 1 : 0
    );

    let xpReward = 15;
    let coinReward = 5;
    let newHighScore = false;

    if (score > oldBest) {
        xpReward += 25;
        coinReward += 10;
        newHighScore = true;
    }

    if (won) {
        xpReward += 25;
        coinReward += 10;
    }

    addRewards(
        userId,
        xpReward,
        coinReward
    );

    return {
        xpReward,
        coinReward,
        newHighScore
    };
}

function getUserStats(userId) {
    const gamesPlayed = db.prepare(`
        SELECT COUNT(*) AS total
        FROM scores
        WHERE user_id = ?
    `).get(userId).total;

    const bestScore = db.prepare(`
        SELECT MAX(score) AS best
        FROM scores
        WHERE user_id = ?
    `).get(userId).best || 0;

    const wins = db.prepare(`
        SELECT COUNT(*) AS total
        FROM scores
        WHERE user_id = ?
        AND won = 1
    `).get(userId).total;

    const favoriteGame = db.prepare(`
        SELECT game, COUNT(*) AS total
        FROM scores
        WHERE user_id = ?
        GROUP BY game
        ORDER BY total DESC
        LIMIT 1
    `).get(userId);

    const uniqueGames = db.prepare(`
        SELECT COUNT(DISTINCT game) AS total
        FROM scores
        WHERE user_id = ?
    `).get(userId).total;

    return {
        gamesPlayed,
        bestScore,
        wins,
        uniqueGames,
        favoriteGame: favoriteGame
            ? favoriteGame.game
            : "None"
    };
}

function getGameStats(userId) {
    return db.prepare(`
        SELECT
            game,
            COUNT(*) AS played,
            MAX(score) AS best,
            SUM(won) AS wins
        FROM scores
        WHERE user_id = ?
        GROUP BY game
        ORDER BY best DESC
    `).all(userId);
}

function getFavorites(userId) {
    return db.prepare(`
        SELECT game
        FROM favorites
        WHERE user_id = ?
        ORDER BY id DESC
    `).all(userId);
}

function toggleFavorite(userId, game) {
    const existing = db.prepare(`
        SELECT id
        FROM favorites
        WHERE user_id = ?
        AND game = ?
    `).get(userId, game);

    if (existing) {
        db.prepare(`
            DELETE FROM favorites
            WHERE id = ?
        `).run(existing.id);

        return false;
    }

    db.prepare(`
        INSERT INTO favorites
        (user_id, game)
        VALUES (?, ?)
    `).run(userId, game);

    return true;
}

function getAchievements(userId) {
    return db.prepare(`
        SELECT
            achievement,
            unlocked_at
        FROM achievements
        WHERE user_id = ?
        ORDER BY unlocked_at DESC
    `).all(userId);
}

function unlockAchievement(userId, achievement) {
    const result = db.prepare(`
        INSERT OR IGNORE INTO achievements
        (user_id, achievement)
        VALUES (?, ?)
    `).run(userId, achievement);

    if (result.changes > 0) {
        addRewards(userId, 50, 25);
        return true;
    }

    return false;
}

function claimDailyReward(userId, date) {
    const result = db.prepare(`
        INSERT OR IGNORE INTO daily_rewards
        (user_id, challenge_date)
        VALUES (?, ?)
    `).run(userId, date);

    if (result.changes === 0) {
        return false;
    }

    addRewards(userId, 100, 50);

    return true;
}

function getLeaderboard(game = null) {
    let query = `
        SELECT
            users.name,
            scores.game,
            MAX(scores.score) AS score
        FROM scores
        INNER JOIN users
        ON users.id = scores.user_id
    `;

    const params = [];

    if (game) {
        query += `
            WHERE scores.game = ?
        `;

        params.push(game);
    }

    query += `
        GROUP BY users.id, scores.game
        ORDER BY score DESC
        LIMIT 20
    `;

    return db.prepare(query).all(...params);
}

module.exports = {
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
};