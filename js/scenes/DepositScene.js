/**
 * DepositScene - Level 2: Banker explains deposits + balance checking,
 * drag coins to vault (synced with real wallet), then take a banking quiz.
 * Launched as overlay from BankInterior; returns there when done.
 */
class DepositScene extends Phaser.Scene {
  constructor() { super('Deposit'); }

  create(data) {
    if (window.AudioManager) window.AudioManager.init(this);
    this.parentScene = (data && data.parentScene) || 'BankInterior';
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1e0f0f');
    this.cameras.main.fadeIn(500);
    this.makeBackBtn();

    // Wallet UI visible throughout
    this.wallet = new WalletSystem(this);
    this.wallet.create();
    this.wallet.show();

    this.stage = 0; // 0=dialogue, 1=deposit, 2=quiz
    this.startDialogue();
  }

  returnToParent() {
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume(this.parentScene);
    });
  }

  // ===== STAGE 0: BANKER DIALOGUE =====
  startDialogue() {
    const W = this.scale.width, H = this.scale.height;
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1a10, 0.95); bg.fillRoundedRect(40, 20, W - 80, 110, 12);
    bg.lineStyle(2, 0xc4a44a); bg.strokeRoundedRect(40, 20, W - 80, 110, 12);

    this.add.text(W / 2, 42, 'DEPOSITS & BALANCE', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5);

    const messages = [
      { speaker: 'Banker Vikram', text: 'Welcome back! Today I\'ll teach you about depositing money.' },
      { speaker: 'Banker Vikram', text: 'DEPOSITING means putting your gold into the bank vault for safekeeping.' },
      { speaker: 'Banker Vikram', text: 'You should always CHECK YOUR BALANCE to know how much money you have.' },
      { speaker: 'Banker Vikram', text: 'You can check your balance anytime by asking the banker or using an ATM.' },
      { speaker: 'Banker Vikram', text: 'Now, let\'s deposit your gold into the vault! Drag each coin over.' }
    ];

    this.dialogueIdx = 0;
    this.dialogueMessages = messages;
    this.dialogueText = this.add.text(W / 2, H / 2, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#e8e0d0', align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);
    this.speakerText = this.add.text(W / 2, H / 2 - 40, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.showDialogueMsg();

    const clickZone = this.add.zone(W / 2, H / 2, W, H).setInteractive();
    clickZone.on('pointerdown', () => {
      if (this.stage !== 0) return;
      this.dialogueIdx++;
      if (this.dialogueIdx >= this.dialogueMessages.length) {
        clickZone.destroy();
        this.dialogueText.destroy();
        this.speakerText.destroy();
        this.stage = 1;
        this.startDepositGame();
      } else {
        this.showDialogueMsg();
      }
    });

    this.add.text(W / 2, H - 30, 'Click to continue...', {
      fontSize: '10px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5);
  }

  showDialogueMsg() {
    const msg = this.dialogueMessages[this.dialogueIdx];
    this.speakerText.setText(msg.speaker);
    this.dialogueText.setText(msg.text);
  }

  // ===== STAGE 1: DEPOSIT GAME (synced with wallet) =====
  startDepositGame() {
    const W = this.scale.width, H = this.scale.height;
    const playerCoins = window.gameState.get('coins') || 0;
    const coinValue = Math.max(10, Math.floor(playerCoins / 5)); // each coin represents 1/5th of wallet
    const numCoins = Math.min(5, Math.max(3, Math.floor(playerCoins / coinValue)));

    const charName = window.gameState.get('selectedCharacter') === 'ananya' ? 'Ananya' : 'Arnav';

    // Bank balance display (top right)
    this.balanceLabel = this.add.text(W - 20, 70, 'Bank: ' + (window.gameState.get('bankBalance') || 0) + 'G', {
      fontSize: '12px', fontFamily: 'monospace', color: '#5a9c4f', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(100);

    this.add.text(W / 2, 90, charName + '\'s gold \u2192 Bank Vault. Drag each coin!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5);
    this.add.text(W / 2, 108, 'Each coin = ' + coinValue + 'G (from your wallet of ' + playerCoins + 'G)', {
      fontSize: '9px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5);

    const chestX = 170, chestY = 320;
    this.drawDashedRect(chestX - 110, chestY - 80, 220, 160);
    this.add.text(chestX, chestY - 65, charName.toUpperCase() + "'S CHEST", {
      fontSize: '10px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5);

    const vaultX = W - 170, vaultY = 320;
    this.vaultG = this.add.graphics();
    this.drawVault(vaultX, vaultY, false);
    this.add.text(vaultX, vaultY - 65, 'ROYAL VAULT', {
      fontSize: '10px', fontFamily: 'monospace', color: '#c4a44a'
    }).setOrigin(0.5);
    this.add.text(vaultX, vaultY - 10, '\uD83C\uDFE6', { fontSize: '28px' }).setOrigin(0.5);

    this.depositedAmount = 0;
    this.goldText = this.add.text(vaultX, vaultY + 40, '0 GOLD', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, chestY, '\u2192', { fontSize: '28px', fontFamily: 'monospace', color: '#c4a44a' }).setOrigin(0.5);

    this.add.zone(vaultX, vaultY, 220, 160).setRectangleDropZone(220, 160);

    this.coinsRemaining = numCoins;
    const positions = [];
    for (let i = 0; i < numCoins; i++) {
      const cx = chestX - 50 + (i % 3) * 50;
      const cy = chestY - 20 + Math.floor(i / 3) * 50;
      positions.push([cx, cy]);
    }
    positions.forEach(([cx, cy]) => {
      const coin = this.add.image(cx, cy, 'coin-large').setDepth(20);
      coin.setInteractive({ draggable: true, useHandCursor: true });
      coin.coinValue = coinValue; coin.startX = cx; coin.startY = cy;
    });

    this.input.on('drag', (p, o, dx, dy) => { o.x = dx; o.y = dy; o.setDepth(30); });
    this.input.on('dragenter', () => this.drawVault(vaultX, vaultY, true));
    this.input.on('dragleave', () => this.drawVault(vaultX, vaultY, false));
    this.input.on('drop', (p, o, z) => {
      o.disableInteractive();
      this.depositedAmount += o.coinValue;
      this.coinsRemaining--;
      // Sync with game state
      window.gameState.removeCoins(o.coinValue);
      window.gameState.set('bankBalance', (window.gameState.get('bankBalance') || 0) + o.coinValue);
      this.wallet.update();
      this.balanceLabel.setText('Bank: ' + window.gameState.get('bankBalance') + 'G');

      this.tweens.add({
        targets: o, x: vaultX, y: vaultY, scale: 0.3, alpha: 0, duration: 400,
        onComplete: () => {
          o.destroy();
          this.goldText.setText(this.depositedAmount + ' GOLD');
          this.tweens.add({ targets: this.goldText, scale: 1.3, duration: 100, yoyo: true });
          this.drawVault(vaultX, vaultY, false);
          if (this.coinsRemaining === 0) {
            this.time.delayedCall(600, () => { this.stage = 2; this.startQuiz(); });
          }
        }
      });
    });
    this.input.on('dragend', (p, o, dropped) => {
      if (!dropped) this.tweens.add({ targets: o, x: o.startX, y: o.startY, duration: 300, ease: 'Back' });
    });
  }

  drawVault(vx, vy, highlight) {
    if (this.vaultG) this.vaultG.clear();
    this.vaultG.fillStyle(highlight ? 0x4a3a28 : 0x3a2a18, 0.9);
    this.vaultG.fillRoundedRect(vx - 110, vy - 80, 220, 160, 10);
    this.vaultG.lineStyle(highlight ? 3 : 2, highlight ? 0xd4a440 : 0xc4a44a);
    this.vaultG.strokeRoundedRect(vx - 110, vy - 80, 220, 160, 10);
  }

  // ===== STAGE 2: BANKING QUIZ with explanations =====
  startQuiz() {
    const W = this.scale.width, H = this.scale.height;
    this.children.removeAll();
    this.cameras.main.setBackgroundColor('#1e0f0f');
    this.makeBackBtn();
    // Re-create wallet UI
    this.wallet = new WalletSystem(this); this.wallet.create(); this.wallet.show();

    this.add.text(W / 2, 30, 'BANKING QUIZ', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W / 2, 55, 'Answer correctly to complete the lesson!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5);

    this.questions = [
      {
        q: 'What does "depositing" mean?',
        options: ['Taking money out', 'Putting money into the bank', 'Spending money'],
        correct: 1,
        explanation: 'Depositing means putting your money INTO the bank for safekeeping. The bank stores it securely in a vault.'
      },
      {
        q: 'Why should you check your balance regularly?',
        options: ['To show off', 'To know how much money you have', 'It\'s not important'],
        correct: 1,
        explanation: 'Checking your balance helps you know exactly how much money is available, so you can plan your spending wisely.'
      },
      {
        q: 'Where is your money safest?',
        options: ['Under your pillow', 'In a bank account', 'In your pocket'],
        correct: 1,
        explanation: 'Banks have vaults, security, and insurance to protect your money. Under a pillow or in a pocket, it can be lost or stolen!'
      },
    ];
    this.quizIdx = 0;
    this.quizScore = 0;
    this.showQuestion();
  }

  showQuestion() {
    const W = this.scale.width, H = this.scale.height;
    if (this.quizContainer) this.quizContainer.destroy();
    this.quizContainer = this.add.container(0, 0);

    if (this.quizIdx >= this.questions.length) { this.quizComplete(); return; }

    const q = this.questions[this.quizIdx];
    this.quizContainer.add(this.add.text(W / 2, 110, 'Q' + (this.quizIdx + 1) + ': ' + q.q, {
      fontSize: '14px', fontFamily: 'monospace', color: '#e8e0d0', wordWrap: { width: 600 }
    }).setOrigin(0.5));

    let answered = false;

    q.options.forEach((opt, i) => {
      const oy = 170 + i * 55;
      const bg = this.add.graphics();
      bg.fillStyle(0x2a1a10); bg.fillRoundedRect(150, oy, W - 300, 44, 8);
      bg.lineStyle(1, 0x8a7a5a); bg.strokeRoundedRect(150, oy, W - 300, 44, 8);
      this.quizContainer.add(bg);
      const label = this.add.text(W / 2, oy + 22, opt, {
        fontSize: '12px', fontFamily: 'monospace', color: '#c4a44a'
      }).setOrigin(0.5);
      this.quizContainer.add(label);
      const zone = this.add.zone(W / 2, oy + 22, W - 300, 44).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        if (answered) return;
        answered = true;

        if (i === q.correct) {
          this.quizScore++;
          bg.clear(); bg.fillStyle(0x1a3a1a); bg.fillRoundedRect(150, oy, W - 300, 44, 8);
          bg.lineStyle(2, 0x5a9c4f); bg.strokeRoundedRect(150, oy, W - 300, 44, 8);
          label.setColor('#5a9c4f');
          label.setText('\u2705 ' + opt + ' — Correct!');
        } else {
          bg.clear(); bg.fillStyle(0x3a1a1a); bg.fillRoundedRect(150, oy, W - 300, 44, 8);
          bg.lineStyle(2, 0xff6b6b); bg.strokeRoundedRect(150, oy, W - 300, 44, 8);
          label.setColor('#ff6b6b');
          label.setText('\u274C ' + opt);

          // Highlight correct answer
          const coy = 170 + q.correct * 55;
          this.quizContainer.add(this.add.graphics()
            .fillStyle(0x1a3a1a).fillRoundedRect(150, coy, W - 300, 44, 8)
            .lineStyle(2, 0x5a9c4f).strokeRoundedRect(150, coy, W - 300, 44, 8));
          this.quizContainer.add(this.add.text(W / 2, coy + 22, '\u2705 ' + q.options[q.correct], {
            fontSize: '12px', fontFamily: 'monospace', color: '#5a9c4f'
          }).setOrigin(0.5));
        }

        // Show explanation
        const expBg = this.add.graphics();
        expBg.fillStyle(0x1a1a2e, 0.95); expBg.fillRoundedRect(80, 350, W - 160, 60, 8);
        expBg.lineStyle(1, 0x4a8ac4); expBg.strokeRoundedRect(80, 350, W - 160, 60, 8);
        this.quizContainer.add(expBg);
        this.quizContainer.add(this.add.text(W / 2, 366, '\uD83D\uDCA1 ' + q.explanation, {
          fontSize: '10px', fontFamily: 'monospace', color: '#8ac4e8', wordWrap: { width: W - 200 }
        }).setOrigin(0.5, 0));

        // Next button
        const nextBtn = this.add.text(W / 2, 440, '[ Next \u2192 ]', {
          fontSize: '13px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.quizContainer.add(nextBtn);
        nextBtn.on('pointerover', () => nextBtn.setColor('#ffffff'));
        nextBtn.on('pointerout', () => nextBtn.setColor('#d4a440'));
        nextBtn.on('pointerdown', () => { this.quizIdx++; this.showQuestion(); });
      });
      this.quizContainer.add(zone);
    });

    this.quizContainer.add(this.add.text(W / 2, H - 30, 'Score: ' + this.quizScore + '/' + this.questions.length, {
      fontSize: '12px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5));
  }

  quizComplete() {
    if (window.AudioManager) window.AudioManager.playAchievement();
    window.gameState.completeChapter(2);
    this.showLesson('Lesson 2 Complete!', [
      'Depositing puts money safely in the bank',
      'Always check your balance regularly',
      'Quiz score: ' + this.quizScore + '/' + this.questions.length
    ]);
  }

  // ===== HELPERS =====
  drawDashedRect(x, y, w, h) {
    const g = this.add.graphics(); g.lineStyle(2, 0x8a7a5a);
    const dash = 8, gap = 6;
    for (let i = x; i < x + w; i += dash + gap) { g.moveTo(i, y); g.lineTo(Math.min(i + dash, x + w), y); g.moveTo(i, y + h); g.lineTo(Math.min(i + dash, x + w), y + h); }
    for (let i = y; i < y + h; i += dash + gap) { g.moveTo(x, i); g.lineTo(x, Math.min(i + dash, y + h)); g.moveTo(x + w, i); g.lineTo(x + w, Math.min(i + dash, y + h)); }
    g.strokePath();
  }

  makeBackBtn() {
    const btn = this.add.text(20, 20, '\u25C0 Back', { fontSize: '13px', fontFamily: 'monospace', color: '#8a7a5a' }).setInteractive({ useHandCursor: true }).setDepth(100);
    btn.on('pointerover', () => btn.setColor('#c4a44a'));
    btn.on('pointerout', () => btn.setColor('#8a7a5a'));
    btn.on('pointerdown', () => this.returnToParent());
  }

  showLesson(title, points) {
    const W = this.scale.width, H = this.scale.height;
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.graphics(); dim.fillStyle(0x1e0f0f, 0.85); dim.fillRect(0, 0, W, H); layer.add(dim);
    const pw = 440, ph = 250, px = W / 2, py = H / 2;
    const panel = this.add.graphics(); panel.fillStyle(0x2a1a10, 0.98); panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    panel.lineStyle(2, 0xc4a44a); panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14); layer.add(panel);
    layer.add(this.add.text(px, py - ph / 2 + 32, title, { fontSize: '20px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold' }).setOrigin(0.5));
    points.forEach((p, i) => { layer.add(this.add.text(px, py - 25 + i * 28, '\u2705 ' + p, { fontSize: '12px', fontFamily: 'monospace', color: '#5a9c4f' }).setOrigin(0.5)); });
    const cont = this.add.text(px, py + ph / 2 - 36, '[ Continue \u2192 ]', { fontSize: '15px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true }); layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff')); cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => this.returnToParent());
  }
}
