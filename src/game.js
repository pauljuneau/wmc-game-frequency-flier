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
var clouds;
var gameCanvas;
var pause = false;
var musicalPerformanceText;

//Phaser game implementation details for mandatory functions: preload(), create(), and update()
var game = new Phaser.Game(config);

function preload ()
{
  var baseUrl = 'https://www.pauljuneauengineer.com/game-assets/';
  this.load.setBaseURL(baseUrl);
  this.load.image('sky', 'skies/phaser_labs_sky4.png');
  this.load.image('birdFlying_1','sprites/bevouliin-free-flying-bird-game-character-sprite-sheets/images/fly/frame-1.png');
  this.load.image('birdFlying_2', 'sprites/bevouliin-free-flying-bird-game-character-sprite-sheets/images/fly/frame-2.png');
  this.load.image('birdHit_2', 'sprites/bevouliin-free-flying-bird-game-character-sprite-sheets/images/hit/frame-2.png');
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
  clouds = [cloud_1, cloud_2, cloud_3];

  this.anims.create({
    key: 'fly',
    frames: [
        { key: 'birdFlying_1' },
        { key: 'birdFlying_2', duration: 50 }
    ],
    frameRate: 8,
    repeat: -1
  });

  this.anims.create({
    key: 'dead',
    frames: [
      { key: 'birdHit_2', duration: 50 }
    ],
    frameRate: 8,
    repeat: 2
  })

  bird = this.physics.add.sprite(400, 300, 'birdFlying_1');
  bird.scale = 0.15;

  musicalPerformanceText = this.add.text(16, 16, '', { fontSize: '18px', fill: '#000' });
}

function update ()
{
  if(pause) {
    this.physics.pause();
  } else {
    this.physics.resume();
  }
  if(!gameCanvas) {
    gameCanvas = document.getElementsByTagName('canvas')[0];
    gameCanvas.addEventListener('click', (event) => {showGameSetupModal(event)});
    gameCanvas.addEventListener('touchstart', (event) => {showGameSetupModal(event)});
  }
  bird.anims.play('fly',true);
  if(musicConductor.noteRecentlyPlayedInScale || musicConductor.chordProgressionsPlayedCount > 0) {
    bird.setVelocityY(-(config.physics.arcade.gravity.y * 0.04));
  }
  for (var cloud of clouds) {
    cloud.setVelocityX(-30);
    if(cloud.getRightCenter().x < 0 ) {
      //when cloud passes left boundary, then reset it some varying distance past right boundary to make some dynamic spacing between clouds.
      cloud.setPosition(Math.floor(Math.random() * 650) + config.width + 100, cloud.y);
    }
  }
  if(bird.getBottomCenter().y > config.height) {
    bird.anims.play('dead',true);
    pause = true;
  }

  if(gameSetupPreferences.musicPerformanceInfoRendered) {
    musicalPerformanceText.setText(musicConductor.performanceString);
  }
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


//GAME SETUP DIALOG
var isDialogOpen = false;
var theoryModal = document.getElementById('theoryModal');
var gameSetupDialog = document.getElementById('gameSetupDialog');
var gameSetupForm = document.forms["gameSetupForm"];
var gameSetupPreferences = {
    musicPerformanceInfoRendered : false,
    key : 'C',
    scaleType : 'major',
    maxMillisWithoutNoteInScale : 1000,
    maxMillisNoChordProgCountReset : 1000
};


function showGameSetupModal(event) {
  isTheoryModalOpen = false;
  pause = true;
  gameSetupForm["musicPerformanceInfoRendered"].checked = gameSetupPreferences.musicPerformanceInfoRendered;
  gameSetupForm["keys"].value = gameSetupPreferences.key;
  gameSetupForm["maxMillisWithoutNoteInScale"].value = gameSetupPreferences.maxMillisWithoutNoteInScale;
  gameSetupForm["maxMillisNoChordProgCountReset"].value = gameSetupPreferences.maxMillisNoChordProgCountReset;
  showModal(gameSetupDialog);
  return;
}

function showModal(dialog) {
  if (typeof dialog.showModal === "function") {
      dialog.showModal();
  } else {
      alert("The <dialog> API is not supported by this browser");
  }
}

/**
 * @description "Confirm" button of form triggers "close" on dialog because of [method="dialog"]
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
 */
 gameSetupDialog.addEventListener('close', function onClose() {
  gameSetupPreferences.musicPerformanceInfoRendered = gameSetupForm["musicPerformanceInfoRendered"].checked;
  gameSetupPreferences.key = gameSetupForm["keys"].value;
  gameSetupPreferences.scaleType = gameSetupForm["scales"].value;
  musicConductor.chordProgressionType = gameSetupForm["chordProgressionTypes"].value;
  changeKeyAndScale(gameSetupPreferences.key, gameSetupPreferences.scaleType);
  gameSetupPreferences.maxMillisWithoutNoteInScale = gameSetupForm["maxMillisWithoutNoteInScale"].value;
  musicConductor.maxMillisWithoutNoteInScale = gameSetupPreferences.maxMillisWithoutNoteInScale;
  gameSetupPreferences.maxMillisNoChordProgCountReset = gameSetupForm["maxMillisNoChordProgCountReset"].value;
  musicConductor.maxMillisNoChordProgCountReset = gameSetupPreferences.maxMillisNoChordProgCountReset;
  if(!isTheoryModalOpen) {
    pause = false;
  }
});

document.addEventListener(MidiInstrumentationEvents.MISC_EVENT, function handleMiscEvents(event) {
  if(event.value == 'showTheoryModalBtnClick') {
    showTheoryModal();
  }
}
);

function showTheoryModal() {
  isTheoryModalOpen = true;
  pause = true;
  var scaleStepSequenceTable = document.getElementById('scaleStepSequenceTable');
  scaleStepSequenceTable.innerHTML = '';
  scaleStepSequenceTable.append(generateTableRow(gameSetupPreferences.scaleType,scaleToHalfStepAlgorithm.get(gameSetupPreferences.scaleType)));

  var chordsStepCombinationsTable = document.getElementById('chordsStepCombinationsTable');
  chordsStepCombinationsTable.innerHTML = '';
  for(const [chordName, stepCombination] of stepCombinationByChordName) {
      chordsStepCombinationsTable.append(generateTableRow(chordName,stepCombination));
  }

  var chordProgressionTable = document.getElementById('chordProgressionTable');
  chordProgressionTable.innerHTML = '';
  var chordProgressionMap = chordProgressionMapByType.get(musicConductor.chordProgressionType) ?? new Map();
  for(const scaleDegreeChord of chordProgressionMap.keys() ) {
      chordProgressionTable.append(generateTableRow(scaleDegreeChord, Array.from(chordProgressionMap.get(scaleDegreeChord)).join(', ')));
  }
  showModal(theoryModal);
}

function generateTableRow(...elements) {
  var tr = document.createElement("tr");
  for(const element of elements) {
      var td = document.createElement("td");
      var tdContent = document.createTextNode(element);
      td.appendChild(tdContent);
      tr.appendChild(td);
  }
  return tr;
}


function closeTheoryModal() {
  theoryModal.close();
  pause = false;
}