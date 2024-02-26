/*
 * temperamental.js
 */

const temperament = function temperament() {

  let a4;
  let a0;
  let piano = {};
  const notes = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];

  // init
  // Take a frequency to use as A4
  // This defaults to 440Hz
  function init(base = 440, type='equal') {
    a4 = base;
    a0 = a4 / 16;
    // We calculate twelve notes straight away according to the given temperament
    // Later we can use these to return frequencies in the correct octave
    // For now, we only know about equal temperament
    switch(type) {
      case 'equal':
        _init_equal();
        break;
      default:
        console.warn(`Unknown temperament: ${type}`)
    }

    console.log(`Initialised temperament type: ${type}`);

  }

  // init_equal
  // Populate our piano hash with 88 notes
  // Use equal temperament
  // We can multiply base freq by 2^(1/12) to get this
  // FIXME: for now, we only know about flats, not sharps.
  // We _could_ fix that here with duplicates, or we could translate sharps to
  // flats on note request.
  // NB: It is tempting to try and remove accuracy errors by setting each A to
  // an int BUT this will fail if we ever use anything but A=440, so for the
  // sake of 0.0000001 of a Hz, we'll not bother.
  function _init_equal() {
    const equal_mult = 2**(1/12);

    let last_freq = a0;
    let octave = 0;
    let count = 0;
    while(count < 88) {
      for(const note of notes) {
        // Octave numbers change at C
        if (note == "C") {
          octave += 1;
        }
        name = note + octave.toString();
        piano[name] = last_freq;
        last_freq *= equal_mult;
        count += 1;
        if (count == 88) {
          break;
        }
      }
    }

    // console.dir(piano);

  }

  // get-note
  // Return a note from the piano hash
  // If note does not exist, complain to console and return 0
  // FIXME: if we don't put duplicates in the hash to handle sharps, we could
  // translate sharps to flats here instead.
  function get_note(note) {
    let freq = 0;

    if (note in piano) {
      freq = piano[note];
    } else {
      console.warn(`Piano has no note called ${note}`);
    }

    return freq;
  }

  return {
    init: init,
    get_note: get_note
  }
}();

const synth = function synth() {

  let audio_context;
  let volume = 0.1;

  function init() {
    // create web audio api context
    audio_context = new (window.AudioContext || window.webkitAudioContext)();

    // create temperament
    temperament.init();
  }

  // _init_osc
  // Looks like we need to create a new oscillator for each note, because
  // you cannot use them again after 'stop' ? Weird huh.
  function _init_osc() {
    // create Oscillator node
    const oscillator = audio_context.createOscillator();
    oscillator.type = "sine";

    gainNode = audio_context.createGain();

    // connect oscillator to gain node to speakers
    oscillator.connect(gainNode);
    gainNode.connect(audio_context.destination);

    gainNode.gain.value = volume; // Do we need all three of these?
    gainNode.gain.minValue = volume;
    gainNode.gain.maxValue = volume;

    return oscillator;
  }

  function play(freq, duration = 1) {
    oscillator = _init_osc();
    console.log(`Playing a note at ${freq}Hz...`)
    oscillator.frequency.setValueAtTime(freq, audio_context.currentTime);
    oscillator.start(0);
    oscillator.stop(audio_context.currentTime + duration)
  }

  function play_note(note, duration = 1) {
    freq = temperament.get_note(note);
    if (freq == 0) {
      console.warn(`Can't get frequency for note ${note}`);
    } else {
      play(freq, duration);
    }
  }

  return {
    init: init,
    play: play,
    play_note: play_note,
    pure_fifth: pure_fifth,
    even_fifth: even_fifth
  };

}();

synth.init();
synth.play_note("C4");
synth.play_note("G4");
