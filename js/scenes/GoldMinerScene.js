/**
 * GoldMinerScene - Dig tiles to find gold nuggets hidden underground.
 * Click dirt tiles to excavate. Find all gold to complete.
 * 15-second time limit!
 */
class GoldMinerScene extends Phaser.Scene {
  constructor() { super('GoldMiner'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1a0f0a');
    this.cameras.main.fadeIn(500);

    // Title
    const tg = this.add.graphics();
    tg.fillStyle(0x2a1a10, 0.9); tg.fillRoundedRect(80, 12, W - 160, 70, 12);
    tg.lineStyle(2, 0xc4a44a); tg.strokeRoundedRect(80, 12, W - 160, 70, 12);

    this.add.text(W / 2, 30, 'DIG FOR TREASURE', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W / 2, 56, 'Click dirt blocks to dig! Find all 8 gold nuggets.', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5);
    if (typeof LevelInfoUI !== 'undefined') LevelInfoUI.create(this);

    // Grid setup
    this.COLS = 10;
    this.ROWS = 6;
    this.CELL = 52;
    this.offsetX = Math.floor((W - this.COLS * this.CELL) / 2);
    this.offsetY = 100;
    this.goldTarget = 8;
    this.goldFound = 0;
    this.totalDug = 0;

    // Generate hidden content
    this.grid = []; // 0=dirt, 1=gold, 2=rock
    for (let r = 0; r < this.ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.COLS; c++) { this.grid[r][c] = 0; }
    }

    // Place gold
    let placed = 0;
    while (placed < this.goldTarget) {
      const r = Phaser.Math.Between(0, this.ROWS - 1);
      const c = Phaser.Math.Between(0, this.COLS - 1);
      if (this.grid[r][c] === 0) { this.grid[r][c] = 1; placed++; }
    }

    // Place rocks (4)
    let rocks = 0;
    while (rocks < 4) {
      const r = Phaser.Math.Between(0, this.ROWS - 1);
      const c = Phaser.Math.Between(0, this.COLS - 1);
      if (this.grid[r][c] === 0) { this.grid[r][c] = 2; rocks++; }
    }

    // Draw initial grid
    this.tiles = [];
    this.tileGraphics = [];
    for (let r = 0; r < this.ROWS; r++) {
      this.tiles[r] = [];
      this.tileGraphics[r] = [];
      for (let c = 0; c < this.COLS; c++) {
        const x = this.offsetX + c * this.CELL;
        const y = this.offsetY + r * this.CELL;
        const g = this.add.graphics();
        this.drawDirtTile(g, x, y);
        this.tileGraphics[r][c] = g;
        this.tiles[r][c] = { dug: false };

        const zone = this.add.zone(x + this.CELL / 2, y + this.CELL / 2, this.CELL, this.CELL)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this.digTile(r, c));
      }
    }

