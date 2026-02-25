const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { nanoid } = require('nanoid');
const multer = require('multer');
const archiver = require('archiver');
const http = require('http');
const { MultiplayerServer } = require('./multiplayer');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize multiplayer server
const multiplayerServer = new MultiplayerServer(httpServer);

app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');

// avatars storage
const PUBLIC_DIR = path.join(__dirname, 'public');
const AVATARS_DIR = path.join(PUBLIC_DIR, 'avatars');
const ITEMS_UPLOAD_DIR = path.join(PUBLIC_DIR, 'items');
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR);
if (!fs.existsSync(ITEMS_UPLOAD_DIR)) fs.mkdirSync(ITEMS_UPLOAD_DIR);
const AVATARS_FILE = path.join(DATA_DIR, 'avatars.json');

// setup multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, AVATARS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    cb(null, nanoid() + ext);
  }
});

// setup multer for item uploads
const itemStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ITEMS_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    cb(null, nanoid() + ext);
  }
});

const upload = multer({ storage });
const itemUpload = multer({ storage: itemStorage });

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
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// initialize files
if (!fs.existsSync(GAMES_FILE)) writeJson(GAMES_FILE, []);
if (!fs.existsSync(USERS_FILE)) writeJson(USERS_FILE, []);

// Serve static site (root of project)
// serve uploaded avatars at /avatars/*
// serve uploaded items at /items/*
app.use('/avatars', express.static(AVATARS_DIR));
app.use('/items', express.static(ITEMS_UPLOAD_DIR));
app.use('/', express.static(path.join(__dirname, '..')));

// ensure avatars and items data files exist
if (!fs.existsSync(AVATARS_FILE)) writeJson(AVATARS_FILE, []);
if (!fs.existsSync(ITEMS_FILE)) writeJson(ITEMS_FILE, []);

// API
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

app.post('/api/publish', (req, res) => {
  const { name, desc, id, author, token, username, projectData, isUpdate } = req.body;
  if (!name || !desc || !id) return res.status(400).json({ ok: false, error: 'missing' });
  
  const users = readJson(USERS_FILE, []);
  let user = null;
  
  // Try to find user by token or username
  if (token) {
    user = users.find((u) => u.token === token);
  }
  if (!user && username) {
    user = users.find((u) => u.username === username);
  }
  if (!user) return res.status(401).json({ ok: false, error: 'unauth' });

  const games = readJson(GAMES_FILE, []);
  let gameIndex = games.findIndex((g) => g.id === id);
  
  // Check if updating existing game (must be author)
  if (gameIndex !== -1 && isUpdate) {
    const existingGame = games[gameIndex];
    if (existingGame.author !== user.username) {
      return res.status(403).json({ ok: false, error: 'not-author' });
    }
    // Update existing game
    games[gameIndex] = {
      ...existingGame,
      name,
      desc,
      projectData: projectData || {},
      updatedAt: new Date().toISOString()
    };
    writeJson(GAMES_FILE, games);
    return res.json({ ok: true, entry: games[gameIndex], isUpdate: true });
  }
  
  // Create new game
  const entry = { 
    name, 
    desc, 
    id, 
    projectData: projectData || '', 
    createdAt: new Date().toISOString(), 
    status: 'pending', 
    author: user.username 
  };
  games.push(entry);
  writeJson(GAMES_FILE, games);
  res.json({ ok: true, entry });
});

// Avatars API
app.get('/api/avatars', (req, res) => {
  const avatars = readJson(AVATARS_FILE, []);
  res.json({ ok: true, avatars });
});

app.get('/api/avatars/:id', (req, res) => {
  const avatars = readJson(AVATARS_FILE, []);
  const found = avatars.find((a) => a.id === req.params.id);
  if (!found) return res.status(404).json({ ok: false });
  res.json({ ok: true, avatar: found });
});

// multipart avatar upload: field name `file`, optional `name` and `token` fields
app.post('/api/avatars', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'no-file' });
  const name = req.body.name || req.file.originalname;
  const token = req.body.token || req.headers['x-token'];
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => token && u.token === token);

  const avatars = readJson(AVATARS_FILE, []);
  const entry = {
    id: nanoid(),
    name,
    filename: req.file.filename,
    url: `/avatars/${req.file.filename}`,
    owner: user ? user.username : null,
    createdAt: new Date().toISOString()
  };
  avatars.push(entry);
  writeJson(AVATARS_FILE, avatars);
  res.json({ ok: true, entry });
});

// Items API
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

