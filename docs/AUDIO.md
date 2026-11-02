# Optional ambient sound

`components/AmbientSound.tsx` creates audio with the browser Web Audio API. It requires no downloaded audio assets, external libraries, accounts, network requests, or microphone access.

Three choices are available: a filtered rain-like noise texture (not a field recording), soft brown noise, and stereo sine tones at 180 Hz left / 186 Hz right. The stereo option creates a 6 Hz frequency difference for headphone listening. It is a listening effect only: no brainwave synchronization, treatment, cognitive, sleep, or anxiety benefit is claimed.

Audio is off initially and begins only after Play. Volume defaults to 20% of a conservatively limited output gain (0.12 maximum internal gain); final loudness still depends on device and headphones. Volume 0 mutes output, Pause stops sources and closes the audio context. Closing the panel leaves playback running, explicitly explained in the controls. Unmounting the component stops and disconnects every source and closes the context. No sensitive data or audio is recorded or stored.

Browsers may suspend audio when backgrounded or under device power policies. An unsupported browser or failed AudioContext produces an accessible error. Speaker playback does not provide separated stereo tones; use headphones if selecting that effect. Listeners can always leave the site silent.
