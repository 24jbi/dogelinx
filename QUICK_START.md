# 🚀 Quick Start: Publishing & Playing Games on DogeLinx

## For Game Creators 👨‍💻

### Step 1: Create Your Game
1. Go to [http://localhost:5173/studio](http://localhost:5173/studio)
2. Build your game using the studio tools:
   - Use the **Home** tab to select and play
   - Use the **Model** tab to add parts and terrain
   - Use the **Test** tab to debug and test
   - Use the **View** tab to toggle panels

### Step 2: Publish Your Game
1. When done, click the **🚀 Publish** button (in Home tab of Ribbon)
2. Enter your game's name
3. Write a fun description
4. Click **Publish**
5. Wait for admin approval (check back in the Games library)

### Step 3: Share with the World
Once approved, your game will appear in the public Games library!

---

## For Game Players 🎮

### Step 1: Browse Games
1. Click **🎮 Play Games** on the home page
2. OR go directly to [http://localhost:5173/games](http://localhost:5173/games)
3. Browse the available games

### Step 2: Play a Game
1. Click **Play Now** on any game
2. The game loads in your browser
3. Use WASD or arrow keys to move (depends on game)
4. Watch the health bar at the top
5. Have fun! 🎉

### Step 3: Go Back
- Click **← Back to Games** to return to the library

---

## Getting the Studio on Your Computer 🖥️

### Option 1: Use in Browser (Easiest)
- Just go to [http://localhost:5173/studio](http://localhost:5173/studio)
- No download needed!
- Works on Mac, Windows, Linux, and even mobile

### Option 2: Download Studio
1. Go to the landing page
2. Click **📥 Download Studio**
3. Choose your operating system (Windows, Mac, or Linux)
4. Extract the ZIP file
5. Open terminal in extracted folder
6. Run:
   ```bash
   npm install
   npm run dev
   ```
7. Open http://localhost:5173 in your browser

---

## Tips for Creating Better Games 💡

### Build Design Tips
- Use terrain to create interesting landscapes
- Add parts to create structures and objects
- Test your game frequently with the Play button

### Scripting Tips
- Write Lua scripts to add interactivity
- Use scripts for game logic, physics, and events
- Check the console for errors

### Publishing Tips
- Give your game a clear, catchy name
- Write a description that excites players
- Test thoroughly before publishing
- Include gameplay instructions in your description

---

## Troubleshooting

### "I can't find the Publish button"
- Make sure you're in the **Home** tab of the Ribbon
- Refresh your browser
- Check the console (F12) for errors

### "My game doesn't appear in the library"
- Wait for admin approval (can take a few minutes)
- Check that your game saved correctly
- Try publishing again with a unique name

### "The game won't start playing"
- Make sure the game data was saved properly
- Try refreshing the browser
- Check console for errors (F12 > Console tab)

### "Download is too slow"
- The studio is about 50MB
- Use a wired connection for faster download
- Try again later if server is busy

---

## Controls

### Studio Controls
| Key | Action |
|-----|--------|
| **W** | Move tool |
| **E** | Rotate tool |
| **R** | Scale tool |
| **F5** | Play/Stop |
| **Ctrl+G** | Group selected objects |
| **Ctrl+Shift+G** | Ungroup objects |
| **Delete** | Delete selected object |

### Game Controls (while playing)
| Key | Action |
|-----|--------|
| **WASD** | Move around |
| **Space** | Jump (if enabled) |
| **Mouse** | Look around |
| **ESC** | Exit game |

---

## Keyboard Shortcuts

### Selection & Transform
- **V** - Select tool
- **W** - Move tool
- **E** - Rotate tool
- **R** - Scale tool

### Organization
- **Ctrl+G** - Group
- **Ctrl+Shift+G** - Ungroup
- **Delete** - Delete selected

### Testing
- **F5** - Play/Stop
- **Ctrl+P** - Toggle performance stats

---

## What's Happening Behind the Scenes? 🤖

### When You Publish
1. Your game data is saved as JSON
2. Game info (name, description) goes to the database
3. Server assigns your game a unique ID
4. Game is marked as "pending" review
5. Admin checks and approves game
6. Game appears in public library

### When Someone Plays
1. Player selects your game from library
2. Server sends your game data
3. Player's browser loads the game
4. Game renders and player can interact
5. Play session ends and browser downloads nothing else

### When Someone Downloads Studio
1. Server packages essential files
2. Creates a ZIP file (~50MB)
3. Browser downloads it
4. User extracts and runs locally
5. They can create games offline!

---

## What Can You Do With DogeLinx?

✅ Create 3D games and worlds  
✅ Write scripts with Lua  
✅ Generate terrain  
✅ Publish to the platform  
✅ Share games with others  
✅ Download for offline use  
✅ Collaborate (save files)  
✅ Playtests in real-time  

---

## Need Help?

1. **Check the docs**: [GAME_PUBLISHING_GUIDE.md](./GAME_PUBLISHING_GUIDE.md)
2. **View changes**: [CHANGELOG.md](./CHANGELOG.md)
3. **Open browser console**: Press F12
4. **Check server logs**: Monitor terminal where server runs

---

## Have Fun! 🎉

You now have a complete game creation and sharing platform. Build amazing games, share them with the DogeLinx community, and inspire others!

Happy Creating! 🚀

---

**DogeLinx Studio v0.2.0**  
*Made with ❤️ for Creators*
