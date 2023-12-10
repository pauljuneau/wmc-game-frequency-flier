/** 
    Copyright © 2022 - 2023 Paul Juneau All Rights Reserved.
**/

//Switch on webmidi music conductor engine to interpret midi in real time
const MUSIC_PERFORMANCE_RATE = 100;
switchOnOffMusicalPerformance(MUSIC_PERFORMANCE_RATE);

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
var gameSetupPreferences = {
  musicPerformanceInfoRendered : false,
  key : 'C',
  scaleType : 'major',
  maxMillisWithoutNoteInScale : 500,
  maxMillisNoChordProgCountReset : 1000,
  musicPerformanceTextSizeScale : 1,
  neverDieMode : false
};

//load gameSetupPreferences from cookie if it exists
// var cookieKeyValues = document.cookie.split('; ');
// if(cookieKeyValues.some((item) => item.trim().startsWith("gameSetupPreferences"))) {
//   let rawPreferences = cookieKeyValues.find((keyValuePair) => keyValuePair.startsWith("gameSetupPreferences"))?.split("=")[1];
//   gameSetupPreferences = JSON.parse(rawPreferences);
// }

function setCookie(cname,cvalue,exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}


function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

var gameState = new Object();
//Initialize gameState to match gameSetupPreferences
for (const property in gameSetupPreferences) {
  gameState[property] = gameSetupPreferences[property];
}
gameState.hasChanged = function(that, propertyName) {
  if(this[propertyName] != that[propertyName]) {
    this[propertyName] = that[propertyName];
    return true;
  } 
  return false;
}
var gameOver = false;
var bird;
var cloud_1;
var cloud_2;
var cloud_3;
var clouds;
var emitter;
var particles;
var lastParticleEmissionTimeStamp;
var gameCanvas;
var pause = false;
var musicalPerformanceText;
var maxChordProgressionCount = 0;
var lastChordProgressionsPlayedCount;
var tints = [0xFF0000,0xFFA500,0xFFFF00,0x008000,0x0000FF,0x4B0082,0xEE82EE]; //ROYGBIV
var tintsAsHexStrings = [];
for(var i =0; i<tints.length; i++) {
  var hexStr = tints[i].toString(16);
  while(hexStr.length < 6) hexStr = '0' +hexStr;
  tintsAsHexStrings[i] = hexStr;
}

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
  this.load.image('redParticle', 'particles/phaser_labs_red.png');
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

  particles = this.add.particles('redParticle');
  emitter = particles.createEmitter({
      speed: 300,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD'
  });

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

  bird = this.physics.add.sprite(config.width/2,config.height/2,'birdFlying_1');
  bird.scale = 0.15;

  musicalPerformanceText = this.add.text(16, 16, '', { 
    fontSize: '18px', 
    color: '#000', 
    fontStyle: 'strong', 
    stroke: '#000', 
    strokeThickness: 1
  });

  emitter.startFollow(bird);
  emitter.setVisible(false);
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

  if(maxChordProgressionCount < musicConductor.chordProgressionsPlayedCount) {
    maxChordProgressionCount = musicConductor.chordProgressionsPlayedCount;
  }

  if(musicConductor.chordProgressionsPlayedCount > 0 && musicConductor.chordProgressionsPlayedCount != lastChordProgressionsPlayedCount) {
    emitter.setVisible(true);
    lastChordProgressionsPlayedCount = musicConductor.chordProgressionsPlayedCount;
    lastParticleEmissionTimeStamp = performance.now();
  }

  if(emitter.visible && performance.now() - lastParticleEmissionTimeStamp >= 2000) {
    emitter.setVisible(false);
  }

  for (var cloud of clouds) {
    cloud.setVelocityX(-30);
    if(cloud.getRightCenter().x < 0 ) {
      //when cloud passes left boundary, then reset it some varying distance past right boundary to make some dynamic spacing between clouds.
      cloud.setPosition(Math.floor(Math.random() * 650) + config.width + 100, cloud.y);
    }
  }

  if(bird.getTopCenter().y < 0 ) {
    bird.setPosition(bird.x, -1*(bird.getTopCenter().y - bird.getCenter().y));
  }
  if(gameSetupPreferences.neverDieMode && bird.getBottomCenter().y > (config.height-bird.displayHeight)) {
    bird.setPosition(bird.x,  (config.height-2*bird.displayHeight));
  }

  if(bird.getBottomCenter().y > config.height && gameOver == false) {
    pause = true;
    //Let player know highest chord progression count reached and then reset game
    gameOver = true;
    
    setTimeout(() => {
      alert('Max Chord Progression Count Achieved: ' + maxChordProgressionCount);
      maxChordProgressionCount = 0;
      bird.setPosition(config.width/2,config.height/2);
      showGameSetupModal();
      gameOver = false;
    }, '1000');
  }
  if(gameOver) {
    bird.anims.play('dead',true);
  }

  if(gameSetupPreferences.musicPerformanceInfoRendered) {
    musicalPerformanceText.setVisible(true);
    musicalPerformanceText.setText(musicConductor.performanceString);
  } else {
    musicalPerformanceText.setVisible(false);
  }

  if(gameState.hasChanged(gameSetupPreferences, 'musicPerformanceTextSizeScale')) {
    musicalPerformanceText.setScale(gameSetupPreferences.musicPerformanceTextSizeScale);
  }
}

