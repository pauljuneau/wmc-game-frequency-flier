//Switch on webmidi music conductor engine to interpret midi in real time
switchOnOffMusicalPerformance(100);

//Phaser game config
var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
    //Uncomment this and comment out other mode to see game scale to the entire screen on mobile. This can cause proportions to look off.
    //mode: Phaser.Scale.ENVELOPE,
    max: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

//Global game objects
var player;
var orbs;
var platforms;
var score = 0;
var gameOver = false;
var scoreText;

//Phaser game implementation details for mandatory functions: preload(), create(), and update()
var game = new Phaser.Game(config);

function preload ()
{
  //Leaving this in to allow rendering images on local machine due to CORS policy restriction for file:// paths and if assets are no longer hosted on pauljuneauengineer.com
  // this.load.setBaseURL('http://labs.phaser.io');
  // this.load.image('sky', 'assets/skies/sky4.png');
  // this.load.image('ground', 'assets/sprites/platform.png');
  // this.load.image('orb', 'assets/sprites/orb-red.png');
  // this.load.image('skull', 'assets/sprites/skull.png');
  // this.load.spritesheet('dude', 'assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
  var baseUrl = window.location.href;
  if(baseUrl.startsWith('file')) {
    baseUrl = 'https://www.pauljuneauengineer.com/wmc-game-phaser-poc/';
  }
  this.load.setBaseURL(baseUrl+'assets/images');
  this.load.image('sky', 'sky4.png');
  this.load.image('ground', 'platform.png');
  this.load.image('orb', 'orb-red.png');
  this.load.image('skull', 'skull.png');
  this.load.spritesheet('dude', 'dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create ()
{
  this.add.image(400, 300, 'sky');

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 568, 'ground').setScale(2).refreshBody();

  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  player = this.physics.add.sprite(100, 450, 'dude');

  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [ { key: 'dude', frame: 4 } ],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  orbs = this.physics.add.group({
    key: 'orb',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 }
  });

  orbs.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.1, 0.3));
  });

  skulls = this.physics.add.group();

  scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

  this.physics.add.collider(player, platforms);
  this.physics.add.collider(orbs, platforms);
  this.physics.add.collider(skulls, platforms);

  this.physics.add.overlap(player, orbs, collectOrb, null, this);

  this.physics.add.collider(player, skulls, hitSkull, null, this);
}

function update ()
{
  if (gameOver)
  {
    return;
  }

  if ((musicConductor.chordsPlaying.length  > 0) && player.body.touching.down)
  {
    player.setVelocityY(-330);
  }
}

//Game behavior functions
function collectOrb (player, orb)
{
  orb.disableBody(true, true);
  score += 10;
  scoreText.setText('Score: ' + score);

  if (orbs.countActive(true) === 0)
  {
    //  A new batch of orbs to collect
    orbs.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });
    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    var skull = skulls.create(x, 16, 'skull');
    skull.setBounce(1);
    skull.setCollideWorldBounds(true);
    skull.setVelocity(Phaser.Math.Between(-200, 200), 20);
    skull.allowGravity = false;
  }
}

function hitSkull (player, skull)
{
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play('turn');

  gameOver = true;
}


//Player movement via midi input
/** 
 * @description listens to midi-chlorian controller event which are events based on 
 * midi notes currently playing.
 * - moves player left or right if the player went up or down the register; respectively. 
 * @listens MidiInstrumentationEvents.MIDICHLORIANCTRLEVENT - published from
 *  midiChlorianController.js' MidiInstrumentationEvents.NOTEBEINGPLAYED event listener.
 * @param e.value - stringified midiChlorianCtrlr 
 * @returns void
 */
 document.addEventListener(MidiInstrumentationEvents.MIDICHLORIANCTRLEVENT, function(e) {
  const oneMidiChlorianCtrlrEvent = JSON.parse(e.value);
  //Play Piano Sounds when playing on computer keyboard
  if(oneMidiChlorianCtrlrEvent.midiInputPlaying.eventType == 'KEYBOARD') {
    try {
        document.getElementById(oneMidiChlorianCtrlrEvent.midiInputPlaying.noteName).play();
    } catch (e) {
        console.error(e.name + ': '+e.message);
    }
  }
  //moves player left or right if the player went up or down the register; respectively. 
  try {
    if(oneMidiChlorianCtrlrEvent.countIncreased) {
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else if ( oneMidiChlorianCtrlrEvent.countDecreased ) {
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn');
    }
  } catch(e) {
    console.error(e.name + ': '+e.message + "; stack: "+e.stack);
  }
  //Only move player for a quarter of a second (assuming 4 4 time)
  setTimeout(
    function() {
      player.setVelocityX(0);
      player.anims.play('turn');
    },
    250
  );
});

//Stop piano sound being played when no longer playing using computer keyboard
document.addEventListener(MidiInstrumentationEvents.NOTELASTPLAYED, function(e){
  const oneNoteLastPlayed = JSON.parse(e.value);
  if(oneNoteLastPlayed.eventType == 'KEYBOARD') {
    try {
      document.getElementById(oneNoteLastPlayed.noteName).pause();
    } catch (e) {
      console.error(e.name + ': '+e.message);
    }
  }
});