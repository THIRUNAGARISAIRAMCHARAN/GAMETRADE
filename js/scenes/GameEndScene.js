/**
 * GameEndScene - Final congratulations screen.
 * Summarizes all lessons learned throughout the game.
 */
class GameEndScene extends Phaser.Scene {
  constructor() { super('GameEnd'); }

  create() {
    if (window.AudioManager) window.AudioManager.init(this);
    const W = this.scale.width, H = this.scale.height;
    if (window.AudioManager) window.AudioManager.playWin();
    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.cameras.main.fadeIn(1000);

    // Starfield background
    for (let i = 0; i < 60; i++) {
      const star = this.add.graphics();
      star.fillStyle(0xffd700, Phaser.Math.FloatBetween(0.2, 0.8));
      star.fillCircle(0, 0, Phaser.Math.Between(1, 3));
      star.setPosition(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H));
      this.tweens.add({
        targets: star, alpha: { from: 0.2, to: 1 },
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true, repeat: -1
      });
    }

    // Crown/trophy
    const badge = this.add.image(W / 2, 80, 'ui-badge').setScale(2.5);
    this.tweens.add({ targets: badge, y: 75, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title
    this.add.text(W / 2, 140, 'CONGRATULATIONS!', {
      fontSize: '28px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);

    const charName = window.gameState.get('selectedCharacter') === 'ananya' ? 'Ananya' : 'Arnav';
    this.add.text(W / 2, 170, charName + ' has completed all banking lessons!', {
      fontSize: '14px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5);

    // Lesson summary
    const lessons = [
      { ch: 1, title: 'Bank Account', desc: 'Opened a savings account safely', icon: '\uD83C\uDFE6' },
      { ch: 2, title: 'Deposits', desc: 'Learned to deposit and check balance', icon: '\uD83D\uDCB0' },
      { ch: 3, title: 'Needs vs Wants', desc: 'Budget wisely - needs before wants', icon: '\uD83D\uDED2' },
      { ch: 4, title: 'Interest', desc: 'Money grows when you save in a bank', icon: '\uD83C\uDF33' },
      { ch: 5, title: 'ATM Card', desc: 'Bank anytime with your ATM card', icon: '\uD83D\uDCB3' },
    ];

    lessons.forEach((l, i) => {
      const ly = 210 + i * 44;
      const lx = W / 2;
      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a2e, 0.8);
      bg.fillRoundedRect(lx - 240, ly, 480, 38, 8);
      bg.lineStyle(1, 0xd4a440);
      bg.strokeRoundedRect(lx - 240, ly, 480, 38, 8);

      this.add.text(lx - 220, ly + 10, l.icon, { fontSize: '16px' });
      this.add.text(lx - 190, ly + 8, 'Ch ' + l.ch + ': ' + l.title, {
        fontSize: '12px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
      });
      this.add.text(lx + 100, ly + 10, l.desc, {
        fontSize: '10px', fontFamily: 'monospace', color: '#8a8a8a'
      });
      this.add.text(lx + 228, ly + 10, '\u2705', { fontSize: '14px' });

      // Per-chapter replay button
      const replayLabel = this.add.text(lx + 180, ly + 10, '[ Replay ]', {
        fontSize: '10px', fontFamily: 'monospace', color: '#5a9c4f', fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      replayLabel.on('pointerover', () => replayLabel.setColor('#ffffff'));
      replayLabel.on('pointerout', () => replayLabel.setColor('#5a9c4f'));
      replayLabel.on('pointerdown', () => {
        if (window.AudioManager) window.AudioManager.playClick();
        this.replayChapter(l.ch);
      });
    });

    // Stats
    const gs = window.gameState;
    const statsY = 440;
    this.add.text(W / 2, statsY, 'Final Stats', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W / 2, statsY + 24, 'Wallet: ' + gs.get('coins') + 'G  |  Bank Balance: ' + gs.get('bankBalance') + 'G  |  Account: ' + gs.get('accountNumber'), {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a8a8a'
    }).setOrigin(0.5);

    // Key takeaways
    this.add.text(W / 2, statsY + 56, 'Key Takeaways:', {
      fontSize: '12px', fontFamily: 'monospace', color: '#5a9c4f', fontStyle: 'bold'
    }).setOrigin(0.5);
    const takeaways = [
      'Save in a bank, not under your pillow!',
      'Budget wisely - needs before wants.',
      'Never share your PIN or OTP with anyone.',
    ];
    takeaways.forEach((t, i) => {
      this.add.text(W / 2, statsY + 78 + i * 18, '\u2B50 ' + t, {
        fontSize: '10px', fontFamily: 'monospace', color: '#c4a44a'
      }).setOrigin(0.5);
    });

    // Play again button
    const replayBg = this.add.graphics();
    replayBg.fillStyle(0x3a6a3a, 0.9); replayBg.fillRoundedRect(W / 2 - 90, H - 50, 180, 36, 10);
    replayBg.lineStyle(2, 0x5a9c4f); replayBg.strokeRoundedRect(W / 2 - 90, H - 50, 180, 36, 10);
    const replayBtn = this.add.text(W / 2, H - 32, '\u25B6 Play Again', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    replayBtn.on('pointerover', () => replayBtn.setColor('#ffd700'));
    replayBtn.on('pointerout', () => replayBtn.setColor('#ffffff'));
    replayBtn.on('pointerdown', () => {
      try { if (this.cache.audio.exists('sfx_click')) this.sound.play('sfx_click', { volume: 0.3 }); } catch (e) { }
      window.gameState = new GameStateManager();
      this.cameras.main.fadeOut(800);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CharacterSelect');
      });
    });

    // Sparkle animation
    this.time.addEvent({
      delay: 300,
      callback: () => {
        const sp = this.add.graphics();
        sp.fillStyle(0xffd700); sp.fillCircle(0, 0, Phaser.Math.Between(2, 4));
        sp.setPosition(Phaser.Math.Between(50, W - 50), Phaser.Math.Between(50, H - 50)).setAlpha(0);
        this.tweens.add({
          targets: sp, alpha: { from: 1, to: 0 }, scale: { from: 0.5, to: 2 },
          duration: 800, onComplete: () => sp.destroy()
        });
      },
      loop: true
    });
  }

  replayChapter(ch) {
    // Preserve character choice when replaying.
    const savedCharacter = window.gameState.get('selectedCharacter') || 'arnav';
    window.gameState = new GameStateManager();
    const gs = window.gameState;
    gs.set('selectedCharacter', savedCharacter);

    let targetScene = 'BankInterior';

    if (ch === 1) {
      // Start at bank interior for account-opening lesson.
      gs.set('crossedRiver', true);
      gs.set('foundTreasure', true);
    } else if (ch === 2) {
      // Account already created; go straight to deposit lesson via bank.
      gs.set('accountCreated', true);
      gs.set('hasBankAccount', true);
      gs.set('chapter1Complete', true);
      gs.set('bankBalance', 100);
      targetScene = 'BankInterior';
    } else if (ch === 3) {
      // Needs vs Wants: replay the market level directly with fresh shopping.
      gs.set('accountCreated', true);
      gs.set('hasBankAccount', true);
      gs.set('chapter1Complete', true);
      gs.set('chapter2Complete', true);
      gs.set('hasGroceryList', true);
      gs.set('coins', 120);
      gs.set('completedMarket', false);
      gs.set('marketBoughtItems', []);
      targetScene = 'Market';
    } else if (ch === 4) {
      // Interest lesson unlocked at bank.
      gs.set('accountCreated', true);
      gs.set('hasBankAccount', true);
      gs.set('chapter1Complete', true);
      gs.set('chapter2Complete', true);
      gs.set('chapter3Complete', true);
      gs.set('bankBalance', 200);
      gs.set('receivedInterestNotification', true);
      targetScene = 'BankInterior';
    } else if (ch === 5) {
      // ATM lesson at bank; earlier chapters complete so ATM is next.
      gs.set('accountCreated', true);
      gs.set('hasBankAccount', true);
      gs.set('chapter1Complete', true);
      gs.set('chapter2Complete', true);
      gs.set('chapter3Complete', true);
      gs.set('chapter4Complete', true);
      gs.set('bankBalance', 250);
      targetScene = 'BankInterior';
    }

    this.cameras.main.fadeOut(600);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(targetScene);
    });
  }
}
