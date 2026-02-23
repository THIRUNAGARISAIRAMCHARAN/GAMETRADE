/**
 * LibraryScene - Walkable library interior.
 * Player moves around and interacts with bookshelves (press E).
 * One special bookshelf contains the treasure map.
 */
class LibraryScene extends Phaser.Scene {
  constructor() { super('Library'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeIn(500);
    window.gameState.set('enteredLibrary', true);

    // Create collision groups FIRST (drawInterior and placeBookshelves use them)
    this.interactables = [];
    this.shelfColliders = this.physics.add.staticGroup();

    // Draw interior
    this.drawInterior(W, H);

    // Player
    const charKey = window.gameState.get('selectedCharacter') || 'arnav';
    this.player = new PlayerController(this, W / 2, H - 80, charKey);
    this.player.sprite.setCollideWorldBounds(true);

    // Bookshelves with collision and interaction
    this.placeBookshelves(W, H);

    // Collisions
    this.physics.add.collider(this.player.sprite, this.shelfColliders);
    this.physics.add.collider(this.player.sprite, this.wallColliders);

    // Dialogue and UI
    this.dialogue = new DialogueManager(this);
    this.dialogue.create();
    this.interactIcon = this.add.image(0, 0, 'ui-interact').setDepth(50).setVisible(false);

    // Exit zone
    this.add.text(W / 2, H - 12, '\u25BC Exit Library', {
      fontSize: '11px', fontFamily: 'monospace', color: '#888'
    }).setOrigin(0.5).setDepth(1);
    this.exitZone = this.add.zone(W / 2, H - 6, 80, 20);
    this.physics.add.existing(this.exitZone, true);

    // Controls
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.createMobileControls();
    if (typeof LevelInfoUI !== 'undefined') LevelInfoUI.create(this);

    // Intro dialogue
    if (!window.gameState.get('foundTreasureMap')) {
      this.time.delayedCall(400, () => {
        this.dialogue.show([
          { speaker: '', text: 'The Aurumvale Library... Full of ancient books and knowledge.' },
          { speaker: '', text: 'Walk around and press E near bookshelves to search for clues!' }
        ]);
      });
    }
  }

  drawInterior(W, H) {
    // Floor
    const floor = this.add.graphics().setDepth(0);
    floor.fillStyle(0x8B7355); floor.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 32) for (let x = 0; x < W; x += 32) {
      if ((x + y) % 64 === 0) { floor.fillStyle(0x9B8365); floor.fillRect(x, y, 32, 32); floor.fillStyle(0x8B7355); }
    }

    // Walls
    const walls = this.add.graphics().setDepth(0);
    walls.fillStyle(0xc4866c); walls.fillRect(0, 0, W, 80);
    walls.fillStyle(0x6c8da8); walls.fillRect(0, 76, W, 6);

    // Wall colliders
    this.wallColliders = this.physics.add.staticGroup();
    const topWall = this.wallColliders.create(W / 2, 40, 'pixel');
    topWall.setDisplaySize(W, 80).setVisible(false).refreshBody();

    // Title
    this.add.text(W / 2, 20, 'AURUMVALE LIBRARY', {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);

    // Windows
    walls.fillStyle(0x87CEEB);
    walls.fillRect(40, 20, 50, 40); walls.fillRect(W - 90, 20, 50, 40);
    walls.lineStyle(2, 0x6c8da8);
    walls.strokeRect(40, 20, 50, 40); walls.strokeRect(W - 90, 20, 50, 40);

    // Reading table in center
    const table = this.add.graphics().setDepth(1);
    table.fillStyle(0x6b4226);
    table.fillRoundedRect(W / 2 - 50, H / 2 - 15, 100, 40, 4);
    table.fillStyle(0x5c3a1e);
    table.fillRoundedRect(W / 2 - 46, H / 2 - 11, 92, 32, 2);
    // Table collider
    const tableCol = this.shelfColliders.create(W / 2, H / 2 + 4, 'pixel');
    tableCol.setDisplaySize(100, 40).setVisible(false).refreshBody();
  }

  placeBookshelves(W, H) {
    const mapFound = window.gameState.get('foundTreasureMap');
    const positions = [
      { x: 80, y: 130, special: false },
      { x: 200, y: 130, special: false },
      { x: 400, y: 130, special: !mapFound },
      { x: 600, y: 130, special: false },
      { x: 720, y: 130, special: false },
      { x: 120, y: 320, special: false },
      { x: 400, y: 320, special: false },
      { x: 680, y: 320, special: false },
    ];

    positions.forEach((shelf, idx) => {
      const img = this.add.image(shelf.x, shelf.y, 'obj-bookshelf').setScale(2).setDepth(2);

      // Collider
      const col = this.shelfColliders.create(shelf.x, shelf.y, 'pixel');
      col.setDisplaySize(48, 48).setVisible(false).refreshBody();

      // Glow for special shelf
      if (shelf.special) {
        const glow = this.add.graphics().setDepth(1);
        glow.fillStyle(0xffd700, 0.15);
        glow.fillCircle(shelf.x, shelf.y, 36);
        this.tweens.add({ targets: glow, alpha: { from: 0.3, to: 1 }, duration: 600, yoyo: true, repeat: -1 });
        this.add.text(shelf.x, shelf.y + 36, '\u2728 Glowing...', {
          fontSize: '8px', fontFamily: 'monospace', color: '#ffd700'
        }).setOrigin(0.5).setDepth(3);
      }

      this.interactables.push({
        sprite: { x: shelf.x, y: shelf.y, visible: true },
        range: 60,
        id: 'shelf-' + idx,
        action: () => this.onShelf(shelf.special, idx)
      });
    });
  }

  onShelf(isSpecial, idx) {
    if (isSpecial && !window.gameState.get('foundTreasureMap')) {
      this.onSpecialBookshelf();
    } else if (window.gameState.get('foundTreasureMap')) {
      this.dialogue.show([{ speaker: '', text: 'Just regular books. You already found the treasure map!' }]);
    } else {
      const msgs = [
        'Old books about history and math... Nothing special.',
        'Dusty pages about ancient kingdoms.',
        'A collection of fairy tales and legends.',
        'Books about farming and trade.',
        'Scrolls about the river and nearby villages.'
      ];
      this.dialogue.show([{ speaker: '', text: msgs[idx % msgs.length] }]);
    }
  }

  onSpecialBookshelf() {
    window.gameState.set('foundTreasureMap', true);
    this.player.freeze();

    const W = this.scale.width, H = this.scale.height;

    // Flash effect
    const flash = this.add.graphics().setDepth(300);
    flash.fillStyle(0xffd700, 0.3); flash.fillRect(0, 0, W, H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 800, onComplete: () => flash.destroy() });

    // Show map popup
    const dim = this.add.graphics().setDepth(290);
    dim.fillStyle(0x000000, 0.6); dim.fillRect(0, 0, W, H);

    const mapImg = this.add.image(W / 2, H / 2 - 30, 'obj-treasure-map').setScale(4).setAlpha(0).setDepth(300);
    this.tweens.add({ targets: mapImg, alpha: 1, scale: 5, duration: 600, ease: 'Back.easeOut' });

    const found = this.add.text(W / 2, H / 2 + 50, 'You found a TREASURE MAP!', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ffd700', fontStyle: 'bold',
      backgroundColor: '#00000088', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setAlpha(0).setDepth(300);
    this.tweens.add({ targets: found, alpha: 1, duration: 500, delay: 300 });

    const detail = this.add.text(W / 2, H / 2 + 80, 'It shows a path to a cave in the forest south of the village...', {
      fontSize: '11px', fontFamily: 'monospace', color: '#e8e0d0',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setAlpha(0).setDepth(300);
    this.tweens.add({ targets: detail, alpha: 1, duration: 500, delay: 600 });

    this.time.delayedCall(1500, () => {
      const cont = this.add.text(W / 2, H / 2 + 120, '[ Continue ]', {
        fontSize: '14px', fontFamily: 'monospace', color: '#d4a440', fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(300);
      cont.on('pointerover', () => cont.setColor('#ffffff'));
      cont.on('pointerout', () => cont.setColor('#d4a440'));
      cont.on('pointerdown', () => {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Town', { from: 'library' });
        });
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

    // Check nearest interactable
    this.nearestItem = null;
    const pos = this.player.getPosition();
    let best = Infinity;
    this.interactables.forEach(item => {
      const d = Phaser.Math.Distance.Between(pos.x, pos.y, item.sprite.x, item.sprite.y);
      if (d < item.range && d < best) { best = d; this.nearestItem = item; }
    });

    if (this.nearestItem) {
      this.interactIcon.setPosition(this.nearestItem.sprite.x, this.nearestItem.sprite.y - 30 + Math.sin(this.time.now / 300) * 3);
      this.interactIcon.setVisible(true);
    } else {
      this.interactIcon.setVisible(false);
    }

    // Exit check
    if (Phaser.Math.Distance.Between(pos.x, pos.y, this.exitZone.x, this.exitZone.y) < 50) {
      if (!this.interactIcon.visible) {
        this.interactIcon.setPosition(this.exitZone.x, this.exitZone.y - 20);
        this.interactIcon.setVisible(true);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.handleAction();
  }

  handleAction() {
    if (this.dialogue && this.dialogue.getIsActive()) { this.dialogue.advance(); return; }

    const pos = this.player.getPosition();

    // Exit
    if (Phaser.Math.Distance.Between(pos.x, pos.y, this.exitZone.x, this.exitZone.y) < 50) {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Town', { from: 'library' });
      });
      return;
    }

    if (this.nearestItem) this.nearestItem.action();
  }

  createMobileControls() {
    if (typeof MobileControls !== 'undefined') MobileControls.addDpadAndAction(this, this.player, () => this.handleAction());
  }
}
