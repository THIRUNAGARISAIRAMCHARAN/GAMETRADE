/**
 * NeedsWantsGameScene - Shopping mini-game with FAKE money.
 * Player gets 100 fake gold and a shopping list.
 * Must buy NEEDS first, then WANTS with leftover money.
 * Teaches budgeting and prioritization.
 * Does NOT affect real game money.
 */
class NeedsWantsGameScene extends Phaser.Scene {
  constructor() { super('NeedsWantsGame'); }

  create(data) {
    this.parentScene = (data && data.parentScene) || 'Market';
    this.W = this.scale.width; this.H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.cameras.main.fadeIn(500);

    // Fake money - does NOT touch real coins
    this.fakeMoney = 100;
    this.cart = [];
    this.gameComplete = false;

    // Items to buy
    this.items = [
      { name: 'Rice & Vegetables', cost: 20, type: 'need', icon: '\uD83C\uDF5A', bought: false },
      { name: 'Medicine', cost: 15, type: 'need', icon: '\uD83D\uDC8A', bought: false },
      { name: 'School Uniform', cost: 18, type: 'need', icon: '\uD83E\uDDE5', bought: false },
      { name: 'Notebooks', cost: 12, type: 'need', icon: '\uD83D\uDCDD', bought: false },
      { name: 'Drinking Water', cost: 10, type: 'need', icon: '\uD83D\uDCA7', bought: false },
      { name: 'Fancy Toy', cost: 25, type: 'want', icon: '\uD83E\uDDF8', bought: false },
      { name: 'Candy Box', cost: 15, type: 'want', icon: '\uD83C\uDF6C', bought: false },
      { name: 'Video Game', cost: 30, type: 'want', icon: '\uD83C\uDFAE', bought: false },
      { name: 'Sticker Album', cost: 10, type: 'want', icon: '\u2B50', bought: false },
      { name: 'Comic Book', cost: 12, type: 'want', icon: '\uD83D\uDCDA', bought: false },
    ];

    this.drawUI();
    this.showIntro();
  }

  drawUI() {
    const W = this.W, H = this.H;

    // Title bar
    const tg = this.add.graphics();
    tg.fillStyle(0x2a1a10, 0.9); tg.fillRoundedRect(20, 8, W - 40, 50, 10);
    tg.lineStyle(2, 0xc4a44a); tg.strokeRoundedRect(20, 8, W - 40, 50, 10);
    this.add.text(W / 2, 18, 'NEEDS vs WANTS - Practice Game', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W / 2, 40, '\u26A0 Uses FAKE money - your real coins are safe!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ff6b6b'
    }).setOrigin(0.5);

