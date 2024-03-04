# Temperamental

A web toy allowing you to hear and play with different kinds of tunings.

Inspired by John Carlos Baez's series of blog posts about different temperament
systems - see https://johncarlosbaez.wordpress.com/2023/10/13/perfect-fifths-in-equal-tempered-scales/

It's all very well but I need to _hear_ what is going on to have a hope of
understanding.

[Have a go on it here](https://www.conniptions.org/temperamental/)

## Currently Implemented

We have a simple keyboard running from C3 to E5 playing a stupidly simple synth
with no sustain whatsoever.

By default we are in equal temperament, but there is a toggle to switch to a
Pythagorean temperament calculated with a start note of C.

There's a volume control and you can set the value of A4 between 420Hz and 460Hz,
in case you like non-standard pitch settings.

## Not Yet Implemented

* Does it work on mobile? Sort of but not really. I need to improve this.
* You can't yet change the start note of Pythagorean temperament.
* A better keyboard that understands holding a key down as well as pressing one
* Even more temperaments
* A pretty UI

## Flaw

I have a bit of a cloth ear, so I can't really hear the difference between the
current two temperaments. Maybe you can?

It's quite possible that my temperament-defining code is buggy. How would I know?
So far it seems to correlate with what other people on the internet say things
should be, but it's also possible that I have Not Yet Actually Understood what
I am doing in some fundamental way.

## Run It Yourself

This is the result of three night's Bee In Bonnet and looks it.

Not polished, very new, probably terrible. Pure JS, bit oldschool because so am I,
no npm, no dependencies, no external anything, just download and run locally using
your favourite webserver.

You'll need a browser that implements the WebAudio API, though, obvs.

## Thanks

Thanks to John Carlos Baez for explaining temperament systems well enough that
I felt the urgent need to build this in order to hear what was going on, even
though actually it turns out so far that I can't, really.

Thanks also to Philip Zastrow, whose CSS piano I borrowed, with modification,
from the orginal CodePen over here: https://codepen.io/zastrow/pen/kxdYdk

Thank you for reading down this far.
