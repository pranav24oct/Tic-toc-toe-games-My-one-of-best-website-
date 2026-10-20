const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const {
  db, createUser, findUserByEmail, findUserById, calculateLevel, getXPForNextLevel,
  saveGameScore, getUserStats, getGameStats, getGameHistory, getFavorites, toggleFavorite,
  getAchievements, unlockAchievement, getPreferences, updatePreferences, claimDailyReward,
  hasClaimedDailyReward, hasCompletedChallenge, getLeaderboard
} = require('./database');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
  throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters in production.');
}
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) console.warn('SESSION_SECRET is not set; using a temporary development secret. Existing sessions will expire after restart.');

class SQLiteSessionStore extends session.Store {
  constructor(database) {
    super();
    this.getStmt = database.prepare('SELECT sess, expired FROM sessions WHERE sid=?');
    this.setStmt = database.prepare('INSERT INTO sessions(sid,sess,expired) VALUES(?,?,?) ON CONFLICT(sid) DO UPDATE SET sess=excluded.sess, expired=excluded.expired');
    this.destroyStmt = database.prepare('DELETE FROM sessions WHERE sid=?');
    this.touchStmt = database.prepare('UPDATE sessions SET expired=? WHERE sid=?');
    this.cleanupStmt = database.prepare('DELETE FROM sessions WHERE expired < ?');
  }
  get(sid, cb) {
    try {
      const row = this.getStmt.get(sid);
      if (!row) return cb(null, null);
      if (row.expired < Date.now()) { this.destroyStmt.run(sid); return cb(null, null); }
      cb(null, JSON.parse(row.sess));
    } catch (e) { cb(e); }
  }
  set(sid, sess, cb = () => {}) {
    try {
      const expires = sess.cookie && sess.cookie.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + 7 * 86400000;
      this.setStmt.run(sid, JSON.stringify(sess), expires);
      this.cleanupStmt.run(Date.now());
      cb(null);
    } catch (e) { cb(e); }
  }
  destroy(sid, cb = () => {}) { try { this.destroyStmt.run(sid); cb(null); } catch (e) { cb(e); } }
  touch(sid, sess, cb = () => {}) {
    try { const expires = sess.cookie && sess.cookie.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + 7 * 86400000; this.touchStmt.run(expires, sid); cb(null); } catch (e) { cb(e); }
  }
}

app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(session({
  name: 'tictoc.sid', secret: sessionSecret, store: new SQLiteSessionStore(db), resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 7 * 86400000 }
}));
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); res.set('Referrer-Policy', 'strict-origin-when-cross-origin'); res.set('X-Frame-Options', 'SAMEORIGIN'); next(); });
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const GAMES = {
  'Snake': { max: 100000 }, 'Tic-Tac-Toe': { max: 100 }, '2048': { max: 1000000 },
  'Pong': { max: 5 }, 'Brick Breaker': { max: 100000 }, 'Memory Match': { max: 1000 }, 'Neon Runner': { max: 10000000 }
};
const challenges = [
  { game: 'Snake', target: 15, reward: '100 XP + 50 Coins', text: 'Reach a score of 15 in Neon Snake.', requiresWin: false },
  { game: 'Tic-Tac-Toe', target: 100, reward: '100 XP + 50 Coins', text: 'Win a Tic-Tac-Toe match.', requiresWin: true },
  { game: 'Brick Breaker', target: 200, reward: '100 XP + 50 Coins', text: 'Score 200 points in Brick Breaker.', requiresWin: false },
  { game: 'Pong', target: 3, reward: '100 XP + 50 Coins', text: 'Score at least 3 points in Cyber Pong.', requiresWin: false },
  { game: 'Memory Match', target: 100, reward: '100 XP + 50 Coins', text: 'Complete Memory Match with at least 100 points.', requiresWin: true },
  { game: '2048', target: 512, reward: '100 XP + 50 Coins', text: 'Score at least 512 points in 2048.', requiresWin: false }
];
function todayUTC() { return new Date().toISOString().slice(0, 10); }
function challengeForDate(date) { const digits = date.split('-').map(Number); const index = (digits[0] + digits[1] + digits[2]) % challenges.length; return challenges[index]; }
function requireLogin(req, res, next) { if (!req.session.userId || !findUserById(req.session.userId)) return res.status(401).json({ success: false, message: 'Please log in to continue.' }); next(); }
function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }
const authAttempts = new Map();
function authRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown'; const now = Date.now();
  const item = authAttempts.get(key) || { count: 0, reset: now + 10 * 60 * 1000 };
  if (now > item.reset) { item.count = 0; item.reset = now + 10 * 60 * 1000; }
  item.count++; authAttempts.set(key, item);
  if (item.count > 40) return res.status(429).json({ success: false, message: 'Too many authentication attempts. Please wait a few minutes.' });
  next();
}
function safeUser(user) { return { id: user.id, name: user.name, email: user.email, xp: user.xp, coins: user.coins, level: calculateLevel(user.xp), nextLevelXP: getXPForNextLevel(user.xp) }; }
function regenSession(req) { return new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve())); }