    // Money display
    this.moneyBg = this.add.graphics();
    this.moneyBg.fillStyle(0x1a3a1a, 0.9); this.moneyBg.fillRoundedRect(W / 2 - 100, 64, 200, 28, 6);
    this.moneyBg.lineStyle(1, 0x5a9c4f); this.moneyBg.strokeRoundedRect(W / 2 - 100, 64, 200, 28, 6);
    this.moneyText = this.add.text(W / 2, 78, '\uD83D\uDCB0 Fake Money: ' + this.fakeMoney + 'G', {
      fontSize: '13px', fontFamily: 'monospace', color: '#5a9c4f', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Cart display
    this.cartText = this.add.text(W - 20, 78, 'Cart: 0 items', {
      fontSize: '10px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(1, 0.5);

    // Items grid
    this.itemContainer = this.add.container(0, 0);
    this.drawItems();

    // Feedback area
    this.feedback = this.add.text(W / 2, H - 55, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#e8e0d0', align: 'center'
    }).setOrigin(0.5);

    // Checkout button
    const checkBg = this.add.graphics();
    checkBg.fillStyle(0x3a6a3a); checkBg.fillRoundedRect(W / 2 - 80, H - 40, 160, 32, 8);
    checkBg.lineStyle(1, 0x5a9c4f); checkBg.strokeRoundedRect(W / 2 - 80, H - 40, 160, 32, 8);
    this.add.text(W / 2, H - 24, 'CHECKOUT', {
      fontSize: '13px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);
    const checkZ = this.add.zone(W / 2, H - 24, 160, 32).setInteractive({ useHandCursor: true });
    checkZ.on('pointerdown', () => this.checkout());
  }

  drawItems() {
    this.itemContainer.removeAll(true);
    const W = this.W;
    const startY = 100;
    const cols = 5;
    const cardW = 140, cardH = 75, gap = 8;
    const totalRowW = cols * cardW + (cols - 1) * gap;
    const startX = (W - totalRowW) / 2;

    this.items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gap) + cardW / 2;
      const cy = startY + row * (cardH + gap + 20) + cardH / 2;

      const bg = this.add.graphics();
      const borderColor = item.type === 'need' ? 0x5a9c4f : 0xc4a44a;
      const fillColor = item.bought ? 0x1a1a1a : (item.type === 'need' ? 0x1a2a1a : 0x2a1a1a);
      bg.fillStyle(fillColor, 0.9);
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      bg.lineStyle(item.bought ? 1 : 2, item.bought ? 0x3a3a3a : borderColor);
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      this.itemContainer.add(bg);

      // Type label
      this.itemContainer.add(this.add.text(cx, cy - 28, item.type.toUpperCase(), {
        fontSize: '8px', fontFamily: 'monospace', color: item.type === 'need' ? '#5a9c4f' : '#c4a44a', fontStyle: 'bold'
      }).setOrigin(0.5));

      // Icon + name
      this.itemContainer.add(this.add.text(cx, cy - 10, item.icon + ' ' + item.name, {
        fontSize: '10px', fontFamily: 'monospace', color: item.bought ? '#555' : '#e8e0d0'
      }).setOrigin(0.5));

      // Cost
      this.itemContainer.add(this.add.text(cx, cy + 6, item.cost + 'G', {
        fontSize: '10px', fontFamily: 'monospace', color: item.bought ? '#555' : '#d4a440', fontStyle: 'bold'
      }).setOrigin(0.5));

      if (!item.bought) {
        // Buy button
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x3a6a3a); btnBg.fillRoundedRect(cx - 30, cy + 18, 60, 20, 4);
        this.itemContainer.add(btnBg);
        const btnTxt = this.add.text(cx, cy + 28, 'BUY', {
          fontSize: '9px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.itemContainer.add(btnTxt);

        const buyZ = this.add.zone(cx, cy + 28, 60, 20).setInteractive({ useHandCursor: true });
        buyZ.on('pointerdown', () => this.buyItem(i));
        this.itemContainer.add(buyZ);
      } else {
        this.itemContainer.add(this.add.text(cx, cy + 28, '\u2705 BOUGHT', {
          fontSize: '9px', fontFamily: 'monospace', color: '#5a9c4f'
        }).setOrigin(0.5));
      }
    });
  }

  showIntro() {
    const W = this.W, H = this.H;
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.7); dim.fillRect(0, 0, W, H); layer.add(dim);

    const pw = 480, ph = 260, px = W / 2, py = H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a10, 0.98); panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    panel.lineStyle(2, 0xc4a44a); panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    layer.add(panel);

    layer.add(this.add.text(px, py - 95, 'Needs vs Wants Practice Game', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5));

    const rules = [
      '\uD83D\uDCB0 You have 100 FAKE gold to spend',
      '\uD83D\uDFE2 GREEN border = NEED (essential items)',
      '\uD83D\uDFE1 YELLOW border = WANT (nice to have)',
      '\uD83C\uDFAF Goal: Buy ALL needs within budget!',
      '\u26A0 This is practice - your real money is safe!'
    ];
    rules.forEach((r, i) => {
      layer.add(this.add.text(px, py - 50 + i * 24, r, {
        fontSize: '11px', fontFamily: 'monospace', color: '#e8e0d0'
      }).setOrigin(0.5));
    });

    const cont = this.add.text(px, py + 95, '[ Start Shopping! ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => layer.destroy());
  }

  buyItem(idx) {
    if (this.gameComplete) return;
    const item = this.items[idx];
    if (item.bought) return;

    if (this.fakeMoney < item.cost) {
      this.feedback.setText('\u26A0 Not enough fake money! You have ' + this.fakeMoney + 'G');
      this.feedback.setColor('#ff6b6b');
      this.cameras.main.flash(200, 255, 50, 50, true);
      return;
    }

    item.bought = true;
    this.fakeMoney -= item.cost;
    this.cart.push(item);
    this.moneyText.setText('\uD83D\uDCB0 Fake Money: ' + this.fakeMoney + 'G');
    this.cartText.setText('Cart: ' + this.cart.length + ' items');
    this.feedback.setText('\u2705 Added ' + item.name + ' to cart!');
    this.feedback.setColor('#5a9c4f');

    // Redraw items
    this.drawItems();

    // Pulse money display
    this.tweens.add({ targets: this.moneyText, scale: 1.2, duration: 100, yoyo: true });
  }

  checkout() {
    if (this.gameComplete) return;
    this.gameComplete = true;

    const needsBought = this.items.filter(i => i.type === 'need' && i.bought);
    const needsTotal = this.items.filter(i => i.type === 'need');
    const wantsBought = this.items.filter(i => i.type === 'want' && i.bought);
    const allNeedsMet = needsBought.length === needsTotal.length;

    const W = this.W, H = this.H;
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.8); dim.fillRect(0, 0, W, H); layer.add(dim);

    const pw = 500, ph = 320, px = W / 2, py = H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a10, 0.98); panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    panel.lineStyle(2, allNeedsMet ? 0x5a9c4f : 0xc4a44a);
    panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    layer.add(panel);

