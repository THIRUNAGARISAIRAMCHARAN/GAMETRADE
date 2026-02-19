/**
 * WalletSystem - Displays coin count as a HUD element.
 * Supports show/hide, animated coin addition, and live updates.
 */
class WalletSystem {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.coinText = null;
    this.visible = false;
  }

  create() {
    this.container = this.scene.add.container(10, 10);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(0, 0, 160, 44, 10);
    bg.lineStyle(2, 0xd4a440);
    bg.strokeRoundedRect(0, 0, 160, 44, 10);
    this.container.add(bg);

    // Coin icon (double circle)
    const coinIcon = this.scene.add.graphics();
    coinIcon.fillStyle(0xffd700);
    coinIcon.fillCircle(24, 22, 12);
    coinIcon.fillStyle(0xdaa520);
    coinIcon.fillCircle(24, 22, 8);
    coinIcon.lineStyle(1, 0xb8860b);
    coinIcon.strokeCircle(24, 22, 12);
    this.container.add(coinIcon);

    // Text
    this.coinText = this.scene.add.text(44, 12, '0 coins', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.container.add(this.coinText);

    this.container.setVisible(false);
  }

  show() {
    this.visible = true;
    this.container.setVisible(true);
    this.update();
  }

  hide() {
    this.visible = false;
    this.container.setVisible(false);
  }

  update() {
    if (this.coinText && this.visible) {
      const coins = window.gameState.get('coins');
      this.coinText.setText(coins + ' coins');
    }
  }

  /** Add coins with a bounce animation */
  animateAdd(amount) {
    window.gameState.addCoins(amount);
    this.update();

    if (this.container) {
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Bounce'
      });
    }
  }
}
