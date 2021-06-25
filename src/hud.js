import Phaser from 'phaser';

export default class Hud {
  constructor(player, scene) {
    this.player = player;
    this.scene = scene;
    this.hearts = scene.add.group();
    for (let i = 0; i < this.player.hp; i++) {
      this.hearts.add(
        scene.add.sprite(30 + 30 * i, 50, 'heart').setScrollFactor(0).setScale(0.2),
      );
    }
    this.scoreText = scene.add.text(800, 20, 'score : 0', { fontSize: '32px', fill: '#632' })
      .setScrollFactor(0);
  }

  update() {
    this.hearts.children.iterate((heart, index) => {
      if (index < player.hp) {
        heart.setAlpha(1);
      } else {
        heart.setAlpha(0.5);
      }
    });
    this.scoreText.setText(`score : ${this.player.score}`);
  }
}
