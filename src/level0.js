import Phaser from 'phaser';

import Player from './player';
import Elli from './elli';
import Warrior from './warrior';

import Hud from './hud';

const debug = !!window.location.search.match(/debug/);

export default class Level extends Phaser.Scene {
  constructor() {
    super('Level 0');
    this.width = 1024 * 8;
    this.height = 1024;
  }

  preload() {
    this.load.image('skyscraper', './assets/skyscraper.png');
    this.load.image('houses', './assets/houses.png');
    this.load.spritesheet('ground', './assets/platform.png', { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet('coin', './assets/coin.png', { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet('heart', './assets/heart.png', { frameWidth: 200, frameHeight: 200 });
    this.load.image('bomb', './assets/bomb.png');
    Player.preload(this);
    Elli.preload(this);
    Warrior.preload(this);
  }

  createElli(x, y) {
    const elli = new Elli(x, y, this, this.player);
    this.enemies.add(elli.sprite);
  }

  createWarrior(x, y) {
    const warrior = new Warrior(x, y, this, this.player);
    this.enemies.add(warrior.sprite);
  }

  createCoin(x, y) {
    this.coins.add(
      this.physics.add.sprite(x, y, 'coin')
        .setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
        .setScale(0.2)
        .play('coin'),
    );
  }

  createHearts(x, y) {
    this.hearts.add(
      this.physics.add.sprite(x, y, 'heart')
      	.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
        .setScale(0.2)
        .play('heart'),
    );
  }

  createPlatform(x, y, width) {
    console.log('platform', x, y, width);
    // first
    this.add.tileSprite(x, y, 256, 256, 'ground', 0)
      .setOrigin(0, 0)
      .setScale(0.25)
      .setDepth(0)
    ;
    // last
    this.add.tileSprite(x + (width - 1) * 256 / 4, y, 256, 256, 'ground', 2)
      .setOrigin(0, 0)
      .setScale(0.25)
      .setDepth(0)
    ;
    // middle
    if (width > 2) {
      this.add.tileSprite(x + 256 / 4, y, 256 * (width - 2), 256, 'ground', 1)
        .setOrigin(0, 0)
        .setScale(0.25)
        .setDepth(0);
    }
    // solid ground
    const platform = this.add.rectangle(x, y + 10, width * 256 / 4, 54, debug ? 0x337788 : undefined, 0.5).setOrigin(0, 0);
    platforms.add(platform);

    this.platforms.add(platform);
  }

  createLevel() {
    this.anims.create({
      key: 'coin',
      frames: 'coin',
      frameRate: 20,
      repeat: -1,
    });

    this.anims.create({
      key: 'heart',
      frames: 'heart',
      frameRate: 20,
      repeat: -1,
    });

    this.createPlatform(20, 900, 25);
    this.createElli(500, 700);
  }

  create() {
    // level
    this.cameras.main.setBounds(0, 0, this.width, this.height);
    this.physics.world.setBounds(1, 1, this.width - 1, this.height - 1);

    // background
    const skyscraper = this.add.tileSprite(0, 444, this.width, 586, 'skyscraper').setOrigin(0, 0);
    skyscraper.scrollFactorX = 0.7;
    const houses = this.add.tileSprite(0, 555, this.width, 386, 'houses').setOrigin(0, 0);
    houses.scrollFactorX = 0.9;

    //
    const cursors = this.input.keyboard.createCursorKeys();
    const platforms = this.physics.add.staticGroup();
    const player = new Player(100, 100, this, cursors);
    const hud = new Hud(player, this);
    const enemies = this.physics.add.group();
    const coins = this.physics.add.group();
    const hearts = this.physics.add.group();

    this.cameras.main.startFollow(player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);

    // colliders
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(player.sprite, platforms);
    this.physics.add.collider(coins, platforms);
    this.physics.add.collider(hearts, platforms);

    this.physics.add.overlap(player.sprite, coins,
			     this.collectCoin,
			     null,
			     this);
    this.physics.add.overlap(player.sprite, hearts,
			     this.collectHeart,
			     () => this.player.hp >= 3,
			     this);
    this.physics.add.overlap(player.sprite, enemies, this.hitEnemie, null, this);

    // export for debug and assignments
    window.scene = this;
    window.platforms = this.platforms = platforms;
    window.player = this.player = player;
    window.cursors = this.cursors = cursors;
    window.enemies = this.enemies = enemies;
    window.coins = this.coins = coins;
    window.hearts = this.hearts = hearts;
    window.hud = this.hud = hud;

    // create Level Objects
    this.createLevel();
  }

  update() {
    // if (gameOver) return;
    enemies.children.iterate((enemie) => enemie.stateMachine.step());
    // player actions
    this.player.step();
    // respawn when player falls
    if (player.sprite.y > this.height - 90) {
      this.player.sprite.y = 100;
      this.player.sprite.x = player.sprite.x - 500;
      this.player.sprite.setVelocity(0, 0);
      this.player.transition('initial');
    }
  }

  hitEnemie(player, enemie) {
    if (enemie.stateMachine.state === 'die') return;
    enemie.stateMachine.collideHandler(player, enemie);
  }

  collectHeart(player, heart) {
    heart.disableBody(true, true);
    player.hp += 1;
    this.hud.update();
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    player.score += 10;
    this.hud.update();
  }

  gameOver() {
    this.cameras.main.zoomTo(4, 3000);
    this.physics.pause();
  }
}
