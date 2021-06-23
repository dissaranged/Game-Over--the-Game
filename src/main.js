import Phaser from 'phaser';
import Player from './player';
import Elli from './elli';
import {random} from './helpers'
window.random = random
const debug = !!window.location.search.match(/debug/);
let gameOver = false;
const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 600,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

let player;
let enemies = [];
let coins;
let platforms;
let cursors;
let score = 0;
let scoreText;
const game = new Phaser.Game(config);
function preload() {
  this.load.image('skyscraper', './assets/skyscraper.png');
  this.load.image('houses', './assets/houses.png');
  this.load.image('ground', './assets/platform.png');
  this.load.spritesheet('coin', './assets/coin.png', { frameWidth: 200, frameHeight: 200 });
  this.load.image('bomb', './assets/bomb.png');
  Player.preload(this);
  Elli.preload(this);
}

const world_width = 1024 * 8;
const world_height = 1024;

function createLevel(x, y, width) {
  const level = []
  while(x<=world_width ) {
    x += width + random(150) - 200;
    width = (random(5)+1)*120;
    let newY;
    do {
      console.log(y, newY, (newY < 400) || (newY > world_height) );
      newY = y + random(150) * (random(2)-1 < 0 ? 1 : -1)
    } while ( (newY < 400) || (newY > world_height) );
    y = newY;
    console.log('platform : ', x,y,width)
    const dice = random(100)
    const entities = []
    if(dice %5 ==0) {
      entities.push('elli')
    }
    if(dice%7 == 0) {
      entities.push('coin');
    }
    level.push({x, y, width, entities});

  }
  return level;
}

function create() {

  this.cameras.main.setBounds(0, 0, world_width, world_height);
  this.physics.world.setBounds(1, 1, world_width-1, world_height-1);

  const skyscraper = this.add.tileSprite(0, 444, world_width, 586, 'skyscraper').setOrigin(0, 0);
  skyscraper.scrollFactorX = 0.7;
  const houses = this.add.tileSprite(0, 555, world_width, 386, 'houses').setOrigin(0, 0);
  houses.scrollFactorX = 0.9;
  const enemieBodies = this.physics.add.group();
  platforms = this.physics.add.staticGroup();
  window.scene = this;
  window.platforms = platforms;

  cursors = this.input.keyboard.createCursorKeys();
  window.cursors = cursors;
  player = new Player(100, 100, this, cursors);
  // player = new Player(1300, 100, this, cursors); 
  this.cameras.main.startFollow(player.sprite, true, 0.08, 0.08);
  this.cameras.main.setZoom(1);
  const scene = this
  coins = this.physics.add.group({
    key: 'coin',
    repeat: 11,
    setXY: { x: 300, y: 100, stepX: 90 },
  });

  const createElli = (x,y) => {
    const elli = new Elli(x, y, scene, player)
    enemieBodies.add(elli.sprite);
    enemies.push(elli)
  }

  const createCoin= (x, y) => {
    coins.add(scene.physics.add.sprite( x, y, 'coin'))
  }
  
  
  const level =[
    { x: 0, y: 900, width: 777, entities: []},
    { x: 300, y: 666, width: 120, entities: [] },
    { x: 600, y: 800, width: 200, entities: [] },
    { x: 700, y: 555, width: 260, entities: [] },
    { x: 900, y: 777, width: 260, entities: [] },
    { x: 1170, y: 727, width: 260, entities: [] },
    ...createLevel(1170, 727, 260)
  ]
  console.log(level)

  level.forEach(({ x, y, width, entities }) => {
    this.add.tileSprite(x, y, width * 2, 86, 'ground').setOrigin(0, 0).setScale(0.5);
    const platform = this.add.rectangle(x, y + 8, width, 35, debug ? 0x337788 : undefined, 0.5).setOrigin(0, 0);
    platforms.add(platform);
    entities.forEach( key => {
      switch(key) {
      case 'elli' :
	createElli(x+random(width), y-300);
	break;
      case 'coin':
	createCoin(x+random(width), y-300)
	break
      default:
	console.log('unknown entitie :', key)
      }
    })
  });
  
  this.anims.create({
    key: 'rotate',
    frames: 'coin',
    frameRate: 20,
    repeat: -1,
  });

  coins.children.iterate((child) => {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    child.setScale(0.2);
    child.play('rotate');
  });

  this.physics.add.collider(player.sprite, platforms);
  this.physics.add.collider(coins, platforms);
  this.physics.add.overlap(player.sprite, coins, collectStar, null, this);

  createElli(800,300);

  this.physics.add.collider(enemieBodies, platforms);
  this.physics.add.overlap(player.sprite, enemieBodies, hitBomb, null, this);

  scoreText = this.add.text(20, 20, 'score : 0', { fontSize: '32px', fill: '#632' }).setScrollFactor(0);
}

function update() {
  if (gameOver) return;
  enemies.forEach((enemie) => enemie.step())
  // player actions
  player.step();
  if(player.sprite.y > world_height-90){
    player.sprite.y = 100;
    player.sprite.x = player.sprite.x-500;
    player.sprite.setVelocity(0,0)
    player.transition('initial')
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);
  score += 10;
  scoreText.setText(`Score: ${score}`);

  if (coins.countActive(true) === 0) {
    coins.children.iterate((child) => child.enableBody(true, child.x, 0, true, true));
  }
}

function hitBomb(player, enemie) {
  if (!enemie.body.moves) return;
  if (player.stateMachine.state == 'punch' && (
    (player.body.touching.left && player.flipX)
      || (player.body.touching.right && !player.flipX))
  ) {
    enemie.anims.play('die');
    enemie.body.moves = false;
    enemie.once(
      'animationcomplete',
      () => enemie.disableBody(true, true),
      1300,
    );
  } else {
    this.physics.pause();
    player.anims.play('die');
    gameOver = true;
  }
}
