/**
 * TownScene - Home village with library, cave (in forest), river dock,
 * ATM beside house, market entrance (north), and house entrance.
 * The bank is in another village, accessed by crossing the river.
 */
class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create(data) {
    if (window.AudioManager) {
      window.AudioManager.init(this);
    }
    this.TILE = 32;
    this.MAP_W = 45;
    this.MAP_H = 30;
    this.worldW = this.MAP_W * this.TILE;
    this.worldH = this.MAP_H * this.TILE;
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.fromWhere = (data && data.from) || '';

    this.buildGround();
    this.buildCollisions();
    this.placeBuildings();
    this.placeAnimals();
    this.setupInteractables();
    this.setupNPCs();

    // Player spawn
    const charKey = window.gameState.get('selectedCharacter') || 'arnav';
    let startX = 6 * this.TILE, startY = 9 * this.TILE;

    if (this.fromWhere === 'library') {
      startX = 28 * this.TILE; startY = 10 * this.TILE;
    } else if (this.fromWhere === 'house') {
      startX = 6 * this.TILE; startY = 10 * this.TILE;
    } else if (this.fromWhere === 'market') {
      startX = 20 * this.TILE; startY = 4 * this.TILE;
    } else if (this.fromWhere === 'river') {
      startX = 35 * this.TILE; startY = 14 * this.TILE;
    } else if (window.gameState.get('completedMining') && !window.gameState.get('metElderSage')) {
      startX = 15 * this.TILE; startY = 22 * this.TILE;
    } else if (window.gameState.get('crossedRiver') && window.gameState.get('accountCreated')) {
      startX = 35 * this.TILE; startY = 14 * this.TILE;
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

    this.interactIcon = this.add.image(0, 0, 'ui-interact').setDepth(50).setVisible(false);
    this.createObjectiveUI();
    this.createTreasureMapHUD();

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.createMobileControls();
    this.restoreState();
    if (typeof LevelInfoUI !== 'undefined') LevelInfoUI.create(this);

    // ATM UI state
    this.atmUIOpen = false;

    if (!window.gameState.get('visitedTown')) {
      window.gameState.set('visitedTown', true);
      this.time.delayedCall(800, () => this.introDialogue());
    }
    if (window.gameState.get('accountCreated') && !window.gameState.get('chapter1CompleteTown')) {
      window.gameState.set('chapter1CompleteTown', true);
      this.time.delayedCall(800, () => {
        this.dialogue.show([
          { speaker: '', text: 'Your bank account is set up! Chapter 1 complete!' },
          { speaker: '', text: 'Visit the bank across the river for more lessons.' }
        ]);
      });
    }
    // After mining, show Elder Sage (visible but silent - player must interact)
    if (window.gameState.get('completedMining') && !window.gameState.get('metElderSage')) {
      this.time.delayedCall(600, () => this.showGuide());
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

    // Border trees
    for (let x = 0; x < W; x++) { m[0][x] = 5; m[1][x] = 5; m[H - 1][x] = 5; m[H - 2][x] = 5; }
    for (let y = 0; y < H; y++) { m[y][0] = 5; m[y][1] = 5; }

    // Open border at north for market entrance (cols 19-21, rows 0-1)
    m[0][19] = 1; m[0][20] = 1; m[0][21] = 1;
    m[1][19] = 1; m[1][20] = 1; m[1][21] = 1;

    // River on right side (cols 39-44)
    for (let y = 0; y < H; y++) { for (let x = 39; x < W; x++) m[y][x] = 2; }

    // Main vertical path (col 19-20)
    for (let y = 2; y < H - 2; y++) { m[y][19] = 1; m[y][20] = 1; }

    // Horizontal to house (row 9-10)
    for (let x = 4; x <= 20; x++) { m[9][x] = 1; m[10][x] = 1; }

    // Horizontal to school (row 9-10)
    for (let x = 20; x <= 32; x++) { m[9][x] = 1; m[10][x] = 1; }

    // Path branches to village houses (north of main path)
    for (let y = 7; y <= 8; y++) { m[y][12] = 1; m[y][24] = 1; }
    // Path branches to village houses (south of main path)
    for (let y = 11; y <= 12; y++) { m[y][8] = 1; m[y][16] = 1; }

    // Path to cave area (row 22-23, south) - through forest
    for (let x = 12; x <= 20; x++) { m[22][x] = 1; m[23][x] = 1; }
    // Vertical path from main path down to the cave entrance (cols 14-16, rows 20-26)
    for (let y = 20; y <= 26; y++) { m[y][14] = 1; m[y][15] = 1; m[y][16] = 1; }

    // Path to dock (row 14-15, east)
    for (let x = 20; x <= 38; x++) { m[14][x] = 1; m[15][x] = 1; }

    // Dock area
    m[13][37] = 1; m[13][38] = 1; m[16][37] = 1; m[16][38] = 1;

    // ===== FOREST around cave (dense trees) =====
    // Path to cave runs on rows 22-23 cols 12-20 and cave is at col 15 row ~24-25
    // Keep a 3-col wide corridor (cols 13-17) clear on rows 20-26 for passage
    const forestTrees = [
      // Row 20: trees on both sides of the path
      [20, 4], [20, 6], [20, 8], [20, 10], [20, 11],
      [20, 21], [20, 22], [20, 24], [20, 26],
      // Row 21
      [21, 3], [21, 5], [21, 7], [21, 9], [21, 10],
      [21, 21], [21, 23], [21, 25],
      // Rows 22-23: path rows — only put trees far from the path corridor
      [22, 3], [22, 5], [22, 7], [22, 9],
      [22, 21], [22, 23], [22, 25],
      [23, 4], [23, 6], [23, 8],
      [23, 22], [23, 24], [23, 26],
      // Row 24-25: keep cols 13-17 clear for cave approach
      [24, 3], [24, 5], [24, 7], [24, 9], [24, 10],
      [24, 20], [24, 22], [24, 24], [24, 26],
      [25, 4], [25, 6], [25, 8], [25, 10],
      [25, 20], [25, 22], [25, 24],
      // Row 26-27: dense forest below cave
      [26, 3], [26, 5], [26, 7], [26, 9], [26, 11],
      [26, 19], [26, 21], [26, 23], [26, 25],
      [27, 4], [27, 6], [27, 8], [27, 10], [27, 12],
      [27, 18], [27, 20], [27, 22], [27, 24], [27, 26],
    ];
    forestTrees.forEach(([ty, tx]) => {
      if (ty >= 0 && ty < H && tx >= 2 && tx < 39 && m[ty][tx] === 0) m[ty][tx] = 5;
    });

    // Regular trees (away from forest and village houses)
    const trees = [
      [4, 5], [4, 15], [4, 25], [4, 34],
      [7, 18], [7, 28], [7, 34],
      [12, 4], [12, 10], [12, 30], [12, 36],
      [15, 5], [15, 11], [15, 28], [15, 35],
      [18, 4], [18, 10], [18, 30], [18, 36],
      [13, 34], [14, 14], [17, 7],
    ];
    trees.forEach(([ty, tx]) => {
      if (ty >= 2 && ty < H - 2 && tx >= 2 && tx < 39 && m[ty][tx] === 0) m[ty][tx] = 5;
    });

    // Flowers
    [[5, 8], [6, 32], [10, 5], [14, 7], [16, 33], [25, 16], [25, 24], [11, 26]].forEach(([fy, fx]) => {
      if (m[fy][fx] === 0) m[fy][fx] = 3;
    });

    // Pond
    for (let py = 17; py <= 19; py++) { for (let px = 5; px <= 7; px++) m[py][px] = 2; }

    return m;
  }

  buildCollisions() {
    this.collisionGroup = this.physics.add.staticGroup();
    // Track which cells are forest trees (for denser rendering)
    const isForestRow = (y) => y >= 20 && y <= 27;

    for (let y = 0; y < this.MAP_H; y++) {
      for (let x = 0; x < this.MAP_W; x++) {
        const v = this.mapData[y][x];
        const cx = x * this.TILE + this.TILE / 2;
        const cy = y * this.TILE + this.TILE / 2;

        if (v === 5) {
          if (isForestRow(y)) {
            // Forest trees: larger, with tinted variation for depth
            this.add.image(cx, cy, 'tile-tree-base').setDepth(1);
            // Bigger, overlapping canopy
            const canopy = this.add.image(cx, cy - this.TILE, 'tile-tree-top').setDepth(15);
            canopy.setScale(1.4);
            // Random green tint variation for natural look
            const tints = [0xffffff, 0xd0f0d0, 0xb0e0b0, 0xc0e8c0];
            canopy.setTint(tints[Phaser.Math.Between(0, tints.length - 1)]);
            // Subtle sway
            this.tweens.add({
              targets: canopy,
              x: cx + Phaser.Math.Between(-2, 2),
              angle: Phaser.Math.Between(-3, 3),
              duration: Phaser.Math.Between(2000, 4000),
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
          } else {
            // Regular trees
            this.add.image(cx, cy, 'tile-tree-base').setDepth(1);
            this.add.image(cx, cy - this.TILE, 'tile-tree-top').setDepth(15);
          }
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
    // Player's House
    this.add.image(6 * this.TILE, 6 * this.TILE, 'building-house').setDepth(2);
    const hc = this.collisionGroup.create(6 * this.TILE, 5.8 * this.TILE, 'pixel');
    hc.setDisplaySize(120, 70).setVisible(false).refreshBody();

    // Village house 1 (between player house and school)
    this.add.image(12 * this.TILE, 6.5 * this.TILE, 'building-house').setDepth(2).setScale(0.9);
    const vh1 = this.collisionGroup.create(12 * this.TILE, 6 * this.TILE, 'pixel');
    vh1.setDisplaySize(100, 55).setVisible(false).refreshBody();

    // Village house 2 (near school)
    this.add.image(24 * this.TILE, 6.5 * this.TILE, 'building-house').setDepth(2).setScale(0.85);
    const vh2 = this.collisionGroup.create(24 * this.TILE, 6 * this.TILE, 'pixel');
    vh2.setDisplaySize(95, 50).setVisible(false).refreshBody();

    // Village house 3 (south of main path, west)
    this.add.image(8 * this.TILE, 11.5 * this.TILE, 'building-house').setDepth(2).setScale(0.8);
    const vh3 = this.collisionGroup.create(8 * this.TILE, 11 * this.TILE, 'pixel');
    vh3.setDisplaySize(90, 50).setVisible(false).refreshBody();

    // Village house 4 (south of main path, center)
    this.add.image(16 * this.TILE, 11.5 * this.TILE, 'building-house').setDepth(2).setScale(0.85);
    const vh4 = this.collisionGroup.create(16 * this.TILE, 11 * this.TILE, 'pixel');
    vh4.setDisplaySize(95, 50).setVisible(false).refreshBody();

    // ATM beside house
    this.atmImg = this.add.image(10 * this.TILE, 7.5 * this.TILE, 'building-atm').setDepth(2);
    const ac = this.collisionGroup.create(10 * this.TILE, 7.5 * this.TILE, 'pixel');
    ac.setDisplaySize(40, 50).setVisible(false).refreshBody();

    // School / Library (enterable)
    this.schoolImg = this.add.image(28 * this.TILE, 6 * this.TILE, 'building-school').setDepth(2);
    const sc = this.collisionGroup.create(28 * this.TILE, 5.8 * this.TILE, 'pixel');
    sc.setDisplaySize(150, 68).setVisible(false).refreshBody();

    // Cave entrance (in forest) — no body-wide collider so player can approach the entrance
    this.caveImg = this.add.image(15 * this.TILE, 24.5 * this.TILE, 'building-cave').setDepth(2);
    // Only block the rock face (top part), leave the cave mouth open
    const ccLeft = this.collisionGroup.create(15 * this.TILE - 50, 24 * this.TILE, 'pixel');
    ccLeft.setDisplaySize(30, 60).setVisible(false).refreshBody();
    const ccRight = this.collisionGroup.create(15 * this.TILE + 50, 24 * this.TILE, 'pixel');
    ccRight.setDisplaySize(30, 60).setVisible(false).refreshBody();
    const ccTop = this.collisionGroup.create(15 * this.TILE, 23.5 * this.TILE, 'pixel');
    ccTop.setDisplaySize(70, 30).setVisible(false).refreshBody();

    // Dock
    this.dockImg = this.add.image(37.5 * this.TILE, 14.5 * this.TILE, 'building-dock').setDepth(2);

    // Market entrance sign (north)
    this.add.text(20 * this.TILE, 2.5 * this.TILE, '\u25B2 MARKET', {
      fontSize: '10px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(3);
  }

  placeAnimals() {
    // Scatter animals near the forest/cave area
    const animalData = [
      { key: 'animal-rabbit', x: 8, y: 22, move: 'hop' },
      { key: 'animal-rabbit', x: 18, y: 25, move: 'hop' },
      { key: 'animal-bird', x: 12, y: 21, move: 'fly' },
      { key: 'animal-bird', x: 20, y: 26, move: 'fly' },
      { key: 'animal-squirrel', x: 6, y: 24, move: 'scurry' },
      { key: 'animal-squirrel', x: 16, y: 27, move: 'scurry' },
      { key: 'animal-bird', x: 30, y: 8, move: 'fly' },
      { key: 'animal-rabbit', x: 8, y: 16, move: 'hop' },
    ];
    animalData.forEach(a => {
      const ax = a.x * this.TILE + this.TILE / 2;
      const ay = a.y * this.TILE + this.TILE / 2;
      const sprite = this.add.image(ax, ay, a.key).setDepth(3).setScale(2.5);

      if (a.move === 'hop') {
        // Rabbits: hop in a random direction, pause, repeat
        const hopLoop = () => {
          const dx = Phaser.Math.Between(-40, 40);
          const dy = Phaser.Math.Between(-30, 30);
          // Flip sprite based on direction
          sprite.setFlipX(dx < 0);
          this.tweens.add({
            targets: sprite,
            x: Phaser.Math.Clamp(sprite.x + dx, ax - 60, ax + 60),
            y: Phaser.Math.Clamp(sprite.y + dy, ay - 50, ay + 50),
            duration: 400,
            ease: 'Quad.easeOut',
            onUpdate: (tween, target) => {
              // Hop arc: move up then down during the tween
              const p = tween.progress;
              target.y -= Math.sin(p * Math.PI) * 1.2;
            },
            onComplete: () => {
              this.time.delayedCall(Phaser.Math.Between(1200, 3000), hopLoop);
            }
          });
        };
        this.time.delayedCall(Phaser.Math.Between(500, 2000), hopLoop);
      } else if (a.move === 'fly') {
        // Birds: gentle circular flight pattern with flap-like scale pulse
        const radius = Phaser.Math.Between(25, 50);
        const speed = Phaser.Math.Between(2500, 4500);
        let angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.tweens.addCounter({
          from: 0, to: 360,
          duration: speed,
          repeat: -1,
          onUpdate: (tween) => {
            const a2 = Phaser.Math.DegToRad(tween.getValue());
            sprite.x = ax + Math.cos(a2) * radius;
            sprite.y = ay + Math.sin(a2) * radius * 0.5;
          }
        });
        // Wing flap effect (subtle scale pulse)
        this.tweens.add({
          targets: sprite,
          scaleX: { from: 2.5, to: 3.0 },
          scaleY: { from: 2.5, to: 2.2 },
          duration: 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (a.move === 'scurry') {
        // Squirrels: quick dashes with pauses
        const scurryLoop = () => {
          const dx = Phaser.Math.Between(-50, 50);
          const dy = Phaser.Math.Between(-20, 20);
          sprite.setFlipX(dx < 0);
          this.tweens.add({
            targets: sprite,
            x: Phaser.Math.Clamp(sprite.x + dx, ax - 70, ax + 70),
            y: Phaser.Math.Clamp(sprite.y + dy, ay - 40, ay + 40),
            duration: 250,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              this.time.delayedCall(Phaser.Math.Between(800, 2500), scurryLoop);
            }
          });
        };
        this.time.delayedCall(Phaser.Math.Between(300, 1500), scurryLoop);
      }
    });
  }

  setupInteractables() {
    this.interactables = [];

    // Library / School entrance zone
    this.libraryZone = this.add.zone(28 * this.TILE, 8.5 * this.TILE, 60, 32);
    this.physics.add.existing(this.libraryZone, true);
    this.interactables.push({ sprite: this.libraryZone, range: 55, id: 'library', action: () => this.onLibrary() });

    // House entrance zone
    this.houseZone = this.add.zone(6 * this.TILE, 8.5 * this.TILE, 50, 32);
    this.physics.add.existing(this.houseZone, true);
    this.interactables.push({ sprite: this.houseZone, range: 55, id: 'house', action: () => this.onHouse() });

    // ATM zone
    this.atmZone = this.add.zone(10 * this.TILE, 8.5 * this.TILE, 40, 32);
    this.physics.add.existing(this.atmZone, true);
    this.interactables.push({ sprite: this.atmZone, range: 50, id: 'atm', action: () => this.onATM() });

    // Cave entrance zone — at the bottom/mouth of the cave image
    this.caveZone = this.add.zone(15 * this.TILE, 25.2 * this.TILE, 70, 40);
    this.physics.add.existing(this.caveZone, true);
    this.interactables.push({ sprite: this.caveZone, range: 70, id: 'cave', action: () => this.onCave() });

    // Dock zone
    this.dockZone = this.add.zone(37 * this.TILE, 14.5 * this.TILE, 60, 40);
    this.physics.add.existing(this.dockZone, true);
    this.interactables.push({ sprite: this.dockZone, range: 60, id: 'dock', action: () => this.onDock() });

    // Market entrance zone (north)
    this.marketZone = this.add.zone(20 * this.TILE, 2 * this.TILE, 80, 40);
    this.physics.add.existing(this.marketZone, true);
    this.interactables.push({ sprite: this.marketZone, range: 60, id: 'market', action: () => this.onMarket() });
  }

  setupNPCs() {
    this.guide = this.physics.add.sprite(25 * this.TILE, 14 * this.TILE, 'npc-guide', 0);
    this.guide.setDepth(10).setImmovable(true).setVisible(false);
    this.guide.body.setSize(22, 22);
    if (!this.anims.exists('npc-guide-idle')) {
      this.anims.create({ key: 'npc-guide-idle', frames: this.anims.generateFrameNumbers('npc-guide', { start: 0, end: 3 }), frameRate: 3, repeat: -1 });
    }
    this.guideLabel = this.add.text(25 * this.TILE, 13 * this.TILE - 4, 'Elder Sage', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(11).setVisible(false);
    this.interactables.push({ sprite: this.guide, range: 55, id: 'guide', action: () => this.onGuide() });
  }

  restoreState() {
    const gs = window.gameState;
    if (gs.get('foundTreasure')) { this.wallet.show(); }
    if (gs.get('metElderSage')) {
      this.guide.setVisible(true); this.guideLabel.setVisible(true);
      this.guide.anims.play('npc-guide-idle');
    }
    if (gs.get('completedMining') && !gs.get('metElderSage')) {
      this.wallet.show(); this.wallet.animateAdd(0);
    }
    if (gs.get('foundTreasureMap') && !gs.get('foundTreasure')) {
      this.showTreasureMapIcon();
    }
    if (gs.get('coins') > 0) { this.wallet.show(); }

    // Auto-compute objective based on game state
    let obj = gs.get('currentObjective') || '';
    if (!gs.get('enteredLibrary')) obj = 'Visit the school library';
    else if (!gs.get('foundTreasureMap')) obj = 'Search the library for clues';
    else if (!gs.get('completedMining')) obj = 'Enter the cave in the forest (south)';
    else if (!gs.get('metElderSage')) obj = 'Talk to the Elder Sage (east on the path)';
    else if (!gs.get('crossedRiver')) obj = 'Go to the dock (east) and cross the river';
    else if (!gs.get('accountCreated')) obj = 'Visit the bank across the river';
    else if (!gs.get('chapter2Complete')) obj = 'Visit the bank for the deposit lesson';
    else if (!gs.get('hasGroceryList')) obj = 'Go home — your mother needs you';
    else if (gs.get('needsMoreMoney') && !gs.get('completedMarket')) obj = gs.get('hasATMCard') ? 'Use the ATM to withdraw money, then return to market' : 'Go to the bank to withdraw money, then return to market';
    else if (!gs.get('completedMarket')) obj = gs.get('motherGaveGroceryListAfterATM') ? 'Go to the market (north) and buy the groceries' : 'Go to the market (north of town)';
    else if (!gs.get('chapter3Complete')) obj = 'Return home after shopping';
    else if (!gs.get('receivedInterestNotification')) obj = 'Rest at home';
    else if (!gs.get('chapter4Complete')) obj = 'Cross the river and visit the bank';
    else if (!gs.get('chapter5Complete')) obj = 'Visit the bank for the ATM lesson';
    else if (gs.get('hasATMCard')) obj = 'Use the ATM near your house';
    this.updateObjective(obj);
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

  createTreasureMapHUD() {
    this.mapHudContainer = this.add.container(this.scale.width - 75, 10).setScrollFactor(0).setDepth(100);
    this.mapHudContainer.setVisible(false);
    const bg = this.add.graphics(); bg.fillStyle(0x000000, 0.5); bg.fillRoundedRect(-14, -4, 32, 32, 6);
    this.mapHudContainer.add(bg);
    const mapIcon = this.add.image(2, 12, 'hud-treasure-map');
    this.mapHudContainer.add(mapIcon);
    this.tweens.add({ targets: this.mapHudContainer, alpha: { from: 0.7, to: 1 }, duration: 800, yoyo: true, repeat: -1 });
  }

  showTreasureMapIcon() { if (this.mapHudContainer) this.mapHudContainer.setVisible(true); }
  hideTreasureMapIcon() { if (this.mapHudContainer) this.mapHudContainer.setVisible(false); }

  createMobileControls() {
    if (typeof MobileControls !== 'undefined') MobileControls.addDpadAndAction(this, this.player, () => this.handleAction());
  }

  // ==================== INTERACTIONS ====================

  onLibrary() {
    this.player.freeze();
    this.dialogue.show([
      { speaker: '', text: 'You enter the library...' }
    ], () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Library');
      });
    });
  }

  onHouse() {
    this.player.freeze();
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('HouseInterior', { from: 'town' });
    });
  }

  onATM() {
    const gs = window.gameState;
    if (!gs.get('hasATMCard')) {
      this.dialogue.show([
        { speaker: '', text: 'An ATM machine. But you don\'t have an ATM card yet.' },
        { speaker: '', text: 'Maybe the bank can help you get one!' }
      ]);
    } else {
      // Open ATM UI directly; individual actions will ask for PIN.
      if (this.atmUIOpen) return;
      this.showATMUI();
    }
  }

  showATMUI() {
    if (this.atmUIOpen) return;
    this.atmUIOpen = true;
    this._atmPinVerifiedSession = false;
    this.player.freeze();

    const W = this.scale.width, H = this.scale.height;
    this._atmObjects = [];

    const _add = (obj) => { obj.setScrollFactor(0).setDepth(250); this._atmObjects.push(obj); return obj; };

    // Dim background
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.7); dim.fillRect(0, 0, W, H); _add(dim);

    // ATM machine frame
    const atm = this.add.graphics();
    atm.fillStyle(0x3a3a3a); atm.fillRoundedRect(W / 2 - 180, 30, 360, 520, 12);
    atm.fillStyle(0x4a4a4a); atm.fillRoundedRect(W / 2 - 170, 40, 340, 500, 10);
    atm.fillStyle(0x0a1a2a); atm.fillRoundedRect(W / 2 - 140, 60, 280, 160, 8);
    atm.lineStyle(2, 0x3a8ac4); atm.strokeRoundedRect(W / 2 - 140, 60, 280, 160, 8);
    _add(atm);

    _add(this.add.text(W / 2, 80, '\uD83C\uDFE7 AURUMVALE ATM', {
      fontSize: '12px', fontFamily: 'monospace', color: '#5a9c4f'
    }).setOrigin(0.5));

    this.atmBalance = window.gameState.get('bankBalance') || 0;
    this.atmScreenText = this.add.text(W / 2, 140, 'Welcome!\nSelect an option:', {
      fontSize: '13px', fontFamily: 'monospace', color: '#5a9c4f', align: 'center'
    }).setOrigin(0.5);
    _add(this.atmScreenText);

    const options = [
      { label: '\uD83D\uDCCA Check Balance', action: () => this.atmCheckBalance() },
      { label: '\uD83D\uDCB0 Withdraw', action: () => this.atmWithdraw() },
      { label: '\uD83D\uDCE5 Deposit', action: () => this.atmDeposit() },
      { label: '\uD83D\uDEAA Exit ATM', action: () => this.closeATMUI() },
    ];

    options.forEach((opt, i) => {
      const by = 250 + i * 50;
      const bg = this.add.graphics();
      bg.fillStyle(0x2a2a2a); bg.fillRoundedRect(W / 2 - 100, by, 200, 38, 6);
      bg.lineStyle(1, 0x5a5a5a); bg.strokeRoundedRect(W / 2 - 100, by, 200, 38, 6);
      _add(bg);
      _add(this.add.text(W / 2, by + 19, opt.label, {
        fontSize: '11px', fontFamily: 'monospace', color: '#c4a44a'
      }).setOrigin(0.5));
      const z = this.add.zone(W / 2, by + 19, 200, 38).setInteractive({ useHandCursor: true });
      z.on('pointerdown', opt.action);
      _add(z);
    });
  }

  atmCheckBalance() {
    // Ask for PIN before showing sensitive balance information
    if (this._atmPinActive) return;
    this.promptATMPIN(() => {
      this.atmScreenText.setText(
        'Account Balance:\n\n' + this.atmBalance + ' GOLD\n\nAccount: ' +
        (window.gameState.get('accountNumber') || 'AURM-12345')
      );
    });
  }

  atmWithdraw() {
    // Require PIN before allowing withdrawal
    if (this._atmPinActive) return;
    this.promptATMPIN(() => {
      this.showATMAmountInput('withdraw');
    });
  }

  atmDeposit() {
    // Require PIN before allowing deposit
    if (this._atmPinActive) return;
    this.promptATMPIN(() => {
      this.showATMAmountInput('deposit');
    });
  }

  /**
   * Prompt the player to enter their 4-digit ATM PIN.
   * Calls onSuccess() only when the correct PIN is entered.
   */
  promptATMPIN(onSuccess) {
    if (this._atmPinActive) return;
    this._atmPinActive = true;

    const W = this.scale.width, H = this.scale.height;
    if (!this._atmPinObjects) this._atmPinObjects = [];
    const _add = (obj) => { obj.setScrollFactor(0).setDepth(260); this._atmPinObjects.push(obj); return obj; };

    this._atmPinInput = '';

    const panelW = 260, panelH = 200;
    const px = W / 2, py = H / 2;

    // Dim layer behind PIN prompt
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.7);
    dim.fillRect(0, 0, W, H);
    _add(dim);
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.96);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 10);
    panel.lineStyle(2, 0x3a8ac4);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 10);
    _add(panel);

    const title = this.add.text(px, py - panelH / 2 + 20, 'Enter your 4-digit PIN', {
      fontSize: '11px', fontFamily: 'monospace', color: '#c4e0ff'
    }).setOrigin(0.5);
    _add(title);

    this._atmPinDisplay = this.add.text(px, py - 20, '_ _ _ _', {
      fontSize: '22px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5);
    _add(this._atmPinDisplay);

    this._atmPinFeedback = this.add.text(px, py + panelH / 2 - 24, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ff6b6b'
    }).setOrigin(0.5);
    _add(this._atmPinFeedback);

    const digits = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [null, 0, 'C']];
    const bW = 38, bH = 28, gap = 3;
    const sx = px - 1.5 * bW - gap, sy = py - 5;
    digits.forEach((row, r) => {
      row.forEach((d, c) => {
        if (d === null) return;
        const bx = sx + c * (bW + gap), by = sy + r * (bH + gap);
        const bg = this.add.graphics();
        bg.fillStyle(d === 'C' ? 0x3a1a1a : 0x2a1a10);
        bg.fillRoundedRect(bx, by, bW, bH, 4);
        bg.lineStyle(1, 0x8a7a5a);
        bg.strokeRoundedRect(bx, by, bW, bH, 4);
        _add(bg);
        const label = this.add.text(bx + bW / 2, by + bH / 2, String(d), {
          fontSize: '12px', fontFamily: 'monospace', color: d === 'C' ? '#ff6b6b' : '#c4a44a', fontStyle: 'bold'
        }).setOrigin(0.5);
        _add(label);
        const z = this.add.zone(bx + bW / 2, by + bH / 2, bW, bH).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => {
          if (!this._atmPinActive) return;
          if (d === 'C') {
            this._atmPinInput = '';
            this.updateATMPinDisplay();
            if (this._atmPinFeedback) this._atmPinFeedback.setText('');
            return;
          }
          if (this._atmPinInput.length >= 4) return;
          this._atmPinInput += String(d);
          this.updateATMPinDisplay();
          if (this._atmPinInput.length === 4) this.checkATMPin(onSuccess);
        });
        _add(z);
      });
    });
  }

  updateATMPinDisplay() {
    if (!this._atmPinDisplay) return;
    let text = '';
    for (let i = 0; i < 4; i++) {
      text += i < this._atmPinInput.length ? '\u2022' : '_';
      if (i < 3) text += ' ';
    }
    this._atmPinDisplay.setText(text);
  }

  checkATMPin(onSuccess) {
    const storedPin = window.gameState.get('pin');
    if (!storedPin) {
      if (this._atmPinFeedback) this._atmPinFeedback.setText('No PIN set. Visit the bank first.');
      return;
    }
    if (this._atmPinInput === String(storedPin)) {
      if (this._atmPinFeedback) {
        this._atmPinFeedback.setText('\u2705 PIN correct!').setColor('#5a9c4f');
      }
      // Mark PIN as verified for this ATM session (no need to re-enter each time)
      this._atmPinActive = false;
      this.time.delayedCall(400, () => {
        this._atmPinInput = '';
        // Destroy PIN UI elements
        if (this._atmPinObjects) {
          this._atmPinObjects.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
          this._atmPinObjects = [];
        }
        if (typeof onSuccess === 'function') onSuccess();
      });
    } else {
      if (this._atmPinFeedback) this._atmPinFeedback.setText('\u274C Wrong PIN. Try again.');
      this._atmPinInput = '';
      this.updateATMPinDisplay();
    }
  }

  /**
   * Generic ATM amount entry for withdraw/deposit.
   * mode: 'withdraw' | 'deposit'
   */
  showATMAmountInput(mode) {
    if (!this.atmUIOpen) return;

    const gs = window.gameState;
    this._atmAmountMode = mode;
    this._atmAmountInput = '';

    const maxWithdraw = Math.min(this.atmBalance, gs.get('withdrawalLimit') || 0);
    const walletCoins = gs.get('coins') || 0;

    if (mode === 'withdraw') {
      this.atmScreenText.setText('Enter amount to WITHDRAW\n(Max: ' + maxWithdraw + 'G)\n\n0 G');
    } else {
      this.atmScreenText.setText('Enter amount to DEPOSIT\n(Wallet: ' + walletCoins + 'G)\n\n0 G');
    }

    if (this._atmAmountFeedback) { this._atmAmountFeedback.destroy(); }
    const W = this.scale.width;
    const _add = (obj) => { obj.setScrollFactor(0).setDepth(255); this._atmObjects.push(obj); return obj; };

    this._atmAmountFeedback = this.add.text(W / 2, 230, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff6b6b'
    }).setOrigin(0.5);
    _add(this._atmAmountFeedback);

    const digits = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [null, 0, 'C']];
    const bW = 50, bH = 38, gap = 4;
    const cx = W / 2, cy = 320;
    const sx = cx - 1.5 * bW - gap, sy = cy - 2 * bH - 1.5 * gap;

