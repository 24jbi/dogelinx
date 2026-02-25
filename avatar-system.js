// Minimal AvatarSystem for DogeLinx - stores avatars in localStorage
(function(global){
    const STORAGE_KEY = 'dogelinx_avatars_v1';

    function load() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch(e){ return []; }
    }

    function save(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

    const avatars = load();

    function findIndex(id){ return avatars.findIndex(a => a.playerId === id); }

    const defaultHumanoidUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<?xml version="1.0"?><svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='100%' height='100%' fill='#1a1a2e'/><g fill='#cfcfcf'><circle cx='128' cy='88' r='36'/><rect x='92' y='136' width='72' height='72' rx='8'/></g></svg>`);

    const API = {
        defaultHumanoidUrl,
        getAllAvatars() { return avatars.slice(); },
        getAvatar(id) { return avatars.find(a => a.playerId === id) || { playerId: 'default', playerName: 'Default', image: defaultHumanoidUrl, type: 'default' }; },
        setAvatar(playerId, imageDataUrl, meta = {}){
            const idx = findIndex(playerId);
            const rec = Object.assign({ playerId, playerName: meta.playerName || playerId, image: imageDataUrl, type: meta.type || 'custom', createdAt: new Date().toISOString() }, meta);
            if (idx === -1) avatars.push(rec); else avatars[idx] = rec;
            save(avatars);
        },
        importAvatarFromFile(file, playerId, meta = {}){
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    try { API.setAvatar(playerId, reader.result, meta); resolve(); }
                    catch(e){ reject(e); }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },
        deleteAvatar(id){ const i = findIndex(id); if (i!==-1){ avatars.splice(i,1); save(avatars); return true; } return false; },
        captureAvatarFromScene(scene, camera, renderer, w=256, h=256){
            try {
                // If renderer has its own canvas, use it; otherwise render to temporary canvas
                if (renderer && renderer.domElement) return renderer.domElement.toDataURL('image/png');
                const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d'); ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0,0,w,h);
                return canvas.toDataURL('image/png');
            } catch(e){ console.warn('captureAvatarFromScene failed', e); return defaultHumanoidUrl; }
        },
        generateAvatarStatsPanel(id){
            const avatar = API.getAvatar(id);
            const el = document.createElement('div');
            el.style.cssText = 'font-size:12px;color:#cfcfcf;display:flex;flex-direction:column;gap:6px';
            el.innerHTML = `<div><strong>${avatar.playerName}</strong></div><div style="font-size:11px;color:#9aa">Type: ${avatar.type}</div><div style="font-size:11px;color:#9aa">Created: ${avatar.createdAt||''}</div>`;
            return el;
        },
        exportAvatar(id, fmt='png'){
            const avatar = API.getAvatar(id);
            const a = document.createElement('a'); a.href = avatar.image; a.download = `${avatar.playerName || id}.${fmt}`; document.body.appendChild(a); a.click(); a.remove();
        }
    };

    global.AvatarSystem = API;
})(window);
