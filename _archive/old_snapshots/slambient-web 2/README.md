# Slambient Web Prototype

A dependency-free browser prototype of the Slambient generative ambient workstation.

## Run it

For browser audio, you can open `index.html` directly. For the best chance of Web MIDI access, serve it from localhost:

```bash
cd ~/Music/FM1-Dev/slambient-web
python3 -m http.server 8000
```

Then open <http://localhost:8000> in a browser that supports Web Audio. Web MIDI is browser- and permission-dependent; Chrome or Edge on a supported desktop setup is the intended test target. Connect/select a MIDI output in the dropdown to send the generated notes to external gear or a DAW.

## Controls

- **Weather** changes the nominal tempo from 40–75 BPM and gently affects layer density and delay modulation.
- **Mutation rate** changes the lead's step size and melodic variation.
- **Drone weight** controls the level of the low drone.
- **Tape diffusion** changes the convolution-reverb wet level.
- **New seed** resets the generative sequence to a new nonzero 32-bit PRNG seed.
- **Panic** stops scheduling, fades the browser audio, and sends MIDI All Sound Off / All Notes Off messages on all channels to the selected MIDI output.

## Important limitations

- This is a browser approximation, not a clone of the FM-1's synthesis engine.
- The DynamicsCompressorNode is a safety stage, not a guaranteed true-peak brick-wall limiter.
- The 10% chromatic tension setting is a target probability over generated lead notes, not a guarantee for each short phrase.
- Seeded note decisions use a deterministic PRNG, but exact audio replay across browsers/audio engines is not promised.
- Web MIDI support requires a compatible browser, permissions, and (usually) a secure context such as localhost or HTTPS.

## Validation performed

- JavaScript syntax check with Node.js.
- Mocked runtime smoke test covering initialization, audio graph construction, start/scheduling, pause, mood change, reseeding, and panic.

A real browser/audio/MIDI hardware test is still needed to verify sound and device behavior.
