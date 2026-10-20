const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'tictoc.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL,
 xp INTEGER NOT NULL DEFAULT 0,
 coins INTEGER NOT NULL DEFAULT 100,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS scores (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 game TEXT NOT NULL,
 score INTEGER NOT NULL,
 won INTEGER NOT NULL DEFAULT 0,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS favorites (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 game TEXT NOT NULL,
 UNIQUE(user_id, game),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS achievements (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 achievement TEXT NOT NULL,
 unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id, achievement),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS daily_rewards (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 challenge_date TEXT NOT NULL,
 UNIQUE(user_id, challenge_date),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS preferences (
 user_id INTEGER PRIMARY KEY,
 theme TEXT NOT NULL DEFAULT 'cyberpunk',
 sound_enabled INTEGER NOT NULL DEFAULT 1,
 animations_enabled INTEGER NOT NULL DEFAULT 1,
 updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS sessions (
 sid TEXT PRIMARY KEY,
 sess TEXT NOT NULL,
 expired INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_user_game_date ON scores(user_id, game, created_at);
CREATE INDEX IF NOT EXISTS idx_scores_game_score ON scores(game, score DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired);
`);

function createUser(name, email, password) {
 const result = db.prepare('INSERT INTO users (name,email,password) VALUES (?,?,?)').run(name.trim(), email.toLowerCase().trim(), password);
 const user = findUserById(result.lastInsertRowid);
 db.prepare('INSERT OR IGNORE INTO preferences (user_id) VALUES (?)').run(user.id);
 return user;
}
function findUserByEmail(email) { return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase().trim()); }
function findUserById(id) { return db.prepare('SELECT id,name,email,xp,coins,created_at FROM users WHERE id = ?').get(id); }
function calculateLevel(xp) { return Math.floor(Math.max(0, Number(xp) || 0) / 500) + 1; }
function getXPForNextLevel(xp) { return calculateLevel(xp) * 500; }
function addRewards(userId, xp, coins) { db.prepare('UPDATE users SET xp=xp+?, coins=coins+? WHERE id=?').run(xp, coins, userId); }
function saveGameScore(userId, game, score, won) {
 const old = db.prepare('SELECT MAX(score) AS best FROM scores WHERE user_id=? AND game=?').get(userId, game).best || 0;
 const insert = db.prepare('INSERT INTO scores (user_id,game,score,won) VALUES (?,?,?,?)').run(userId, game, score, won ? 1 : 0);
 let xpReward = 15, coinReward = 5, newHighScore = score > old;
 if (newHighScore) { xpReward += 25; coinReward += 10; }
 if (won) { xpReward += 25; coinReward += 10; }
 addRewards(userId, xpReward, coinReward);
 return { id: Number(insert.lastInsertRowid), xpReward, coinReward, newHighScore };
}
function getUserStats(userId) {
 const gamesPlayed = db.prepare('SELECT COUNT(*) total FROM scores WHERE user_id=?').get(userId).total;
 const bestScore = db.prepare('SELECT MAX(score) best FROM scores WHERE user_id=?').get(userId).best || 0;
 const wins = db.prepare('SELECT COUNT(*) total FROM scores WHERE user_id=? AND won=1').get(userId).total;
 const favorite = db.prepare('SELECT game,COUNT(*) total FROM scores WHERE user_id=? GROUP BY game ORDER BY total DESC LIMIT 1').get(userId);
 const uniqueGames = db.prepare('SELECT COUNT(DISTINCT game) total FROM scores WHERE user_id=?').get(userId).total;
 return { gamesPlayed, bestScore, wins, uniqueGames, favoriteGame: favorite ? favorite.game : 'None' };
}
function getGameStats(userId) { return db.prepare('SELECT game,COUNT(*) played,MAX(score) best,SUM(won) wins FROM scores WHERE user_id=? GROUP BY game ORDER BY best DESC').all(userId); }
function getGameHistory(userId, limit = 12) { return db.prepare('SELECT game,score,won,created_at FROM scores WHERE user_id=? ORDER BY id DESC LIMIT ?').all(userId, limit); }
function getFavorites(userId) { return db.prepare('SELECT game FROM favorites WHERE user_id=? ORDER BY id DESC').all(userId); }
function toggleFavorite(userId, game) {
 const existing = db.prepare('SELECT id FROM favorites WHERE user_id=? AND game=?').get(userId, game);
 if (existing) { db.prepare('DELETE FROM favorites WHERE id=?').run(existing.id); return false; }
 db.prepare('INSERT INTO favorites (user_id,game) VALUES (?,?)').run(userId, game); return true;
}
function getAchievements(userId) { return db.prepare('SELECT achievement,unlocked_at FROM achievements WHERE user_id=? ORDER BY unlocked_at DESC').all(userId); }
function unlockAchievement(userId, achievement) {
 const result = db.prepare('INSERT OR IGNORE INTO achievements (user_id,achievement) VALUES (?,?)').run(userId, achievement);
 if (result.changes) addRewards(userId, 50, 25);
 return result.changes > 0;
}
function getPreferences(userId) {
 db.prepare('INSERT OR IGNORE INTO preferences (user_id) VALUES (?)').run(userId);
 const p = db.prepare('SELECT theme,sound_enabled,animations_enabled FROM preferences WHERE user_id=?').get(userId);
 return { theme: p.theme, soundEnabled: !!p.sound_enabled, animationsEnabled: !!p.animations_enabled };
}
function updatePreferences(userId, prefs) {
 const current = getPreferences(userId);
 const next = {
  theme: ['cyberpunk','space','retro'].includes(prefs.theme) ? prefs.theme : current.theme,
  soundEnabled: typeof prefs.soundEnabled === 'boolean' ? prefs.soundEnabled : current.soundEnabled,
  animationsEnabled: typeof prefs.animationsEnabled === 'boolean' ? prefs.animationsEnabled : current.animationsEnabled
 };
 db.prepare(`INSERT INTO preferences(user_id,theme,sound_enabled,animations_enabled,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)
 ON CONFLICT(user_id) DO UPDATE SET theme=excluded.theme,sound_enabled=excluded.sound_enabled,animations_enabled=excluded.animations_enabled,updated_at=CURRENT_TIMESTAMP`)
 .run(userId,next.theme,next.soundEnabled?1:0,next.animationsEnabled?1:0);
 return next;
}
function claimDailyReward(userId, date) {
 const result = db.prepare('INSERT OR IGNORE INTO daily_rewards (user_id,challenge_date) VALUES (?,?)').run(userId,date);
 if (!result.changes) return false;
 addRewards(userId,100,50); return true;
}
function hasClaimedDailyReward(userId,date) { return !!db.prepare('SELECT 1 FROM daily_rewards WHERE user_id=? AND challenge_date=?').get(userId,date); }
function hasCompletedChallenge(userId, date, game, target, requiresWin = false) {
 const query = `SELECT 1 FROM scores WHERE user_id=? AND game=? AND date(created_at)=? AND score>=? ${requiresWin ? 'AND won=1' : ''} LIMIT 1`;
 return !!db.prepare(query).get(userId,game,date,target);
}
function getLeaderboard(game = null) {
 let query = `SELECT users.name,scores.game,MAX(scores.score) score,COUNT(scores.id) games_played FROM scores JOIN users ON users.id=scores.user_id`;
 const params=[];
 if (game) { query += ' WHERE scores.game=?'; params.push(game); }
 query += ' GROUP BY users.id,scores.game ORDER BY score DESC, games_played DESC LIMIT 20';
 return db.prepare(query).all(...params);
}
module.exports = { db, createUser, findUserByEmail, findUserById, calculateLevel, getXPForNextLevel, saveGameScore, getUserStats, getGameStats, getGameHistory, getFavorites, toggleFavorite, getAchievements, unlockAchievement, getPreferences, updatePreferences, claimDailyReward, hasClaimedDailyReward, hasCompletedChallenge, getLeaderboard };
