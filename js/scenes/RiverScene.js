/**
 * RiverScene - Cross the river by navigating a boat through obstacles.
 * Top-down boat navigation mini-game.
 * Supports bidirectional travel (Town→BankVillage or BankVillage→Town).
 */
class RiverScene extends Phaser.Scene {
  constructor() { super('River'); }

  create(data) {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#2a5a8a');
    this.cameras.main.fadeIn(500);

    // Direction: 'toBankVillage' (default) or 'toTown'
    this.direction = (data && data.direction) || 'toBankVillage';
    const goingRight = this.direction === 'toBankVillage';

    // River background with current lines
    const bg = this.add.graphics();
    bg.fillStyle(0x3a7ab4); bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) {
      bg.fillStyle(0x4a8ac4, 0.3);
      bg.fillRect(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), Phaser.Math.Between(40, 120), 2);
    }

    // Title
    this.add.text(W / 2, 16, 'CROSS THE RIVER', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W / 2, 36, 'Navigate with arrow keys! Avoid the rocks!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5);

    // Left shore (start or end)
    const shore1 = this.add.graphics();
    shore1.fillStyle(0x5a9c4f); shore1.fillRect(0, 0, 60, H);
    shore1.fillStyle(0xc4a66a); shore1.fillRect(40, H / 2 - 30, 20, 60);
    this.add.text(30, H / 2, goingRight ? 'START' : 'BANK\nVILLAGE', {
      fontSize: '9px', fontFamily: 'monospace', color: '#333', align: 'center'
    }).setOrigin(0.5);

    // Right shore (end or start)
    const shore2 = this.add.graphics();
    shore2.fillStyle(0x5a9c4f); shore2.fillRect(W - 60, 0, 60, H);
    shore2.fillStyle(0xc4a66a); shore2.fillRect(W - 60, H / 2 - 30, 20, 60);
    this.add.text(W - 30, H / 2, goingRight ? 'BANK\nVILLAGE' : 'START', {
      fontSize: '8px', fontFamily: 'monospace', color: '#333', align: 'center'
    }).setOrigin(0.5);

    // Boat (player) - spawn on correct side
    const startX = goingRight ? 90 : W - 90;
    this.boat = this.physics.add.sprite(startX, H / 2, 'obj-boat').setDepth(10);
    this.boat.setCollideWorldBounds(true);
    this.boat.body.setSize(36, 24);

    // Character sitting on boat
    const charKey = window.gameState.get('selectedCharacter') || 'arnav';
    this.boatChar = this.add.sprite(startX, H / 2 - 8, charKey, 0).setDepth(11).setScale(0.9);

    // Rocks (obstacles) — randomly placed each time
    this.rocks = this.physics.add.staticGroup();
    const numRocks = Phaser.Math.Between(12, 18);
    for (let i = 0; i < numRocks; i++) {
      const rx = Phaser.Math.Between(120, W - 120);
      const ry = Phaser.Math.Between(50, H - 50);
      // Don't place rocks too close to shores or start position
      if (rx < 90 || rx > W - 90) continue;
      const rg = this.add.graphics();
      const sz = Phaser.Math.Between(16, 32);
      rg.fillStyle(0x5a5a5a); rg.fillCircle(rx, ry, sz);
      rg.fillStyle(0x4a4a4a); rg.fillCircle(rx - 3, ry - 3, sz * 0.7);
      rg.fillStyle(0x6a6a6a); rg.fillCircle(rx + 2, ry + 2, sz * 0.3);
      const rock = this.rocks.create(rx, ry, 'pixel');
      rock.setDisplaySize(sz * 1.3, sz * 1.3).setVisible(false).refreshBody();
    }

    // Collision
    this.physics.add.collider(this.boat, this.rocks, () => this.onHitRock());

    // Success zone (on the destination side)
    const successX = goingRight ? W - 50 : 50;
    this.successZone = this.add.zone(successX, H / 2, 40, H).setOrigin(0.5);
    this.physics.add.existing(this.successZone, true);
    this.physics.add.overlap(this.boat, this.successZone, () => this.onReachShore());

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.completed = false;
    this.boatSpeed = 160;
    this.goingRight = goingRight;

    // Progress indicator
    this.progressBar = this.add.graphics();
    this.add.text(W / 2, H - 12, 'Progress', { fontSize: '9px', fontFamily: 'monospace', color: '#e8e0d0' }).setOrigin(0.5);
  }

  update() {
    if (this.completed) return;

    // Boat movement
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown) vx = -this.boatSpeed;
    if (this.cursors.right.isDown) vx = this.boatSpeed;
    if (this.cursors.up.isDown) vy = -this.boatSpeed;
    if (this.cursors.down.isDown) vy = this.boatSpeed;

    // Auto forward drift
    vx += this.goingRight ? 30 : -30;

    this.boat.setVelocity(vx, vy);

    // Character follows boat
    this.boatChar.setPosition(this.boat.x, this.boat.y - 8);

    // Update progress bar
    const W = this.scale.width;
    let pct;
    if (this.goingRight) {
      pct = Math.max(0, (this.boat.x - 80) / (W - 140));
    } else {
      pct = Math.max(0, (W - 80 - this.boat.x) / (W - 140));
    }
    this.progressBar.clear();
    this.progressBar.fillStyle(0x2a2a2a); this.progressBar.fillRect(200, this.scale.height - 26, W - 400, 8);
    this.progressBar.fillStyle(0xd4a440); this.progressBar.fillRect(200, this.scale.height - 26, (W - 400) * pct, 8);
  }

  onHitRock() {
    if (this.goingRight) {
      this.boat.x = Math.max(80, this.boat.x - 20);
    } else {
      this.boat.x = Math.min(this.scale.width - 80, this.boat.x + 20);
    }
    this.cameras.main.shake(100, 0.005);
  }

  onReachShore() {
    if (this.completed) return;
    this.completed = true;
    this.boat.setVelocity(0, 0);

    const W = this.scale.width, H = this.scale.height;
    const msg = this.add.text(W / 2, H / 2, '\u2705 River Crossed!', {
      fontSize: '22px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold',
      backgroundColor: '#00000088', padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setAlpha(0).setDepth(50);

    this.tweens.add({ targets: msg, alpha: 1, duration: 500 });

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.direction === 'toBankVillage') {
          window.gameState.set('crossedRiver', true);
          this.scene.start('BankVillage');
        } else {
          this.scene.start('Town', { from: 'river' });
        }
      });
    });
  }
}