    // Progress
    this.progressText = this.add.text(W / 2, H - 45, 'Gold found: 0 / ' + this.goldTarget, {
      fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Pickaxe cursor hint
    this.add.text(W / 2, H - 22, '\u26CF Click dirt blocks to dig!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5);

    this.completed = false;

    // ===== 15-SECOND TIMER =====
    this.timeLimit = 45;
    this.timeRemaining = this.timeLimit;

    // Timer display - prominent at the top
    this.timerBg = this.add.graphics();
    this.timerBg.fillStyle(0x3a1a10, 0.9);
    this.timerBg.fillRoundedRect(W / 2 - 70, 84, 140, 14, 4);

    this.timerBarBg = this.add.graphics();
    this.timerBarBg.fillStyle(0x2a1a08);
    this.timerBarBg.fillRect(W / 2 - 66, 86, 132, 10);

    this.timerBar = this.add.graphics();
    this.updateTimerBar();

    this.timerText = this.add.text(W - 60, 88, this.timeRemaining + 's', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ff6b6b', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);

    // Countdown timer event
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.completed) return;
        this.timeRemaining--;
        this.timerText.setText(this.timeRemaining + 's');
        this.updateTimerBar();

        // Flash warning when low
        if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
          this.timerText.setColor('#ff3333');
          this.tweens.add({ targets: this.timerText, scale: 1.3, duration: 100, yoyo: true });
        }

        if (this.timeRemaining <= 0) {
          this.completed = true;
          this.onTimeUp();
        }
      },
      loop: true
    });
  }

  updateTimerBar() {
    const W = this.scale.width;
    const pct = Math.max(0, this.timeRemaining / this.timeLimit);
    this.timerBar.clear();
    const color = pct > 0.4 ? 0xd4a440 : (pct > 0.2 ? 0xff8800 : 0xff3333);
    this.timerBar.fillStyle(color);
    this.timerBar.fillRect(W / 2 - 66, 86, 132 * pct, 10);
  }

  drawDirtTile(g, x, y) {
    g.clear();
    g.fillStyle(0x8B6914);
    g.fillRect(x + 1, y + 1, this.CELL - 2, this.CELL - 2);
    g.fillStyle(0x7a5a10);
    g.fillRect(x + 4, y + 4, this.CELL - 8, this.CELL - 8);
    // Dirt texture dots
    g.fillStyle(0x6b4a08);
    g.fillRect(x + 10, y + 12, 3, 3);
    g.fillRect(x + 28, y + 20, 3, 3);
    g.fillRect(x + 18, y + 36, 3, 3);
  }

  drawGoldTile(g, x, y) {
    g.clear();
    g.fillStyle(0x3a2a10);
    g.fillRect(x + 1, y + 1, this.CELL - 2, this.CELL - 2);
    // Gold nugget
    g.fillStyle(0xffd700);
    g.fillCircle(x + this.CELL / 2, y + this.CELL / 2, 14);
    g.fillStyle(0xd4a440);
    g.fillCircle(x + this.CELL / 2, y + this.CELL / 2, 10);
  }

  drawEmptyTile(g, x, y) {
    g.clear();
    g.fillStyle(0x3a2a10);
    g.fillRect(x + 1, y + 1, this.CELL - 2, this.CELL - 2);
    g.fillStyle(0x2a1a08);
    g.fillRect(x + 8, y + 8, this.CELL - 16, this.CELL - 16);
  }

  drawRockTile(g, x, y) {
    g.clear();
    g.fillStyle(0x3a2a10);
    g.fillRect(x + 1, y + 1, this.CELL - 2, this.CELL - 2);
    // Rock
    g.fillStyle(0x6a6a6a);
    g.fillCircle(x + this.CELL / 2, y + this.CELL / 2, 16);
    g.fillStyle(0x5a5a5a);
    g.fillCircle(x + this.CELL / 2 - 3, y + this.CELL / 2 - 3, 10);
  }

  digTile(r, c) {
    if (this.completed) return;
    if (this.tiles[r][c].dug) return;

    if (window.AudioManager) window.AudioManager.playDig();

    const x = this.offsetX + c * this.CELL;
    const y = this.offsetY + r * this.CELL;
    const g = this.tileGraphics[r][c];
    this.tiles[r][c].dug = true;
    this.totalDug++;

    const content = this.grid[r][c];
    if (content === 1) {
      // Gold!
      this.drawGoldTile(g, x, y);
      this.goldFound++;
      this.progressText.setText('Gold found: ' + this.goldFound + ' / ' + this.goldTarget);

      // Sparkle
      for (let i = 0; i < 4; i++) {
        const sp = this.add.graphics();
        sp.fillStyle(0xffd700); sp.fillCircle(0, 0, 3);
        sp.setPosition(x + this.CELL / 2 + Phaser.Math.Between(-20, 20), y + this.CELL / 2 + Phaser.Math.Between(-20, 20));
        sp.setAlpha(0);
        this.tweens.add({ targets: sp, alpha: { from: 1, to: 0 }, scale: { from: 1, to: 2 }, duration: 400, delay: i * 60, onComplete: () => sp.destroy() });
      }

      // Scale bounce
      this.tweens.add({ targets: this.progressText, scale: 1.2, duration: 100, yoyo: true });

      if (this.goldFound >= this.goldTarget) {
        this.completed = true;
        if (this.timerEvent) this.timerEvent.destroy();
        this.time.delayedCall(800, () => this.onComplete());
      }
    } else if (content === 2) {
      // Rock
      this.drawRockTile(g, x, y);
    } else {
      // Empty
      this.drawEmptyTile(g, x, y);
    }
  }

  onTimeUp() {
    // Time's up! Complete with whatever gold was found
    if (this.timerEvent) this.timerEvent.destroy();

    const W = this.scale.width, H = this.scale.height;
    const coinsEarned = 200;

    window.gameState.set('completedMining', true);
    window.gameState.set('foundTreasure', true);
    window.gameState.addCoins(coinsEarned);

    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.graphics(); dim.fillStyle(0x1a0f0a, 0.8); dim.fillRect(0, 0, W, H); layer.add(dim);

    const pw = 400, ph = 220, px = W / 2, py = H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a10, 0.98); panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    panel.lineStyle(2, 0xc4a44a); panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    layer.add(panel);

    layer.add(this.add.text(px, py - 70, '\u23F0 Time\'s Up!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#ff8800', fontStyle: 'bold'
    }).setOrigin(0.5));

    layer.add(this.add.text(px, py - 30, 'You found ' + this.goldFound + ' / ' + this.goldTarget + ' gold nuggets!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5));

    layer.add(this.add.text(px, py, 'Earned 200 gold coins!', {
      fontSize: '13px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5));

    layer.add(this.add.text(px, py + 25, 'Your pockets feel heavy with treasure...', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5));

    const cont = this.add.text(px, py + 65, '[ Return to Village \u2192 ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => {
      if (window.AudioManager) window.AudioManager.playClick();
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Town'));
    });
  }

  onComplete() {
    window.gameState.set('completedMining', true);
    window.gameState.set('foundTreasure', true);
    window.gameState.addCoins(200);

    const W = this.scale.width, H = this.scale.height;
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.graphics(); dim.fillStyle(0x1a0f0a, 0.8); dim.fillRect(0, 0, W, H); layer.add(dim);

    const pw = 400, ph = 200, px = W / 2, py = H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a10, 0.98); panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    panel.lineStyle(2, 0xc4a44a); panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    layer.add(panel);

    layer.add(this.add.text(px, py - 60, '\u26CF Treasure Excavated!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5));

    layer.add(this.add.text(px, py - 20, 'You found all 8 gold nuggets! Earned 200 coins!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5));

    layer.add(this.add.text(px, py + 10, 'Your pockets feel heavy with treasure...', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5));

    const cont = this.add.text(px, py + 55, '[ Return to Village \u2192 ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => {
      if (window.AudioManager) window.AudioManager.playClick();
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Town'));
    });
  }
}
