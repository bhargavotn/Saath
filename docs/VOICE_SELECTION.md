# Saath voice and sound selection

## Recommended pilot architecture

Human calls: LiveKit WebRTC private rooms. AI rehearsal: OpenAI Realtime over browser WebRTC using server-minted ephemeral access. ElevenLabs Agents is an alternative to compare for voice character and language pronunciation, not an additional mandatory provider.

LiveKit Agents require an agent-server deployment (LiveKit Cloud or a container host); do not try to run the long-lived agent process inside the website's request-scoped Cloudflare Worker. Keep website auth and token issuance on the server. No provider is connected in this release.

Browser SpeechRecognition is not a dependable primary transcription path: browser support varies and some implementations send audio to a service. Browser speech synthesis in `/studio` is a device preview only, not a cloud-provider benchmark.

## Official references checked 2026-11-01

- https://docs.livekit.io/transport/media/noise-cancellation/
- https://docs.livekit.io/agents/
- https://docs.livekit.io/deploy/custom/deployments/
- https://developers.openai.com/api/docs/guides/realtime
- https://developers.openai.com/api/docs/guides/voice-webrtc
- https://elevenlabs.io/docs/eleven-agents/customization/voice/customization/language
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

Language support does not prove Hinglish quality. Test mixed-language utterances with actual speakers before choosing. Provider retention, recording, transcripts, and observability settings must be reviewed before real disclosures are used.

## Repeatable comparison protocol

Use identical synthetic scripts, device, headset, network, microphone gain, and region. Run at least ten turns in each of English, Hindi, and Hinglish. Include pauses, an interruption, a restart, and a network interruption. Capture no real personal disclosures.

Measure connection success, first-audio latency (median and p95), interruption stop time, missing/duplicated turns, language pronunciation, reconnection, permission-denied recovery, and cost per completed session. These are engineering measurements, not mental-health outcomes. Set explicit pilot targets and record results; do not substitute marketing latency claims for measurements.

Compare neutral conversational voices with clear diction and natural pauses. Avoid exaggerated whispering, forced intimacy, and claims to understand feelings that were not stated. The fictional role must stay identifiable.

## Initial sound palette

- Silence: default, always available.
- Rain texture: filtered procedural noise, not a field recording.
- Brown noise: procedural low-frequency noise.
- Stereo tones: 180/186 Hz, an optional headphone listening effect only.

Play at a comfortable user-selected level. Avoid sudden starts and notification sounds. During real calls, mute ambient audio by default or explicitly duck it; never let it obscure speech. Sound cannot be labelled effective for panic or anxiety without appropriate evidence.

## Test status

Existing ambient Play/Pause was browser-checked in the initial release. The studio adds device speech playback, microphone capture meter, local-only review notes, and individual asset downloads. The meter neither records nor transmits audio; browser speech synthesis may use a device/vendor service. Cloud voice providers remain unconfigured and unbenchmarked. Browser automation does not establish whether a sound feels pleasant to a user; use listening reviews.
