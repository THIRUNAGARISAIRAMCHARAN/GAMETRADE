/**
 * LevelInfoUI - Top-right button to show current level and total levels.
 * Call LevelInfoUI.create(scene) from any playable scene's create().
 */
const LevelInfoUI = {
  create(scene) {
    const W = scene.scale.width;
    const btn = scene.add.text(W - 12, 12, '\uD83D\uDCDA Levels', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a7a5a',
      backgroundColor: '#00000099', padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#d4a440'));
    btn.on('pointerout', () => btn.setColor('#8a7a5a'));
    btn.on('pointerdown', () => { if (window.AudioManager) window.AudioManager.playClick(); LevelInfoUI.showPopup(scene); });
  },

  showPopup(scene) {
    const gs = window.gameState;
    const current = gs.getCurrentLevel();
    const total = gs.getTotalLevels();
    const title = gs.getLevelTitle(current);

    const W = scene.scale.width;
    const H = scene.scale.height;
    const layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(2000);
    const dim = scene.add.graphics();
    dim.fillStyle(0x000000, 0.6);
    dim.fillRect(0, 0, W, H);
    layer.add(dim);

    const closePopup = () => { if (window.AudioManager) window.AudioManager.playClick(); layer.destroy(); };
    const backdropZone = scene.add.zone(W / 2, H / 2, W, H).setScrollFactor(0).setInteractive({ useHandCursor: true });
    backdropZone.on('pointerdown', closePopup);
    layer.add(backdropZone);

    const panelW = 320;
    const panelH = 180;
    const px = W / 2;
    const py = H / 2;
    const panel = scene.add.graphics();
    panel.fillStyle(0x2a1a10, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 12);
    panel.lineStyle(2, 0xd4a440);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 12);
    layer.add(panel);

    layer.add(scene.add.text(px, py - 65, 'Level Progress', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#d4a440', fontStyle: 'bold'
    }).setOrigin(0.5));

    layer.add(scene.add.text(px, py - 30, 'Current level: ' + current + ' of ' + total, {
      fontSize: '14px', fontFamily: 'monospace', color: '#e8e0d0'
    }).setOrigin(0.5));

    layer.add(scene.add.text(px, py + 10, title, {
      fontSize: '12px', fontFamily: 'monospace', color: '#c4a44a', align: 'center', wordWrap: { width: panelW - 24 }
    }).setOrigin(0.5));

    const closeBtn = scene.add.text(px, py + 55, '[ Close ]', {
      fontSize: '13px', fontFamily: 'monospace', color: '#d4a440'
    }).setOrigin(0.5).setScrollFactor(0);
    closeBtn.setInteractive({ useHandCursor: true, pixelPerfect: false });
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#d4a440'));
    closeBtn.on('pointerdown', closePopup);
    layer.add(closeBtn);
  }
};
