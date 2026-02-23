/**
 * MobileControls - Shared D-pad and action button for touch devices.
 * Call MobileControls.addDpadAndAction(scene, player, onAction) in scenes with walkable player.
 * onAction = function to run when E/action is pressed (e.g. scene.handleAction). Can be null to hide action btn.
 */
window.MobileControls = {
  addDpadAndAction(scene, player, onAction) {
    if (!scene.sys.game.device.input.touch) return;
    const W = scene.scale.width;
    const H = scene.scale.height;
    const btns = [
      { k: 'dpad-up',    x: 80,  y: H - 120, dx: 0,  dy: -1 },
      { k: 'dpad-down',  x: 80,  y: H - 40,  dx: 0,  dy: 1 },
      { k: 'dpad-left',  x: 40,  y: H - 80,  dx: -1, dy: 0 },
      { k: 'dpad-right', x: 120, y: H - 80,  dx: 1,  dy: 0 },
      { k: 'btn-action', x: W - 60, y: H - 80, act: true }
    ];
    btns.forEach(b => {
      if (b.act && onAction == null) return;
      const img = scene.add.image(b.x, b.y, b.k).setScrollFactor(0).setDepth(300).setAlpha(0.65).setInteractive({ useHandCursor: false });
      if (b.act) {
        img.on('pointerdown', () => { if (window.AudioManager) window.AudioManager.playClick(); onAction(); });
      } else {
        img.on('pointerdown', () => player.setMobileDirection(b.dx, b.dy));
        img.on('pointerup', () => player.setMobileDirection(0, 0));
        img.on('pointerout', () => player.setMobileDirection(0, 0));
      }
    });
  }
};