    if (this._atmAmountButtons) {
      this._atmAmountButtons.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
    }
    this._atmAmountButtons = [];

    digits.forEach((row, r) => {
      row.forEach((d, c) => {
        if (d === null) return;
        const bx = sx + c * (bW + gap), by = sy + r * (bH + gap);
        const bg = this.add.graphics();
        bg.fillStyle(d === 'C' ? 0x3a1a1a : 0x2a1a10);
        bg.fillRoundedRect(bx, by, bW, bH, 5);
        bg.lineStyle(1, 0x8a7a5a); bg.strokeRoundedRect(bx, by, bW, bH, 5);
        _add(bg); this._atmAmountButtons.push(bg);
        const label = this.add.text(bx + bW / 2, by + bH / 2, String(d), {
          fontSize: '14px', fontFamily: 'monospace', color: d === 'C' ? '#ff6b6b' : '#c4a44a', fontStyle: 'bold'
        }).setOrigin(0.5);
        _add(label); this._atmAmountButtons.push(label);
        const z = this.add.zone(bx + bW / 2, by + bH / 2, bW, bH).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => {
          if (d === 'C') {
            this._atmAmountInput = '';
          } else if (this._atmAmountInput.length < 3) {
            this._atmAmountInput += String(d);
          }
          this.updateATMAmountDisplay();
        });
        _add(z); this._atmAmountButtons.push(z);
      });
    });

    const okBg = this.add.graphics();
    okBg.fillStyle(0x3a6a3a); okBg.fillRoundedRect(W / 2 - 50, cy + 110, 100, 32, 6);
    okBg.lineStyle(1, 0x5a9c4f); okBg.strokeRoundedRect(W / 2 - 50, cy + 110, 100, 32, 6);
    _add(okBg); this._atmAmountButtons.push(okBg);
    const okText = this.add.text(W / 2, cy + 126, '[ OK ]', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    okText.on('pointerover', () => okText.setColor('#ffd700'));
    okText.on('pointerout', () => okText.setColor('#ffffff'));
    okText.on('pointerdown', () => this.confirmATMAmount());
    _add(okText); this._atmAmountButtons.push(okText);
  }

  updateATMAmountDisplay() {
    const amt = parseInt(this._atmAmountInput || '0', 10) || 0;
    const gs = window.gameState;
    if (this._atmAmountMode === 'withdraw') {
      const maxWithdraw = Math.min(this.atmBalance, gs.get('withdrawalLimit') || 0);
      this.atmScreenText.setText('Enter amount to WITHDRAW\n(Max: ' + maxWithdraw + 'G)\n\n' + amt + ' G');
    } else {
      const walletCoins = gs.get('coins') || 0;
      this.atmScreenText.setText('Enter amount to DEPOSIT\n(Wallet: ' + walletCoins + 'G)\n\n' + amt + ' G');
    }
  }

  confirmATMAmount() {
    const gs = window.gameState;
    const amt = parseInt(this._atmAmountInput || '0', 10) || 0;
    if (amt <= 0) {
      this._atmAmountFeedback.setText('Enter a positive amount.');
      return;
    }

    if (this._atmAmountMode === 'withdraw') {
      const maxWithdraw = Math.min(this.atmBalance, gs.get('withdrawalLimit') || 0);
      if (amt > maxWithdraw) {
        this._atmAmountFeedback.setText('Cannot withdraw more than ' + maxWithdraw + 'G.');
        return;
      }
      this.atmBalance -= amt;
      gs.set('bankBalance', this.atmBalance);
      gs.addCoins(amt);
      if (this.wallet) this.wallet.update();
      if (gs.get('needsMoreMoney')) {
        this._atmAmountFeedback.setText('\u2705 Withdrawn ' + amt + 'G! Now return to the market.').setColor('#5a9c4f');
      } else {
        this._atmAmountFeedback.setText('\u2705 Withdrawn ' + amt + 'G! Added to wallet.').setColor('#5a9c4f');
      }
      this.updateATMAmountDisplay();
    } else if (this._atmAmountMode === 'deposit') {
      const walletCoins = gs.get('coins') || 0;
      if (amt > walletCoins) {
        this._atmAmountFeedback.setText('Amount exceeds wallet (' + walletCoins + 'G).');
        return;
      }
      this.atmBalance += amt;
      gs.set('bankBalance', this.atmBalance);
      gs.removeCoins(amt);
      if (this.wallet) this.wallet.update();
      this._atmAmountFeedback.setText('\u2705 Deposited ' + amt + 'G!').setColor('#5a9c4f');
      this.updateATMAmountDisplay();
    }

    // Hide keypad after completion
    this.time.delayedCall(1500, () => {
      if (this._atmAmountButtons) {
        this._atmAmountButtons.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
        this._atmAmountButtons = [];
      }
      if (this._atmAmountFeedback) {
        this._atmAmountFeedback.destroy();
        this._atmAmountFeedback = null;
      }
      // Return to main menu look
      this.atmScreenText.setText('Welcome!\nSelect an option:');
    });
  }

  closeATMUI() {
    if (this._atmObjects) {
      this._atmObjects.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
      this._atmObjects = [];
    }
    this._atmPinActive = false;
    this._atmPinInput = '';
    this._atmAmountInput = '';
    this._atmPinVerifiedSession = false;
    if (this._atmPinObjects) {
      this._atmPinObjects.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
      this._atmPinObjects = [];
    }
    this.atmUIOpen = false;

    // Never end the game when closing the ATM. The game ends only after: home → mom gives list → market (insufficient) → ATM withdraw → return to market → complete shopping (then MarketScene triggers GameEnd).
  }

  // ==================== STORY ====================

  introDialogue() {
    this.dialogue.show([
      { speaker: '', text: 'A calm morning in the village of Aurumvale...' },
      { speaker: '', text: 'You decide to visit the school library. Maybe something interesting awaits!' }
    ]);
  }

  onCave() {
    const gs = window.gameState;
    if (!gs.get('foundTreasureMap')) {
      this.dialogue.show([{ speaker: '', text: 'A dark cave entrance deep in the forest. You have no reason to go in yet...' }]);
      return;
    }
    if (gs.get('completedMining')) {
      this.dialogue.show([{ speaker: '', text: 'The cave is empty now. All the treasure has been excavated.' }]);
      return;
    }
    this.player.freeze();
    this.hideTreasureMapIcon();
    this.dialogue.show([
      { speaker: '', text: 'The cave looks dark and mysterious. The treasure map shows treasure inside...' },
      { speaker: '', text: 'You enter the cave!' }
    ], () => {
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CaveMaze'));
    });
  }

  showGuide() {
    this.guide.setVisible(true); this.guideLabel.setVisible(true);
    this.guide.anims.play('npc-guide-idle');
    this.guide.setAlpha(0); this.guideLabel.setAlpha(0);
    this.tweens.add({ targets: [this.guide, this.guideLabel], alpha: 1, duration: 800 });
    this.dialogue.show([
      { speaker: '', text: 'An Elder Sage has appeared on the path to the east!' },
      { speaker: '', text: 'Go talk to him.' }
    ], () => this.updateObjective('Talk to the Elder Sage (east on the path)'));
  }

  onGuide() {
    const gs = window.gameState;
    if (!gs.get('metElderSage')) {
      gs.set('metElderSage', true);
      gs.set('talkedToGuide', true);
      this.dialogue.show([
        { speaker: 'Elder Sage', text: 'Greetings, young one! I see you found treasure in the cave!' },
        { speaker: 'Elder Sage', text: 'Carrying all that gold is dangerous. Thieves roam these lands.' },
        { speaker: 'Elder Sage', text: 'You should open a bank account across the river in the next village.' },
        { speaker: 'Elder Sage', text: 'The Royal Bank will keep your treasure safe AND help it grow!' },
        { speaker: 'Elder Sage', text: 'Head east to the dock and cross the river by boat!' }
      ], () => this.updateObjective('Go to the dock (east) and cross the river'));
      return;
    }
    if (!gs.get('accountCreated')) {
      this.dialogue.show([{ speaker: 'Elder Sage', text: 'Head east to the dock! The bank is across the river.' }]);
    } else {
      this.dialogue.show([
        { speaker: 'Elder Sage', text: 'Well done setting up your bank account!' },
        { speaker: 'Elder Sage', text: 'Visit the bank across the river anytime for more lessons.' }
      ]);
    }
  }

  onDock() {
    const gs = window.gameState;
    if (!gs.get('foundTreasure') && !gs.get('receivedInterestNotification') && !gs.get('chapter2Complete') && !gs.get('needsMoreMoney')) {
      this.dialogue.show([{ speaker: '', text: 'A wooden dock by the river. You have no reason to cross yet.' }]);
      return;
    }
    if (!gs.get('talkedToGuide') && !gs.get('accountCreated') && !gs.get('needsMoreMoney')) {
      this.dialogue.show([{ speaker: '', text: 'Maybe talk to the Elder Sage first...' }]);
      return;
    }
    this.player.freeze();
    this.dialogue.show([
      { speaker: '', text: 'You board the boat to cross the river...' }
    ], () => {
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('River', { direction: 'toBankVillage' });
      });
    });
  }

  onMarket() {
    const gs = window.gameState;
    if (!gs.get('hasGroceryList')) {
      this.dialogue.show([{ speaker: '', text: 'The market is to the north. You have no shopping to do right now.' }]);
      return;
    }
    if (gs.get('ch3MarketDone')) {
      this.dialogue.show([{ speaker: '', text: 'The market is quiet. You\'ve already done your shopping.' }]);
      return;
    }
    this.player.freeze();
    const fromBank = gs.get('needsMoreMoney') ? 'bank' : '';
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Market', { from: fromBank });
    });
  }

  // ==================== UPDATE ====================

  update() {
    if (this.atmUIOpen) return;

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
      if (!item.sprite.visible && item.id !== 'cave' && item.id !== 'dock' && item.id !== 'library' && item.id !== 'house' && item.id !== 'atm' && item.id !== 'market') return;
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
    if (this.atmUIOpen) return;
    if (this.dialogue.getIsActive()) { this.dialogue.advance(); return; }
    if (this.nearestItem) this.nearestItem.action();
  }
}
