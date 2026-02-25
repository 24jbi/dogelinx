// Standalone API server for DogeLinx
// Can be deployed to Railway, Render, Vercel, etc.

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { nanoid } = require('nanoid');
const multer = require('multer');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, 'server', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const AVATARS_FILE = path.join(DATA_DIR, 'avatars.json');

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const txt = fs.readFileSync(file, 'utf8');
    return JSON.parse(txt || 'null') || fallback;
  } catch (e) {
    console.error('readJson error', e);
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Initialize files
if (!fs.existsSync(GAMES_FILE)) writeJson(GAMES_FILE, []);
if (!fs.existsSync(USERS_FILE)) writeJson(USERS_FILE, []);
if (!fs.existsSync(ITEMS_FILE)) writeJson(ITEMS_FILE, []);
if (!fs.existsSync(AVATARS_FILE)) writeJson(AVATARS_FILE, []);

// API Routes
app.get('/api/games', (req, res) => {
  const games = readJson(GAMES_FILE, []);
  const approved = games.filter((g) => g.status === 'approved');
  res.json({ ok: true, games: approved });
});

app.get('/api/games/:id', (req, res) => {
  const games = readJson(GAMES_FILE, []);
  const game = games.find((g) => g.id === req.params.id && g.status === 'approved');
  if (!game) return res.status(404).json({ ok: false, error: 'not-found' });
  res.json({ ok: true, game });
});

app.get('/api/items', (req, res) => {
  const items = readJson(ITEMS_FILE, []);
  res.json({ ok: true, items });
});

app.get('/api/items/:id', (req, res) => {
  const items = readJson(ITEMS_FILE, []);
  const item = items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ ok: false });
  res.json({ ok: true, item });
});

app.get('/api/avatars', (req, res) => {
  const avatars = readJson(AVATARS_FILE, []);
  res.json({ ok: true, avatars });
});

app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ ok: false });
  const users = readJson(USERS_FILE, []);
  if (users.find((u) => u.username === username)) return res.status(400).json({ ok: false, error: 'exists' });
  const token = nanoid();
  const user = { 
    username, 
    password, 
    dogeTokens: 0, 
    token, 
    itemsOwned: [],
    createdAt: new Date().toISOString() 
  };
  users.push(user);
  writeJson(USERS_FILE, users);
  res.json({ ok: true, user });
});

app.post('/api/auth/signin', (req, res) => {
  const { username, password } = req.body;
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ ok: false });
  res.json({ ok: true, user });
});

app.get('/api/me', (req, res) => {
  const token = req.query.token;
  if (!token) return res.json({ ok: false });
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.token === token);
  if (!user) return res.json({ ok: false });
  return res.json({ ok: true, user });
});

app.post('/api/buy-dt', (req, res) => {
  const { username, amount } = req.body;
  if (!username || !amount) return res.status(400).json({ ok: false, error: 'Missing fields' });
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(401).json({ ok: false, error: 'User not found' });
  user.dogeTokens = (user.dogeTokens || 0) + Number(amount);
  writeJson(USERS_FILE, users);
  res.json({ ok: true, user, message: `Added ${amount} DT` });
});

app.post('/api/download-studio', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="DogeLinx-Studio.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ ok: false, error: err.message });
    });

    archive.pipe(res);

    const files = [
      'index.html', 'package.json', 'vite.config.js',
      'src/main.jsx', 'src/App.jsx', 'src/index.css', 'src/store.js'
    ];

    files.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    archive.append('# DogeLinx Studio\n\nRun: npm install && npm run dev', { name: 'README.md' });
    archive.finalize();
  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🎮 DogeLinx API Server running on port ${PORT}`);
});
