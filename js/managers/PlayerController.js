/**
 * PlayerController - Handles player sprite, movement, and animation.
 * Supports keyboard (arrow keys) and mobile D-pad input.
 */
class PlayerController {
  constructor(scene, x, y, characterKey) {
    this.scene = scene;
    this.speed = 160;
    this.characterKey = characterKey;

    // Create physics sprite
    this.sprite = scene.physics.add.sprite(x, y, characterKey, 0);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setSize(18, 16);
    this.sprite.setOffset(7, 14);
    this.sprite.setDepth(10);

    // Keyboard input
    this.cursors = scene.input.keyboard.createCursorKeys();

    // Direction state
    this.facing = 'down';
    this.isMoving = false;

    // Mobile direction (set by D-pad buttons)
    this.mobileDir = { x: 0, y: 0 };

    // Build animations
    this.createAnimations();
  }

  createAnimations() {
    const key = this.characterKey;
    const anims = this.scene.anims;

    // Only create once per character key
    if (anims.exists(key + '-walk-down')) return;

    // Rows in the sprite sheet: 0=down, 1=left, 2=right, 3=up
    const dirs = ['down', 'left', 'right', 'up'];
    dirs.forEach((dir, row) => {
      anims.create({
        key: key + '-walk-' + dir,
        frames: anims.generateFrameNumbers(key, { start: row * 4, end: row * 4 + 3 }),
        frameRate: 8,
        repeat: -1
      });
    });
  }

  update() {
    if (!this.sprite || !this.sprite.body) return;

    const body = this.sprite.body;
    body.setVelocity(0);

    // Combine keyboard + mobile input
    let vx = this.mobileDir.x;
    let vy = this.mobileDir.y;

    if (this.cursors.left.isDown)  vx = -1;
    if (this.cursors.right.isDown) vx = 1;
    if (this.cursors.up.isDown)    vy = -1;
    if (this.cursors.down.isDown)  vy = 1;

    const key = this.characterKey;

    if (vx !== 0 || vy !== 0) {
      body.setVelocity(vx * this.speed, vy * this.speed);
      body.velocity.normalize().scale(this.speed);
      this.isMoving = true;

      // Determine facing direction (favor horizontal if equal)
      if (Math.abs(vx) >= Math.abs(vy)) {
        this.facing = vx < 0 ? 'left' : 'right';
      } else {
        this.facing = vy < 0 ? 'up' : 'down';
      }

      this.sprite.anims.play(key + '-walk-' + this.facing, true);
    } else {
      this.isMoving = false;
      this.sprite.anims.stop();

      // Idle frame (first frame of the facing direction)
      const idleFrames = { down: 0, left: 4, right: 8, up: 12 };
      this.sprite.setFrame(idleFrames[this.facing]);
    }
  }

  /** Called by mobile D-pad buttons */
  setMobileDirection(x, y) {
    this.mobileDir.x = x;
    this.mobileDir.y = y;
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  freeze() {
    if (this.sprite.body) this.sprite.body.setVelocity(0);
    this.sprite.anims.stop();
  }
}
