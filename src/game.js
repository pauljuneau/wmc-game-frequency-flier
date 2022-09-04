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
var bird;
var cloud_1;
var cloud_2;
var cloud_3;

//Phaser game implementation details for mandatory functions: preload(), create(), and update()
var game = new Phaser.Game(config);

function preload ()
{
  var baseUrl = 'https://www.pauljuneauengineer.com/game-assets/';
  this.load.setBaseURL(baseUrl);
  this.load.image('sky', 'skies/phaser_labs_sky4.png');
  this.load.image('birdFlying_1','sprites/bevouliin-free-flying-bird-game-character-sprite-sheets/images/fly/frame-1.png');
  this.load.image('birdFlying_2', 'sprites/bevouliin-free-flying-bird-game-character-sprite-sheets/images/fly/frame-2.png');
  this.load.image('cloud_1', 'skies/synethic223_cloud_pack/Cloud_1.png');
  this.load.image('cloud_2', 'skies/synethic223_cloud_pack/Cloud_2.png');
  this.load.image('cloud_3', 'skies/synethic223_cloud_pack/Cloud_3.png');
}

function create ()
{
  this.add.image(400, 300, 'sky');

  cloud_1 = this.physics.add.sprite(400,75,'cloud_1');
  cloud_1.scale = 0.50;
  cloud_1.setGravityY(-config.physics.arcade.gravity.y);
  cloud_2 = this.physics.add.sprite(200,250,'cloud_2');
  cloud_2.scale = 0.50;
  cloud_2.setGravityY(-config.physics.arcade.gravity.y);
  cloud_3 = this.physics.add.sprite(600,425,'cloud_3');
  cloud_3.scale = 0.50;
  cloud_3.setGravityY(-config.physics.arcade.gravity.y);

  this.anims.create({
    key: 'fly',
    frames: [
        { key: 'birdFlying_1' },
        { key: 'birdFlying_2', duration: 50 }
    ],
    frameRate: 8,
    repeat: -1
  });

  bird = this.physics.add.sprite(400, 300, 'birdFlying_1');
  bird.scale = 0.15;
  bird.setCollideWorldBounds(true);

}

function update ()
{
  bird.anims.play('fly',true);
  cloud_1.setVelocityX(-30);
  cloud_2.setVelocityX(-30);
  cloud_3.setVelocityX(-30);
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