// Upload avatar item for shop
app.post('/api/items', itemUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'no-file' });
  
  const { name, price, category, token, username } = req.body;
  if (!name || !price || !category) return res.status(400).json({ ok: false, error: 'missing-fields' });
  
  const users = readJson(USERS_FILE, []);
  let user = null;
  
  if (token) {
    user = users.find((u) => u.token === token);
  }
  if (!user && username) {
    user = users.find((u) => u.username === username);
  }
  if (!user) return res.status(401).json({ ok: false, error: 'unauth' });

  const items = readJson(ITEMS_FILE, []);
  const item = {
    id: nanoid(),
    name,
    price: Number(price),
    category,
    imageUrl: `/items/${req.file.filename}`,
    creator: user.username,
    creatorToken: user.token,
    sales: 0,
    totalEarnings: 0,
    createdAt: new Date().toISOString()
  };
  
  items.push(item);
  writeJson(ITEMS_FILE, items);
  res.json({ ok: true, item });
});

// Purchase item with 10% tax to creator
app.post('/api/items/buy', (req, res) => {
  const { itemId, token, username } = req.body;
  if (!itemId) return res.status(400).json({ ok: false, error: 'missing-itemId' });
  
  const users = readJson(USERS_FILE, []);
  let buyer = null;
  
  if (token) {
    buyer = users.find((u) => u.token === token);
  }
  if (!buyer && username) {
    buyer = users.find((u) => u.username === username);
  }
  if (!buyer) return res.status(401).json({ ok: false, error: 'unauth' });

  const items = readJson(ITEMS_FILE, []);
  const item = items.find((i) => i.id === itemId);
  if (!item) return res.status(404).json({ ok: false, error: 'item-not-found' });

  // Check sufficient balance
  if (buyer.dogeTokens < item.price) {
    return res.status(400).json({ ok: false, error: 'insufficient-dt' });
  }

  // Calculate 90/10 split
  const creatorEarnings = Math.floor(item.price * 0.9);
  const tax = item.price - creatorEarnings;

  // Deduct from buyer
  buyer.dogeTokens -= item.price;

  // Add to creator
  const creator = users.find((u) => u.username === item.creator);
  if (creator) {
    creator.dogeTokens = (creator.dogeTokens || 0) + creatorEarnings;
  }

  // Add item to buyer's inventory
  if (!buyer.itemsOwned) buyer.itemsOwned = [];
  if (!buyer.itemsOwned.includes(itemId)) {
    buyer.itemsOwned.push(itemId);
  }

  // Update item sales
  item.sales = (item.sales || 0) + 1;
  item.totalEarnings = (item.totalEarnings || 0) + creatorEarnings;

  writeJson(USERS_FILE, users);
  writeJson(ITEMS_FILE, items);

  res.json({ 
    ok: true, 
    message: `Purchased "${item.name}" for ${item.price} DT (Creator earned ${creatorEarnings} DT, 10% tax: ${tax} DT)`,
    buyer,
    item
  });
});

app.get('/api/items/creator/:username', (req, res) => {
  const items = readJson(ITEMS_FILE, []);
  const creatorItems = items.filter((i) => i.creator === req.params.username);
  res.json({ ok: true, items: creatorItems });
});

app.get('/api/moderation/pending', (req, res) => {
  // simple admin check via query token (insecure demo)
  const adminKey = process.env.DOGELINX_ADMIN || 'admin-secret';
  const key = req.query.key;
  if (key !== adminKey) return res.status(403).json({ ok: false, error: 'forbidden' });
  const games = readJson(GAMES_FILE, []);
  const pending = games.filter((g) => g.status === 'pending');
  res.json({ ok: true, pending });
});

app.post('/api/moderation/approve', (req, res) => {
  const { index, key } = req.body;
  const adminKey = process.env.DOGELINX_ADMIN || 'admin-secret';
  if (key !== adminKey) return res.status(403).json({ ok: false, error: 'forbidden' });
  const games = readJson(GAMES_FILE, []);
  if (typeof index !== 'number' || index < 0 || index >= games.length) return res.status(400).json({ ok: false });
  games[index].status = 'approved';
  writeJson(GAMES_FILE, games);
  res.json({ ok: true, games });
});

app.post('/api/moderation/reject', (req, res) => {
  const { index, key } = req.body;
  const adminKey = process.env.DOGELINX_ADMIN || 'admin-secret';
  if (key !== adminKey) return res.status(403).json({ ok: false, error: 'forbidden' });
  const games = readJson(GAMES_FILE, []);
  if (typeof index !== 'number' || index < 0 || index >= games.length) return res.status(400).json({ ok: false });
  games[index].status = 'rejected';
  writeJson(GAMES_FILE, games);
  res.json({ ok: true, games });
});

// Auth
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

app.post('/api/buy', (req, res) => {
  const { token, amount } = req.body;
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.token === token);
  if (!user) return res.status(401).json({ ok: false });
  user.dogeTokens = (user.dogeTokens || 0) + Number(amount || 0);
  writeJson(USERS_FILE, users);
  res.json({ ok: true, user });
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

app.get('/api/me', (req, res) => {
  const token = req.query.token;
  if (!token) return res.json({ ok: false });
  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.token === token);
  if (!user) return res.json({ ok: false });
  return res.json({ ok: true, user });
});

