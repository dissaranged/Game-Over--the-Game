import { StateMachine } from './statemachine';

const InitialState = {
  enter({ sprite }) {
    sprite.play('idle');
  },
  execute({ cursors, sprite }) {
    const {
      left: { isDown: dLeft }, right: { isDown: dRight },
      up: { isDown: dUp }, down: { isDown: dDown },
      space: { isDown: dSpace }, shift: { isDown: dShift },
    } = cursors;
    if (sprite.body.touching.down) {
      sprite.play('die', false);
      if (dLeft || dRight) {
        this.transition('move');
      }
    }
  },
};

const HurtState = {
  enter(player, right) {
    const { sprite } = player;
    const { scene } = player;
    player.hp -= 1;
    scene.hud.update();
    scene.cameras.main.shake(200, 0.05);
    scene.cameras.main.zoomTo(1.13, 200);
    // scene.cameras.main.rotateTo(0.3* sprite.flipX ? -1 : 1, true, 200);
    sprite.play('hurt');
    sprite.setFlipX(right);
    sprite.setVelocityX(right ? 100 : -100);
    sprite.once('animationcomplete', () => {
      scene.cameras.main.zoomTo(1, 50);
      // scene.cameras.main.setRotation(0);
      if (player.hp < 0) {
        this.transition('die');
        return;
      }
      this.transition('idle');
    });
  },
};

const IdleState = {
  enter({ sprite }) {
    sprite.setVelocity(0);
    sprite.play('idle');
  },
  execute({ cursors, sprite }) {
    const { /** eslint-disable-region * */
      left: { isDown: dLeft }, right: { isDown: dRight },
      up: { isDown: dUp }, down: { isDown: dDown },
      space: { isDown: dSpace }, shift: { isDown: dShift },
    } = cursors;
    const {
      left: tLeft, right: tRight, down: tDown, up: tUp,
    } = sprite.body.touching;
    /** eslint-enable-region* */
    if ((tDown && dUp) || !tDown) {
      this.transition('jump', tDown);
      return;
    }
    if (dShift) {
      this.transition('punch');
      return;
    }
    if (tDown && (dLeft || dRight)) {
      this.transition('move');
    }
  },
};

const MoveState = {
  enter() {},
  execute({ cursors, sprite }) {
    const { /** eslint-disable-region * */
      left: { isDown: dLeft }, right: { isDown: dRight },
      up: { isDown: dUp }, down: { isDown: dDown },
      space: { isDown: dSpace }, shift: { isDown: dShift },
    } = cursors;
    const {
      left: tLeft, right: tRight, down: tDown, up: tUp,
    } = sprite.body.touching;
    /** eslint-enable-region* */
    if (dUp && tDown) {
      this.transition('jump', true);
      return;
    }
    if (!tDown) {
      this.transition('jump', false);
      return;
    }
    if (dLeft) {
      sprite.setVelocityX(-160)
        .anims.play('run', true)
        .setFlipX(true);
      return;
    }
    if (dRight) {
      sprite.setVelocityX(160)
        .anims.play('run', true)
        .setFlipX(false);
      return;
    }
    if (dShift) {
      this.transition('punch');
      return;
    }
    this.transition('idle');
  },
};

const DieState = {
  enter({ sprite, scene }) {
    sprite.play('die');
    scene.gameOver();
  },
};

const JumpState = {
  enter({ cursors, sprite }, doJump) {
    sprite.play('jump');
    if (doJump) sprite.setVelocityY(-230);
  },
  execute({ cursors, sprite }) {
    const { /** eslint-disable-region * */
      left: { isDown: dLeft }, right: { isDown: dRight },
      up: { isDown: dUp }, down: { isDown: dDown },
      space: { isDown: dSpace }, shift: { isDown: dShift },
    } = cursors;
    const {
      left: tLeft, right: tRight, down: tDown, up: tUp,
    } = sprite.body.touching;
    /** eslint-enable-region* */
    if (tDown) {
      this.transition('idle');
      return;
    }
    if (dLeft) {
      sprite.setFlipX(true);
      sprite.setVelocityX(-120);
      return;
    }
    if (dRight) {
      sprite.setFlipX(false);
      sprite.setVelocityX(120);
      return;
    }
    if (dShift) {
      this.transition('punch');
    }
  },
};

const PunchState = {
  enter({ sprite, cursors }) {
    if (sprite.body.touching.down) sprite.setVelocityX(0);
  },
  execute({ cursors, sprite }) {
    const { /** eslint-disable-region * */
      left: { isDown: dLeft }, right: { isDown: dRight },
      up: { isDown: dUp }, down: { isDown: dDown },
      space: { isDown: dSpace }, shift: { isDown: dShift },
    } = cursors;
    const {
      left: tLeft, right: tRight, down: tDown, up: tUp,
    } = sprite.body.touching;
    /** eslint-enable-region* */
    if (tDown) {
      sprite.play('punch', true);
      if (!dShift) {
        this.transition('idle');
        return;
      }
    }
    if (!tDown) {
      sprite.play('kick');
      if (!dShift) {
        this.transition('jump');
      }
    }
  },
};

export default class Player extends StateMachine {
  static preload(scene) {
    scene.load.spritesheet('eboy', './assets/eboy.png', { frameWidth: 256, frameHeight: 256 });
  }

  constructor(x, y, scene, cursors) {
    super('initial', {
      initial: InitialState,
      idle: IdleState,
      move: MoveState,
      jump: JumpState,
      hurt: HurtState,
      punch: PunchState,
      die: DieState,
    });
    this.hp = 3;
    this.score = 0;
    this.stateArgs = [this];
    this.scene = scene;
    this.cursors = cursors;
    const sprite = scene.physics.add.sprite(x, y, 'eboy')
	  .setScale(0.5)
	  .setBounce(0.2)
	  .setSize(128, 256)
	  .setDepth(5)
	  .setCollideWorldBounds(true);
    this.sprite = sprite;
    sprite.stateMachine = this;
    this.type = 'eboy';

    sprite.anims.create({
      key: 'idle',
      frames: [{ key: 'eboy', frame: 4 }],
      frameRate: 20,
    });

    sprite.anims.create({
      key: 'hurt',
      frames: [{ key: 'eboy', frame: 0 }],
      duration: 300,
    });

    sprite.anims.create({
      key: 'punch',
      frames: scene.anims.generateFrameNumbers('eboy', { start: 6, end: 11 }),
      frameRate: 20,
    });

    sprite.anims.create({
      key: 'die',
      frames: [{ key: 'eboy', frame: 24 }],
      repeat: -1,
    });

    sprite.anims.create({
      key: 'run',
      frames: sprite.anims.generateFrameNumbers('eboy', { start: 12, end: 22 }),
      frameRate: 20,
      repeat: -1,
    });

    sprite.anims.create({
      key: 'jump',
      frames: [{ key: 'eboy', frame: 23 }],
      repeat: -1,
    });

    sprite.anims.create({
      key: 'kick',
      frames: [{ key: 'eboy', frame: 5 }],
      repeat: -1,
    });
    return this;
  }
}
