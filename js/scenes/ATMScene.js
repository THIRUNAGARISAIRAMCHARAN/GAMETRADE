/**
 * ATMScene - Level 5: ATM Card application form + PIN setup.
 * Player fills form at bank, gets ATM card, sets PIN.
 * Actual ATM usage happens at the ATM in TownScene.
 * Launched as overlay from BankInterior; returns there when done.
 */
class ATMScene extends Phaser.Scene {
  constructor() { super('ATM'); }

  create(data) {
    if (window.AudioManager) window.AudioManager.init(this);
    this.parentScene = (data && data.parentScene) || 'BankInterior';
    this.W = this.scale.width; this.H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1e0f0f');
    this.cameras.main.fadeIn(500);
    this.pin = '';
    this.savedPin = '';

    // Back button
    const btn = this.add.text(20, 20, '\u25C0 Back', { fontSize: '13px', fontFamily: 'monospace', color: '#8a7a5a' }).setInteractive({ useHandCursor: true }).setDepth(100);
    btn.on('pointerover', () => btn.setColor('#c4a44a')); btn.on('pointerout', () => btn.setColor('#8a7a5a'));
    btn.on('pointerdown', () => this.returnToParent());

    this.startBankerExplanation();
  }

  returnToParent() {
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume(this.parentScene);
    });
  }

  clearStage() { if (this.stageC) this.stageC.destroy(); this.stageC = this.add.container(0, 0); }

  // ===== STAGE 1: BANKER EXPLAINS ATM =====
  startBankerExplanation() {
    this.clearStage();
    const W = this.W, H = this.H;
    this.drawTitle('ABOUT YOUR ATM CARD');

    this.stageC.add(this.add.text(W / 2, 90, 'Banker Vikram explains:', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5));

    const bullets = [
      '\uD83C\uDFE7  Withdraw cash anytime, even at night!',
      '\uD83D\uDCCA  Check your account balance instantly',
      '\uD83D\uDCB0  Deposit money without visiting the bank',
      '\u23F0  ATMs are available 24 hours, 7 days a week',
      '\uD83D\uDEAB  NEVER share your ATM PIN with anyone',
      '\uD83D\uDCB3  Always take your card after using the ATM',
    ];

    bullets.forEach((b, i) => {
      const by = 130 + i * 38;
      const bg = this.add.graphics();
      bg.fillStyle(0x2a1a10, 0.8); bg.fillRoundedRect(100, by, W - 200, 32, 6);
      bg.lineStyle(1, 0x4a3a2a); bg.strokeRoundedRect(100, by, W - 200, 32, 6);
      this.stageC.add(bg);
      this.stageC.add(this.add.text(W / 2, by + 16, b, {
        fontSize: '12px', fontFamily: 'monospace', color: '#e8e0d0'
      }).setOrigin(0.5));
    });

    const cont = this.add.text(W / 2, H - 45, '[ Fill ATM Card Form \u2192 ]', {
      fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.stageC.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => this.startATMForm());
  }

  // ===== STAGE 2: ATM CARD FORM =====
  startATMForm() {
    this.clearStage();
    const W = this.W, H = this.H;
    this.drawTitle('ATM CARD APPLICATION FORM');

    const charName = window.gameState.get('selectedCharacter') === 'ananya' ? 'Ananya' : 'Arnav';
    const accNum = window.gameState.get('accountNumber') || 'AURM-12345';

    const fields = [
      { label: 'Name', value: charName },
      { label: 'Account Number', value: accNum },
      { label: 'Account Type', value: 'Savings' },
    ];

    fields.forEach((f, i) => {
      const fy = 120 + i * 60;
      this.stageC.add(this.add.text(200, fy, f.label + ':', { fontSize: '12px', fontFamily: 'monospace', color: '#8a7a5a' }));
      const fbg = this.add.graphics();
      fbg.fillStyle(0x2a2a2a); fbg.fillRoundedRect(350, fy - 4, 250, 28, 5);
      fbg.lineStyle(1, 0x5a5a5a); fbg.strokeRoundedRect(350, fy - 4, 250, 28, 5);
      this.stageC.add(fbg);
      this.stageC.add(this.add.text(360, fy + 2, f.value, { fontSize: '12px', fontFamily: 'monospace', color: '#e8e0d0' }));
    });

    const signY = 320;
    this.signed = false;
    const checkBg = this.add.graphics();
    checkBg.lineStyle(2, 0xc4a44a); checkBg.strokeRect(200, signY, 20, 20);
    this.stageC.add(checkBg);
    this.stageC.add(this.add.text(230, signY + 3, 'I agree to the terms and conditions of ATM card usage', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e8e0d0'
    }));

    const checkZone = this.add.zone(210, signY + 10, 30, 30).setInteractive({ useHandCursor: true });
    this.stageC.add(checkZone);
    const checkMark = this.add.text(204, signY - 1, '', { fontSize: '16px', color: '#5a9c4f' });
    this.stageC.add(checkMark);
    checkZone.on('pointerdown', () => {
      this.signed = !this.signed;
      checkMark.setText(this.signed ? '\u2705' : '');
    });

    const submitBg = this.add.graphics();
    submitBg.fillStyle(0x3a6a3a); submitBg.fillRoundedRect(W / 2 - 80, 380, 160, 36, 8);
    this.stageC.add(submitBg);
    this.stageC.add(this.add.text(W / 2, 398, 'SUBMIT FORM', {
      fontSize: '13px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5));

    this.formFeedback = this.add.text(W / 2, 430, '', { fontSize: '11px', fontFamily: 'monospace', color: '#ff6b6b' }).setOrigin(0.5);
    this.stageC.add(this.formFeedback);

    const submitZ = this.add.zone(W / 2, 398, 160, 36).setInteractive({ useHandCursor: true });
    this.stageC.add(submitZ);
    submitZ.on('pointerdown', () => {
      if (!this.signed) { this.formFeedback.setText('Please check the agreement box!'); return; }
      this.formFeedback.setText('\u2705 ATM Card issued!').setColor('#5a9c4f');
      this.time.delayedCall(1200, () => this.startPINSetup());
    });
  }

  // ===== STAGE 3: SET ATM PIN =====
  startPINSetup() {
    this.clearStage();
    const W = this.W, H = this.H;
    this.pin = '';
    this.drawTitle('SET YOUR ATM PIN');

    this.stageC.add(this.add.text(W / 2, 100, '\u26A0 Your PIN is SECRET \u2014 NEVER share it with ANYONE!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff6b6b'
    }).setOrigin(0.5));

    this.pinDisplay = this.add.text(W / 2, 165, '_ _ _ _', {
      fontSize: '30px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.stageC.add(this.pinDisplay);

    this.pinFeedback = this.add.text(W / 2, 480, '', { fontSize: '12px', fontFamily: 'monospace', color: '#ff6b6b' }).setOrigin(0.5);
    this.stageC.add(this.pinFeedback);

    this.createKeypad(W / 2, 330, (d) => {
      if (this.pin.length < 4) {
        this.pin += d;
        this.updatePinDisplay();
        if (this.pin.length === 4) {
          this.savedPin = this.pin;
          window.gameState.set('pin', this.savedPin);
          this.pinFeedback.setText('\u2705 PIN Set! Now verify it.').setColor('#5a9c4f');
          this.time.delayedCall(1000, () => this.startPINVerify());
        }
      }
    });
  }

  // ===== STAGE 4: VERIFY PIN =====
  startPINVerify() {
    this.clearStage();
    const W = this.W, H = this.H;
    this.pin = '';
    this.drawTitle('VERIFY YOUR PIN');

    this.stageC.add(this.add.text(W / 2, 100, 'Enter your PIN again to confirm', {
      fontSize: '12px', fontFamily: 'monospace', color: '#a09070'
    }).setOrigin(0.5));

    this.pinDisplay = this.add.text(W / 2, 150, '_ _ _ _', {
      fontSize: '30px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.stageC.add(this.pinDisplay);

    this.pinFeedback = this.add.text(W / 2, 480, '', { fontSize: '12px', fontFamily: 'monospace', color: '#ff6b6b' }).setOrigin(0.5);
    this.stageC.add(this.pinFeedback);

    this.createKeypad(W / 2, 320, (d) => {
      if (this.pin.length < 4) {
        this.pin += d;
        this.updatePinDisplay();
        if (this.pin.length === 4) {
          if (this.pin === this.savedPin) {
            this.pinFeedback.setText('\u2705 PIN Verified! ATM Card is ready!').setColor('#5a9c4f');
            this.time.delayedCall(1200, () => this.onComplete());
          } else {
            this.pinFeedback.setText('\u274C PINs don\'t match! Try again.');
            this.pin = '';
            this.time.delayedCall(1000, () => { this.pinFeedback.setText(''); this.updatePinDisplay(); });
          }
        }
      }
    });
  }

  onComplete() {
    if (window.AudioManager) window.AudioManager.playAchievement();
    window.gameState.set('hasATMCard', true);
    window.gameState.completeChapter(5);

    const W = this.W, H = this.H;
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.graphics(); dim.fillStyle(0x1e0f0f, 0.85); dim.fillRect(0, 0, W, H); layer.add(dim);
    const pw = 500, ph = 280, px = W / 2, py = H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a10, 0.98); panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    panel.lineStyle(2, 0xd4a440); panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    layer.add(panel);

    layer.add(this.add.text(px, py - 100, '\uD83D\uDCB3 ATM Card Ready!', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5));

    const points = [
      'Your ATM card has been issued!',
      'Your PIN is secret - never share it',
      'Use the ATM near your home to bank anytime',
      'You can check balance, withdraw, and deposit',
      'Exit the bank and go to your village when ready.'
    ];
    points.forEach((p, i) => {
      layer.add(this.add.text(px, py - 50 + i * 26, '\u2705 ' + p, {
        fontSize: '11px', fontFamily: 'monospace', color: '#5a9c4f'
      }).setOrigin(0.5));
    });

    // Return to bank (parent scene); player leaves normally via exit, then village → river → town → home
    const cont = this.add.text(px, py + 100, '[ Done — Return to Bank \u2192 ]', {
      fontSize: '15px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop();
        this.scene.resume(this.parentScene);
      });
    });
  }

  // ===== HELPERS =====
  drawTitle(title) {
    const tg = this.add.graphics();
    tg.fillStyle(0x2a1a10, 0.9); tg.fillRoundedRect(80, 16, this.W - 160, 50, 12);
    tg.lineStyle(2, 0xc4a44a); tg.strokeRoundedRect(80, 16, this.W - 160, 50, 12);
    this.add.text(this.W / 2, 42, title, { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold' }).setOrigin(0.5);
  }

  createKeypad(cx, cy, onDigit) {
    const digits = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [null, 0, 'C']];
    const bW = 50, bH = 38, gap = 5;
    const sx = cx - 1.5 * bW - gap, sy = cy - 2 * bH - 1.5 * gap;
    digits.forEach((row, r) => {
      row.forEach((d, c) => {
        if (d === null) return;
        const bx = sx + c * (bW + gap), by = sy + r * (bH + gap);
        const bg = this.add.graphics();
        bg.fillStyle(d === 'C' ? 0x3a1a1a : 0x2a1a10);
        bg.fillRoundedRect(bx, by, bW, bH, 5);
        bg.lineStyle(1, 0x8a7a5a); bg.strokeRoundedRect(bx, by, bW, bH, 5);
        this.stageC.add(bg);
        this.stageC.add(this.add.text(bx + bW / 2, by + bH / 2, String(d), {
          fontSize: '15px', fontFamily: 'monospace', color: d === 'C' ? '#ff6b6b' : '#c4a44a', fontStyle: 'bold'
        }).setOrigin(0.5));
        const z = this.add.zone(bx + bW / 2, by + bH / 2, bW, bH).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { if (d === 'C') { this.pin = ''; this.updatePinDisplay(); } else onDigit(String(d)); });
        this.stageC.add(z);
      });
    });
  }

  updatePinDisplay() {
    if (!this.pinDisplay) return;
    let d = '';
    for (let i = 0; i < 4; i++) { d += i < this.pin.length ? '\u2022' : '_'; if (i < 3) d += ' '; }
    this.pinDisplay.setText(d);
  }
}
