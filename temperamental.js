/*
 * temperamental.js
 */

// temperament
// Sets up a hash with entries for each note on an 88 key piano
// Precalculates frequencies for them given a base note of A4 and temperament type
const temperament = function temperament() {

  let a4;
  let piano = {};
  const notes = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];

  // init
  // Take temperament type and a pivot note for temperaments that need them
  // Also take a frequency to use as A4, defaulting to 440Hz
  function init(type = 'equal', pivot = 'C', base = 440) {
    set_temp(type, pivot, base);
  }

  // set_temp
  // A separate function now so we can call it without calling init
  // Not that we do anything else in init just yet, but we might.
  // Tidy. I'm being tidy.
  function set_temp(type, pivot = 'C', base = 440) {
    a4 = base;
    piano = {};
    switch(type) {
      case 'equal':
        _init_equal();
        break;
      case 'pythagorean':
        _init_pythag(pivot);
        break;
      default:
        console.warn(`Unknown temperament: ${type}`)
    }

    console.log(`Initialised temperament type: ${type}`);
  }

  // init_pythag
  // For Pythagorean tuning, we take perfect 3/2 fifths around the circle of
  // fifths leaving one horribly out of tune fifth to join them.
  // We call the start note in the cycle the 'pivot' b/c I have no better ideas.
  // Also, we start from a reference A=440 b/c otherwise how does it work at all?
  function _init_pythag(pivot) {
    const up_mult = 3/2;
    const down_mult = 2/3;
    const fifths_cycle = ['A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D'];

    // First calculate the frequencies for octave 4 starting at A
    let last_freq = a4;
    const p_freqs = {};
    // First we go round the cycle forwards
    for(const note of fifths_cycle) {
      name = note + "4";
      if (note == "A") {
        piano[name] = last_freq;
        continue;
      } else if (note == pivot) {
        break; // NB - if pivot is A we never need to break early
      }
      last_freq *= up_mult;
      // Stay in the right octave
      if (['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb'].includes(note)) {
        last_freq /= 2;
      }
      piano[name] = last_freq;
    }
    // We've hit the pivot, so now we need to go round the cycle backwards
    // UNLESS pivot was actually A
    if (pivot != "A") {
      last_freq = a4; // Come back to our fixed A=440
      for(const note of fifths_cycle.reverse()) {
        name = note + "4";
        last_freq *= down_mult;
        // Stay in the right octave
        if (['F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B' ].includes(note)) {
          last_freq *= 2;
        }
        piano[name] = last_freq;
        if(note == pivot) {
          break;
        }
      }
    }

    // console.dir(piano);

    // Then copy those over to the rest of the piano
    // This time we get a bit of an extended piano, but fine.
    for(const note of notes) {
      last_freq = piano[note + "4"];
      for(const octave of [5,6,7,8]) {
        last_freq *= 2;
        piano[note + octave.toString()] = last_freq;
      }
      last_freq = piano[note + "4"];
      for(const octave of [3,2,1,0]) {
        last_freq /= 2;
        piano[note + octave.toString()] = last_freq;
      }
    }

  }

  // init_equal
  // Populate our piano hash with 88 notes in equal temperament
  // We can multiply base freq by 2^(1/12) to get this
  // FIXME: for now, we only know about flats, not sharps.
  // We _could_ fix that here with duplicates, or we could translate sharps to
  // flats on note request.
  // NB: It is tempting to try and remove accuracy errors by setting each A to
  // an int BUT this will fail if we ever use anything but A=440, so for the
  // sake of 0.0000001 of a Hz, we'll not bother.
  function _init_equal() {
    const equal_mult = 2**(1/12);
    const a0 = a4 / 16; // more for clarity than necessity

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
  // Return a frequency from the piano hash
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
    get_note: get_note,
    set_temp: set_temp
  }
}();

