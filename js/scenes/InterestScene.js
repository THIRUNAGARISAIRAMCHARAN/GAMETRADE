/**
 * InterestScene - Level 4: Learn about interest through money seeds planting.
 * Player plants money seeds and advances a timeline to watch growth.
 * Timeline: 1 week, 1 month, 2 months, 6 months, 1 year.
 * Launched as overlay from BankInterior; returns there when done.
 */
class InterestScene extends Phaser.Scene {
  constructor() { super('Interest'); }

  create(data) {
    this.parentScene = (data && data.parentScene) || 'BankInterior';
    this.W = this.scale.width; this.H = this.scale.height;
    this.cameras.main.setBackgroundColor('#1a2a1a');
    this.cameras.main.fadeIn(500);

    // Back button
    const btn = this.add.text(20, 20, '\u25C0 Back', { fontSize: '13px', fontFamily: 'monospace', color: '#8a7a5a' }).setInteractive({ useHandCursor: true }).setDepth(100);
    btn.on('pointerover', () => btn.setColor('#c4a44a')); btn.on('pointerout', () => btn.setColor('#8a7a5a'));
    btn.on('pointerdown', () => this.returnToParent());

    this.startExplanation();
  }

  returnToParent() {
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume(this.parentScene);
    });
  }

  startExplanation() {
    const W = this.W, H = this.H;

    // Title
    const tg = this.add.graphics();
    tg.fillStyle(0x1a2a10, 0.9); tg.fillRoundedRect(80, 10, W - 160, 50, 12);
    tg.lineStyle(2, 0x5a9c4f); tg.strokeRoundedRect(80, 10, W - 160, 50, 12);
    this.add.text(W / 2, 36, 'THE MAGIC OF INTEREST - Plant Money Seeds!', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#5a9c4f', fontStyle: 'bold'
    }).setOrigin(0.5);

    const msgs = [
      { icon: '\uD83C\uDF31', text: 'Think of your savings as SEEDS you plant in the bank\'s garden...' },
      { icon: '\uD83C\uDF3F', text: 'Over time, the bank helps your seeds GROW into plants...' },
      { icon: '\uD83C\uDF33', text: 'The longer you wait, the bigger the plant - and it bears GOLD COINS!' },
      { icon: '\uD83C\uDFE6', text: 'This growth is called INTEREST - the bank pays you for saving!' },
    ];

    this.msgIdx = 0;
    this.msgIcon = this.add.text(W / 2, H / 2 - 40, msgs[0].icon, { fontSize: '48px' }).setOrigin(0.5);
    this.msgText = this.add.text(W / 2, H / 2 + 20, msgs[0].text, {
      fontSize: '13px', fontFamily: 'monospace', color: '#e8e0d0', align: 'center', wordWrap: { width: 500 }
    }).setOrigin(0.5);
    this.add.text(W / 2, H - 30, 'Click to continue...', { fontSize: '10px', fontFamily: 'monospace', color: '#8a7a5a' }).setOrigin(0.5);

    const z = this.add.zone(W / 2, H / 2, W, H).setInteractive();
    z.on('pointerdown', () => {
      this.msgIdx++;
      if (this.msgIdx >= msgs.length) {
        z.destroy();
        this.msgIcon.destroy();
        this.msgText.destroy();
        this.startPlantingGame();
      } else {
        this.msgIcon.setText(msgs[this.msgIdx].icon);
        this.msgText.setText(msgs[this.msgIdx].text);
        this.tweens.add({ targets: this.msgIcon, scale: { from: 0.5, to: 1 }, duration: 300, ease: 'Back.easeOut' });
      }
    });
  }

  startPlantingGame() {
    const W = this.W, H = this.H;

    // Clear any previous
    if (this.gameContainer) this.gameContainer.destroy();
    this.gameContainer = this.add.container(0, 0);

    // Ground
    const ground = this.add.graphics();
    ground.fillStyle(0x5a4a2a); ground.fillRect(0, H - 100, W, 100);
    ground.fillStyle(0x4a3a1a); ground.fillRect(0, H - 100, W, 4);
    this.gameContainer.add(ground);

    // State
    this.savings = window.gameState.get('bankBalance') || 100;
    this.interestRate = 0.10; // 10% per period
    this.currentTimeline = 0;
    this.planted = false;

    // Timeline points
    this.timelinePoints = [
      { label: 'Start', months: 0 },
      { label: '1 Week', months: 0.25 },
      { label: '1 Month', months: 1 },
      { label: '2 Months', months: 2 },
      { label: '6 Months', months: 6 },
      { label: '1 Year', months: 12 },
    ];

    // Info display
    this.savingsLabel = this.add.text(20, 70, 'Savings: ' + this.savings + 'G', {
      fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    });
    this.gameContainer.add(this.savingsLabel);

    this.interestLabel = this.add.text(20, 92, 'Interest earned: 0G', {
      fontSize: '11px', fontFamily: 'monospace', color: '#5a9c4f'
    });
    this.gameContainer.add(this.interestLabel);

    this.timeLabel = this.add.text(20, 112, 'Time: Start', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a7a5a'
    });
    this.gameContainer.add(this.timeLabel);

    this.compLabel = this.add.text(W - 20, 70, 'Under pillow: ' + this.savings + 'G (no change)', {
      fontSize: '10px', fontFamily: 'monospace', color: '#666'
    }).setOrigin(1, 0);
    this.gameContainer.add(this.compLabel);

    // Tree drawing area
    this.treeX = W / 2;
    this.treeY = H - 100;
    this.treeGraphics = this.add.graphics();
    this.gameContainer.add(this.treeGraphics);

    // Timeline slider
    this.drawTimeline();

    // Plant button
    this.plantBtn = this.add.text(W / 2, H - 50, '\uD83C\uDF31 Plant Your Money Seeds', {
      fontSize: '14px', fontFamily: 'monospace', color: '#5a9c4f', fontStyle: 'bold',
      backgroundColor: '#1a2a10', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.plantBtn.on('pointerover', () => this.plantBtn.setColor('#ffffff'));
    this.plantBtn.on('pointerout', () => this.plantBtn.setColor('#5a9c4f'));
    this.plantBtn.on('pointerdown', () => this.plantSeed());
    this.gameContainer.add(this.plantBtn);

    this.drawTree(0);
  }

  drawTimeline() {
    const W = this.W, H = this.H;
    const tlY = 130;
    const tlStartX = 80, tlEndX = W - 80;
    const tlW = tlEndX - tlStartX;

    // Timeline bar
    const tlBar = this.add.graphics();
    tlBar.fillStyle(0x3a3a3a); tlBar.fillRect(tlStartX, tlY, tlW, 6);
    tlBar.fillStyle(0x5a9c4f); tlBar.fillRect(tlStartX, tlY, 0, 6);
    this.gameContainer.add(tlBar);
    this.tlBar = tlBar;
    this.tlStartX = tlStartX;
    this.tlW = tlW;
    this.tlY = tlY;

    // Timeline points
    this.tlButtons = [];
    this.timelinePoints.forEach((pt, i) => {
      const x = tlStartX + (i / (this.timelinePoints.length - 1)) * tlW;
      const dot = this.add.graphics();
      dot.fillStyle(i === 0 ? 0x5a9c4f : 0x3a3a3a);
      dot.fillCircle(x, tlY + 3, 8);
      dot.lineStyle(1, 0x5a9c4f); dot.strokeCircle(x, tlY + 3, 8);
      this.gameContainer.add(dot);

      const label = this.add.text(x, tlY + 18, pt.label, {
        fontSize: '8px', fontFamily: 'monospace', color: '#8a7a5a'
      }).setOrigin(0.5);
      this.gameContainer.add(label);

      if (i > 0) {
        const zone = this.add.zone(x, tlY + 3, 24, 24).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this.advanceToPoint(i, dot));
        this.gameContainer.add(zone);
      }

      this.tlButtons.push({ dot, label, x, active: i === 0 });
    });
  }

  plantSeed() {
    if (this.planted) return;
    this.planted = true;
    this.plantBtn.setText('\u2705 Seeds Planted!').disableInteractive();

    // Sparkle effect
    for (let i = 0; i < 5; i++) {
      const sp = this.add.graphics(); sp.fillStyle(0xffd700); sp.fillCircle(0, 0, 3);
      sp.setPosition(this.treeX + Phaser.Math.Between(-30, 30), this.treeY - 20).setAlpha(0);
      this.tweens.add({ targets: sp, alpha: { from: 1, to: 0 }, y: sp.y - 30, duration: 600, delay: i * 100, onComplete: () => sp.destroy() });
    }

    this.drawTree(0);
    this.add.text(this.W / 2, this.H - 50, 'Click timeline points to advance time \u2192', {
      fontSize: '11px', fontFamily: 'monospace', color: '#c4a44a'
    }).setOrigin(0.5);
  }

  advanceToPoint(pointIdx, dot) {
    if (!this.planted) return;
    if (pointIdx <= this.currentTimeline) return;

    this.currentTimeline = pointIdx;
    const pt = this.timelinePoints[pointIdx];
    const months = pt.months;

    // Calculate interest compounded
    const multiplier = Math.pow(1 + this.interestRate, months);
    const total = Math.round(this.savings * multiplier);
    const interest = total - this.savings;

    // Update displays
    this.savingsLabel.setText('Savings: ' + total + 'G');
    this.interestLabel.setText('Interest earned: +' + interest + 'G');
    this.timeLabel.setText('Time: ' + pt.label);
    this.compLabel.setText('Under pillow: ' + this.savings + 'G (no change)');

    // Update timeline visuals
    const fillW = (pointIdx / (this.timelinePoints.length - 1)) * this.tlW;
    this.tlBar.clear();
    this.tlBar.fillStyle(0x3a3a3a); this.tlBar.fillRect(this.tlStartX, this.tlY, this.tlW, 6);
    this.tlBar.fillStyle(0x5a9c4f); this.tlBar.fillRect(this.tlStartX, this.tlY, fillW, 6);

    // Activate dots
    for (let i = 0; i <= pointIdx; i++) {
      this.tlButtons[i].dot.clear();
      this.tlButtons[i].dot.fillStyle(0x5a9c4f);
      this.tlButtons[i].dot.fillCircle(this.tlButtons[i].x, this.tlY + 3, 8);
      this.tlButtons[i].label.setColor('#5a9c4f');
    }

    // Draw tree at this stage
    const treeStage = pointIdx;
    this.drawTree(treeStage);

    // Sparkle for growth
    for (let i = 0; i < 3; i++) {
      const sp = this.add.graphics(); sp.fillStyle(0x5a9c4f); sp.fillCircle(0, 0, 4);
      sp.setPosition(this.treeX + Phaser.Math.Between(-40, 40), this.treeY - 30 - treeStage * 15).setAlpha(0);
      this.tweens.add({ targets: sp, alpha: { from: 1, to: 0 }, scale: { from: 0.5, to: 2 }, duration: 500, delay: i * 100, onComplete: () => sp.destroy() });
    }

    // Check completion
    if (pointIdx >= this.timelinePoints.length - 1) {
      this.time.delayedCall(1000, () => this.onComplete(total, interest));
    }
  }

  drawTree(stage) {
    this.treeGraphics.clear();
    const x = this.treeX, y = this.treeY;

    if (stage === 0) {
      // Seed
      this.treeGraphics.fillStyle(0x6b4226);
      this.treeGraphics.fillCircle(x, y - 5, 8);
      this.treeGraphics.fillStyle(0x8B6914);
      this.treeGraphics.fillCircle(x, y - 5, 5);
    } else if (stage === 1) {
      // Small sprout
      this.treeGraphics.fillStyle(0x6b4226);
      this.treeGraphics.fillRect(x - 2, y - 20, 4, 15);
      this.treeGraphics.fillStyle(0x5a9c4f);
      this.treeGraphics.fillCircle(x, y - 25, 8);
    } else if (stage === 2) {
      // Small plant
      this.treeGraphics.fillStyle(0x6b4226);
      this.treeGraphics.fillRect(x - 3, y - 45, 6, 40);
      this.treeGraphics.fillStyle(0x3a8030);
      this.treeGraphics.fillCircle(x - 12, y - 35, 10);
      this.treeGraphics.fillCircle(x + 12, y - 35, 10);
      this.treeGraphics.fillCircle(x, y - 48, 12);
    } else if (stage === 3) {
      // Medium tree
      this.treeGraphics.fillStyle(0x6b4226);
      this.treeGraphics.fillRect(x - 4, y - 75, 8, 70);
      this.treeGraphics.fillStyle(0x2d6b24);
      this.treeGraphics.fillCircle(x, y - 85, 28);
      this.treeGraphics.fillStyle(0x3a8030);
      this.treeGraphics.fillCircle(x - 15, y - 75, 18);
      this.treeGraphics.fillCircle(x + 15, y - 75, 18);
      // Small coins
      this.treeGraphics.fillStyle(0xffd700);
      this.treeGraphics.fillCircle(x - 8, y - 90, 5);
      this.treeGraphics.fillCircle(x + 10, y - 82, 5);
    } else if (stage === 4) {
      // Large tree with coins
      this.treeGraphics.fillStyle(0x6b4226);
      this.treeGraphics.fillRect(x - 6, y - 110, 12, 105);
      this.treeGraphics.fillRect(x - 25, y - 80, 20, 4);
      this.treeGraphics.fillRect(x + 5, y - 90, 20, 4);
      this.treeGraphics.fillStyle(0x2d6b24);
      this.treeGraphics.fillCircle(x, y - 125, 38);
      this.treeGraphics.fillStyle(0x3a8030);
      this.treeGraphics.fillCircle(x - 20, y - 115, 25);
      this.treeGraphics.fillCircle(x + 20, y - 115, 25);
      this.treeGraphics.fillCircle(x, y - 145, 22);
      // Gold coins on tree
      this.treeGraphics.fillStyle(0xffd700);
      const coins = [[x - 15, y - 140], [x + 12, y - 135], [x - 5, y - 150],
                      [x + 22, y - 120], [x - 22, y - 118]];
      coins.forEach(([cx, cy]) => {
        this.treeGraphics.fillCircle(cx, cy, 6);
        this.treeGraphics.fillStyle(0xd4a440);
        this.treeGraphics.fillCircle(cx, cy, 4);
        this.treeGraphics.fillStyle(0xffd700);
      });
    } else if (stage >= 5) {
      // Massive tree overflowing with coins
      this.treeGraphics.fillStyle(0x6b4226);
      this.treeGraphics.fillRect(x - 8, y - 150, 16, 145);
      this.treeGraphics.fillRect(x - 35, y - 110, 28, 5);
      this.treeGraphics.fillRect(x + 7, y - 125, 28, 5);
      this.treeGraphics.fillRect(x - 25, y - 85, 20, 4);
      this.treeGraphics.fillStyle(0x2d6b24);
      this.treeGraphics.fillCircle(x, y - 170, 48);
      this.treeGraphics.fillStyle(0x3a8030);
      this.treeGraphics.fillCircle(x - 28, y - 155, 32);
      this.treeGraphics.fillCircle(x + 28, y - 155, 32);
      this.treeGraphics.fillCircle(x, y - 195, 30);
      this.treeGraphics.fillCircle(x - 35, y - 130, 20);
      this.treeGraphics.fillCircle(x + 35, y - 130, 20);
      // Many gold coins
      this.treeGraphics.fillStyle(0xffd700);
      const bigCoins = [
        [x - 20, y - 180], [x + 18, y - 175], [x - 5, y - 195],
        [x + 30, y - 160], [x - 30, y - 158], [x + 10, y - 148],
        [x - 15, y - 145], [x + 25, y - 140], [x - 35, y - 135],
        [x + 35, y - 130], [x, y - 200]
      ];
      bigCoins.forEach(([cx, cy]) => {
        this.treeGraphics.fillCircle(cx, cy, 7);
        this.treeGraphics.fillStyle(0xd4a440);
        this.treeGraphics.fillCircle(cx, cy, 5);
        this.treeGraphics.fillStyle(0xffd700);
      });
    }
  }

  onComplete(total, interest) {
    if (window.AudioManager) window.AudioManager.playAchievement();
    window.gameState.completeChapter(4);
    window.gameState.set('bankBalance', total);

    const W = this.W, H = this.H;
    const layer = this.add.container(0, 0).setDepth(300);
    const dim = this.add.graphics(); dim.fillStyle(0x1a2a1a, 0.85); dim.fillRect(0, 0, W, H); layer.add(dim);
    const pw = 480, ph = 300, px = W / 2, py = H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x1a2a10, 0.98); panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    panel.lineStyle(2, 0x5a9c4f); panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 14);
    layer.add(panel);

    layer.add(this.add.text(px, py - 120, '\uD83C\uDF33 Interest Lesson Complete!', {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#5a9c4f', fontStyle: 'bold'
    }).setOrigin(0.5));

    const points = [
      'Interest is money the bank pays YOU for saving',
      'Your ' + this.savings + 'G grew to ' + total + 'G in 1 year!',
      'That\'s +' + interest + 'G just from saving!',
      'Money under a pillow stays at ' + this.savings + 'G forever',
      'The longer you save, the bigger your money tree grows!'
    ];
    points.forEach((p, i) => {
      layer.add(this.add.text(px, py - 65 + i * 26, '\u2705 ' + p, {
        fontSize: '11px', fontFamily: 'monospace', color: '#5a9c4f'
      }).setOrigin(0.5));
    });

    const cont = this.add.text(px, py + 110, '[ Continue \u2192 ]', {
      fontSize: '15px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    layer.add(cont);
    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout', () => cont.setColor('#d4a440'));
    cont.on('pointerdown', () => this.returnToParent());
  }
}
