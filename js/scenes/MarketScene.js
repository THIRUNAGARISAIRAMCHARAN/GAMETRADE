/**
 * MarketScene - Walkable market with shop stalls.
 * Flow: Mom gives 50 coins. Groceries cost ~100 total.
 * Player buys until money runs out → "Insufficient funds, go to bank."
 * Player goes to bank, withdraws, returns to continue shopping.
 * Purchased items appear in a column on the right side.
 * After buying all items, return home → mother teaches needs vs wants.
 */
class MarketScene extends Phaser.Scene {
  constructor() { super('Market'); }

  create(data) {
    if (window.AudioManager) window.AudioManager.init(this);
    this.TILE = 32;
    this.MAP_W = 25;
    this.MAP_H = 20;
    this.worldW = this.MAP_W * this.TILE;
    this.worldH = this.MAP_H * this.TILE;
    this.physics.world.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.fadeIn(500);
    this.fromWhere = (data && data.from) || '';

    // Define items BEFORE building map & stalls
    this.stallItems = [
      { name: 'Rice & Vegetables', cost: 25, type: 'need', icon: '\uD83C\uDF5A', x: 4, y: 4 },
      { name: 'Medicine', cost: 20, type: 'need', icon: '\uD83D\uDC8A', x: 10, y: 4 },
      { name: 'Warm Clothes', cost: 25, type: 'need', icon: '\uD83E\uDDE5', x: 16, y: 4 },
      { name: 'School Books', cost: 30, type: 'need', icon: '\uD83D\uDCDD', x: 21, y: 4 },
      { name: 'Fancy Toy', cost: 15, type: 'want', icon: '\uD83E\uDDF8', x: 4, y: 10 },
      { name: 'Candy Bag', cost: 10, type: 'want', icon: '\uD83C\uDF6C', x: 10, y: 10 },
      { name: 'Comic Book', cost: 12, type: 'want', icon: '\uD83D\uDCDA', x: 16, y: 10 },
      { name: 'Sticker Set', cost: 8, type: 'want', icon: '\u2B50', x: 21, y: 10 },
    ];

    // Restore purchased items from previous visit
    this.boughtItems = window.gameState.get('marketBoughtItems') || [];

    this.buildGround();
    this.buildCollisions();
    this.placeStalls();
    this.placeMarketPeople();

    // Player
    const charKey = window.gameState.get('selectedCharacter') || 'arnav';
    this.player = new PlayerController(this, 12 * this.TILE, 18 * this.TILE, charKey);
    this.physics.add.collider(this.player.sprite, this.collisionGroup);

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);

    // Systems
    this.dialogue = new DialogueManager(this);
    this.dialogue.create();
    this.wallet = new WalletSystem(this);
    this.wallet.create();
    this.wallet.show();
    this.interactIcon = this.add.image(0, 0, 'ui-interact').setDepth(50).setVisible(false);

    // Controls
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.createMobileControls();

    this.setupStallInteractions();

    // Exit zone (south)
    this.exitZone = this.add.zone(12 * this.TILE, 19 * this.TILE, 64, 32);
    this.physics.add.existing(this.exitZone, true);
    this.add.text(12 * this.TILE, 19.5 * this.TILE, '\u25BC Exit Market', {
      fontSize: '9px', fontFamily: 'monospace', color: '#888'
    }).setOrigin(0.5).setDepth(1);

    // Purchased items column (right side, scrollFactor 0 so it stays on screen)
    this.purchaseColumn = this.add.container(this.scale.width - 55, 60).setScrollFactor(0).setDepth(100);
    this.drawPurchaseColumn();

