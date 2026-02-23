/**
 * ChapterSelectScene - Hub showing all 5 levels with progress.
 */
class ChapterSelectScene extends Phaser.Scene {
  constructor() { super('ChapterSelect'); }

  create() {
    if (window.AudioManager) window.AudioManager.init(this);
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1e0f0f');
    this.cameras.main.fadeIn(500);

    this.add.text(width / 2, 32, 'ROYAL BANK OF AURUMVALE', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(width / 2, 60, 'Choose Your Level', {
      fontSize: '14px', fontFamily: 'monospace', color: '#a09070'
    }).setOrigin(0.5);

    const chapters = [
      { num: 1, title: 'Treasure Hunt\n& Bank Account', icon: '\uD83C\uDFE6', scene: 'Town', desc: 'Cave \u2192 Maze \u2192 Gold \u2192 River \u2192 Bank' },
      { num: 2, title: 'Deposits\n& Balance', icon: '\uD83D\uDCB0', scene: 'Deposit', desc: 'Learn to deposit & check balance' },
      { num: 3, title: 'Withdrawals\n& Spending', icon: '\uD83D\uDCB3', scene: 'Withdraw', desc: 'Withdraw, budget & spend wisely' },
      { num: 4, title: 'Interest &\nMoney Tree', icon: '\uD83C\uDF33', scene: 'Interest', desc: 'Watch your savings grow!' },
      { num: 5, title: 'ATM Card\n& Security', icon: '\uD83C\uDFE7', scene: 'ATM', desc: 'Get ATM card, set PIN, use ATM' },
    ];

    // Layout: single row of 5 or 3+2
    const cardW = 140, cardH = 190, gap = 16;
    const totalW = 3 * cardW + 2 * gap;
    const startX = width / 2 - totalW / 2 + cardW / 2;
    const row1Y = 145, row2Y = row1Y + cardH + gap;

    chapters.forEach((ch, i) => {
      let cx, cy;
      if (i < 3) { cx = startX + i * (cardW + gap); cy = row1Y; }
      else { cx = width / 2 - (cardW + gap) / 2 + (i - 3) * (cardW + gap); cy = row2Y; }
      this.createCard(cx, cy, cardW, cardH, ch);
    });

    // Return to town
    const backBtn = this.add.text(width / 2, height - 30, '\u25C0  Return to Village', {
      fontSize: '12px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setColor('#c4a44a'));
    backBtn.on('pointerout', () => backBtn.setColor('#8a7a5a'));
    backBtn.on('pointerdown', () => {
      if (window.AudioManager) window.AudioManager.playClick();
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Town'));
    });

    // Stats
    const coins = window.gameState.get('coins');
    const bal = window.gameState.get('bankBalance');
    this.add.text(width - 98, 10, 'Wallet: ' + coins + 'G  |  Bank: ' + bal + 'G', {
      fontSize: '10px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(1, 0);
    if (typeof LevelInfoUI !== 'undefined') LevelInfoUI.create(this);
  }

  createCard(cx, cy, w, h, ch) {
    const unlocked = window.gameState.isChapterUnlocked(ch.num);
    const completed = window.gameState.get('chapter' + ch.num + 'Complete');
    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x2a1a10 : 0x1a1210, 0.95);
    card.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
    card.lineStyle(2, completed ? 0x5a9c4f : (unlocked ? 0xc4a44a : 0x4a3a2a));
    card.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);

    this.add.text(cx - w / 2 + 10, cy - h / 2 + 8, 'LV ' + ch.num, {
      fontSize: '9px', fontFamily: 'monospace', color: completed ? '#5a9c4f' : (unlocked ? '#c4a44a' : '#4a3a2a'), fontStyle: 'bold'
    });

    if (completed) this.add.text(cx + w / 2 - 10, cy - h / 2 + 8, '\u2705', { fontSize: '12px' }).setOrigin(1, 0);

    this.add.text(cx, cy - 30, ch.icon, { fontSize: '28px' }).setOrigin(0.5).setAlpha(unlocked ? 1 : 0.3);
    this.add.text(cx, cy + 10, ch.title, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: unlocked ? '#e8e0d0' : '#5a4a3a', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5);
    this.add.text(cx, cy + 50, ch.desc, {
      fontSize: '8px', fontFamily: 'monospace', color: unlocked ? '#a09070' : '#3a2a1a', align: 'center', wordWrap: { width: w - 16 }
    }).setOrigin(0.5);

    if (!unlocked) {
      this.add.text(cx, cy + 72, '\uD83D\uDD12 Locked', { fontSize: '9px', fontFamily: 'monospace', color: '#4a3a2a' }).setOrigin(0.5);
    }

    if (unlocked) {
      const zone = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => {
        card.clear(); card.fillStyle(0x3a2a18, 0.95); card.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
        card.lineStyle(3, completed ? 0x5a9c4f : 0xd4a440); card.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
      });
      zone.on('pointerout', () => {
        card.clear(); card.fillStyle(0x2a1a10, 0.95); card.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
        card.lineStyle(2, completed ? 0x5a9c4f : 0xc4a44a); card.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
      });
      zone.on('pointerdown', () => {
        if (window.AudioManager) window.AudioManager.playClick();
        this.cameras.main.fadeOut(400);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(ch.scene));
      });
    }
  }
}
