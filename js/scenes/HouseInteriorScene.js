/**
 * HouseInteriorScene - Player's home interior with mother NPC.
 * Used for:
 *   - Ch3 start: Mother gives grocery list + 80 coins → go to market
 *   - Ch3 end: Return from market → mother teaches needs vs wants (drag-drop)
 *   - Ch4: Receive interest notification → go to bank
 */
class HouseInteriorScene extends Phaser.Scene {
  constructor() { super('HouseInterior'); }

  create(data) {
    if (window.AudioManager) window.AudioManager.init(this);
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(500);
    this.fromWhere = (data && data.from) || '';
    this.lastLevelComplete = !!(data && data.lastLevelComplete);

    this.drawInterior(W, H);

    // Player
    const charKey = window.gameState.get('selectedCharacter') || 'arnav';
    this.player = new PlayerController(this, W / 2, H - 80, charKey);
    this.player.sprite.setCollideWorldBounds(true);

    // Mother NPC
    this.mother = this.physics.add.sprite(W / 2, 160, 'npc-mother', 0).setDepth(10).setImmovable(true).setScale(1.3);
    this.add.text(W / 2, 128, 'Mother', {
      fontSize: '10px', fontFamily: 'monospace', color: '#c4666e', backgroundColor: '#00000088', padding: { x: 3, y: 1 }
    }).setOrigin(0.5).setDepth(11);

    if (!this.anims.exists('npc-mother-idle')) {
      this.anims.create({ key: 'npc-mother-idle', frames: this.anims.generateFrameNumbers('npc-mother', { start: 0, end: 3 }), frameRate: 3, repeat: -1 });
    }
    this.mother.anims.play('npc-mother-idle');

    // Furniture colliders
    this.physics.add.collider(this.player.sprite, this.furnitureGroup);
    this.physics.add.collider(this.player.sprite, this.mother);

    // Dialogue & UI
    this.dialogue = new DialogueManager(this);
    this.dialogue.create();
    this.wallet = new WalletSystem(this);
    this.wallet.create();
    this.wallet.show();
    this.interactIcon = this.add.image(0, 0, 'ui-interact').setDepth(50).setVisible(false);

    // Exit zone
    this.add.text(W / 2, H - 12, '\u25BC Exit Home', {
      fontSize: '11px', fontFamily: 'monospace', color: '#888'
    }).setOrigin(0.5).setDepth(1);
    this.exitZone = this.add.zone(W / 2, H - 6, 80, 20);
    this.physics.add.existing(this.exitZone, true);

    // Controls
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.createMobileControls();
    if (typeof LevelInfoUI !== 'undefined') LevelInfoUI.create(this);

    // Last level: after buying all groceries, mom congratulates then game ends
    if (this.lastLevelComplete) {
      this.time.delayedCall(1000, () => this.showLastLevelMomCongratulations());
    }
  }

