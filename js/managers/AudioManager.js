/**
 * AudioManager - Procedural sounds via Web Audio API.
 * Cheering BG music, character select, river, maze, coins, dig, click, win, achievement.
 */
window.AudioManager = (function () {
  let scene = null;
  let bgMusic = null;

  /** Initialize with a Phaser scene context */
  function init(pScene) {
    scene = pScene;
  }

  /** Resume audio context (often required on first interaction) */
  function resumeContext() {
    try {
      if (scene && scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
        scene.sound.resume();
      }
    } catch (e) {
      console.warn("AudioManager: Failed to resume context", e);
    }
  }

  function startMusic() {
    try {
      if (scene && scene.sound && !bgMusic) {
        bgMusic = scene.sound.add('school-road', { loop: true, volume: 0.05 });
        bgMusic.play();
      }
    } catch (e) {
      console.warn("AudioManager: Failed to start music", e);
    }
  }

  function stopMusic() {
    try {
      if (bgMusic) {
        bgMusic.stop();
        bgMusic = null;
      }
    } catch (e) {
      console.warn("AudioManager: Failed to stop music", e);
    }
  }

  // Defunct SFX methods kept as no-ops for compatibility with other scenes
  function playClick() { }
  function playCharacterSelect() { }
  function playCoinIn() { }
  function playCoinOut() { }
  function playDig() { }
  function playWin() { }
  function playAchievement() { }
  function startRiverSound() { }
  function stopRiverSound() { }
  function startMazeMusic() { startMusic(); }
  function stopMazeMusic() { stopMusic(); }
  function startWalkingSound() { }
  function stopWalkingSound() { }
  function startAmbientBirds() { }
  function setAmbientVolume() { }

  return {
    init,
    resumeContext,
    playClick,
    playCharacterSelect,
    playCoinIn,
    playCoinOut,
    playDig,
    playWin,
    playAchievement,
    startMusic,
    stopMusic,
    startRiverSound,
    stopRiverSound,
    startMazeMusic,
    stopMazeMusic,
    startWalkingSound,
    stopWalkingSound,
    startAmbientBirds,
    setAmbientVolume
  };
})();
