/**
 * CharacterSelectScene - Player picks Arnav or Ananya.
 */
class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super('CharacterSelect');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.fadeIn(600);
    this.cameras.main.setBackgroundColor('#0d0d1a');

    // Title
    this.add.text(width / 2, 55, 'ROYAL BANK OF AURUMVALE', {
      fontSize: '26px',
      fontFamily: 'Georgia, serif',
      color: '#d4a440',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 95, 'Choose Your Character', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Character cards
    this.createCard(width / 2 - 130, height / 2 + 10, 'arnav', 'Arnav');
    this.createCard(width / 2 + 130, height / 2 + 10, 'ananya', 'Ananya');

    // Instruction
    this.add.text(width / 2, height - 50, 'Click a character to begin your adventure!', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#777777'
    }).setOrigin(0.5);
  }

  createCard(x, y, key, name) {
    // Card background
    const card = this.add.graphics();
    this.drawCard(card, x, y, false);

    // Character preview (scaled up)
    const sprite = this.add.sprite(x, y - 10, key, 0).setScale(3);

    // Floating idle bob
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 5,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Name label
    this.add.text(x, y + 60, name, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Click zone
    const zone = this.add.zone(x, y + 10, 170, 210).setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => this.drawCard(card, x, y, true));
    zone.on('pointerout', () => this.drawCard(card, x, y, false));
    zone.on('pointerdown', () => {
      try { if (this.cache.audio.exists('sfx_click')) this.sound.play('sfx_click', { volume: 0.3 }); } catch (e) {}
      window.gameState.set('selectedCharacter', key);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Town');
      });
    });
  }

  drawCard(gfx, x, y, hover) {
    gfx.clear();
    gfx.fillStyle(hover ? 0x3a3a6e : 0x222244, 0.85);
    gfx.fillRoundedRect(x - 85, y - 95, 170, 210, 14);
    gfx.lineStyle(hover ? 3 : 2, hover ? 0xffd700 : 0xd4a440);
    gfx.strokeRoundedRect(x - 85, y - 95, 170, 210, 14);
  }
}