    // Objective
    this.objContainer = this.add.container(10, 10).setScrollFactor(0).setDepth(100);
    const obg = this.add.graphics(); obg.fillStyle(0x000000, 0.5); obg.fillRoundedRect(0, 0, 320, 34, 8);
    this.objContainer.add(obg);
    this.objText = this.add.text(10, 9, 'Buy groceries! Wallet: ' + (window.gameState.get('coins') || 0) + 'G', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffd700'
    });
    this.objContainer.add(this.objText);
    if (typeof LevelInfoUI !== 'undefined') LevelInfoUI.create(this);

    // Intro
    if (this.boughtItems.length === 0) {
      this.time.delayedCall(400, () => {
        this.dialogue.show([
          { speaker: '', text: 'Welcome to the Aurumvale Market!' },
          { speaker: '', text: 'Walk to the stalls and press E to buy groceries for your mom.' }
        ]);
      });
    } else if (this.fromWhere === 'bank') {
      this.time.delayedCall(400, () => {
        this.dialogue.show([
          { speaker: '', text: 'You\'re back with more money! Continue buying your groceries.' }
        ]);
      });
    }
  }

  buildGround() {
    this.mapData = [];
    for (let y = 0; y < this.MAP_H; y++) {
      this.mapData[y] = [];
      for (let x = 0; x < this.MAP_W; x++) {
        let v = 0;
        if (x >= 11 && x <= 13) v = 1;
        if (y >= 8 && y <= 12 && x >= 2 && x <= 22) v = 1;
        if (y === 0 || y === this.MAP_H - 1 || x === 0 || x === this.MAP_W - 1) v = 5;
        if (y === this.MAP_H - 1 && x >= 11 && x <= 13) v = 1;
        this.mapData[y][x] = v;
        let tex = (x + y) % 3 === 0 ? 'tile-grass2' : 'tile-grass';
        if (v === 1) tex = 'tile-path';
        this.add.image(x * this.TILE + this.TILE / 2, y * this.TILE + this.TILE / 2, tex).setDepth(0);
      }
    }
  }

  buildCollisions() {
    this.collisionGroup = this.physics.add.staticGroup();
    for (let y = 0; y < this.MAP_H; y++) {
      for (let x = 0; x < this.MAP_W; x++) {
        if (this.mapData[y][x] === 5) {
          this.add.image(x * this.TILE + this.TILE / 2, y * this.TILE + this.TILE / 2, 'tile-tree-base').setDepth(1);
          this.add.image(x * this.TILE + this.TILE / 2, y * this.TILE - this.TILE / 2, 'tile-tree-top').setDepth(15);
          const col = this.collisionGroup.create(x * this.TILE + this.TILE / 2, y * this.TILE + this.TILE / 2, 'pixel');
          col.setDisplaySize(26, 26).setVisible(false).refreshBody();
        }
      }
    }
  }

  placeStalls() {
    this.add.text(12 * this.TILE, 1.5 * this.TILE, 'AURUMVALE MARKET', {
      fontSize: '12px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);

    this.stallItems.forEach((item, idx) => {
      const sx = item.x * this.TILE + this.TILE / 2;
      const sy = item.y * this.TILE + this.TILE / 2;
      this.add.image(sx, sy, 'building-market-stall').setDepth(2);

      const bought = this.boughtItems.includes(idx);
      this.add.text(sx, sy - 30, item.icon + ' ' + item.name, {
        fontSize: '8px', fontFamily: 'monospace', color: bought ? '#555' : '#e8e0d0',
        backgroundColor: '#00000088', padding: { x: 2, y: 1 }
      }).setOrigin(0.5).setDepth(3);
      this.add.text(sx, sy + 30, bought ? 'SOLD' : item.cost + 'G', {
        fontSize: '9px', fontFamily: 'monospace', color: bought ? '#555' : '#d4a440', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(3);

      const col = this.collisionGroup.create(sx, sy, 'pixel');
      col.setDisplaySize(50, 36).setVisible(false).refreshBody();
    });
  }

  placeMarketPeople() {
    const customerKeys = ['npc-guide', 'npc-mother', 'npc-aunty'];
    const peoplePositions = [
      { x: 6 * this.TILE + this.TILE / 2, y: 10 * this.TILE + this.TILE / 2, label: 'Shopper' },
      { x: 14 * this.TILE + this.TILE / 2, y: 9 * this.TILE + this.TILE / 2, label: 'Villager' },
      { x: 18 * this.TILE + this.TILE / 2, y: 11 * this.TILE + this.TILE / 2, label: 'Shopper' },
      { x: 8 * this.TILE + this.TILE / 2, y: 12 * this.TILE + this.TILE / 2, label: 'Villager' },
      { x: 12 * this.TILE + this.TILE / 2, y: 14 * this.TILE + this.TILE / 2, label: 'Shopper' },
    ];
    this.marketPeople = [];
    peoplePositions.forEach((pos, i) => {
      const ck = customerKeys[i % customerKeys.length];
      const npc = this.add.sprite(pos.x, pos.y, ck, 0).setDepth(4).setScale(1.1);
      const animKey = ck + '-idle-market';
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(ck, { start: 0, end: 3 }),
          frameRate: 2,
          repeat: -1
        });
      }
      npc.anims.play(animKey);
      this.add.text(pos.x, pos.y - 20, pos.label, {
        fontSize: '8px', fontFamily: 'monospace', color: '#aaa', backgroundColor: '#00000066', padding: { x: 2, y: 1 }
      }).setOrigin(0.5).setDepth(5);
      this.marketPeople.push({ sprite: npc, x: pos.x, y: pos.y });
    });
  }

  createMobileControls() {
    if (typeof MobileControls !== 'undefined') MobileControls.addDpadAndAction(this, this.player, () => this.handleAction());
  }

  setupStallInteractions() {
    this.interactables = [];
    this.stallItems.forEach((item, idx) => {
      const sx = item.x * this.TILE + this.TILE / 2;
      const sy = item.y * this.TILE + this.TILE / 2;
      this.interactables.push({
        sprite: { x: sx, y: sy + 36, visible: true },
        range: 55, id: 'stall-' + idx,
        action: () => this.onStall(idx)
      });
    });
    this.interactables.push({
      sprite: { x: 12 * this.TILE, y: 19 * this.TILE, visible: true },
      range: 50, id: 'exit',
      action: () => this.onExit()
    });
  }

  drawPurchaseColumn() {
    this.purchaseColumn.removeAll(true);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6); bg.fillRoundedRect(-45, -10, 90, 30 + this.boughtItems.length * 28, 6);
    bg.lineStyle(1, 0xd4a440); bg.strokeRoundedRect(-45, -10, 90, 30 + this.boughtItems.length * 28, 6);
    this.purchaseColumn.add(bg);
    this.purchaseColumn.add(this.add.text(0, -2, 'Bought', {
      fontSize: '9px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5));

    this.boughtItems.forEach((idx, i) => {
      const item = this.stallItems[idx];
      if (!item) return;
      this.purchaseColumn.add(this.add.text(0, 18 + i * 28, item.icon, { fontSize: '16px' }).setOrigin(0.5));
      this.purchaseColumn.add(this.add.text(0, 34 + i * 28, item.name.substring(0, 10), {
        fontSize: '7px', fontFamily: 'monospace', color: '#ccc'
      }).setOrigin(0.5));
    });
  }

  onStall(idx) {
    const item = this.stallItems[idx];
    if (this.boughtItems.includes(idx)) {
      this.dialogue.show([{ speaker: '', text: 'You already bought ' + item.name + '!' }]);
      return;
    }

    const coins = window.gameState.get('coins') || 0;
    if (coins >= item.cost) {
      // Can afford
      window.gameState.removeCoins(item.cost);
      this.boughtItems.push(idx);
      window.gameState.set('marketBoughtItems', [...this.boughtItems]);
      this.wallet.update();
      this.objText.setText('Wallet: ' + window.gameState.get('coins') + 'G | Bought: ' + this.boughtItems.length + '/' + this.stallItems.length);

      this.dialogue.show([
        { speaker: '', text: 'Bought ' + item.icon + ' ' + item.name + ' for ' + item.cost + 'G!' }
      ]);
      this.drawPurchaseColumn();

      // Check if all items bought
      if (this.boughtItems.length === this.stallItems.length) {
        this.time.delayedCall(1000, () => {
          if (window.AudioManager) window.AudioManager.playAchievement();
          window.gameState.set('completedMarket', true);
          const isLastLevel = window.gameState.get('motherGaveGroceryListAfterATM');
          this.dialogue.show(
            isLastLevel
              ? [
                { speaker: '', text: 'All groceries purchased!' },
                { speaker: '', text: 'You\'ve completed all the lessons. Congratulations!' }
              ]
              : [{ speaker: '', text: 'All groceries purchased! Time to go home.' }]
          );
        });
      }
    } else {
      // Not enough money
      this.player.freeze();
      const hasATM = window.gameState.get('hasATMCard');
      const msgs = hasATM
        ? [
          { speaker: '', text: 'Money insufficient! You need ' + item.cost + 'G but only have ' + coins + 'G.' },
          { speaker: '', text: 'Use your ATM card to withdraw more money in town!' },
          { speaker: '', text: 'Exit the market and use the ATM near your house.' }
        ]
        : [
          { speaker: '', text: 'Money insufficient! You need ' + item.cost + 'G but only have ' + coins + 'G.' },
          { speaker: '', text: 'Go to the bank to withdraw more money!' },
          { speaker: '', text: 'Exit the market and cross the river to the bank.' }
        ];
      this.dialogue.show(msgs, () => {
        window.gameState.set('needsMoreMoney', true);
      });
    }
  }

  onExit() {
    const gs = window.gameState;

    if (gs.get('completedMarket')) {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (gs.get('motherGaveGroceryListAfterATM')) {
          // Last level: send player home so mom can congratulate before game end
          this.scene.start('HouseInterior', { from: 'market', lastLevelComplete: true });
        } else {
          this.scene.start('HouseInterior', { from: 'market' });
        }
      });
    } else if (gs.get('needsMoreMoney')) {
      // Go to bank to withdraw
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Town', { from: 'market' });
      });
    } else {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Town', { from: 'market' });
      });
    }
  }

  update() {
    if (this.dialogue && this.dialogue.getIsActive()) {
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
    if (this.dialogue && this.dialogue.getIsActive()) { this.dialogue.advance(); return; }
    if (this.nearestItem) this.nearestItem.action();
  }
}