var lastMidiChlorianCtrlEvent;
/** 
 * @description listens to midi-chlorian controller event which are events based on 
 * midi notes currently playing.
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
  lastMidiChlorianCtrlEvent = oneMidiChlorianCtrlrEvent;
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

var lastTintIndex;
document.addEventListener(MidiInstrumentationEvents.CHORDINSCALEPLAYED, function(e){
  const scaleDegreeChordObj = JSON.parse(e.value);
  var scaleDegreeChord = (lastMidiChlorianCtrlEvent == undefined || lastMidiChlorianCtrlEvent.countIncreased || (lastMidiChlorianCtrlEvent.countIncreased == false && lastMidiChlorianCtrlEvent.countDecreased == false)) ? scaleDegreeChordObj.scaleDegreeChordPlayedASC : scaleDegreeChordObj.scaleDegreeChordPlayedDESC;
  var tintIndex = parseInt(scaleDegreeChord.split(' ')[0]) - 1;
  //tint bird 
  bird.setTint(tints[tintIndex]);
  //color first column in matching chordProgressionTable row
  if(isTheoryModalOpen) {
    var chordProgressionTable = document.getElementById("chordProgressionTable");
    for(var i=0; i < chordProgressionTable.rows.length; i++) {
      //assuming 1st cell is populated with scale degree chord name
      var col1 = chordProgressionTable.rows[i].cells[0]; 
      if(col1.innerText == scaleDegreeChord) {
        col1.style.backgroundColor = '#'+tintsAsHexStrings[tintIndex];
        break;
      }
    }
  }
  clearTint(tintIndex);  
  lastTintIndex = tintIndex;
});


function clearTint(tintIndex) {
  if(tintIndex != lastTintIndex ) {
    setTimeout(() => {
      bird.clearTint();
      var chordProgressionTable = document.getElementById("chordProgressionTable");
      for(var i=0; i < chordProgressionTable.rows.length; i++) {
        chordProgressionTable.rows[i].cells[0].style.backgroundColor ='';
      }
      lastTintIndex = undefined;
    }, 1000);
  }
}

//POPULATE GAME SETUP MODAL FORM ELEMENTS
var chordProgressionTypeSelect = document.getElementById("chordProgressionType-select");
for (const chordProgressionType in CHORD_PROGRESSION_TYPES) {
  var option = document.createElement("option");
  option.value = CHORD_PROGRESSION_TYPES[chordProgressionType];
  option.textContent = option.value;
  chordProgressionTypeSelect.appendChild(option);
}

var scaleTypeSelect = document.getElementById("scale-select");
for (const oneScaleType of scaleToHalfStepAlgorithm.keys()) {
  var option = document.createElement("option");
  option.value = oneScaleType;
  option.textContent = option.value;
  scaleTypeSelect.appendChild(option);
}

//GAME SETUP DIALOG
var theoryModal = document.getElementById('theoryModal');
var gameSetupDialog = document.getElementById('gameSetupDialog');
var gameSetupForm = document.forms["gameSetupForm"];


function showGameSetupModal(event) {
  isTheoryModalOpen = false;
  pause = true;
  gameSetupForm["musicPerformanceInfoRendered"].checked = gameSetupPreferences.musicPerformanceInfoRendered;
  gameSetupForm["neverDieMode"].checked = gameSetupPreferences.neverDieMode;
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    gameSetupForm["musicPerformanceTextSizeScale"].defaultValue = "2.5";
  } else {
    gameSetupForm["musicPerformanceTextSizeScale"].defaultValue = gameSetupPreferences.musicPerformanceTextSizeScale;
  }
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
  updateSettings();
});

document.addEventListener(MidiInstrumentationEvents.MISC_EVENT, function handleMiscEvents(event) {
  if(event.value == 'showTheoryModalBtnClick') {
    showTheoryModal();
  }
}
);

function updateSettings() {
  gameSetupPreferences.musicPerformanceInfoRendered = gameSetupForm["musicPerformanceInfoRendered"].checked;
  gameSetupPreferences.neverDieMode = gameSetupForm["neverDieMode"].checked;
  gameSetupPreferences.musicPerformanceTextSizeScale = gameSetupForm["musicPerformanceTextSizeScale"].value;
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
}

var isTheoryModalOpen = false;
function showTheoryModal() {
  isTheoryModalOpen = true;
  pause = true;
  updateSettings();
  var scaleStepSequenceTable = document.getElementById('scaleStepSequenceTable');
  scaleStepSequenceTable.innerHTML = '';
  scaleStepSequenceTable.append(generateTableRow(gameSetupPreferences.scaleType,scaleToHalfStepAlgorithm.get(gameSetupPreferences.scaleType)));

  //TODO only load table if table has not been drawn yet so that it can retain filter settings when closed and reopened
  var chordsStepCombinationsTable = document.getElementById('chordsStepCombinationsTable');
  document.getElementById('triadsOnly_chordsStepCombinations').checked = true;
  document.getElementById('7thsOnly_chordsStepCombinations').checked = true;
  chordsStepCombinationsTable.innerHTML = '';
  for(const [chordName, stepCombination] of stepCombinationByChordName) {
      chordsStepCombinationsTable.append(generateTableRow(chordName,stepCombination));
  }
  //TODO only load table if table has not been drawn yet or when chordProgressionType changes so that it can retain filter settings when closed and reopened
  var chordProgressionTable = document.getElementById('chordProgressionTable');
  document.getElementById('triadsOnly_chordProgressions').checked = true;
  document.getElementById('7thsOnly_chordProgressions').checked = true;
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
  isTheoryModalOpen = false;
  pause = false;
}

function filterRows(filter, tableId, checkboxId) {
  var isChecked = document.getElementById(checkboxId).checked;
  var table = document.getElementById(tableId);
  var tr = table.getElementsByTagName("tr");
  for (let i = 0; i < tr.length; i++) {
    var td = tr[i].getElementsByTagName("td")[0];
    if(td) {
      var txtValue = td.textContent || td.innerText;
      if(txtValue.toLowerCase().includes(filter)) {
        tr[i].style.display = isChecked ? "" : "none";
      }
    }
  }
}