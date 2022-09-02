# ![wmc-logo](assets/images/favicon.ico) wmc-game-phaser-poc
Created [Phaser 3.55.2](https://newdocs.phaser.io/docs/3.55.2) [first game tutorial](https://phaser.io/tutorials/making-your-first-phaser-3-game/part1_) with player movement [WebMidi Conductor v2.5.1](https://github.com/pauljuneau/webmidi-conductor/tree/v2.5.1)

Player movement alterations: 
* Player avatar, 'dude', moves left or right if the player went up or down the register; respectively. 
* Player avatar, 'dude', jumps when playing a triad or 7th chord

[Click here to play!](https://www.pauljuneauengineer.com/wmc-game-phaser-poc/)

### Gotchas
* Make sure your midi device is plugged into your computer or mobile phone before opening the web browser!
* No iOS support :frowning_face: 
   * See [MDN MIDIAccess Browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/MIDIAccess)
* if trying to run the code locally instead from the github page, then make sure to change the image URL sources in the `preload()` function to the insecure http://labs.phaser.io or hard-code `baseUrl = https://www.pauljuneauengineer.com/wmc-game-phaser-poc/` in place of `baseUrl = window.location.href`