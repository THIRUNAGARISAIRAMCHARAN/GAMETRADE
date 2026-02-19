/**
 * BootScene - Generates ALL game art assets programmatically.
 * No external images needed — everything is drawn with Canvas 2D.
 * This keeps the prototype self-contained and fast to load.
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    // Title
    this.add.text(width / 2, height / 2 - 80, 'ROYAL BANK OF AURUMVALE', {
      fontSize: '26px',
      fontFamily: 'Georgia, serif',
      color: '#d4a440',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Loading text
    this.add.text(width / 2, height / 2, 'Preparing the kingdom...', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#888888'
    }).setOrigin(0.5);

    // Simple loading bar
    const barW = 260;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333);
    barBg.fillRect(width / 2 - barW / 2, height / 2 + 30, barW, 14);

    this.loadBar = this.add.graphics();
    this.loadBarWidth = barW;
    this.loadBarX = width / 2 - barW / 2;
    this.loadBarY = height / 2 + 30;
  }

  create() {
    // Generate every asset the game needs
    this.generatePixelTexture();  // 1x1 helper
    this.generateTiles();
    this.generateCharacters();
    this.generateBuildings();
    this.generateNPCs();
    this.generateObjects();
    this.generateUI();

    // Fill loading bar fully
    this.loadBar.clear();
    this.loadBar.fillStyle(0xd4a440);
    this.loadBar.fillRect(this.loadBarX + 2, this.loadBarY + 2, this.loadBarWidth - 4, 10);

    // Transition to character select
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CharacterSelect');
      });
    });
  }

  // ========== HELPERS ==========

  /** Creates a canvas texture from a draw function */
  makeTex(key, w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    // addCanvas properly handles WebGL GPU upload
    this.textures.addCanvas(key, c);
  }

  /** Creates a sprite-sheet texture (grid of frames) */
  makeSheet(key, frameW, frameH, cols, rows, drawFn) {
    const c = document.createElement('canvas');
    c.width = frameW * cols;
    c.height = frameH * rows;
    const ctx = c.getContext('2d');
    drawFn(ctx, frameW, frameH, cols, rows);
    this.textures.addSpriteSheet(key, c, { frameWidth: frameW, frameHeight: frameH });
  }

  /** 1x1 white pixel — used for invisible collision bodies */
  generatePixelTexture() {
    this.makeTex('pixel', 1, 1, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1, 1);
    });
  }

  // ========== TILES (32x32) ==========

  generateTiles() {
    const S = 32;

    // Grass
    this.makeTex('tile-grass', S, S, (ctx) => {
      ctx.fillStyle = '#5a9c4f';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#4e9643';
      ctx.fillRect(6, 12, 2, 2);
      ctx.fillRect(20, 6, 2, 2);
      ctx.fillRect(14, 24, 2, 2);
    });

    // Grass variant
    this.makeTex('tile-grass2', S, S, (ctx) => {
      ctx.fillStyle = '#4e9643';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#5a9c4f';
      ctx.fillRect(4, 8, 3, 5);
      ctx.fillRect(22, 18, 3, 5);
    });

    // Path
    this.makeTex('tile-path', S, S, (ctx) => {
      ctx.fillStyle = '#c4a66a';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#b89658';
      ctx.fillRect(5, 10, 4, 2);
      ctx.fillRect(20, 22, 4, 2);
    });

    // Water
    this.makeTex('tile-water', S, S, (ctx) => {
      ctx.fillStyle = '#4a8cc4';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#5a9cd4';
      ctx.fillRect(3, 10, 12, 2);
      ctx.fillRect(18, 22, 10, 2);
    });

    // Flowers
    this.makeTex('tile-flowers', S, S, (ctx) => {
      ctx.fillStyle = '#5a9c4f';
      ctx.fillRect(0, 0, S, S);
      const cols = ['#ff6b6b', '#ffd93d', '#c084fc', '#ff9ff3'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(4 + (i % 3) * 10, 6 + Math.floor(i / 3) * 14, 4, 4);
      }
    });

    // Tree trunk (bottom tile)
    this.makeTex('tile-tree-base', S, S, (ctx) => {
      ctx.fillStyle = '#5a9c4f';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(12, 0, 8, S);
    });

    // Tree canopy (top tile, drawn above player — transparent bg)
    this.makeTex('tile-tree-top', S, S, (ctx) => {
      ctx.fillStyle = '#2d6b24';
      ctx.beginPath();
      ctx.arc(S / 2, S / 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a8030';
      ctx.beginPath();
      ctx.arc(S / 2 - 2, S / 2 - 3, 9, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fence
    this.makeTex('tile-fence', S, S, (ctx) => {
      ctx.fillStyle = '#5a9c4f';
      ctx.fillRect(0, 0, S, S);
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, 12, S, 3);
      ctx.fillRect(0, 22, S, 3);
      ctx.fillRect(5, 8, 4, 20);
      ctx.fillRect(23, 8, 4, 20);
    });
  }

  // ========== CHARACTERS ==========

  generateCharacters() {
    // Arnav — blue shirt, dark hair
    this.createCharacterSheet('arnav', {
      skin: '#f4c4a0', hair: '#2c2c2c', shirt: '#3a6ea5',
      pants: '#2c3e6b', shoes: '#4a3728', longHair: false
    });

    // Ananya — purple top, long dark hair with red accessory
    this.createCharacterSheet('ananya', {
      skin: '#f4c4a0', hair: '#1a1a2e', shirt: '#9b4dca',
      pants: '#6b3fa0', shoes: '#4a3728', longHair: true
    });
  }

  createCharacterSheet(key, col) {
    this.makeSheet(key, 32, 32, 4, 4, (ctx, fw, fh) => {
      // 4 directions (rows): down, left, right, up
      // 4 frames (cols): walk cycle
      for (let dir = 0; dir < 4; dir++) {
        for (let fr = 0; fr < 4; fr++) {
          this.drawChar(ctx, fr * fw, dir * fh, col, dir, fr);
        }
      }
    });
  }

  drawChar(ctx, x, y, c, dir, fr) {
    // dir: 0=down 1=left 2=right 3=up   fr: 0-3 walk cycle
    const bob = (fr === 1 || fr === 3) ? -1 : 0;

    // -- Legs --
    ctx.fillStyle = c.pants;
    if (fr % 2 === 1) {
      ctx.fillRect(x + 10, y + 22 + bob, 5, 6);
      ctx.fillRect(x + 17, y + 23 + bob, 5, 5);
    } else {
      ctx.fillRect(x + 11, y + 22, 4, 6);
      ctx.fillRect(x + 17, y + 22, 4, 6);
    }

    // -- Shoes --
    ctx.fillStyle = c.shoes;
    ctx.fillRect(x + 10, y + 27 + bob, 5, 3);
    ctx.fillRect(x + 17, y + 27 + bob, 5, 3);

    // -- Body --
    ctx.fillStyle = c.shirt;
    ctx.fillRect(x + 9, y + 14 + bob, 14, 9);

    // -- Arms --
    ctx.fillStyle = c.skin;
    const armSwing = (fr % 2 === 1) ? 2 : 0;
    ctx.fillRect(x + 6, y + 15 + bob + armSwing, 3, 6);
    ctx.fillRect(x + 23, y + 15 + bob + (fr % 2 === 1 ? 0 : 2), 3, 6);

    // -- Head --
    ctx.fillStyle = c.skin;
    ctx.fillRect(x + 10, y + 4 + bob, 12, 11);

    // -- Hair --
    ctx.fillStyle = c.hair;
    if (dir === 3) {
      // Back of head
      ctx.fillRect(x + 9, y + 2 + bob, 14, 12);
    } else {
      ctx.fillRect(x + 9, y + 2 + bob, 14, 5);
      if (c.longHair) {
        ctx.fillRect(x + 9, y + 2 + bob, 3, 14);
        ctx.fillRect(x + 20, y + 2 + bob, 3, 14);
      }
      if (dir === 1) ctx.fillRect(x + 9, y + 2 + bob, 5, 9);
      if (dir === 2) ctx.fillRect(x + 18, y + 2 + bob, 5, 9);
    }

    // -- Eyes (not when facing up) --
    if (dir !== 3) {
      ctx.fillStyle = '#1a1a1a';
      const offsets = { 0: [12, 18], 1: [11, 16], 2: [14, 20] };
      const [e1, e2] = offsets[dir];
      ctx.fillRect(x + e1, y + 9 + bob, 2, 2);
      ctx.fillRect(x + e2, y + 9 + bob, 2, 2);
      // Mouth
      ctx.fillRect(x + 14, y + 12 + bob, 4, 1);
    }

    // -- Hair accessory (Ananya) --
    if (c.longHair && dir !== 3) {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(x + 20, y + 5 + bob, 3, 3);
    }
  }

  // ========== BUILDINGS ==========

  generateBuildings() {
    // Player House (128×96)
    this.makeTex('building-house', 128, 96, (ctx, w, h) => {
      // Roof
      ctx.fillStyle = '#a0522d';
      ctx.beginPath();
      ctx.moveTo(0, 34); ctx.lineTo(w / 2, 0); ctx.lineTo(w, 34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Walls
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(8, 34, w - 16, h - 38);
      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 34, w - 16, h - 38);
      // Door
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(w / 2 - 10, h - 36, 20, 32);
      ctx.fillStyle = '#d4a440';
      ctx.fillRect(w / 2 + 4, h - 22, 3, 3);
      // Windows
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(18, 44, 22, 18);
      ctx.fillRect(w - 40, 44, 22, 18);
      ctx.strokeStyle = '#DEB887';
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 44, 22, 18);
      ctx.strokeRect(w - 40, 44, 22, 18);
    });

    // Royal Bank (192×140)
    this.makeTex('building-bank', 192, 140, (ctx, w, h) => {
      // Foundation
      ctx.fillStyle = '#8c8c8c';
      ctx.fillRect(4, h - 6, w - 8, 6);
      // Walls
      ctx.fillStyle = '#d4d4d4';
      ctx.fillRect(8, 38, w - 16, h - 44);
      // Pillars
      ctx.fillStyle = '#e8e8e8';
      for (let i = 0; i < 4; i++) {
        const px = 18 + i * ((w - 36) / 3);
        ctx.fillRect(px, 38, 10, h - 44);
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(px, 38, 10, 5);
        ctx.fillRect(px, h - 10, 10, 4);
        ctx.fillStyle = '#e8e8e8';
      }
      // Gold roof
      ctx.fillStyle = '#d4a440';
      ctx.beginPath();
      ctx.moveTo(0, 40); ctx.lineTo(w / 2, 2); ctx.lineTo(w, 40);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Roof trim
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(4, 36, w - 8, 5);
      // Crown
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(w / 2 - 8, 14, 16, 3);
      ctx.fillRect(w / 2 - 10, 10, 3, 7);
      ctx.fillRect(w / 2 - 1, 8, 3, 9);
      ctx.fillRect(w / 2 + 7, 10, 3, 7);
      // Grand door
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(w / 2 - 16, h - 56, 32, 50);
      // Arch
      ctx.beginPath();
      ctx.arc(w / 2, h - 56, 16, Math.PI, 0);
      ctx.fill();
      // Door details
      ctx.fillStyle = '#d4a440';
      ctx.fillRect(w / 2 - 1, h - 52, 2, 44);
      ctx.fillRect(w / 2 + 8, h - 34, 3, 3);
      ctx.fillRect(w / 2 - 11, h - 34, 3, 3);
      // Windows
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(22, 54, 24, 22);
      ctx.fillRect(w - 46, 54, 24, 22);
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 1;
      ctx.strokeRect(22, 54, 24, 22);
      ctx.strokeRect(w - 46, 54, 24, 22);
      // Sign
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(w / 2 - 46, h - 80, 92, 16);
      ctx.fillStyle = '#d4a440';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ROYAL BANK', w / 2, h - 68);
    });

    // School / Library (160×96)
    this.makeTex('building-school', 160, 96, (ctx, w, h) => {
      // Walls
      ctx.fillStyle = '#c4866c';
      ctx.fillRect(8, 30, w - 16, h - 34);
      // Roof
      ctx.fillStyle = '#6c8da8';
      ctx.fillRect(0, 24, w, 10);
      // Roof peak
      ctx.beginPath();
      ctx.moveTo(w / 2 - 26, 24);
      ctx.lineTo(w / 2, 2);
      ctx.lineTo(w / 2 + 26, 24);
      ctx.closePath();
      ctx.fill();
      // Clock
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w / 2, 14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2, 14); ctx.lineTo(w / 2, 9);
      ctx.moveTo(w / 2, 14); ctx.lineTo(w / 2 + 4, 14);
      ctx.stroke();
      // Door
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(w / 2 - 12, h - 38, 24, 34);
      ctx.fillStyle = '#d4a440';
      ctx.fillRect(w / 2 + 6, h - 22, 3, 3);
      // Windows
      ctx.fillStyle = '#87CEEB';
      for (let i = 0; i < 2; i++) {
        ctx.fillRect(16 + i * 22, 42, 16, 18);
        ctx.fillRect(w - 32 - i * 22, 42, 16, 18);
      }
      // Sign
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(w / 2 - 34, h - 52, 68, 12);
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LIBRARY', w / 2, h - 43);
    });
  }

  // ========== NPCs ==========

  generateNPCs() {
    // Elder Sage — green robes, gray hair
    this.createCharacterSheet('npc-guide', {
      skin: '#deb887', hair: '#c0c0c0', shirt: '#2d8b4e',
      pants: '#1a6b3a', shoes: '#4a3728', longHair: false
    });
    // Banker Vikram — dark formal suit
    this.createCharacterSheet('npc-banker', {
      skin: '#f4c4a0', hair: '#4a3728', shirt: '#2c2c2c',
      pants: '#1a1a1a', shoes: '#111111', longHair: false
    });
    // Mother — warm brown dress, long hair, apron
    this.createCharacterSheet('npc-mother', {
      skin: '#f4c4a0', hair: '#5c3a1e', shirt: '#c4666e',
      pants: '#a04848', shoes: '#4a3728', longHair: true
    });
    // Market Aunty — green sari, gray hair
    this.createCharacterSheet('npc-aunty', {
      skin: '#deb887', hair: '#888888', shirt: '#2d8b4e',
      pants: '#1a6b3a', shoes: '#4a3728', longHair: true
    });
  }

  // ========== INTERACTIVE OBJECTS ==========

  generateObjects() {
    const S = 32;

    // Treasure chest (closed)
    this.makeTex('obj-chest', S, S, (ctx) => {
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(4, 12, 24, 16);
      ctx.fillStyle = '#a07828';
      ctx.fillRect(2, 8, 28, 7);
      ctx.fillStyle = '#d4a440';
      ctx.fillRect(13, 18, 6, 5);
      ctx.fillStyle = '#6b5210';
      ctx.fillRect(4, 15, 24, 2);
    });

    // Treasure chest (open, with glow)
    this.makeTex('obj-chest-open', S, S, (ctx) => {
      ctx.fillStyle = 'rgba(255,215,0,0.25)';
      ctx.beginPath(); ctx.arc(16, 14, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(4, 16, 24, 12);
      ctx.fillStyle = '#a07828';
      ctx.fillRect(4, 6, 24, 6);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(8, 16, 16, 6);
      ctx.fillStyle = '#ffed4a';
      ctx.fillRect(10, 14, 4, 4);
      ctx.fillRect(18, 14, 4, 4);
    });

    // Bookshelf
    this.makeTex('obj-bookshelf', S, S, (ctx) => {
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(2, 0, 28, 32);
      ctx.fillStyle = '#5c3a1e';
      ctx.fillRect(2, 10, 28, 2);
      ctx.fillRect(2, 20, 28, 2);
      const bk = ['#c44', '#44c', '#4a4', '#cc4', '#c4c'];
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = bk[(r + i) % bk.length];
          ctx.fillRect(4 + i * 5, r * 10 + 1, 4, 8);
        }
      }
    });

    // Glowing treasure map
    this.makeTex('obj-treasure-map', S, S, (ctx) => {
      ctx.fillStyle = 'rgba(255,215,0,0.2)';
      ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#deb887';
      ctx.fillRect(6, 6, 20, 20);
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 6, 20, 20);
      ctx.strokeStyle = '#6b4226';
      ctx.beginPath();
      ctx.moveTo(10, 16); ctx.lineTo(16, 12); ctx.lineTo(22, 18);
      ctx.stroke();
      ctx.fillStyle = '#c44';
      ctx.font = '10px sans-serif';
      ctx.fillText('X', 19, 20);
    });

    // ===== LEVEL ASSETS =====

    // Large draggable gold coin (48×48)
    this.makeTex('coin-large', 48, 48, (ctx) => {
      ctx.fillStyle = '#d4a440';
      ctx.beginPath(); ctx.arc(24, 24, 21, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c4a44a';
      ctx.beginPath(); ctx.arc(24, 24, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a2a';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(24, 24, 21, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#3a2a10';
      ctx.font = 'bold 18px Georgia';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('G', 24, 25);
    });

    // Small coin for animations (24×24)
    this.makeTex('coin-small', 24, 24, (ctx) => {
      ctx.fillStyle = '#d4a440';
      ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c4a44a';
      ctx.beginPath(); ctx.arc(12, 12, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a2a';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke();
    });

    // Cave entrance (128×112) - Pokemon-style rocky mountain with dark entrance
    this.makeTex('building-cave', 128, 112, (ctx, w, h) => {
      // Transparent base
      ctx.clearRect(0, 0, w, h);
      // Large rocky mountain shape
      ctx.fillStyle = '#8a7a6a';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(2, h * 0.55); ctx.lineTo(10, h * 0.4);
      ctx.lineTo(20, h * 0.25); ctx.lineTo(35, h * 0.12);
      ctx.lineTo(w / 2 - 10, h * 0.04); ctx.lineTo(w / 2, 0);
      ctx.lineTo(w / 2 + 10, h * 0.04);
      ctx.lineTo(w - 35, h * 0.12); ctx.lineTo(w - 20, h * 0.25);
      ctx.lineTo(w - 10, h * 0.4); ctx.lineTo(w - 2, h * 0.55);
      ctx.lineTo(w, h);
      ctx.closePath(); ctx.fill();
      // Darker rock layers
      ctx.fillStyle = '#7a6a5a';
      ctx.beginPath();
      ctx.moveTo(8, h); ctx.lineTo(12, h * 0.5);
      ctx.lineTo(25, h * 0.3); ctx.lineTo(40, h * 0.18);
      ctx.lineTo(w / 2, h * 0.1);
      ctx.lineTo(w - 40, h * 0.18); ctx.lineTo(w - 25, h * 0.3);
      ctx.lineTo(w - 12, h * 0.5); ctx.lineTo(w - 8, h);
      ctx.closePath(); ctx.fill();
      // Rock texture - lighter patches
      ctx.fillStyle = '#9a8a7a';
      [[12, 35, 16, 10], [w-28, 40, 14, 8], [30, 20, 10, 8],
       [w-42, 22, 12, 7], [20, 55, 12, 10], [w-34, 58, 10, 8],
       [45, 14, 8, 6], [w-55, 16, 10, 5]].forEach(([rx, ry, rw, rh]) => {
        ctx.fillRect(rx, ry, rw, rh);
      });
      // Darker rock spots
      ctx.fillStyle = '#5a4a3a';
      [[18, 42, 8, 5], [w-26, 48, 6, 4], [38, 28, 7, 4],
       [w-48, 30, 8, 4], [55, 50, 6, 5], [w-60, 52, 7, 4]].forEach(([rx, ry, rw, rh]) => {
        ctx.fillRect(rx, ry, rw, rh);
      });
      // Boulders at base
      ctx.fillStyle = '#6a5a4a';
      ctx.beginPath(); ctx.arc(15, h - 8, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w - 18, h - 10, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a6a5a';
      ctx.beginPath(); ctx.arc(15, h - 10, 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w - 18, h - 12, 8, 0, Math.PI * 2); ctx.fill();
      // Cave entrance (dark arch)
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.ellipse(w / 2, h, 24, 36, 0, Math.PI, 0, true);
      ctx.fill();
      ctx.fillStyle = '#050505';
      ctx.beginPath();
      ctx.ellipse(w / 2, h, 18, 28, 0, Math.PI, 0, true);
      ctx.fill();
      // Stalactites
      ctx.fillStyle = '#5a4a3a';
      [[-16, 36], [-6, 40], [4, 38], [12, 34]].forEach(([ox, oh]) => {
        ctx.beginPath();
        ctx.moveTo(w/2 + ox - 3, h - oh);
        ctx.lineTo(w/2 + ox, h - oh + 10);
        ctx.lineTo(w/2 + ox + 3, h - oh);
        ctx.closePath(); ctx.fill();
      });
      // Green moss/grass patches
      ctx.fillStyle = '#4a7a3a';
      ctx.fillRect(5, h * 0.5, 12, 3); ctx.fillRect(w - 18, h * 0.48, 14, 3);
      ctx.fillRect(25, h * 0.28, 8, 2); ctx.fillRect(w - 36, h * 0.26, 10, 2);
      ctx.fillStyle = '#5a9c4f';
      ctx.fillRect(8, h - 4, 18, 4); ctx.fillRect(w - 28, h - 4, 20, 4);
      // Subtle glow from inside
      ctx.fillStyle = 'rgba(255, 200, 100, 0.05)';
      ctx.beginPath(); ctx.ellipse(w / 2, h, 14, 20, 0, Math.PI, 0, true); ctx.fill();
    });

    // Dock / pier (64×48)
    this.makeTex('building-dock', 64, 48, (ctx, w, h) => {
      ctx.fillStyle = '#8B7355';
      for (let i = 0; i < 4; i++) { ctx.fillRect(2, i * 12, w - 4, 10); }
      ctx.fillStyle = '#6b5535'; ctx.fillRect(8, 0, 6, h); ctx.fillRect(w - 14, 0, 6, h);
      ctx.fillStyle = '#5c3a1e'; ctx.fillRect(w / 2 - 10, h - 8, 20, 8);
      ctx.fillStyle = '#d4a440'; ctx.font = '8px monospace'; ctx.textAlign = 'center'; ctx.fillText('DOCK', w / 2, 8);
    });

    // Boat (48×32)
    this.makeTex('obj-boat', 48, 32, (ctx, w, h) => {
      ctx.fillStyle = '#6b4226';
      ctx.beginPath(); ctx.moveTo(4, h - 4); ctx.lineTo(0, h / 2); ctx.lineTo(8, 4); ctx.lineTo(w - 8, 4); ctx.lineTo(w, h / 2); ctx.lineTo(w - 4, h - 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8B6914'; ctx.fillRect(12, 6, w - 24, h - 12);
      ctx.fillStyle = '#a07828'; ctx.fillRect(w / 2 - 1, 2, 2, h - 6);
    });

    // Treasure map HUD icon (24×24)
    this.makeTex('hud-treasure-map', 24, 24, (ctx) => {
      ctx.fillStyle = 'rgba(255,215,0,0.3)';
      ctx.beginPath(); ctx.arc(12, 12, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#deb887';
      ctx.fillRect(4, 4, 16, 16);
      ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, 16, 16);
      ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(7, 12); ctx.lineTo(12, 9); ctx.lineTo(17, 14); ctx.stroke();
      ctx.fillStyle = '#c44'; ctx.font = 'bold 8px sans-serif'; ctx.fillText('X', 14, 16);
    });

    // ATM Machine (48×64)
    this.makeTex('building-atm', 48, 64, (ctx, w, h) => {
      // Base/body
      ctx.fillStyle = '#3a6a8a';
      ctx.fillRect(4, 8, 40, 52);
      ctx.fillStyle = '#2a5a7a';
      ctx.fillRect(6, 10, 36, 48);
      // Screen
      ctx.fillStyle = '#0a2a3a';
      ctx.fillRect(10, 14, 28, 18);
      ctx.fillStyle = '#1a4a5a';
      ctx.fillRect(12, 16, 24, 14);
      // Screen text
      ctx.fillStyle = '#5a9c4f';
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ATM', 24, 24);
      // Keypad
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(14, 36, 20, 14);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(16 + c * 6, 38 + r * 4, 4, 3);
      }
      // Card slot
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(18, 52, 12, 3);
      // Top label
      ctx.fillStyle = '#d4a440';
      ctx.fillRect(4, 4, 40, 5);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 4px monospace';
      ctx.fillText('BANK', 24, 8);
    });

    // Market stall (64×48)
    this.makeTex('building-market-stall', 64, 48, (ctx, w, h) => {
      // Canopy
      ctx.fillStyle = '#c44';
      ctx.fillRect(0, 0, w, 14);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) { if (i % 2 === 0) ctx.fillRect(i * 8, 0, 8, 14); }
      ctx.fillStyle = '#a03030';
      ctx.fillRect(0, 12, w, 3);
      // Counter
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(2, 14, w - 4, h - 16);
      ctx.fillStyle = '#7a5a10';
      ctx.fillRect(4, 16, w - 8, h - 20);
      // Items on counter
      ctx.fillStyle = '#5a9c4f'; ctx.fillRect(8, 20, 8, 8);
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(20, 18, 6, 10);
      ctx.fillStyle = '#ffd700'; ctx.fillRect(30, 20, 8, 8);
      ctx.fillStyle = '#9b4dca'; ctx.fillRect(42, 18, 6, 10);
      ctx.fillStyle = '#ff9f43'; ctx.fillRect(52, 20, 8, 8);
    });

    // Grocery list (32×32)
    this.makeTex('obj-grocery-list', 32, 32, (ctx) => {
      ctx.fillStyle = '#f5f0e0';
      ctx.fillRect(6, 2, 20, 28);
      ctx.strokeStyle = '#8a7a5a';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 2, 20, 28);
      ctx.fillStyle = '#333';
      ctx.font = '5px monospace';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(9, 6 + i * 5, 14, 1);
      }
      ctx.fillStyle = '#c44';
      ctx.fillRect(9, 6, 2, 2);
      ctx.fillRect(9, 11, 2, 2);
      ctx.fillRect(9, 16, 2, 2);
    });

    // Animals (16×16 each)
    this.makeTex('animal-rabbit', 16, 16, (ctx) => {
      ctx.fillStyle = '#deb887';
      ctx.fillRect(4, 6, 8, 8);
      ctx.fillRect(5, 2, 2, 5);
      ctx.fillRect(9, 2, 2, 5);
      ctx.fillStyle = '#c4a070';
      ctx.fillRect(6, 12, 4, 2);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(6, 3, 1, 1);
      ctx.fillRect(10, 3, 1, 1);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(5, 8, 1, 1);
      ctx.fillRect(10, 8, 1, 1);
    });

    this.makeTex('animal-bird', 16, 16, (ctx) => {
      ctx.fillStyle = '#4a8cc4';
      ctx.fillRect(5, 5, 6, 5);
      ctx.fillStyle = '#3a7ab4';
      ctx.fillRect(3, 3, 3, 4);
      ctx.fillRect(10, 3, 3, 4);
      ctx.fillStyle = '#ff9f43';
      ctx.fillRect(7, 10, 2, 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(6, 6, 1, 1);
      ctx.fillRect(9, 6, 1, 1);
    });

    this.makeTex('animal-squirrel', 16, 16, (ctx) => {
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(4, 5, 7, 7);
      ctx.fillStyle = '#a07828';
      ctx.fillRect(5, 3, 5, 4);
      ctx.fillRect(10, 1, 3, 8);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(6, 5, 1, 1);
      ctx.fillRect(9, 5, 1, 1);
      ctx.fillStyle = '#deb887';
      ctx.fillRect(6, 9, 3, 2);
    });

    // Interact indicator (E key)
    this.makeTex('ui-interact', S, S, (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath(); ctx.arc(16, 16, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', 16, 16);
    });
  }

  // ========== UI TEXTURES ==========

  generateUI() {
    // Badge (account success)
    this.makeTex('ui-badge', 64, 64, (ctx, w, h) => {
      // Gold star
      ctx.fillStyle = '#d4a440';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = 32 + 28 * Math.cos(a);
        const py = 32 + 28 * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // Inner circle
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(32, 32, 16, 0, Math.PI * 2); ctx.fill();
      // Check mark
      ctx.strokeStyle = '#1a6b3a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(24, 32); ctx.lineTo(30, 38); ctx.lineTo(40, 26);
      ctx.stroke();
    });

    // Phone screen (for OTP)
    this.makeTex('ui-phone', 120, 200, (ctx, w, h) => {
      // Body
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(4, 0, w - 8, h);
      ctx.fillRect(0, 8, w, h - 16);
      // Screen
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(10, 28, w - 20, h - 52);
      // Speaker
      ctx.fillStyle = '#444';
      ctx.fillRect(w / 2 - 12, 12, 24, 3);
      // Home btn
      ctx.fillStyle = '#444';
      ctx.beginPath(); ctx.arc(w / 2, h - 12, 6, 0, Math.PI * 2); ctx.fill();
    });

    // D-pad and action buttons (mobile)
    const btnKeys = {
      'dpad-up': '\u25B2', 'dpad-down': '\u25BC',
      'dpad-left': '\u25C0', 'dpad-right': '\u25B6',
      'btn-action': 'E'
    };
    Object.entries(btnKeys).forEach(([key, label]) => {
      this.makeTex(key, 48, 48, (ctx) => {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.arc(24, 24, 22, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 24, 24);
      });
    });
  }
}
