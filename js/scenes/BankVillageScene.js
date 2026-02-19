/**
 * BankVillageScene - The village across the river with the Royal Bank.
 * Player arrives here after crossing the river.
 * Walk to the bank entrance to enter BankInterior.
 * Dock on the left side to return to home village.
 */
class BankVillageScene extends Phaser.Scene {
  constructor() { super('BankVillage'); }

  create() {
    this.TILE = 32;
    this.MAP_W = 25;
    this.MAP_H = 20;
    this.worldW = this.MAP_W * this.TILE;
    this.worldH = this.MAP_H * this.TILE;
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);

    this.buildGround();
    this.buildCollisions();
    this.placeBuildings();
    this.setupInteractables();

    // Player spawn at dock (left side)
    const charKey = window.gameState.get('selectedCharacter') || 'arnav';
    let startX = 4 * this.TILE, startY = 10 * this.TILE;
    // If returning from bank interior, spawn near bank
    if (window.gameState.get('enteredBank')) {
      startX = 13 * this.TILE; startY = 12 * this.TILE;
    }
    this.player = new PlayerController(this, startX, startY, charKey);
    this.physics.add.collider(this.player.sprite, this.collisionGroup);

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.fadeIn(700);

    this.dialogue = new DialogueManager(this);
    this.dialogue.create();
    this.wallet = new WalletSystem(this);
    this.wallet.create();
    this.wallet.show();

    this.interactIcon = this.add.image(0, 0, 'ui-interact').setDepth(50).setVisible(false);

    // Objective UI
    this.createObjectiveUI();

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.createMobileControls();

