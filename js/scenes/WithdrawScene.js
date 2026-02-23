/**
 * WithdrawScene - Simple withdrawal UI.
 * Now a streamlined overlay: enter amount → withdraw → return.
 * The spending/needs-wants lesson happens in the world (Market + NeedsWantsGame).
 * Launched as overlay from BankInterior; returns there when done.
 */
class WithdrawScene extends Phaser.Scene {
  constructor() { super('Withdraw'); }

  create(data) {
    if (window.AudioManager) window.AudioManager.init(this);
    this.parentScene = (data && data.parentScene) || 'BankInterior';
    this.W = this.scale.width; this.H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1e0f0f');
    this.cameras.main.fadeIn(500);

    const storedBalance = window.gameState.get('bankBalance');
    this.balance = (storedBalance !== undefined && storedBalance !== null) ? storedBalance : 0;
    this.limit = window.gameState.get('withdrawalLimit') || 50;
    this.wdInput = '';

    this.drawTitle('WITHDRAW MONEY', 'Limit: ' + this.limit + 'G per transaction | Balance: ' + this.balance + 'G');

    this.wdDisplay = this.add.text(this.W / 2, 150, '0 GOLD', {
      fontSize: '24px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.wdFeedback = this.add.text(this.W / 2, 450, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff6b6b'
    }).setOrigin(0.5);

    this.createNumpad(this.W / 2, 300, (d) => {
      if (this.wdInput.length < 3) { this.wdInput += d; this.wdDisplay.setText(this.wdInput + ' GOLD'); }
    });

    // Withdraw button
    const wbg = this.add.graphics(); wbg.fillStyle(0x3a6a3a); wbg.fillRoundedRect(this.W / 2 - 80, 410, 160, 36, 8);
    this.add.text(this.W / 2, 428, 'WITHDRAW', { fontSize: '14px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const wz = this.add.zone(this.W / 2, 428, 160, 36).setInteractive({ useHandCursor: true });
    wz.on('pointerdown', () => this.attemptWithdraw());

    // Back button
    const btn = this.add.text(20, 20, '\u25C0 Back', { fontSize: '13px', fontFamily: 'monospace', color: '#8a7a5a' }).setInteractive({ useHandCursor: true }).setDepth(100);
    btn.on('pointerover', () => btn.setColor('#c4a44a')); btn.on('pointerout', () => btn.setColor('#8a7a5a'));
    btn.on('pointerdown', () => this.returnToParent());
  }

  returnToParent() {
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume(this.parentScene);
    });
  }

  attemptWithdraw() {
    const amt = parseInt(this.wdInput) || 0;
    if (amt === 0) { this.wdFeedback.setText('Enter an amount!').setColor('#ff6b6b'); return; }
    if (amt > this.limit) { this.wdFeedback.setText('Limit exceeded! Max ' + this.limit + 'G').setColor('#ff6b6b'); return; }
    if (amt > this.balance) { this.wdFeedback.setText('Insufficient funds! Balance: ' + this.balance + 'G').setColor('#ff6b6b'); return; }

    this.balance -= amt;
    window.gameState.set('bankBalance', this.balance);
    window.gameState.addCoins(amt);

    if (window.gameState.get('needsMoreMoney')) {
      this.wdFeedback.setText('\u2705 Withdrawn ' + amt + 'G! Now return to the market.').setColor('#5a9c4f');
    } else {
      this.wdFeedback.setText('\u2705 Withdrawn ' + amt + 'G! Added to wallet.').setColor('#5a9c4f');
    }

    this.time.delayedCall(1500, () => this.returnToParent());
  }

  drawTitle(title, subtitle) {
    const tg = this.add.graphics();
    tg.fillStyle(0x2a1a10, 0.9); tg.fillRoundedRect(40, 16, this.W - 80, 70, 12);
    tg.lineStyle(2, 0xc4a44a); tg.strokeRoundedRect(40, 16, this.W - 80, 70, 12);
    this.add.text(this.W / 2, 34, title, { fontSize: '18px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(this.W / 2, 60, subtitle, { fontSize: '10px', fontFamily: 'monospace', color: '#e8e0d0' }).setOrigin(0.5);
  }

  createNumpad(cx, cy, onDigit) {
    const digits = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [null, 0, 'C']];
    const bW = 50, bH = 38, gap = 4;
    const sx = cx - 1.5 * bW - gap, sy = cy - 2 * bH - 1.5 * gap;
    digits.forEach((row, r) => {
      row.forEach((d, c) => {
        if (d === null) return;
        const bx = sx + c * (bW + gap), by = sy + r * (bH + gap);
        const bg = this.add.graphics();
        bg.fillStyle(d === 'C' ? 0x3a1a1a : 0x2a1a10);
        bg.fillRoundedRect(bx, by, bW, bH, 5);
        bg.lineStyle(1, 0x8a7a5a); bg.strokeRoundedRect(bx, by, bW, bH, 5);
        this.add.text(bx + bW / 2, by + bH / 2, String(d), {
          fontSize: '14px', fontFamily: 'monospace', color: d === 'C' ? '#ff6b6b' : '#c4a44a', fontStyle: 'bold'
        }).setOrigin(0.5);
        const z = this.add.zone(bx + bW / 2, by + bH / 2, bW, bH).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => {
          if (d === 'C') { this.wdInput = ''; this.wdDisplay.setText('0 GOLD'); }
          else onDigit(String(d));
        });
      });
    });
  }
}