// synth
// A hugely minimal synth
// Uses the WebAudio API to emit pure sine waves at a given pitch and duration
// Uses the temperament code above for temperament
const synth = function synth() {

  let audio_context;
  let volume = 0.5;
  let note_el;
  let freq_el;

  // Take temperament type to set up temperament, default to 'equal'
  // FIXME: Should take all of temperament.init's params, no? Or do we just
  // add a reset temperament method to handle that?
  function init(type = 'equal') {
    // create web audio api context
    audio_context = new (window.AudioContext || window.webkitAudioContext)();

    // create temperament
    temperament.init(type);

    // get note and frequency elements so we can report
    // NB - Should we really be putting display stuff in here? Probably not.
    note_el = document.getElementById("note");
    freq_el = document.getElementById("freq");
  }

  // _init_osc
  // Looks like we need to create a new oscillator for each note, because
  // you cannot use them again after 'stop' ? Weird huh.
  // Set up a simple ADSR envelope while we're here
  function _init_osc(duration) {

    const minvol = 0.00001;
    const attack = 0.2; // These must sum to 1
    const decay = 0.2;
    const sustain = 0.4;
    const release = 0.2; // This one not actually used, implied by other two
    const decaylev = 0.9; // Level we decay to after attack

    // create Oscillator node
    const oscillator = audio_context.createOscillator();
    oscillator.type = "sine";

    gainNode = audio_context.createGain();

    // connect oscillator to gain node to speakers
    oscillator.connect(gainNode);
    gainNode.connect(audio_context.destination);

    gainNode.gain.value = minvol; // Do we need all three of these?
    gainNode.gain.minValue = minvol;
    gainNode.gain.maxValue = volume;

    // Stupid adsr envelope
    gainNode.gain.exponentialRampToValueAtTime(volume, audio_context.currentTime + (duration * attack));
    gainNode.gain.exponentialRampToValueAtTime(volume * decaylev, audio_context.currentTime + (duration * attack) + (duration * decay));
    gainNode.gain.linearRampToValueAtTime(volume * decaylev, audio_context.currentTime + (duration * sustain) + (duration * attack) + (duration * decay));
    gainNode.gain.exponentialRampToValueAtTime(minvol, audio_context.currentTime + duration);

    return oscillator;
  }

  // _play
  // Play a note of given frequency and duration
  function _play(freq, duration = 1) {
    oscillator = _init_osc(duration);
    console.log(`Playing a note at ${freq}Hz...`)
    oscillator.frequency.setValueAtTime(freq, audio_context.currentTime);
    oscillator.start(0);
    oscillator.stop(audio_context.currentTime + duration)
  }

  // play
  // Take a note in standard pitch/octave notation, eg A4, B3 etc
  // Convert to frequency and play it
  // Also take duration in seconds (for now)
  function play(note, duration = 1) {
    freq = temperament.get_note(note);
    if (freq == 0) {
      console.warn(`Can't get frequency for note ${note}`);
    } else {
      _play(freq, duration);
      // NB We really ought to return these and set UI in caller
      note_el.innerHTML = note;
      freq_el.innerHTML = freq.toFixed(4).toString();
    }
  }

  function set_vol(vol) {
    volume = vol;
    console.log(`Setting volume to ${vol}`);
  }

  return {
    init: init,
    play: play,
    set_vol: set_vol,
  };

}();

// keyboard
// We have a hardwired HTML piano keyboard in a li with id 'keyboard'
// Each key needs an event listener bound to it to play the right note
// Other UI elements also get event listeners here. We should rename this UI maybe?
const keyboard = function keyboard() {

  function init() {
    keys = document.getElementById("keyboard");
    for (const key of keys.children) {
      key.addEventListener("pointerdown", () => { synth.play(key.id, 0.5) });
    }

    // Temperament selectors
    equal_select = document.getElementById("equal");
    equal_select.addEventListener("change", () => { temperament.set_temp('equal')});

    pythag_select = document.getElementById("pythagorean");
    pythag_select.addEventListener("change", () => { temperament.set_temp('pythagorean')});

    // Controls
    volume_control = document.getElementById("volume_control");
    volume_control.addEventListener("change", () => { synth.set_vol(volume_control.value) });
  }

  return {
    init: init
  }
}();


synth.init();
keyboard.init();