// Download studio endpoint - generates a minimal zip with just studio files
app.post('/api/download-studio', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="DogeLinx-Studio.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ ok: false, error: err.message });
    });

    // Pipe archive to response
    archive.pipe(res);

    const rootDir = path.join(__dirname, '..');
    
    // Essential studio files to include
    const essentialFiles = [
      { src: 'index.html', dest: 'index.html' },
      { src: 'src/main.jsx', dest: 'src/main.jsx' },
      { src: 'src/App.jsx', dest: 'src/App.jsx' },
      { src: 'src/index.css', dest: 'src/index.css' },
      { src: 'src/store.js', dest: 'src/store.js' },
      { src: 'src/supabaseClient.js', dest: 'src/supabaseClient.js' },
      { src: 'src/supabaseStorage.js', dest: 'src/supabaseStorage.js' },
      { src: 'src/suppressWarnings.js', dest: 'src/suppressWarnings.js' },
      { src: 'src/uiStore.js', dest: 'src/uiStore.js' },
      { src: 'vite.config.mjs', dest: 'vite.config.mjs' },
      { src: 'src/R6Rig.js', dest: 'src/R6Rig.js' },
      { src: 'src/R6Rig_new.js', dest: 'src/R6Rig_new.js' },
      { src: 'features.js', dest: 'features.js' },
      { src: 'package.json', dest: 'package.json' },
      { src: '.gitignore', dest: '.gitignore' },
    ];

    // Add component files
    const componentsDir = path.join(rootDir, 'src', 'components');
    if (fs.existsSync(componentsDir)) {
      const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
      componentFiles.forEach(file => {
        try {
          archive.file(path.join(componentsDir, file), { name: `src/components/${file}` });
        } catch (e) {
          console.error(`Error adding component ${file}:`, e);
        }
      });
    }

    // Add utility files
    const utilsDir = path.join(rootDir, 'src', 'utils');
    if (fs.existsSync(utilsDir)) {
      const utilFiles = fs.readdirSync(utilsDir).filter(f => f.endsWith('.js'));
      utilFiles.forEach(file => {
        try {
          archive.file(path.join(utilsDir, file), { name: `src/utils/${file}` });
        } catch (e) {
          console.error(`Error adding util ${file}:`, e);
        }
      });
    }

    // Add style files
    const stylesDir = path.join(rootDir, 'src', 'styles');
    if (fs.existsSync(stylesDir)) {
      const styleFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));
      styleFiles.forEach(file => {
        try {
          archive.file(path.join(stylesDir, file), { name: `src/styles/${file}` });
        } catch (e) {
          console.error(`Error adding style ${file}:`, e);
        }
      });
    }

    // Add root files
    essentialFiles.forEach(({ src, dest }) => {
      const filePath = path.join(rootDir, src);
      if (fs.existsSync(filePath)) {
        try {
          archive.file(filePath, { name: dest });
        } catch (e) {
          console.error(`Error adding root file ${src}:`, e);
        }
      }
    });

    // Add a README with setup instructions
    const readmeContent = `# DogeLinx Studio

## Installation

1. Extract this folder
2. Install dependencies: \`npm install\`
3. Run development server: \`npm run dev\`
4. Open http://localhost:5173 in your browser

## For the Full Experience

You'll need Node.js installed. [Download Node.js](https://nodejs.org/)

This is a minimal studio bundle for development and game creation.
`;
    archive.append(readmeContent, { name: 'README.md' });

    archive.finalize();
  } catch (err) {
    console.error('Download studio error:', err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
});

// Multiplayer API endpoints
app.get('/api/games/:gameId/sessions', (req, res) => {
  const { gameId } = req.params;
  const sessionInfo = multiplayerServer.getSessionInfo(gameId);
  
  res.json({
    ok: true,
    gameId,
    sessions: sessionInfo || [],
    maxPlayersPerSession: 20,
    maxSessionsPerGame: 'unlimited'
  });
});

app.post('/api/games/:gameId/sessions', (req, res) => {
  const { gameId } = req.params;
  const { username } = req.body;
  
  if (!gameId) {
    return res.status(400).json({ ok: false, error: 'gameId required' });
  }

  // Find available session info to return
  const sessionInfo = multiplayerServer.getSessionInfo(gameId);
  const availableSessions = sessionInfo ? sessionInfo.filter(s => !s.isFull) : [];
  
  if (availableSessions.length === 0 && sessionInfo && sessionInfo.length > 0) {
    // All sessions full, would need to create new one
    return res.status(400).json({ 
      ok: false, 
      error: 'all-sessions-full',
      message: 'All game sessions are full. Try again later.'
    });
  }

  res.json({
    ok: true,
    gameId,
    wsUrl: `ws://${req.hostname}:${PORT}/ws/game/${gameId}`,
    username: username || undefined
  });
});

httpServer.listen(PORT, () => console.log('🎮 DogeLinx Multiplayer Server running on port', PORT));
