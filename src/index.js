require('phaser');


let debug = !!window.location.search.match(/debug/);
let gameOver = false;
var config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 600,
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: debug
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var enemies;
var coins;
var platforms;
var cursors;
var score = 0;
var scoreText;
var game = new Phaser.Game(config);
function preload ()
{
    this.load.image('skyscraper', './assets/skyscraper.png');
    this.load.image('houses', './assets/houses.png')
    this.load.image('ground', './assets/platform.png');
    this.load.spritesheet('coin', './assets/coin.png', {frameWidth: 200, frameHeight: 200});
    this.load.image('bomb', './assets/bomb.png');
    this.load.spritesheet('eboy', './assets/eboy.png', { frameWidth: 650, frameHeight: 650 });
    this.load.spritesheet('elli', './assets/elli.png', { frameWidth: 128, frameHeight: 126 });
}


function create ()
{
    const world_width = 1024*8;
    const world_height = 1024;

    this.cameras.main.setBounds(0, 0, world_width, world_height);
    this.physics.world.setBounds(0, 0, world_width, world_height);
    
    let skyscraper = this.add.tileSprite(0,444,world_width, 586,'skyscraper').setOrigin(0,0);
    skyscraper.scrollFactorX = 0.7;
    let houses =this.add.tileSprite(0, 555, world_width, 386,'houses').setOrigin(0,0);
    houses.scrollFactorX = 0.9;
    platforms = this.physics.add.staticGroup();
    window.scene=this
    window.platforms = platforms;

    [
	{x: 0, y: 900, width:777},
	{x: 300, y: 666, width: 120},
	{x: 600, y: 800, width: 200},
	{x: 700, y: 555, width: 260},
	{x: 900, y: 777, width: 260},
	{x: 1170, y: 707, width: 260},
    ].forEach(({x,y, width}) => {
	this.add.tileSprite(x, y, width*2, 86, 'ground').setOrigin(0,0).setScale(0.5)
	let platform = this.add.rectangle(x,y+8,width,35,debug ? 0x337788:undefined, 0.5).setOrigin(0,0);
	platforms.add(platform);
    });
    
    player = this.physics.add.sprite(100, 100, 'eboy').setScale(0.2);

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.cameras.main.startFollow(player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);
    
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'eboy', frame: 17 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'punch',
        frames: this.anims.generateFrameNumbers('eboy', {frames: [19,20,21,22,1] } ),
        frameRate: 20
    });

    this.anims.create({
        key: 'die',
        frames: this.anims.generateFrameNumbers('eboy', {frames:[0,16]}),
        frameRate: 5,
        repeat: -1
    });
    this.anims.create({
        key: 'run',
        frames: this.anims.generateFrameNumbers('eboy', {frames:[3,4,5,6,7,8,9,10,12,13]}),
        frameRate: 20,
        repeat: -1
    });

    this.anims.create({
	key: 'jump',
        frames: [{key: 'eboy', frame: 18}],
        frameRate: 20,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    this.anims.create({
	key: 'rotate',
	frames: 'coin',
	frameRate:20,
	repeat: -1,
    })
    coins = this.physics.add.group({
        key: 'coin',
        repeat: 11,
        setXY: { x: 300, y: 100, stepX: 90 }
    });

    coins.children.iterate(function (child) {

        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
	child.setScale(0.2);
	child.play('rotate');

    });


    this.physics.add.collider(player, platforms);
    this.physics.add.collider(coins, platforms);
    this.physics.add.overlap(player, coins, collectStar, null, this);

    enemies = this.physics.add.group();
    let elli = this.physics.add.sprite(700,300, 'elli');
    elli.setCollideWorldBounds(true);
    elli.anims.create({
	key: 'jump',
	frames: this.anims.generateFrameNumbers('elli', {start: 55, end: 63}),
	frameRate: 20,
    });
    elli.anims.create({
	key: 'die',
	frames: this.anims.generateFrameNumbers('elli', {start: 24, end: 50}),
	frameRate: 20,
	hideOnComplete: true
    });
    enemies.add(elli);
    
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(player, enemies, hitBomb, null, this);
    
    scoreText = this.add.text(20, 20, 'score : 0', {fontSize: '32px', fill: '#632'}).setScrollFactor(0);
}

function update ()
{
    if(gameOver) return;
    enemies.children.iterate( enemie=> {
	if(!enemie.body.moves)
	    return;
	if(enemie.body.touching.down) {
	    if(enemie.x>player.x) {
		enemie.setVelocity(-200,-100);
		enemie.play('jump');
		enemie.flipX = false;
	    } else {
		enemie.setVelocity(200,-100);
		enemie.play('jump');
		enemie.flipX = true;
 	    }
	} else if (enemie.body.touching.right) {
	    enemie.setVelocity(-100,-220);
	    enemie.play('jump');
	    enemie.flipX = false
	} else if(enemie.body.touching.left){
	    enemie.setVelocity(100, -220);
	    enemie.play('jump');
	    enemie.flipX = true
	}
    })
    
    // player actions
    let idle = true
    player.punshing = false;
    if(cursors.shift.isDown){
	player.anims.play('punch', true);
	player.punshing = true;
	idle = false
    } 

    if (cursors.left.isDown)
    {
	if(cursors.shift.isDown) {
	    player.setVelocityX(-60)
	} else {
	    player.setVelocityX(-160);
	    player.anims.play('run', true);
	}
	player.flipX = true;
	idle = false;
    }
    else if (cursors.right.isDown)
    {
	if(cursors.shift.isDown) {
	    player.setVelocityX(60)
	} else {
	    player.setVelocityX(160);
	    player.anims.play('run', true);
	}
	player.flipX = false;
	idle = false;
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    } else if(idle) {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if(!player.body.touching.down){
	player.anims.play('jump', true)
    }
}

function collectStar (player, star)
{
    star.disableBody(true, true);
    score += 10;
    scoreText.setText(`Score: ${score}`)

    if (coins.countActive(true) === 0) {
	coins.children.iterate( child => child.enableBody(true, child.x, 0, true, true) );
	
	
    }
}

function hitBomb(player, enemie) {
    console.log(player, enemie)
    console.log('punsing :'+player.punshing)
    console.log(player.body.touching)
    console.log(player.flipX)
    if(!enemie.body.moves)
	return;
    if(player.punshing && (
	(player.body.touching.left && player.flipX) ||
	    (player.body.touching.right && !player.flipX) )
      ) {
	enemie.anims.play('die');
	enemie.body.moves = false;
	enemie.once(
	    'animationcomplete',
	    ()=> enemie.disableBody(true,true),
	    1300);
    } else {
	this.physics.pause();
 	player.anims.play('die');
	gameOver = true;
    }
}
