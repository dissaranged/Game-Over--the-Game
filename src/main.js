import Phaser from 'phaser';
import Level from './level0';

const debug = !!window.location.search.match(/debug/);

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
  scene: Level,
};

window.game = new Phaser.Game(config);

function createLevel(x, y, width) {
  const level = [];
  while (x <= world_width) {
    x += width + random(150) - 200;
    width = (random(5) + 1) * 120;
    let newY;
    do {
      console.log(y, newY, (newY < 400) || (newY > world_height));
      newY = y + random(150) * (random(2) - 1 < 0 ? 1 : -1);
    } while ((newY < 400) || (newY > world_height));
    y = newY;
    console.log('platform : ', x, y, width);
    const dice = random(100);
    const entities = [];
    if (dice % 5 == 0) {
      entities.push('elli');
    }
    if (dice % 7 == 0) {
      entities.push('coin');
    }
    level.push({
      x, y, width, entities,
    });
  }
  return level;
}

function create() {
  const level = [
    {
      x: 0, y: 900, width: 777, entities: [],
    },
    {
      x: 300, y: 666, width: 120, entities: [],
    },
    {
      x: 600, y: 800, width: 200, entities: ['warrior'],
    },
    {
      x: 700, y: 555, width: 260, entities: [],
    },
    {
      x: 900, y: 777, width: 260, entities: [],
    },
    {
      x: 1170, y: 727, width: 260, entities: [],
    },
    ...createLevel(1170, 727, 260),
  ];

  level.forEach(({
    x, y, width, entities,
  }) => {
    entities.forEach((key) => {
      switch (key) {
        case 'elli':
          createElli(x + random(width), y - 300);
          break;
        case 'warrior':
          createWarrior(x + random(width), y - 300);
          break;
        case 'coin':
          createCoin(x + random(width), y - 300);
          break;
        default:
          console.log('unknown entitie :', key);
      }
    });
  });
}
