/**
 * BankInteriorScene - Inside the Royal Bank of Aurumvale.
 * Uses DialogueManager for bottom dialogue boxes (not full-screen text).
 * Linear narrative progression:
 *   Ch1: Account creation (drag-drop documents + OTP)
 *   Ch2: Deposit lesson (auto-launched after ch1)
 *   Ch3: Tells player to go home (withdrawal happens via world flow)
 *   Ch4: Interest explanation + game
 *   Ch5: ATM form + card issuance
 * Exit returns to BankVillage.
 */
class BankInteriorScene extends Phaser.Scene {
  constructor() { super('BankInterior'); }

  create() {
    if (window.AudioManager) window.AudioManager.init(this);
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(600);
    this.drawInterior(width, height);

    const charKey = window.gameState.get('selectedCharacter') || 'arnav';
    this.player = new PlayerController(this, width / 2, height - 80, charKey);
    this.player.sprite.setCollideWorldBounds(true);

    this.banker = this.physics.add.sprite(width / 2, 180, 'npc-banker', 0).setDepth(10).setImmovable(true).setScale(1.5);
    this.add.text(width / 2, 148, 'Banker Vikram', {
      fontSize: '11px', fontFamily: 'monospace', color: '#d4a440', backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(11);

    const desk = this.add.graphics();
    desk.fillStyle(0x6b4226); desk.fillRect(width / 2 - 60, 212, 120, 22);
    desk.fillStyle(0x5c3a1e); desk.fillRect(width / 2 - 58, 216, 116, 16); desk.setDepth(5);
    const deskZone = this.add.zone(width / 2, 222, 130, 28);
    this.physics.add.existing(deskZone, true);
    this.physics.add.collider(this.player.sprite, deskZone);

    // Bank customers (interactable NPCs with bank-related dialogue)
    const customerKeys = ['npc-guide', 'npc-mother', 'npc-aunty'];
    const customerPositions = [
      { x: 130, y: 350, label: 'Customer', lines: ['The bank is a very safe place to keep your money!', 'I always feel secure leaving my savings here.'] },
      { x: width - 130, y: 380, label: 'Customer', lines: ['The bank gives interest on your savings—your money grows over time!', 'I opened my account years ago and my balance has grown nicely.'] },
      { x: 200, y: 450, label: 'Customer', lines: ['You can deposit and withdraw whenever you need. Very convenient!', 'The Royal Bank has been serving Aurumvale for generations.'] },
    ];
    this.bankNPCs = [];
    customerPositions.forEach((cp, i) => {
      const ck = customerKeys[i % customerKeys.length];
      const cust = this.add.sprite(cp.x, cp.y, ck, 0).setDepth(4).setScale(1.1);
      if (!this.anims.exists(ck + '-idle-bank')) {
        this.anims.create({ key: ck + '-idle-bank', frames: this.anims.generateFrameNumbers(ck, { start: 0, end: 3 }), frameRate: 2, repeat: -1 });
      }
      cust.anims.play(ck + '-idle-bank');
      this.add.text(cp.x, cp.y - 20, cp.label, {
        fontSize: '8px', fontFamily: 'monospace', color: '#aaa', backgroundColor: '#00000066', padding: { x: 2, y: 1 }
      }).setOrigin(0.5).setDepth(5);
      this.bankNPCs.push({ x: cp.x, y: cp.y, range: 70, lines: cp.lines });
    });

    // Dialogue (bottom box style)
    this.dialogue = new DialogueManager(this); this.dialogue.create();
    this.wallet = new WalletSystem(this); this.wallet.create(); this.wallet.show();
    this.interactIcon = this.add.image(0, 0, 'ui-interact').setDepth(50).setVisible(false);

    this.add.text(width / 2, height - 16, '\u25BC Exit to Village', { fontSize: '11px', fontFamily: 'monospace', color: '#888' }).setOrigin(0.5).setDepth(1);
    this.exitZone = this.add.zone(width / 2, height - 6, 80, 20);
    this.physics.add.existing(this.exitZone, true);

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.createMobileControls();
    if (typeof LevelInfoUI !== 'undefined') LevelInfoUI.create(this);

    // Dialogue with banker only when player walks to banker and presses E (see handleAction)
  }

  drawInterior(w, h) {
    const floor = this.add.graphics().setDepth(0);
    floor.fillStyle(0x8B7355); floor.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
      if ((x + y) % 64 === 0) { floor.fillStyle(0x9B8365); floor.fillRect(x, y, 32, 32); floor.fillStyle(0x8B7355); }
    }
    const walls = this.add.graphics().setDepth(0);
    walls.fillStyle(0xd4d4d4); walls.fillRect(0, 0, w, 120);
    walls.fillStyle(0xb8860b); walls.fillRect(0, 116, w, 6); walls.fillRect(0, 0, w, 4);
    walls.fillStyle(0x87CEEB); walls.fillRect(50, 18, 55, 48); walls.fillRect(w - 105, 18, 55, 48);
    walls.lineStyle(2, 0xb8860b); walls.strokeRect(50, 18, 55, 48); walls.strokeRect(w - 105, 18, 55, 48);
    this.add.text(w / 2, 36, 'ROYAL BANK OF AURUMVALE', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
  }

  determineFlow() {
    const gs = window.gameState;

    if (!gs.get('accountCreated')) {
      // Chapter 1: Account creation
      this.bankerIntro();
    } else if (!gs.get('chapter2Complete')) {
      // Chapter 2: Deposit lesson
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'Welcome back! Let me teach you about deposits today.' },
        { speaker: 'Banker Vikram', text: 'Deposits keep your money safe and accessible.' }
      ], () => {
        this.scene.pause();
        this.scene.launch('Deposit', { parentScene: 'BankInterior' });
      });
    } else if (gs.get('needsMoreMoney') && !gs.get('completedMarket')) {
      // Player needs to withdraw money for market shopping
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'You need more money for shopping? No problem!' },
        { speaker: 'Banker Vikram', text: 'Let me help you withdraw some gold.' }
      ], () => {
        this.scene.pause();
        this.scene.launch('Withdraw', { parentScene: 'BankInterior' });
      });
    } else if (!gs.get('chapter3Complete') && !gs.get('hasGroceryList')) {
      // After ch2: tell player to go home
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'Great job learning about deposits!' },
        { speaker: 'Banker Vikram', text: 'Now go home to your village. Your mother might need your help.' },
        { speaker: 'Banker Vikram', text: 'You can withdraw money here when you need it. Practice spending wisely!' }
      ], () => {
        gs.set('returnedFromBank', true);
        gs.set('currentObjective', 'Go home (exit bank, cross river)');
      });
    } else if (gs.get('receivedInterestNotification') && !gs.get('chapter4Complete')) {
      // Chapter 4: Interest lesson
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'Ah, you received our notification! Good to see you.' },
        { speaker: 'Banker Vikram', text: 'Your money has grown while sitting in the bank. This is called INTEREST.' },
        { speaker: 'Banker Vikram', text: 'Let me explain how interest works through a game!' }
      ], () => {
        this.scene.pause();
        this.scene.launch('Interest', { parentScene: 'BankInterior' });
      });
    } else if (gs.get('chapter4Complete') && !gs.get('chapter5Complete')) {
      // Chapter 5: ATM
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'You\'ve learned so much! Is there anything else?' }
      ], () => {
        this.dialogue.show([
          { speaker: window.gameState.get('selectedCharacter') === 'ananya' ? 'Ananya' : 'Arnav', text: 'Is there a way to check my balance and withdraw money anytime without visiting the bank?' },
          { speaker: 'Banker Vikram', text: 'Absolutely! That\'s what ATM cards are for!' },
          { speaker: 'Banker Vikram', text: 'Let me help you get one right now.' }
        ], () => {
          this.scene.pause();
          this.scene.launch('ATM', { parentScene: 'BankInterior' });
        });
      });
    } else if (gs.get('chapter5Complete')) {
      // All done!
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'Congratulations! You now have your ATM card.' },
        { speaker: 'Banker Vikram', text: 'Go back to your village and try using the ATM near your home!' }
      ], () => {
        gs.set('currentObjective', 'Use the ATM near your house');
      });
    } else {
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'Welcome back! Talk to me when you\'re ready.' }
      ]);
    }
  }

  bankerIntro() {
    if (this.dialogue.getIsActive()) return;
    this.dialogue.show([
      { speaker: 'Banker Vikram', text: 'Welcome to the Royal Bank of Aurumvale, young one!' },
      { speaker: 'Banker Vikram', text: 'I see you\'ve brought treasure from across the river. Smart!' },
      { speaker: 'Banker Vikram', text: 'We offer two types of accounts:' },
      { speaker: 'Banker Vikram', text: 'SAVINGS ACCOUNT \u2014 A safe place for money. It earns interest over time!' },
      { speaker: 'Banker Vikram', text: 'BUSINESS ACCOUNT \u2014 For merchants who buy and sell regularly.' },
      {
        speaker: 'Banker Vikram', text: 'Which would you like?', choices: [
          { text: 'Savings Account', value: 'savings' },
          { text: 'Business Account', value: 'business' }
        ], onChoice: (v) => this.handleAccountChoice(v)
      }
    ]);
  }

  handleAccountChoice(choice) {
    window.gameState.set('learnedAccountTypes', true);
    if (choice === 'business') {
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'Business Accounts are for grown-up merchants!' },
        { speaker: 'Banker Vikram', text: 'Since you are under 18, only a Savings Account is available.' },
        { speaker: 'Banker Vikram', text: 'Don\'t worry \u2014 it\'s perfect! Your money stays safe AND grows.' }
      ], () => this.startDocumentStep());
    } else {
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'Great choice! A Savings Account is perfect for young adventurers.' },
        { speaker: 'Banker Vikram', text: 'Your money stays safe, and it grows over time. That\'s interest!' }
      ], () => this.startDocumentStep());
    }
  }

  // ==================== DRAG & DROP DOCUMENTS ====================

  startDocumentStep() {
    this.dialogue.show([
      { speaker: 'Banker Vikram', text: 'To open your account, I need some documents.' },
      { speaker: 'Banker Vikram', text: 'Drag the CORRECT documents to the submission slots!' }
    ], () => this.showDocumentDragDrop());
  }

  showDocumentDragDrop() {
    const { width: W, height: H } = this.scale;
    this.docLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(250);
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.75); dim.fillRect(0, 0, W, H);
    this.docLayer.add(dim);
    this.docLayer.add(this.add.text(W / 2, 30, 'DRAG DOCUMENTS TO SLOTS', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5));
    this.docLayer.add(this.add.text(W / 2, 55, 'Drag the 3 correct documents to the submission area on the right', {
      fontSize: '10px', fontFamily: 'monospace', color: '#a09070'
    }).setOrigin(0.5));

    const docs = [
      { name: 'ID Proof\n(Aadhaar)', correct: true, icon: '\uD83E\uDEAA' },
      { name: 'Address\nProof', correct: true, icon: '\uD83D\uDCC4' },
      { name: 'Photo', correct: true, icon: '\uD83D\uDCF8' },
      { name: 'Favourite\nFood List', correct: false, icon: '\uD83C\uDF55' },
      { name: 'Pet\'s\nBirthday', correct: false, icon: '\uD83C\uDF82' },
      { name: 'Game\nScores', correct: false, icon: '\uD83C\uDFAE' }
    ];

    const slotX = W - 160, slotStartY = 100;
    this.slots = [];
    for (let i = 0; i < 3; i++) {
      const sy = slotStartY + i * 120;
      const sg = this.add.graphics();
      sg.lineStyle(2, 0xc4a44a, 0.6);
      const dash = 8, gap = 6;
      for (let d = slotX - 60; d < slotX + 60; d += dash + gap) {
        sg.moveTo(d, sy - 40); sg.lineTo(Math.min(d + dash, slotX + 60), sy - 40);
        sg.moveTo(d, sy + 40); sg.lineTo(Math.min(d + dash, slotX + 60), sy + 40);
      }
      for (let d = sy - 40; d < sy + 40; d += dash + gap) {
        sg.moveTo(slotX - 60, d); sg.lineTo(slotX - 60, Math.min(d + dash, sy + 40));
        sg.moveTo(slotX + 60, d); sg.lineTo(slotX + 60, Math.min(d + dash, sy + 40));
      }
      sg.strokePath();
      this.docLayer.add(sg);
      const labels = ['Document 1', 'Document 2', 'Document 3'];
      this.docLayer.add(this.add.text(slotX, sy - 50, labels[i], { fontSize: '9px', fontFamily: 'monospace', color: '#8a7a5a' }).setOrigin(0.5));
      const dropZone = this.add.zone(slotX, sy, 120, 80).setRectangleDropZone(120, 80);
      this.slots.push({ zone: dropZone, filled: false, doc: null, graphics: sg });
    }

    this.placedDocs = [];
    const shuffled = Phaser.Utils.Array.Shuffle([...docs]);
    shuffled.forEach((doc, i) => {
      const dx = 100, dy = 90 + i * 80;
      const card = this.add.container(dx, dy);
      card.setSize(110, 65);
      const bg = this.add.graphics();
      bg.fillStyle(doc.correct ? 0x2a3a2a : 0x2a2a4e, 0.9);
      bg.fillRoundedRect(-55, -32, 110, 65, 8);
      bg.lineStyle(1, 0x8a7a5a); bg.strokeRoundedRect(-55, -32, 110, 65, 8);
      card.add(bg);
      card.add(this.add.text(0, -14, doc.icon, { fontSize: '20px' }).setOrigin(0.5));
      card.add(this.add.text(0, 12, doc.name, { fontSize: '9px', fontFamily: 'monospace', color: '#e8e0d0', align: 'center' }).setOrigin(0.5));
      card.setInteractive({ draggable: true, useHandCursor: true });
      card.docData = doc; card.startX = dx; card.startY = dy;
      this.docLayer.add(card);
    });

    this.input.on('drag', (pointer, obj, dragX, dragY) => {
      if (obj.docData) { obj.x = dragX; obj.y = dragY; obj.setDepth(260); }
    });
    this.input.on('drop', (pointer, obj, zone) => {
      if (!obj.docData) return;
      const slot = this.slots.find(s => s.zone === zone && !s.filled);
      if (slot) {
        if (obj.docData.correct) {
          slot.filled = true; slot.doc = obj.docData;
          obj.x = zone.x; obj.y = zone.y;
          obj.disableInteractive();
          this.placedDocs.push(obj.docData);
          slot.graphics.clear();
          slot.graphics.lineStyle(2, 0x5a9c4f);
          slot.graphics.strokeRoundedRect(zone.x - 60, zone.y - 40, 120, 80, 6);
          if (this.placedDocs.length === 3) this.time.delayedCall(600, () => this.documentsComplete());
        } else {
          this.tweens.add({ targets: obj, x: obj.startX, y: obj.startY, duration: 300, ease: 'Back' });
          const err = this.add.text(zone.x, zone.y, '\u274C Wrong!', { fontSize: '12px', fontFamily: 'monospace', color: '#ff6b6b' }).setOrigin(0.5).setDepth(270);
          this.docLayer.add(err);
          this.tweens.add({ targets: err, alpha: 0, y: err.y - 20, duration: 1000, onComplete: () => err.destroy() });
        }
      }
    });
    this.input.on('dragend', (pointer, obj, dropped) => {
      if (obj.docData && !dropped) {
        this.tweens.add({ targets: obj, x: obj.startX, y: obj.startY, duration: 300, ease: 'Back' });
      }
    });
  }

  documentsComplete() {
    this.docLayer.destroy();
    window.gameState.set('submittedDocuments', true);
    this.dialogue.show([
      { speaker: 'Banker Vikram', text: 'Perfect! All documents are in order.' },
      { speaker: 'Banker Vikram', text: 'For security, I\'m sending a One-Time Password to verify your identity.' },
      { speaker: 'Banker Vikram', text: 'You must ENTER the OTP shown on your phone. Never share it!' }
    ], () => this.showOTPKeypad());
  }

  // ==================== OTP KEYPAD ====================

  showOTPKeypad() {
    const { width: W, height: H } = this.scale;
    this.otpLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(260);
    const dim = this.add.graphics(); dim.fillStyle(0x000000, 0.7); dim.fillRect(0, 0, W, H);
    this.otpLayer.add(dim);

    const px = W / 2 - 140, py = H / 2;
    const phone = this.add.image(px, py, 'ui-phone').setScale(1.2);
    this.otpLayer.add(phone);

    this.otpCode = String(Math.floor(1000 + Math.random() * 9000));
    this.otpLayer.add(this.add.text(px, py - 55, '\uD83D\uDD12 Your OTP', { fontSize: '12px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold' }).setOrigin(0.5));
    this.otpLayer.add(this.add.text(px, py - 20, this.otpCode, { fontSize: '28px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
    this.otpLayer.add(this.add.text(px, py + 20, 'Never share your\nOTP with anyone!', { fontSize: '9px', fontFamily: 'monospace', color: '#ff6b6b', align: 'center' }).setOrigin(0.5));

    const kx = W / 2 + 120;
    this.otpLayer.add(this.add.text(kx, py - 110, 'Enter the OTP:', { fontSize: '12px', fontFamily: 'monospace', color: '#c4a44a' }).setOrigin(0.5));

    this.otpInput = '';
    this.otpDisplay = this.add.text(kx, py - 80, '_ _ _ _', { fontSize: '26px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold' }).setOrigin(0.5);
    this.otpLayer.add(this.otpDisplay);
    this.otpFeedback = this.add.text(kx, py + 90, '', { fontSize: '11px', fontFamily: 'monospace', color: '#ff6b6b' }).setOrigin(0.5);
    this.otpLayer.add(this.otpFeedback);

    const digits = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [null, 0, 'C']];
    const btnW = 48, btnH = 36, gap = 4;
    const startKX = kx - 1.5 * btnW - gap, startKY = py - 50;
    digits.forEach((row, r) => {
      row.forEach((d, c) => {
        if (d === null) return;
        const bx = startKX + c * (btnW + gap), by = startKY + r * (btnH + gap);
        const bg = this.add.graphics();
        bg.fillStyle(d === 'C' ? 0x3a1a1a : 0x2a1a10);
        bg.fillRoundedRect(bx, by, btnW, btnH, 5);
        bg.lineStyle(1, 0x8a7a5a); bg.strokeRoundedRect(bx, by, btnW, btnH, 5);
        this.otpLayer.add(bg);
        this.otpLayer.add(this.add.text(bx + btnW / 2, by + btnH / 2, String(d), { fontSize: '14px', fontFamily: 'monospace', color: d === 'C' ? '#ff6b6b' : '#c4a44a', fontStyle: 'bold' }).setOrigin(0.5));
        const zone = this.add.zone(bx + btnW / 2, by + btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          if (d === 'C') { this.otpInput = ''; this.updateOTPDisplay(); return; }
          if (this.otpInput.length < 4) {
            this.otpInput += String(d);
            this.updateOTPDisplay();
            if (this.otpInput.length === 4) this.checkOTP();
          }
        });
        this.otpLayer.add(zone);
      });
    });
  }

  updateOTPDisplay() {
    let display = '';
    for (let i = 0; i < 4; i++) { display += i < this.otpInput.length ? this.otpInput[i] : '_'; if (i < 3) display += ' '; }
    this.otpDisplay.setText(display);
  }

  checkOTP() {
    if (this.otpInput === this.otpCode) {
      this.otpLayer.destroy();
      window.gameState.set('enteredOTP', true);
      this.dialogue.show([
        { speaker: 'Banker Vikram', text: 'OTP verified!' },
        { speaker: 'Banker Vikram', text: 'Remember: an OTP is like a secret key. NEVER share it!' }
      ], () => this.celebrateAccount());
    } else {
      this.otpFeedback.setText('\u274C Wrong OTP! Try again.');
      this.otpInput = '';
      this.updateOTPDisplay();
      this.time.delayedCall(1500, () => { if (this.otpFeedback) this.otpFeedback.setText(''); });
    }
  }

  // ==================== CELEBRATION ====================

  celebrateAccount() {
    if (window.AudioManager) window.AudioManager.playAchievement();
    window.gameState.set('accountCreated', true);
    window.gameState.set('hasBankAccount', true);
    const { width, height } = this.scale;
    this.celebLayer = this.add.container(0, 0).setScrollFactor(0).setDepth(270);
    const glow = this.add.graphics(); glow.fillStyle(0xffd700, 0.12); glow.fillRect(0, 0, width, height);
    this.celebLayer.add(glow);
    this.tweens.add({ targets: glow, alpha: { from: 0, to: 0.8 }, duration: 800, yoyo: true, repeat: 2 });
    const badge = this.add.image(width / 2, height / 2 - 50, 'ui-badge').setScale(0);
    this.celebLayer.add(badge);
    this.tweens.add({ targets: badge, scale: 2, duration: 700, ease: 'Back.easeOut' });
    const title = this.add.text(width / 2, height / 2 + 30, 'Account Created!', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    this.celebLayer.add(title);
    this.tweens.add({ targets: title, alpha: 1, y: title.y - 8, duration: 500, delay: 300 });
    const sub = this.add.text(width / 2, height / 2 + 65, 'Account: ' + window.gameState.get('accountNumber'), {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);
    this.celebLayer.add(sub);
    this.tweens.add({ targets: sub, alpha: 1, duration: 500, delay: 600 });

    for (let i = 0; i < 12; i++) {
      const sp = this.add.graphics(); sp.fillStyle(0xffd700); sp.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      sp.setPosition(Phaser.Math.Between(80, width - 80), Phaser.Math.Between(60, height - 60)).setAlpha(0);
      this.celebLayer.add(sp);
      this.tweens.add({ targets: sp, alpha: { from: 0, to: 1 }, scale: { from: 0, to: 2 }, duration: 350, delay: i * 80, yoyo: true, onComplete: () => sp.destroy() });
    }

    this.time.delayedCall(2500, () => {
      const cont = this.add.text(width / 2, height / 2 + 115, '[ Continue to Deposit Lesson ]', {
        fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.celebLayer.add(cont);
      cont.on('pointerover', () => cont.setColor('#ffffff'));
      cont.on('pointerout', () => cont.setColor('#d4a440'));
      cont.on('pointerdown', () => {
        if (window.AudioManager) window.AudioManager.playClick();
        this.celebLayer.destroy();
        window.gameState.completeChapter(1);
        // Directly launch deposit lesson
        this.dialogue.show([
          { speaker: 'Banker Vikram', text: 'Congratulations! Your gold is now safe with us.' },
          { speaker: 'Banker Vikram', text: 'Now, let me teach you how to make deposits!' }
        ], () => {
          this.scene.pause();
          this.scene.launch('Deposit', { parentScene: 'BankInterior' });
        });
      });
    });
  }

  // ==================== UPDATE ====================

  update() {
    if (this.dialogue && this.dialogue.getIsActive()) {
      this.player.freeze(); this.interactIcon.setVisible(false);
      if (Phaser.Input.Keyboard.JustDown(this.eKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialogue.advance();
      return;
    }
    this.player.update(); this.wallet.update();
    const pos = this.player.getPosition();
    this.nearestBankNPC = null;
    let bestDist = Infinity;
    if (this.bankNPCs) {
      this.bankNPCs.forEach((npc) => {
        const d = Phaser.Math.Distance.Between(pos.x, pos.y, npc.x, npc.y);
        if (d < npc.range && d < bestDist) { bestDist = d; this.nearestBankNPC = npc; }
      });
    }
    const bDist = Phaser.Math.Distance.Between(pos.x, pos.y, this.banker.x, this.banker.y);
    if (this.nearestBankNPC) {
      this.interactIcon.setPosition(this.nearestBankNPC.x, this.nearestBankNPC.y - 40 + Math.sin(this.time.now / 300) * 3);
      this.interactIcon.setVisible(true);
    } else if (bDist < 80) {
      this.interactIcon.setPosition(this.banker.x, this.banker.y - 40 + Math.sin(this.time.now / 300) * 3);
      this.interactIcon.setVisible(true);
    } else {
      this.interactIcon.setVisible(false);
    }
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.handleAction();
  }

  handleAction() {
    if (this.dialogue && this.dialogue.getIsActive()) { this.dialogue.advance(); return; }
    const pos = this.player.getPosition();
    if (this.nearestBankNPC) {
      const msgs = this.nearestBankNPC.lines.map((text) => ({ speaker: 'Customer', text }));
      this.dialogue.show(msgs);
      return;
    }
    if (Phaser.Math.Distance.Between(pos.x, pos.y, this.banker.x, this.banker.y) < 80) {
      this.determineFlow();
      return;
    }
    if (Phaser.Math.Distance.Between(pos.x, pos.y, this.exitZone.x, this.exitZone.y) < 55) {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('BankVillage'));
    }
  }

  createMobileControls() {
    if (typeof MobileControls !== 'undefined') MobileControls.addDpadAndAction(this, this.player, () => this.handleAction());
  }
}
