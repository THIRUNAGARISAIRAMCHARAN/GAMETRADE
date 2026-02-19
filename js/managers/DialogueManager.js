/**
 * DialogueManager - Handles NPC/story dialogue with typewriter effect.
 *
 * Usage:
 *   this.dialogue.show([
 *     { speaker: 'NPC', text: 'Hello!' },
 *     { speaker: 'NPC', text: 'Pick one:', choices: [...], onChoice: fn }
 *   ], onComplete);
 *
 * Input is handled by the SCENE (not here) — scene calls advance().
 */
class DialogueManager {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.nameText = null;
    this.messageText = null;
    this.promptText = null;

    this.messages = [];
    this.currentIndex = 0;
    this.isActive = false;
    this.isTyping = false;
    this.onComplete = null;
    this.fullText = '';
    this.typeTimer = null;
    this.choiceButtons = [];
  }

  create() {
    const { width, height } = this.scene.scale;

    this.container = this.scene.add.container(0, height - 160);
    this.container.setScrollFactor(0);
    this.container.setDepth(200);

    // Box background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.92);
    bg.fillRoundedRect(20, 0, width - 40, 150, 12);
    bg.lineStyle(2, 0xd4a440);
    bg.strokeRoundedRect(20, 0, width - 40, 150, 12);
    this.container.add(bg);

    // Speaker name
    this.nameText = this.scene.add.text(40, 10, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#d4a440',
      fontStyle: 'bold'
    });
    this.container.add(this.nameText);

    // Message body
    this.messageText = this.scene.add.text(40, 34, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      wordWrap: { width: width - 100 },
      lineSpacing: 4
    });
    this.container.add(this.messageText);

    // "Next" prompt
    this.promptText = this.scene.add.text(width - 80, 125, '▶ Next', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#aaaaaa'
    });
    this.container.add(this.promptText);

    this.container.setVisible(false);

    // Click anywhere on dialogue box to advance
    const { width: w } = this.scene.scale;
    const clickZone = this.scene.add.zone(w / 2, 75, w - 40, 150);
    clickZone.setInteractive();
    clickZone.on('pointerdown', () => {
      if (this.isActive && this.choiceButtons.length === 0) {
        this.advance();
      }
    });
    this.container.add(clickZone);
  }

  // ---- Public API ----

  show(messages, onComplete) {
    this.messages = messages;
    this.currentIndex = 0;
    this.onComplete = onComplete || null;
    this.isActive = true;
    this.container.setVisible(true);
    this.showCurrentMessage();
  }

  /** Called by the scene when player presses E / Space / clicks */
  advance() {
    if (!this.isActive) return;

    try { if (this.scene.cache.audio.exists('sfx_dialogue')) this.scene.sound.play('sfx_dialogue', { volume: 0.25 }); } catch (e) {}

    // If still typing, skip to full text
    if (this.isTyping) {
      this.finishTyping();
      return;
    }

    // If waiting for a choice, don't advance
    if (this.choiceButtons.length > 0) return;

    // Move to next message
    this.currentIndex++;
    if (this.currentIndex >= this.messages.length) {
      this.close();
    } else {
      this.showCurrentMessage();
    }
  }

  getIsActive() {
    return this.isActive;
  }

  // ---- Internal ----

  showCurrentMessage() {
    const msg = this.messages[this.currentIndex];
    if (!msg) { this.close(); return; }

    this.nameText.setText(msg.speaker || '');
    this.fullText = msg.text;
    this.messageText.setText('');
    this.promptText.setVisible(false);
    this.isTyping = true;
    this.clearChoices();

    // Typewriter effect
    let charIndex = 0;
    if (this.typeTimer) this.typeTimer.destroy();

    this.typeTimer = this.scene.time.addEvent({
      delay: 22,
      callback: () => {
        charIndex++;
        this.messageText.setText(this.fullText.substring(0, charIndex));
        if (charIndex >= this.fullText.length) {
          this.finishTyping();
        }
      },
      loop: true
    });
  }

  finishTyping() {
    this.isTyping = false;
    if (this.typeTimer) { this.typeTimer.destroy(); this.typeTimer = null; }
    this.messageText.setText(this.fullText);

    const msg = this.messages[this.currentIndex];
    if (msg && msg.choices) {
      this.showChoices(msg.choices, msg.onChoice);
    } else {
      this.promptText.setVisible(true);
    }
  }

  showChoices(choices, onChoice) {
    this.clearChoices();
    this.promptText.setVisible(false);

    const startY = 85;
    choices.forEach((choice, i) => {
      const btn = this.scene.add.text(60, startY + i * 28, '▸ ' + choice.text, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#d4a440'
      });
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setColor('#ffffff'));
      btn.on('pointerout', () => btn.setColor('#d4a440'));
      btn.on('pointerdown', () => {
        this.clearChoices();
        const prevMessages = this.messages;
        if (onChoice) onChoice(choice.value);
        // Only auto-advance if onChoice didn't start a new dialogue
        if (this.messages === prevMessages) {
          this.currentIndex++;
          if (this.currentIndex >= this.messages.length) {
            this.close();
          } else {
            this.showCurrentMessage();
          }
        }
      });
      this.container.add(btn);
      this.choiceButtons.push(btn);
    });
  }

  clearChoices() {
    this.choiceButtons.forEach(btn => btn.destroy());
    this.choiceButtons = [];
  }

  close() {
    this.isActive = false;
    this.container.setVisible(false);
    this.clearChoices();
    if (this.typeTimer) { this.typeTimer.destroy(); this.typeTimer = null; }
    if (this.onComplete) {
      const cb = this.onComplete;
      this.onComplete = null;
      cb();
    }
  }
}