  /** Last level: mom congratulates player on completing all banking lessons, then go to Game End. */
  showLastLevelMomCongratulations() {
    const gs = window.gameState;
    const charName = gs.get('selectedCharacter') === 'ananya' ? 'Ananya' : 'Arnav';
    this.dialogue.show([
      { speaker: 'Mother', text: 'You\'re back with all the groceries! Well done, ' + charName + '!' },
      { speaker: 'Mother', text: 'You used the ATM to withdraw cash, went to the market, and bought everything we needed. I\'m so proud of you!' },
      { speaker: 'Mother', text: 'You have completed all the banking lessons. You know how to save, deposit, spend wisely, earn interest, and use the ATM. Congratulations!' }
    ], () => {
      gs.set('gameEnded', true);
      this.cameras.main.fadeOut(600);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameEnd', {
          fromLastLevel: true,
          totalWithdrawn: gs.get('lastLevelTotalWithdrawn') || 0,
          totalSpent: gs.get('lastLevelTotalSpent') || 0,
          remainingCash: gs.get('coins') || 0
        });
      });
    });
  }

  drawInterior(W, H) {
    const floor = this.add.graphics().setDepth(0);
    floor.fillStyle(0x9B8365); floor.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 32) for (let x = 0; x < W; x += 32) {
      if ((x + y) % 64 === 0) { floor.fillStyle(0xAB9375); floor.fillRect(x, y, 32, 32); floor.fillStyle(0x9B8365); }
    }
    const walls = this.add.graphics().setDepth(0);
    walls.fillStyle(0xDEB887); walls.fillRect(0, 0, W, 90);
    walls.fillStyle(0xa0522d); walls.fillRect(0, 86, W, 6);
    walls.fillStyle(0x87CEEB);
    walls.fillRect(60, 18, 50, 45); walls.fillRect(W - 110, 18, 50, 45);
    walls.lineStyle(2, 0xa0522d);
    walls.strokeRect(60, 18, 50, 45); walls.strokeRect(W - 110, 18, 50, 45);
    this.add.text(W / 2, 20, 'HOME', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#5c3a1e', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);

    this.furnitureGroup = this.physics.add.staticGroup();
    const table = this.add.graphics().setDepth(1);
    table.fillStyle(0x6b4226); table.fillRoundedRect(W / 2 - 60, 210, 120, 45, 4);
    table.fillStyle(0x5c3a1e); table.fillRoundedRect(W / 2 - 56, 214, 112, 37, 2);
    const tc = this.furnitureGroup.create(W / 2, 232, 'pixel');
    tc.setDisplaySize(120, 45).setVisible(false).refreshBody();

    const bed = this.add.graphics().setDepth(1);
    bed.fillStyle(0x4a6a8a); bed.fillRect(30, 300, 80, 50);
    bed.fillStyle(0x5a7a9a); bed.fillRect(34, 304, 72, 42);
    bed.fillStyle(0xffffff); bed.fillRect(34, 304, 72, 14);
    const bc = this.furnitureGroup.create(70, 325, 'pixel');
    bc.setDisplaySize(80, 50).setVisible(false).refreshBody();

    const chest = this.add.graphics().setDepth(1);
    chest.fillStyle(0x8B6914); chest.fillRect(W - 110, 310, 60, 35);
    chest.fillStyle(0xa07828); chest.fillRect(W - 106, 306, 52, 8);
    chest.fillStyle(0xd4a440); chest.fillRect(W - 85, 322, 10, 8);
    const cc = this.furnitureGroup.create(W - 80, 325, 'pixel');
    cc.setDisplaySize(60, 35).setVisible(false).refreshBody();
  }

  triggerContextDialogue() {
    const gs = window.gameState;
    const charName = gs.get('selectedCharacter') === 'ananya' ? 'Ananya' : 'Arnav';

    // After market complete: mother teaches needs vs wants
    if (this.fromWhere === 'market' && gs.get('completedMarket') && !gs.get('learnedNeedsWants')) {
      this.dialogue.show([
        { speaker: 'Mother', text: 'You\'re back with all the groceries! Let me see what you bought.' },
        { speaker: 'Mother', text: 'Hmm... some of these things are NEEDS and some are WANTS.' },
        { speaker: 'Mother', text: 'Let me teach you the difference!' },
        { speaker: 'Mother', text: 'NEEDS are essentials - food, medicine, clothes, education.' },
        { speaker: 'Mother', text: 'WANTS are nice to have but not necessary - toys, candy, comics.' },
        { speaker: 'Mother', text: 'Let\'s sort the items you bought! Drag each item to the correct category.' }
      ], () => {
        this.showNeedsWantsDragDrop();
      });
      return;
    }

    // After ATM: mother gives grocery list again + 80 coins (market will be insufficient → go to ATM)
    if (gs.get('hasATMCard') && !gs.get('motherGaveGroceryListAfterATM')) {
      this.dialogue.show([
        { speaker: 'Mother', text: 'Welcome back! Could you go to the market again for groceries?' },
        { speaker: 'Mother', text: 'Here\'s the list. I\'ve set aside 80 gold coins for you.' },
        { speaker: 'Mother', text: 'The groceries cost about 100 gold total. If you run short, use the ATM to withdraw more!' }
      ], () => {
        gs.set('motherGaveGroceryListAfterATM', true);
        gs.set('hasGroceryList', true);
        gs.set('completedMarket', false);
        gs.set('marketBoughtItems', []);
        gs.set('ch3MarketDone', false);
        gs.addCoins(80);
        this.wallet.update();
        gs.set('currentObjective', 'Go to the market (north of town)');
        this.dialogue.show([
          { speaker: '', text: '\uD83D\uDCB0 Mother gave you 80 gold coins!' },
          { speaker: '', text: '\uD83D\uDCDD Grocery list ready. Head to the market!' }
        ]);
      });
      return;
    }

    // After ch2 (deposit): mom gives grocery list + 80 coins
    if (gs.get('chapter2Complete') && !gs.get('hasGroceryList') && !gs.get('ch3MarketDone')) {
      this.dialogue.show([
        { speaker: 'Mother', text: 'Welcome home, dear! I heard you opened a bank account. I\'m so proud!' },
        { speaker: 'Mother', text: 'Now that you know about money, could you help me?' },
        { speaker: 'Mother', text: 'Here\'s a list of groceries we need. And here are 80 gold coins to start.' },
        { speaker: 'Mother', text: 'The groceries will cost about 100 gold total, so you may need to go to the bank if you run out!' },
        { speaker: 'Mother', text: 'The market entrance is to the NORTH of the village. Be wise with your spending!' }
      ], () => {
        gs.set('hasGroceryList', true);
        gs.addCoins(80);
        this.wallet.update();
        gs.set('currentObjective', 'Go to the market (north of town)');
        this.dialogue.show([
          { speaker: '', text: '\uD83D\uDCB0 Mother gave you 80 gold coins!' },
          { speaker: '', text: '\uD83D\uDCDD You received a grocery list. Head to the market!' }
        ]);
      });
      return;
    }

    // After needs/wants done: chapter 3 complete
    if (gs.get('learnedNeedsWants') && !gs.get('chapter3Complete')) {
      gs.set('apologizedToMom', true);
      gs.completeChapter(3);
      this.dialogue.show([
        { speaker: 'Mother', text: 'I\'m glad you learned about needs and wants!' },
        { speaker: 'Mother', text: 'Always prioritize needs before wants when spending.' },
        { speaker: '', text: 'Chapter 3 Complete! You learned about needs vs wants.' }
      ]);
      return;
    }

    // Chapter 3 done, waiting for interest notification (skip if in final level — avoid bank notification / freeze)
    if (gs.get('chapter3Complete') && !gs.get('receivedInterestNotification') && !gs.get('motherGaveGroceryListAfterATM')) {
      this.time.delayedCall(1500, () => this.showNotification());
      this.dialogue.show([{ speaker: 'Mother', text: 'Good to see you home safe, dear.' }]);
      return;
    }

    this.dialogue.show([{ speaker: 'Mother', text: 'Welcome home, dear!' }]);
  }

  // ===== NEEDS VS WANTS DRAG & DROP =====
  showNeedsWantsDragDrop() {
    this.player.freeze();
    const W = this.scale.width, H = this.scale.height;
    const boughtIdxs = window.gameState.get('marketBoughtItems') || [0, 1, 2, 3, 4, 5, 6, 7];
    // Reference items from market
    const allItems = [
      { name: 'Rice & Vegetables', type: 'need', icon: '\uD83C\uDF5A' },
      { name: 'Medicine', type: 'need', icon: '\uD83D\uDC8A' },
      { name: 'Warm Clothes', type: 'need', icon: '\uD83E\uDDE5' },
      { name: 'School Books', type: 'need', icon: '\uD83D\uDCDD' },
      { name: 'Fancy Toy', type: 'want', icon: '\uD83E\uDDF8' },
      { name: 'Candy Bag', type: 'want', icon: '\uD83C\uDF6C' },
      { name: 'Comic Book', type: 'want', icon: '\uD83D\uDCDA' },
      { name: 'Sticker Set', type: 'want', icon: '\u2B50' },
    ];
    const items = boughtIdxs.map(i => allItems[i]).filter(Boolean);
    if (items.length === 0) {
      // Fallback: use all items
      items.push(...allItems);
    }

    this.ddLayer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.8); dim.fillRect(0, 0, W, H); this.ddLayer.add(dim);

    this.ddLayer.add(this.add.text(W / 2, 20, 'SORT: NEEDS vs WANTS', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5));
    this.ddLayer.add(this.add.text(W / 2, 45, 'Drag each item into the correct box!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5));

    // Two drop zones
    const needsX = 160, wantsX = W - 160, zoneY = 340, zoneW = 240, zoneH = 200;
    // Needs box
    const nb = this.add.graphics();
    nb.fillStyle(0x1a2a1a, 0.9); nb.fillRoundedRect(needsX - zoneW / 2, zoneY - zoneH / 2, zoneW, zoneH, 10);
    nb.lineStyle(2, 0x5a9c4f); nb.strokeRoundedRect(needsX - zoneW / 2, zoneY - zoneH / 2, zoneW, zoneH, 10);
    this.ddLayer.add(nb);
    this.ddLayer.add(this.add.text(needsX, zoneY - zoneH / 2 + 14, '\u2705 NEEDS', {
      fontSize: '14px', fontFamily: 'monospace', color: '#5a9c4f', fontStyle: 'bold'
    }).setOrigin(0.5));
    this.ddLayer.add(this.add.text(needsX, zoneY - zoneH / 2 + 32, '(Essential items)', {
      fontSize: '9px', fontFamily: 'monospace', color: '#3a7a3a'
    }).setOrigin(0.5));

    // Wants box
    const wb = this.add.graphics();
    wb.fillStyle(0x2a1a10, 0.9); wb.fillRoundedRect(wantsX - zoneW / 2, zoneY - zoneH / 2, zoneW, zoneH, 10);
    wb.lineStyle(2, 0xc4a44a); wb.strokeRoundedRect(wantsX - zoneW / 2, zoneY - zoneH / 2, zoneW, zoneH, 10);
    this.ddLayer.add(wb);
    this.ddLayer.add(this.add.text(wantsX, zoneY - zoneH / 2 + 14, '\u2B50 WANTS', {
      fontSize: '14px', fontFamily: 'monospace', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5));
    this.ddLayer.add(this.add.text(wantsX, zoneY - zoneH / 2 + 32, '(Nice to have)', {
      fontSize: '9px', fontFamily: 'monospace', color: '#8a6a2a'
    }).setOrigin(0.5));

    // Drop zones
    const needsZone = this.add.zone(needsX, zoneY, zoneW, zoneH).setRectangleDropZone(zoneW, zoneH);
    const wantsZone = this.add.zone(wantsX, zoneY, zoneW, zoneH).setRectangleDropZone(zoneW, zoneH);

    // Items to drag (shuffled in center); keep refs so we can destroy them when minigame completes
    const shuffled = Phaser.Utils.Array.Shuffle([...items]);
    this.ddScore = 0;
    this.ddTotal = shuffled.length;
    this.ddRemaining = shuffled.length;
    this.needsCount = 0;
    this.wantsCount = 0;
    this.ddItemCards = [];

    this.ddFeedback = this.add.text(W / 2, 470, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5).setDepth(210);

    shuffled.forEach((item, i) => {
      const ix = W / 2 + (i % 4 - 1.5) * 95;
      const iy = 100 + Math.floor(i / 4) * 55;
      const card = this.add.container(ix, iy).setSize(88, 44).setDepth(210);
      const cbg = this.add.graphics();
      cbg.fillStyle(0x2a2a3e, 0.95); cbg.fillRoundedRect(-44, -22, 88, 44, 6);
      cbg.lineStyle(1, 0x6a6a8a); cbg.strokeRoundedRect(-44, -22, 88, 44, 6);
      card.add(cbg);
      card.add(this.add.text(0, -6, item.icon, { fontSize: '14px' }).setOrigin(0.5));
      card.add(this.add.text(0, 12, item.name.substring(0, 14), { fontSize: '8px', fontFamily: 'monospace', color: '#e8e0d0' }).setOrigin(0.5));
      card.setInteractive({ draggable: true, useHandCursor: true });
      card.itemData = item;
      card.startX = ix; card.startY = iy;
      this.ddItemCards.push(card);
    });

    this.input.on('drag', (p, obj, dx, dy) => {
      if (obj.itemData) { obj.x = dx; obj.y = dy; obj.setDepth(220); }
    });
    this.input.on('drop', (p, obj, zone) => {
      if (!obj.itemData) return;
      const droppedInNeeds = zone === needsZone;
      const correct = (droppedInNeeds && obj.itemData.type === 'need') || (!droppedInNeeds && obj.itemData.type === 'want');

      obj.disableInteractive();
      this.ddRemaining--;

      if (correct) {
        this.ddScore++;
        const tgtX = droppedInNeeds ? needsX : wantsX;
        const count = droppedInNeeds ? this.needsCount++ : this.wantsCount++;
        this.ddFeedback.setText('\u2705 Correct! ' + obj.itemData.name + ' is a ' + obj.itemData.type.toUpperCase()).setColor('#5a9c4f');
        this.tweens.add({ targets: obj, x: tgtX - 50 + (count % 3) * 50, y: zoneY - 30 + Math.floor(count / 3) * 40, scale: 0.8, duration: 300 });
      } else {
        const correctZone = obj.itemData.type === 'need' ? 'NEEDS' : 'WANTS';
        this.ddFeedback.setText('\u274C Wrong! ' + obj.itemData.name + ' belongs in ' + correctZone).setColor('#ff6b6b');
        const tgtX = obj.itemData.type === 'need' ? needsX : wantsX;
        const count = obj.itemData.type === 'need' ? this.needsCount++ : this.wantsCount++;
        this.tweens.add({ targets: obj, x: tgtX - 50 + (count % 3) * 50, y: zoneY - 30 + Math.floor(count / 3) * 40, scale: 0.8, duration: 500 });
      }

      if (this.ddRemaining === 0) {
        this.time.delayedCall(1500, () => this.finishNeedsWants());
      }
    });
    this.input.on('dragend', (p, obj, dropped) => {
      if (obj.itemData && !dropped) {
        this.tweens.add({ targets: obj, x: obj.startX, y: obj.startY, duration: 300, ease: 'Back' });
      }
    });
  }

  finishNeedsWants() {
    window.gameState.set('learnedNeedsWants', true);
    window.gameState.set('completedMarket', true);
    window.gameState.set('ch3MarketDone', true);

    // Remove all needs vs wants UI and item cards so nothing stays stuck on screen
    if (this.ddItemCards && this.ddItemCards.length) {
      this.ddItemCards.forEach(card => { if (card && card.destroy) card.destroy(); });
      this.ddItemCards = [];
    }
    if (this.ddFeedback && this.ddFeedback.destroy) this.ddFeedback.destroy();
    this.ddFeedback = null;
    if (this.ddLayer) this.ddLayer.destroy();
    this.ddLayer = null;

    const W = this.scale.width, H = this.scale.height;
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.85); dim.fillRect(0, 0, W, H); layer.add(dim);
    const pw = 480, ph = 200, px = W / 2, py = H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a10, 0.98); panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    panel.lineStyle(2, 0x5a9c4f); panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    layer.add(panel);
    layer.add(this.add.text(px, py - 70, '\u2705 Needs vs Wants Lesson Complete!', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#5a9c4f', fontStyle: 'bold'
    }).setOrigin(0.5));
    layer.add(this.add.text(px, py - 30, 'Score: ' + this.ddScore + ' / ' + this.ddTotal + ' correct', {
      fontSize: '13px', fontFamily: 'monospace', color: '#d4a440'
    }).setOrigin(0.5));
    layer.add(this.add.text(px, py + 0, 'Always buy NEEDS first, then WANTS with leftover money!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5));

    const cont = this.add.text(px, py + 50, '[ Continue ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => {
      layer.destroy();
      this.triggerContextDialogue();
    });
  }

  showNotification() {
    const gs = window.gameState;
    gs.set('receivedInterestNotification', true);

    const W = this.scale.width, H = this.scale.height;
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.6); dim.fillRect(0, 0, W, H); layer.add(dim);
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a10, 0.95); panel.fillRoundedRect(W / 2 - 220, H / 2 - 80, 440, 160, 14);
    panel.lineStyle(2, 0xd4a440); panel.strokeRoundedRect(W / 2 - 220, H / 2 - 80, 440, 160, 14);
    layer.add(panel);
    layer.add(this.add.text(W / 2, H / 2 - 50, '\uD83D\uDD14 Bank Notification!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5));
    layer.add(this.add.text(W / 2, H / 2 - 15, 'Your bank balance has INCREASED!', {
      fontSize: '14px', fontFamily: 'monospace', color: '#5a9c4f'
    }).setOrigin(0.5));
    layer.add(this.add.text(W / 2, H / 2 + 10, 'Please visit the Royal Bank to learn why.', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5));

    const cont = this.add.text(W / 2, H / 2 + 50, '[ Go to Bank \u2192 ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => {
      layer.destroy();
      gs.set('currentObjective', 'Cross the river and visit the bank');
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Town', { from: 'house' });
      });
    });
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
    const pos = this.player.getPosition();
    const mDist = Phaser.Math.Distance.Between(pos.x, pos.y, this.mother.x, this.mother.y);
    if (mDist < 70) {
      this.interactIcon.setPosition(this.mother.x, this.mother.y - 35 + Math.sin(this.time.now / 300) * 3);
      this.interactIcon.setVisible(true);
    } else {
      this.interactIcon.setVisible(false);
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.handleAction();
  }

  handleAction() {
    if (this.dialogue && this.dialogue.getIsActive()) { this.dialogue.advance(); return; }
    const pos = this.player.getPosition();
    if (Phaser.Math.Distance.Between(pos.x, pos.y, this.mother.x, this.mother.y) < 70) {
      this.triggerContextDialogue();
      return;
    }
    if (Phaser.Math.Distance.Between(pos.x, pos.y, this.exitZone.x, this.exitZone.y) < 50) {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Town', { from: 'house' });
      });
    }
  }

  createMobileControls() {
    if (typeof MobileControls !== 'undefined') MobileControls.addDpadAndAction(this, this.player, () => this.handleAction());
  }
}