app.get('/health', (req, res) => {
  try { db.prepare('SELECT 1').get(); res.json({ status: 'ok', service: 'tictoc-toy-games', database: 'connected', timestamp: new Date().toISOString() }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});
app.get('/api/health', (req, res) => res.redirect(307, '/health'));

app.post('/api/register', authRateLimit, asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim(); const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 40) return res.status(400).json({ success: false, message: 'Name must be between 2 and 40 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 72) return res.status(400).json({ success: false, message: 'Password must be between 8 and 72 characters.' });
  if (findUserByEmail(email)) return res.status(409).json({ success: false, message: 'This email is already registered.' });
  const hash = await bcrypt.hash(password, 12);
  let user;
  try { user = createUser(name, email, hash); } catch (e) { if (String(e.code).includes('CONSTRAINT')) return res.status(409).json({ success: false, message: 'This email is already registered.' }); throw e; }
  await regenSession(req); req.session.userId = user.id;
  res.status(201).json({ success: true, message: 'Welcome to TicToc!', user: safeUser(user) });
}));
app.post('/api/login', authRateLimit, asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required.' });
  const user = findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  await regenSession(req); req.session.userId = user.id;
  res.json({ success: true, message: 'Login successful.', user: safeUser(user) });
}));
app.post('/api/logout', (req, res, next) => req.session.destroy(err => { if (err) return next(err); res.clearCookie('tictoc.sid', { httpOnly: true, sameSite: 'lax', secure: isProduction }); res.json({ success: true, message: 'Logged out successfully.' }); }));
app.get('/api/me', (req, res) => { const user = req.session.userId ? findUserById(req.session.userId) : null; res.json(user ? { loggedIn: true, user: safeUser(user) } : { loggedIn: false }); });

app.get('/api/profile', requireLogin, (req, res) => {
  const user = findUserById(req.session.userId);
  res.json({ success: true, user: safeUser(user), stats: getUserStats(user.id), gameStats: getGameStats(user.id), favorites: getFavorites(user.id), achievements: getAchievements(user.id), history: getGameHistory(user.id), preferences: getPreferences(user.id) });
});
app.patch('/api/profile', requireLogin, (req, res) => {
  const name = String(req.body.name || '').trim();
  if (name.length < 2 || name.length > 40) return res.status(400).json({ success: false, message: 'Name must be between 2 and 40 characters.' });
  db.prepare('UPDATE users SET name=? WHERE id=?').run(name, req.session.userId);
  res.json({ success: true, user: safeUser(findUserById(req.session.userId)) });
});
app.get('/api/preferences', requireLogin, (req, res) => res.json({ success: true, preferences: getPreferences(req.session.userId) }));
app.put('/api/preferences', requireLogin, (req, res) => {
  const { theme, soundEnabled, animationsEnabled } = req.body || {};
  if (theme !== undefined && !['cyberpunk', 'space', 'retro'].includes(theme)) return res.status(400).json({ success: false, message: 'Invalid theme.' });
  if (soundEnabled !== undefined && typeof soundEnabled !== 'boolean') return res.status(400).json({ success: false, message: 'soundEnabled must be true or false.' });
  if (animationsEnabled !== undefined && typeof animationsEnabled !== 'boolean') return res.status(400).json({ success: false, message: 'animationsEnabled must be true or false.' });
  res.json({ success: true, preferences: updatePreferences(req.session.userId, { theme, soundEnabled, animationsEnabled }) });
});
app.get('/api/history', requireLogin, (req, res) => res.json({ success: true, history: getGameHistory(req.session.userId, 30) }));