    // Show arrival dialogue first time
    if (!window.gameState.get('enteredBank')) {
      this.time.delayedCall(600, () => {
        this.dialogue.show([
          { speaker: '', text: 'You arrive at the Bank Village across the river!' },
          { speaker: '', text: 'The Royal Bank stands proudly in the center of the village.' },
          { speaker: '', text: 'Walk to the bank entrance and press E to enter.' }
        ], () => this.updateObjective('Enter the Royal Bank'));
      });
    } else if (window.gameState.get('accountCreated')) {
      this.updateObjective('Visit the bank for more lessons, or return to village');
    }
  }

  // ==================== MAP ====================

  buildGround() {
    this.mapData = this.generateMap();
    for (let y = 0; y < this.MAP_H; y++) {
      for (let x = 0; x < this.MAP_W; x++) {
        const v = this.mapData[y][x];
        let tex = (x + y) % 3 === 0 ? 'tile-grass2' : 'tile-grass';
        if (v === 1) tex = 'tile-path';
        if (v === 2) tex = 'tile-water';
        if (v === 3) tex = 'tile-flowers';
        this.add.image(x * this.TILE + this.TILE / 2, y * this.TILE + this.TILE / 2, tex).setDepth(0);
      }
    }
  }

  generateMap() {
    const W = this.MAP_W, H = this.MAP_H;
    const m = Array.from({ length: H }, () => new Array(W).fill(0));

    // Border trees (top, bottom, right)
    for (let x = 0; x < W; x++) { m[0][x] = 5; m[1][x] = 5; m[H - 1][x] = 5; m[H - 2][x] = 5; }
    for (let y = 0; y < H; y++) { m[y][W - 1] = 5; m[y][W - 2] = 5; }

    // River on left side (cols 0-2)
    for (let y = 0; y < H; y++) { for (let x = 0; x < 3; x++) m[y][x] = 2; }

    // Dock area on left (cols 3-4)
    m[9][3] = 1; m[10][3] = 1; m[11][3] = 1;
    m[9][4] = 1; m[10][4] = 1; m[11][4] = 1;

    // Main path from dock to bank (row 10)
    for (let x = 3; x <= 18; x++) { m[10][x] = 1; m[11][x] = 1; }

    // Vertical path in village center (col 12-13)
    for (let y = 3; y < H - 2; y++) { m[y][12] = 1; m[y][13] = 1; }

    // Path to side buildings (row 6)
    for (let x = 8; x <= 18; x++) { m[6][x] = 1; m[7][x] = 1; }

    // Trees for decoration
    const trees = [
      [4, 6], [4, 10], [4, 16], [4, 20],
      [8, 5], [8, 20],
      [13, 5], [13, 20],
      [15, 8], [15, 18],
      [16, 6], [16, 16],
    ];
    trees.forEach(([ty, tx]) => {
      if (ty >= 2 && ty < H - 2 && tx >= 3 && tx < W - 2 && m[ty][tx] === 0) m[ty][tx] = 5;
    });

    // Flowers for decoration
    [[5, 8], [5, 18], [9, 7], [9, 19], [13, 8], [13, 18], [15, 12]].forEach(([fy, fx]) => {
      if (fy >= 2 && fy < H - 2 && fx >= 3 && fx < W - 2 && m[fy][fx] === 0) m[fy][fx] = 3;
    });

    return m;
  }

  buildCollisions() {
    this.collisionGroup = this.physics.add.staticGroup();
    for (let y = 0; y < this.MAP_H; y++) {
      for (let x = 0; x < this.MAP_W; x++) {
        const v = this.mapData[y][x];
        const cx = x * this.TILE + this.TILE / 2;
        const cy = y * this.TILE + this.TILE / 2;
        if (v === 5) {
          this.add.image(cx, cy, 'tile-tree-base').setDepth(1);
          this.add.image(cx, cy - this.TILE, 'tile-tree-top').setDepth(15);
          const col = this.collisionGroup.create(cx, cy, 'pixel');
          col.setDisplaySize(26, 26).setVisible(false).refreshBody();
        }
        if (v === 2) {
          const col = this.collisionGroup.create(cx, cy, 'pixel');
          col.setDisplaySize(32, 32).setVisible(false).refreshBody();
        }
      }
    }
  }

  placeBuildings() {
    // Royal Bank (center of village)
    this.bankImg = this.add.image(13 * this.TILE, 5 * this.TILE, 'building-bank').setDepth(2);
    const bc = this.collisionGroup.create(13 * this.TILE, 4.5 * this.TILE, 'pixel');
    bc.setDisplaySize(180, 80).setVisible(false).refreshBody();

    // Small house 1
    this.add.image(8 * this.TILE, 14 * this.TILE, 'building-house').setDepth(2).setScale(0.8);
    const h1 = this.collisionGroup.create(8 * this.TILE, 13.5 * this.TILE, 'pixel');
    h1.setDisplaySize(90, 50).setVisible(false).refreshBody();

    // Small house 2
    this.add.image(18 * this.TILE, 14 * this.TILE, 'building-house').setDepth(2).setScale(0.8);
    const h2 = this.collisionGroup.create(18 * this.TILE, 13.5 * this.TILE, 'pixel');
    h2.setDisplaySize(90, 50).setVisible(false).refreshBody();

    // Dock on left side
    this.dockImg = this.add.image(3.5 * this.TILE, 10 * this.TILE, 'building-dock').setDepth(2);

    // Village name sign
    this.add.text(13 * this.TILE, 2.5 * this.TILE, 'BANK VILLAGE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#00000088', padding: { x: 6, y: 2 }
    }).setOrigin(0.5).setDepth(20);

    // Villagers walking around (background NPCs)
    const villagers = [
      { x: 10, y: 10, key: 'npc-guide' },
      { x: 16, y: 11, key: 'npc-mother' },
      { x: 8, y: 8, key: 'npc-aunty' },
    ];
    villagers.forEach(v => {
      const vx = v.x * this.TILE, vy = v.y * this.TILE;
      const spr = this.add.sprite(vx, vy, v.key, 0).setDepth(4);
      if (!this.anims.exists(v.key + '-walk-bv')) {
        this.anims.create({ key: v.key + '-walk-bv', frames: this.anims.generateFrameNumbers(v.key, { start: 0, end: 3 }), frameRate: 3, repeat: -1 });
      }
      spr.anims.play(v.key + '-walk-bv');
      // Gentle wander
      const wander = () => {
        const nx = Phaser.Math.Clamp(vx + Phaser.Math.Between(-48, 48), 4 * this.TILE, 20 * this.TILE);
        const ny = Phaser.Math.Clamp(vy + Phaser.Math.Between(-48, 48), 4 * this.TILE, 16 * this.TILE);
        spr.setFlipX(nx < spr.x);
        this.tweens.add({ targets: spr, x: nx, y: ny, duration: Phaser.Math.Between(2000, 4000), ease: 'Sine.easeInOut', onComplete: () => this.time.delayedCall(Phaser.Math.Between(1000, 3000), wander) });
      };
      this.time.delayedCall(Phaser.Math.Between(500, 2000), wander);
    });
  }

  setupInteractables() {
    this.interactables = [];

    // Bank entrance zone (in front of bank door)
    this.bankZone = this.add.zone(13 * this.TILE, 7.5 * this.TILE, 60, 30);
    this.physics.add.existing(this.bankZone, true);
    this.interactables.push({ sprite: this.bankZone, range: 60, id: 'bank', action: () => this.onBank() });

    // Dock zone (return to Town)
    this.dockReturnZone = this.add.zone(3.5 * this.TILE, 10 * this.TILE, 60, 40);
    this.physics.add.existing(this.dockReturnZone, true);
    this.interactables.push({ sprite: this.dockReturnZone, range: 55, id: 'dock-return', action: () => this.onDockReturn() });
  }

  // ==================== UI ====================

  createObjectiveUI() {
    this.objContainer = this.add.container(10, 60).setScrollFactor(0).setDepth(100);
    const bg = this.add.graphics(); bg.fillStyle(0x000000, 0.5); bg.fillRoundedRect(0, 0, 320, 34, 8);
    this.objContainer.add(bg);
    const icon = this.add.text(10, 7, '\uD83D\uDCCD', { fontSize: '14px' }); this.objContainer.add(icon);
    this.objText = this.add.text(34, 9, '', { fontSize: '12px', fontFamily: 'monospace', color: '#ffd700' });
    this.objContainer.add(this.objText);
  }

  updateObjective(text) {
    window.gameState.set('currentObjective', text);
    if (this.objText) this.objText.setText(text);
    if (this.objContainer) this.tweens.add({ targets: this.objContainer, alpha: 0.3, duration: 250, yoyo: true, repeat: 2 });
  }

  createMobileControls() {
    if (!this.sys.game.device.input.touch) return;
    const btns = [
      { k: 'dpad-up', x: 80, y: this.scale.height - 120, dx: 0, dy: -1 },
      { k: 'dpad-down', x: 80, y: this.scale.height - 40, dx: 0, dy: 1 },
      { k: 'dpad-left', x: 40, y: this.scale.height - 80, dx: -1, dy: 0 },
      { k: 'dpad-right', x: 120, y: this.scale.height - 80, dx: 1, dy: 0 },
      { k: 'btn-action', x: this.scale.width - 60, y: this.scale.height - 80, act: true }
    ];
    btns.forEach(b => {
      const img = this.add.image(b.x, b.y, b.k).setScrollFactor(0).setDepth(300).setAlpha(0.6).setInteractive();
      if (b.act) { img.on('pointerdown', () => this.handleAction()); }
      else {
        img.on('pointerdown', () => this.player.setMobileDirection(b.dx, b.dy));
        img.on('pointerup', () => this.player.setMobileDirection(0, 0));
        img.on('pointerout', () => this.player.setMobileDirection(0, 0));
      }
    });
  }

  // ==================== INTERACTIONS ====================

  onBank() {
    this.player.freeze();
    window.gameState.set('enteredBank', true);
    this.dialogue.show([
      { speaker: '', text: 'You enter the Royal Bank of Aurumvale...' }
    ], () => {
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('BankInterior'));
    });
  }

  onDockReturn() {
    this.player.freeze();
    this.dialogue.show([
      { speaker: '', text: 'You board the boat back to your home village...' }
    ], () => {
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('River', { direction: 'toTown' });
      });
    });
  }

  // ==================== UPDATE ====================

  update() {
    if (this.dialogue.getIsActive()) {
      this.player.freeze();
      this.interactIcon.setVisible(false);
      if (Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialogue.advance();
      return;
    }
    this.player.update();
    this.wallet.update();

    this.nearestItem = null;
    const pos = this.player.getPosition();
    let best = Infinity;
    this.interactables.forEach(item => {
      const d = Phaser.Math.Distance.Between(pos.x, pos.y, item.sprite.x, item.sprite.y);
      if (d < item.range && d < best) { best = d; this.nearestItem = item; }
    });

    if (this.nearestItem) {
      this.interactIcon.setPosition(this.nearestItem.sprite.x, this.nearestItem.sprite.y - 28 + Math.sin(this.time.now / 300) * 3);
      this.interactIcon.setVisible(true);
    } else {
      this.interactIcon.setVisible(false);
    }
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.handleAction();
  }

  handleAction() {
    if (this.dialogue.getIsActive()) { this.dialogue.advance(); return; }
    if (this.nearestItem) this.nearestItem.action();
  }
}
