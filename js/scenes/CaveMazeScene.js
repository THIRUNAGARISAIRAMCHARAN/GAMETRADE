/**
 * CaveMazeScene - Navigate a maze inside the cave to reach the treasure.
 * Uses recursive backtracking maze generation.
 * Player character sprite appears instead of a coin.
 */
class CaveMazeScene extends Phaser.Scene {
  constructor() { super('CaveMaze'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#0a0a0a');
    this.cameras.main.fadeIn(500);

    // Title
    this.add.text(W / 2, 18, 'NAVIGATE THE CAVE', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#c4a44a', fontStyle: 'bold'
    }).setOrigin(0.5);
    const mazeHint = this.sys.game.device.input.touch ? 'Use the D-pad or arrow keys to find the exit!' : 'Use arrow keys to find the exit!';
    this.add.text(W / 2, 38, mazeHint, {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(0.5);
    if (typeof LevelInfoUI !== 'undefined') LevelInfoUI.create(this);

    // Maze dimensions (must be odd)
    this.COLS = 21;
    this.ROWS = 13;
    this.CELL = 28;
    this.offsetX = Math.floor((W - this.COLS * this.CELL) / 2);
    this.offsetY = 55;

    // Generate and draw maze
    this.maze = this.generateMaze(this.COLS, this.ROWS);
    this.drawMaze();

    // Player - use character sprite instead of gold coin
    this.px = 1; this.py = 1;
    const charKey = window.gameState.get('selectedCharacter') || 'arnav';
    const startPixelX = this.offsetX + this.px * this.CELL + this.CELL / 2;
    const startPixelY = this.offsetY + this.py * this.CELL + this.CELL / 2;
    this.playerSprite = this.add.sprite(startPixelX, startPixelY, charKey, 0).setDepth(10);
    this.playerSprite.setDisplaySize(this.CELL - 4, this.CELL - 4);

    // Exit marker
    this.exitX = this.COLS - 2;
    this.exitY = this.ROWS - 2;
    this.maze[this.exitY][this.exitX] = 0; // ensure exit is open
    const ex = this.offsetX + this.exitX * this.CELL + this.CELL / 2;
    const ey = this.offsetY + this.exitY * this.CELL + this.CELL / 2;
    this.exitMarker = this.add.graphics();
    this.exitMarker.fillStyle(0xffd700, 0.5);
    this.exitMarker.fillCircle(ex, ey, 10);
    this.add.text(ex, ey, '\u2605', { fontSize: '16px', color: '#ffd700' }).setOrigin(0.5);

    // Tweens for exit glow
    this.tweens.add({ targets: this.exitMarker, alpha: { from: 0.3, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

    // Step counter
    this.steps = 0;
    this.stepText = this.add.text(W - 96, 18, 'Steps: 0', {
      fontSize: '11px', fontFamily: 'monospace', color: '#8a7a5a'
    }).setOrigin(1, 0);

    // Arrow key input (with rate limiting)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.moveDelay = 0;
    this.completed = false;
    this.mobileDir = { dx: 0, dy: 0 };
    this.createMobileControls();
    if (window.AudioManager) {
      window.AudioManager.resumeContext();
      window.AudioManager.startMazeMusic();
    }
  }

  shutdown() {
    // window.AudioManager.stopMazeMusic(); // Keep music playing
  }

  createMobileControls() {
    if (!this.sys.game.device.input.touch) return;
    const H = this.scale.height;
    const btns = [
      { k: 'dpad-up', x: 80, y: H - 120, dx: 0, dy: -1 },
      { k: 'dpad-down', x: 80, y: H - 40, dx: 0, dy: 1 },
      { k: 'dpad-left', x: 40, y: H - 80, dx: -1, dy: 0 },
      { k: 'dpad-right', x: 120, y: H - 80, dx: 1, dy: 0 }
    ];
    btns.forEach(b => {
      const img = this.add.image(b.x, b.y, b.k).setScrollFactor(0).setDepth(300).setAlpha(0.65).setInteractive({ useHandCursor: false });
      img.on('pointerdown', () => { this.mobileDir.dx = b.dx; this.mobileDir.dy = b.dy; });
      img.on('pointerup', () => { this.mobileDir.dx = 0; this.mobileDir.dy = 0; });
      img.on('pointerout', () => { this.mobileDir.dx = 0; this.mobileDir.dy = 0; });
    });
  }

  generateMaze(cols, rows) {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(1));
    const stack = [];
    const startX = 1, startY = 1;
    maze[startY][startX] = 0;
    stack.push({ x: startX, y: startY });

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];
      const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
      for (const [dx, dy] of dirs) {
        const nx = current.x + dx, ny = current.y + dy;
        if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && maze[ny][nx] === 1) {
          neighbors.push({ x: nx, y: ny, wx: current.x + dx / 2, wy: current.y + dy / 2 });
        }
      }
      if (neighbors.length > 0) {
        const next = Phaser.Utils.Array.GetRandom(neighbors);
        maze[next.wy][next.wx] = 0;
        maze[next.y][next.x] = 0;
        stack.push({ x: next.x, y: next.y });
      } else {
        stack.pop();
      }
    }
    return maze;
  }

  drawMaze() {
    this.mazeGraphics = this.add.graphics();
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const x = this.offsetX + c * this.CELL;
        const y = this.offsetY + r * this.CELL;
        if (this.maze[r][c] === 1) {
          this.mazeGraphics.fillStyle(0x4a4a4a);
          this.mazeGraphics.fillRect(x, y, this.CELL, this.CELL);
          this.mazeGraphics.fillStyle(0x3a3a3a);
          this.mazeGraphics.fillRect(x + 2, y + 2, this.CELL - 4, this.CELL - 4);
        } else {
          this.mazeGraphics.fillStyle(0x1a1a1a);
          this.mazeGraphics.fillRect(x, y, this.CELL, this.CELL);
        }
      }
    }
  }

  movePlayer() {
    const x = this.offsetX + this.px * this.CELL + this.CELL / 2;
    const y = this.offsetY + this.py * this.CELL + this.CELL / 2;
    this.playerSprite.setPosition(x, y);
  }

  update(time) {
    if (this.completed) return;
    if (time < this.moveDelay) return;

    let dx = 0, dy = 0;
    if (this.mobileDir.dx !== 0 || this.mobileDir.dy !== 0) {
      dx = this.mobileDir.dx;
      dy = this.mobileDir.dy;
    } else if (this.cursors.left.isDown) dx = -1;
    else if (this.cursors.right.isDown) dx = 1;
    else if (this.cursors.up.isDown) dy = -1;
    else if (this.cursors.down.isDown) dy = 1;
    else return;

    const nx = this.px + dx, ny = this.py + dy;
    if (nx >= 0 && nx < this.COLS && ny >= 0 && ny < this.ROWS && this.maze[ny][nx] === 0) {
      this.px = nx; this.py = ny;
      this.steps++;
      this.stepText.setText('Steps: ' + this.steps);
      this.movePlayer();

      // Update character facing frame based on direction
      const charKey = window.gameState.get('selectedCharacter') || 'arnav';
      if (dx < 0) this.playerSprite.setFrame(4);       // left
      else if (dx > 0) this.playerSprite.setFrame(8);   // right
      else if (dy < 0) this.playerSprite.setFrame(12);  // up
      else if (dy > 0) this.playerSprite.setFrame(0);   // down

      this.moveDelay = time + 120;

      // Check win
      if (this.px === this.exitX && this.py === this.exitY) {
        this.completed = true;
        this.onComplete();
      }
    }
  }

  onComplete() {
    window.gameState.set('completedMaze', true);
    const W = this.scale.width, H = this.scale.height;

    const msg = this.add.text(W / 2, H - 40, '\u2705 Maze Complete! You found the treasure chamber!', {
      fontSize: '13px', fontFamily: 'monospace', color: '#5a9c4f', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 500 });

    this.time.delayedCall(1500, () => {
      // if (window.AudioManager) window.AudioManager.stopMazeMusic(); // Keep music playing
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GoldMiner');
      });
    });
  }
}