app.post('/api/score', requireLogin, (req, res) => {
  const game = String(req.body.game || ''); const score = Number(req.body.score); const won = req.body.won === true;
  if (!Object.prototype.hasOwnProperty.call(GAMES, game)) return res.status(400).json({ success: false, message: 'Unknown game.' });
  if (!Number.isSafeInteger(score) || score < 0 || score > GAMES[game].max) return res.status(400).json({ success: false, message: `Score must be an integer between 0 and ${GAMES[game].max}.` });
  // Client-side games cannot prove gameplay outcomes. This endpoint enforces game-specific bounds,
  // but competitive anti-cheat needs server-authoritative game simulations/results.
  if (game === 'Tic-Tac-Toe' && score !== 10 && score !== 100) return res.status(400).json({ success: false, message: 'Invalid Tic-Tac-Toe result score.' });
  if (game === 'Pong' && won && score < 5) return res.status(400).json({ success: false, message: 'A Pong win requires 5 points.' });
  if (game === 'Pong' && score > 5) return res.status(400).json({ success: false, message: 'Pong score cannot exceed 5.' });
  const result = saveGameScore(req.session.userId, game, score, won);
  const stats = getUserStats(req.session.userId); const user = findUserById(req.session.userId); const unlocked = [];
  if (stats.gamesPlayed >= 1 && unlockAchievement(user.id, 'First Game')) unlocked.push('First Game');
  if (stats.uniqueGames >= 3 && unlockAchievement(user.id, 'Explorer')) unlocked.push('Explorer');
  if (stats.uniqueGames >= 6 && unlockAchievement(user.id, 'Game Collector')) unlocked.push('Game Collector');
  if (score >= 500 && unlockAchievement(user.id, 'Score Hunter')) unlocked.push('Score Hunter');
  if (user.xp >= 1000 && unlockAchievement(user.id, 'Rising Star')) unlocked.push('Rising Star');
  res.json({ success: true, ...result, unlocked, level: calculateLevel(findUserById(user.id).xp), stats: getUserStats(user.id) });
});
app.get('/api/favorites', requireLogin, (req, res) => res.json({ success: true, favorites: getFavorites(req.session.userId) }));
app.post('/api/favorites', requireLogin, (req, res) => {
  const game = String(req.body.game || ''); if (!Object.hasOwn(GAMES, game)) return res.status(400).json({ success: false, message: 'Unknown game.' });
  res.json({ success: true, favorite: toggleFavorite(req.session.userId, game) });
});
app.get('/api/achievements', requireLogin, (req, res) => res.json({ success: true, achievements: getAchievements(req.session.userId) }));
app.get('/api/daily-challenge', (req, res) => { const date = todayUTC(); const challenge = challengeForDate(date); const userId = req.session.userId; const completed = !!userId && hasCompletedChallenge(userId, date, challenge.game, challenge.target, challenge.requiresWin); const claimed = !!userId && hasClaimedDailyReward(userId, date); res.json({ success: true, date, challenge: { game: challenge.game, target: challenge.target, reward: challenge.reward, text: challenge.text }, completed, claimed, loggedIn: !!userId }); });
app.post('/api/daily-challenge/claim', requireLogin, (req, res) => {
  const date = todayUTC(); const challenge = challengeForDate(date);
  const completed = hasCompletedChallenge(req.session.userId, date, challenge.game, challenge.target, challenge.requiresWin);
  if (!completed) return res.status(403).json({ success: false, claimed: false, message: 'Complete today\'s challenge first to claim the reward.' });
  const claimed = claimDailyReward(req.session.userId, date);
  if (!claimed) return res.status(409).json({ success: false, claimed: false, message: 'You have already claimed today\'s reward.' });
  res.json({ success: true, claimed: true, reward: { xp: 100, coins: 50 } });
});
app.get('/api/leaderboard/:game', (req, res) => { const game = req.params.game; if (!Object.hasOwn(GAMES, game)) return res.status(400).json({ success: false, message: 'Unknown game.' }); res.json({ success: true, leaderboard: getLeaderboard(game) }); });
app.get('/api/leaderboard', (req, res) => res.json({ success: true, leaderboard: getLeaderboard() }));
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API endpoint not found.' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err, req, res, next) => { console.error(`[${new Date().toISOString()}]`, err); if (res.headersSent) return next(err); res.status(500).json({ success: false, message: isProduction ? 'An unexpected server error occurred.' : err.message }); });

const server = app.listen(PORT, () => console.log(`TicToc Toy Games listening on http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`));
server.on('error', err => { console.error('Server failed to start:', err.message); process.exitCode = 1; });
module.exports = { app, server };
