import { StateMachine } from './statemachine';

const IdleState = {
  enter({ sprite }) {
    sprite.play('idle', true);
    sprite.setVelocityX(0);
  },
  execute({ sprite, player: { sprite: player } }) {
    if ((Math.abs(player.body.center.x - sprite.body.center.x) < 400)
	&& (Math.abs(player.y - sprite.y) < 400)) {
      this.transition('jump');
    }
  },
};

const JumpState = {
  enter({ sprite, player: { sprite: player } }, flee) {
    sprite.play('jump');
    if (flee) {
      if (sprite.body.center.x < player.body.center.x) {
        sprite.setVelocity(-250, -100);
        sprite.flipX = false;
      } else {
        sprite.setVelocity(250, -100);
        sprite.flipX = true;
      }
    }
  },
  execute({ sprite, player: { sprite: player } }) {
    if (sprite.body.touching.down) {
      if ((Math.abs(player.body.center.x - sprite.body.center.x) > 500)
	  || (Math.abs(player.body.center.y - sprite.body.center.y) > 500)) {
        this.transition('idle');
        return;
      }
      if (sprite.body.center.x > player.body.center.x) {
        sprite.setVelocity(-250, -100);
        sprite.flipX = false;
      } else {
        sprite.setVelocity(250, -100);
        sprite.flipX = true;
      }
    } else if (sprite.body.touching.right) {
      sprite.setVelocity(-150, -220);
      sprite.play('jump');
      sprite.flipX = false;
    } else if (sprite.body.touching.left) {
      sprite.setVelocity(150, -220);
      sprite.play('jump');
      sprite.flipX = true;
    }
  },
};

const DieState = {
  enter({ sprite, player, scene }) {
    sprite.play('die', true);
    sprite.body.moves = false;
    player.score += 100;
    scene.hud.update()
    sprite.once(
      'animationcomplete',
      () => sprite.disableBody(true, true),
    );
  },
};

export default class Elli extends StateMachine {
  static preload(scene) {
    scene.load.spritesheet('elli', './assets/elli.png', { frameWidth: 256, frameHeight: 256 });
  }

  constructor(x, y, scene, player) {
    super('idle', {
      idle: IdleState,
      jump: JumpState,
      die: DieState,
    });
    this.stateArgs = [this];
    this.scene = scene;
    this.player = player;
    this.type = 'elli';
    const sprite = scene.physics.add.sprite(x, y, 'elli')
	  .setScale(0.5)
	  .setBounce(0.5)
	  .setDepth(5)
	  .setSize(256, 128)
	  .setCollideWorldBounds(true);
    this.sprite = sprite;
    sprite.stateMachine = this;
    sprite.anims.create({
      key: 'jump',
      frames: scene.anims.generateFrameNumbers('elli', { start: 55, end: 63 }),
      frameRate: 20,
    });

    sprite.anims.create({
      key: 'die',
      frames: scene.anims.generateFrameNumbers('elli', { start: 24, end: 50 }),
      frameRate: 20,
    });

    sprite.anims.create({
      key: 'idle',
      frames: scene.anims.generateFrameNumbers('elli', { start: 0, end: 24 }),
      frameRate: 20,
      repeat: -1,
    });

    return this;
  }

  collideHandler(player, enemie) {
    const enemieState = enemie.stateMachine.state;
    const playerState = player.stateMachine.state;
    if (playerState === 'hurt') {
      enemie.stateMachine.transition('jump', true);
      return;
    }

    if (playerState === 'punch' && (
      (player.body.touching.left && player.flipX)
	|| (player.body.touching.right && !player.flipX))) {
      enemie.stateMachine.transition('die');
    } else {
      player.stateMachine.transition('hurt');
    }
  }
}