    const title = allNeedsMet ? '\u2705 Great Shopping!' : '\u26A0 Budget Review';
    layer.add(this.add.text(px, py - 130, title, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: allNeedsMet ? '#5a9c4f' : '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5));

    const summary = [
      'Needs bought: ' + needsBought.length + ' / ' + needsTotal.length,
      'Wants bought: ' + wantsBought.length,
      'Money spent: ' + (100 - this.fakeMoney) + 'G',
      'Money left: ' + this.fakeMoney + 'G'
    ];
    summary.forEach((s, i) => {
      layer.add(this.add.text(px, py - 80 + i * 24, s, {
        fontSize: '12px', fontFamily: 'monospace', color: '#e8e0d0'
      }).setOrigin(0.5));
    });

    // Lesson
    const lessons = allNeedsMet
      ? ['\u2705 You prioritized NEEDS first - excellent!', '\u2705 Smart budgeting means essentials come first!']
      : ['\u26A0 You missed some NEEDS!', '\u26A0 Always buy essentials before treats.'];
    lessons.forEach((l, i) => {
      layer.add(this.add.text(px, py + 20 + i * 24, l, {
        fontSize: '11px', fontFamily: 'monospace', color: allNeedsMet ? '#5a9c4f' : '#ff6b6b'
      }).setOrigin(0.5));
    });

    layer.add(this.add.text(px, py + 80, 'Key lesson: NEEDS first, WANTS second!', {
      fontSize: '13px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5));

    const cont = this.add.text(px, py + 120, '[ Continue \u2192 ]', {
      fontSize: '15px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => {
      window.gameState.set('learnedNeedsWants', true);
      window.gameState.set('completedMarket', true);
      window.gameState.set('ch3MarketDone', true);
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Return to house to apologize to mom
        this.scene.start('HouseInterior', { from: 'market' });
      });
    });
  }
}
