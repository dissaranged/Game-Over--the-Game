
import { StateMachine } from './statemachine';

const InitialState = {
  enter({sprite}) {
    sprite.play('idle');
  },
  execute({cursors, sprite}) {
    const { 
      left: { isDown: dLeft },  right: {isDown: dRight},
      up: {isDown: dUp}, down: {isDown: dDown},
      space: {isDown: dSpace}, shift: {isDown: dShift},
    } = cursors;
    if(sprite.body.touching.down) {
      sprite.play('die', false);
      if(dLeft || dRight) {
	this.stateMachine.transition('move')
      }
    }    
  }  
}

const IdleState = {
  enter({ sprite }) {
    sprite.setVelocity(0);
    sprite.play('idle');
  },
  execute({ cursors, sprite }) {
    const { /**eslint-disable-region **/
      left: { isDown: dLeft },  right: {isDown: dRight},
      up: {isDown: dUp}, down: {isDown: dDown},
      space: {isDown: dSpace}, shift: {isDown: dShift},
    } = cursors;
    const {
      left: tLeft, right: tRight, down: tDown, up: tUp,
    } = sprite.body.touching;
    /**eslint-enable-region**/
    if ((tDown && dUp) || !tDown) {
      this.stateMachine.transition('jump', tDown);
      return;
    }
    if (dShift) {
      this.stateMachine.transition('punch');
      return;
    }
    if (tDown && (dLeft || dRight)) {
      this.stateMachine.transition('move');
    }
  },
};

const MoveState = {
  enter() {},
  execute({ cursors, sprite }) {
    const { /**eslint-disable-region **/
      left: { isDown: dLeft },  right: {isDown: dRight},
      up: {isDown: dUp}, down: {isDown: dDown},
      space: {isDown: dSpace}, shift: {isDown: dShift},
    } = cursors;
    const {
      left: tLeft, right: tRight, down: tDown, up: tUp,
    } = sprite.body.touching;
    /**eslint-enable-region**/
    if(dUp && tDown) {
      this.stateMachine.transition('jump', true);
      return;
    }
    if(!tDown) {
      this.stateMachine.transition('jump', false);
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
    if(dShift) {
      this.stateMachine.transition('punch');
      return;
    }
    this.stateMachine.transition('idle');
  },
};

const JumpState = {
  enter({cursors, sprite}, doJump) {
    sprite.play('jump');
    if(doJump)
      sprite.setVelocityY(-330);
  },
  execute({cursors, sprite}) {
    const { /**eslint-disable-region **/
      left: { isDown: dLeft },  right: {isDown: dRight},
      up: {isDown: dUp}, down: {isDown: dDown},
      space: {isDown: dSpace}, shift: {isDown: dShift},
    } = cursors;
    const {
      left: tLeft, right: tRight, down: tDown, up: tUp,
    } = sprite.body.touching;
    /**eslint-enable-region**/
    if(tDown) {
      this.stateMachine.transition('idle');
      return;
    }
    if(dLeft) {
      sprite.setFlipX(true);
      sprite.setVelocityX(-60);
      return;
    }
    if(dRight) {
      sprite.setFlipX(false);
      sprite.setVelocityX(60);
      return
    }
    if(dShift) {
      this.stateMachine.transition('punch');
      return;
    }
  },
}

const PunchState = {
  enter({sprite}) {
    sprite.setVelocityX(0);
  },
  execute({cursors, sprite}) {
    const { /**eslint-disable-region **/
      left: { isDown: dLeft },  right: {isDown: dRight},
      up: {isDown: dUp}, down: {isDown: dDown},
      space: {isDown: dSpace}, shift: {isDown: dShift},
    } = cursors;
    const {
      left: tLeft, right: tRight, down: tDown, up: tUp,
    } = sprite.body.touching;
    /**eslint-enable-region**/
    if(tDown) {
      sprite.play('punch', true)
      if(!dShift) {
	this.stateMachine.transition('idle');
	return;
      }
    }
    if(!tDown) {
      sprite.play('kick')
      if(!dShift) {
	this.stateMachine.transition('jump');
	return;
      }
    }
  },
}

export default class Player extends StateMachine{
  static preload(scene) {
    scene.load.spritesheet('eboy', './assets/eboy.png', { frameWidth: 256, frameHeight: 256 });
  }

  constructor(scene, cursors) {
    super('initial', {
      initial: InitialState,
      idle: IdleState,
      move: MoveState,
      jump: JumpState,
      punch: PunchState,
    });
    this.stateArgs = [this]
    this.scene = scene;
    this.cursors = cursors;
    const sprite = scene.physics.add.sprite(100, 100, 'eboy')
	  .setScale(0.5)
	  .setBounce(0.2)
	  .setSize(128,256)
	  .setCollideWorldBounds(true);
    this.sprite = sprite;

    sprite.anims.create({
      key: 'idle',
      frames: [{ key: 'eboy', frame: 4 }],
      frameRate: 20,
    });

    sprite.anims.create({
      key: 'punch',
      frames: scene.anims.generateFrameNumbers('eboy', { start: 6, end: 11}),
      frameRate: 20,
    });

    sprite.anims.create({
      key: 'die',
      frames: [{key: 'eboy', frame: 24 }],
      frameRate: 5,
      repeat: -1,
    });
    
    sprite.anims.create({
      key: 'run',
      frames: sprite.anims.generateFrameNumbers('eboy', { start: 12, end: 22}),
      frameRate: 20,
      repeat: -1,
    });

    sprite.anims.create({
      key: 'jump',
      frames: [{ key: 'eboy', frame: 23 }],
      frameRate: 20,
      repeat: -1,
    });

    sprite.anims.create({
      key: 'kick',
      frames: [{ key: 'eboy', frame: 5}],
      frameRate: 20,
      repeat: -1,
    });
    return this;
  }
}
