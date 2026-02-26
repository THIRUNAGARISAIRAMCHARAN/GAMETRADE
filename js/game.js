const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  pixelArt: true,
  input: {
    touch: { capture: true }
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [
    BootScene, CharacterSelectScene, TownScene,
    LibraryScene, CaveMazeScene, GoldMinerScene, RiverScene,
    BankVillageScene, BankInteriorScene,
    DepositScene, WithdrawScene, InterestScene, ATMScene,
    HouseInteriorScene, MarketScene, NeedsWantsGameScene, GameEndScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
const game = new Phaser.Game(config);
// Ensure canvas is centered on load and resize
game.events.once('ready', () => {
  game.scale.refresh();
});
window.addEventListener('resize', () => game.scale.refresh());
