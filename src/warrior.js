import { StateMachine } from './statemachine';

const IdleState = {
  enter({ sprite }) {
    sprite.play('idle', true);
    sprite.setVelocityX(0);
  },
  execute({ sprite, player: { sprite: player } }) {
    if ((Math.abs(player.x - sprite.x) < 400)
	&& (Math.abs(player.y - sprite.y) < 400)) {
      this.transition('alert');
    }
  },
};

const AttackState = {
  enter({ sprite, player: { sprite: player } }) {
    if (player.x < sprite.x) {
      sprite.setVelocityX(-100);
    } else {
      sprite.setVelocityX(100);
    }
    (random(100) % 2 == 0) ? sprite.play('kick') : sprite.play('punch');
    sprite.once('animationcomplete', () => this.transition('alert'));
  },
};

const BlockState = {
  enter({ sprite, player: { sprite: player } }) {
    sprite.setVelocityX(0);
    sprite.play('block');
    sprite.once('animationcomplete', () => this.transition('alert'));
  },
};

const MoveState = {
  enter({ sprite, player: { sprite: player } }) {
    if (player.x < sprite.x) {
      sprite.setVelocityX(-200);
    } else {
      sprite.setVelocityX(200);
    }
  },
  execute({ sprite, player: { sprite: player } }) {
    if ((Math.abs(player.x - sprite.x) < 256)
       && (Math.abs(player.y - sprite.y) < 256)) {
      this.transition('alert');
    }
  },
};

const AlertState = {
  enter({ sprite, player: { sprite: player } }) {
    if (player.body.center.x < sprite.body.center.x) {
      sprite.setVelocityX(30)
        .setFlipX(true);
    } else {
      sprite.setVelocityX(-30)
      	.setFlipX(false);
    }
    sprite.play('idle');
    sprite.once('animationcomplete', () => {
      if ((Math.abs(player.x - sprite.x) < 64)
	 && (Math.abs(player.y - sprite.y) < 128)) {
        this.transition('block');
      } else if ((Math.abs(player.x - sprite.x) < 128)
	 && (Math.abs(player.y - sprite.y) < 128)) {
        this.transition('attack');
      } else {
        this.transition('move');
      }
    });
  },
  execute({ sprite, player: { sprite: player } }) {
    if (sprite.body.touching.down) {
      if ((Math.abs(player.x - sprite.x) > 1024)
	  || (Math.abs(player.y - sprite.y) > 1024)) {
        this.transition('idle');
      }
    }
  },
};

const DieState = {
  enter({ sprite }) {
    sprite.play('die', true);
    sprite.body.moves = false;
    sprite.once(
      'animationcomplete',
      () => sprite.disableBody(true, true),
    );
  },
};

export default class Warrior extends StateMachine {
  static preload(scene) {
    scene.load.spritesheet('warrior', './assets/warrior.png', { frameWidth: 256, frameHeight: 256 });
  }

  constructor(x, y, scene, player) {
    super('idle', {
      idle: IdleState,
      attack: AttackState,
      block: BlockState,
      alert: AlertState,
      move: MoveState,
      die: DieState,
    });
    this.stateArgs = [this];
    this.scene = scene;
    this.player = player;
    this.type = 'warrior';
    const sprite = scene.physics.add.sprite(x, y, 'warrior')
	  .setScale(0.5)
	  .setBounce(0.1)
	  .setSize(256, 256)
	  .setFriction(2, 0)
    	  .setDepth(5)
	  .setCollideWorldBounds(true);
    this.sprite = sprite;
    sprite.stateMachine = this;

    sprite.anims.create({
      key: 'hurt',
      frames: [{ key: 'warrior', frame: 40 }],
      duration: 5000,
    });
    sprite.anims.create({
      key: 'punch',
      frames: [{ key: 'warrior', frame: 43 }],
      repeat: 1,
      duration: 300,
    });
    sprite.anims.create({
      key: 'kick',
      frames: [{ key: 'warrior', frame: 42 }],
      duration: 500,

    });
    sprite.anims.create({
      key: 'block',
      frames: [{ key: 'warrior', frame: 0 }],
      duration: 1000,
    });
    sprite.anims.create({
      key: 'jump',
      frames: [{ key: 'warrior', frame: 41 }],
      frameRate: 20,
      repeat: -1,
    });

    sprite.anims.create({
      key: 'die',
      frames: scene.anims.generateFrameNumbers('warrior', { start: 1, end: 39 }),
      frameRate: 20,
    });

    sprite.anims.create({
      key: 'idle',
      frames: scene.anims.generateFrameNumbers('warrior', { start: 44, end: 56 }),
      frameRate: 20,
    });

    return this;
  }

  collideHandler(player, enemie) {
    const enemieState = enemie.stateMachine.state;
    const playerState = player.stateMachine.state;
    if ((enemie.flipX && enemie.body.touching.left)
	|| (!enemie.flipX && enemie.body.touching.right)) {
      if (enemieState === 'attack') {
        if (playerState !== 'hurt') {
	  player.stateMachine.transition('hurt', player.body.touching.right);
	  return;
        }
      }
      if (enemieState !== 'block' && playerState === 'punch') {
        enemie.stateMachine.transition('die');
      }
    }
  }
}
