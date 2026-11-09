# The Living Portal

First milestone for the DEV Presage SmartSpectra SDK Challenge. The Electron observatory uses the live SmartSpectra chest-breathing waveform to change the portal ring radius. The ring waits for a valid signal and holds its position if tracking drops.

## Run on macOS

Use an Apple Silicon Mac, Node.js 22.12 or newer, a camera, and an internet connection for Presage authorization. Confirm your architecture with `uname -m` (`arm64` on Apple Silicon). Get your own key from the [Presage Developer Portal](https://physiology.presagetech.com/). From this folder in the default macOS zsh shell:

```zsh
npm ci
read -rs 'PRESAGE_API_KEY?Presage API key: '
export PRESAGE_API_KEY
printf '\n'
npm start
unset PRESAGE_API_KEY
```

1. Confirm the app opens with **Camera off**.
2. Choose **Enable Camera** and approve the macOS prompt if shown.
3. Sit in even light with your face and upper chest in frame. Breathe normally. Confirm the live status and ring movement.
4. Step out of frame. Confirm the ring pauses, then return and confirm it resumes.
5. Select **Stop Camera**. Confirm the status returns to **Camera off** and the camera indicator turns off.

## Consent and data handling

The player starts camera capture by selecting **Enable Camera**. **Stop Camera** and closing the window end the session. SmartSpectra processes camera frames on device and contacts Presage for SDK authorization. The app does not save or share frames or readings. It keeps up to 12 seconds of waveform samples in memory to map movement to the ring, then discards them as they age out or when tracking stops. SDK aggregate telemetry and accumulated output are explicitly disabled. The app uses no AI insight service. Keep the API key out of the repository and demo recording.

## Challenge status

Live webcam behavior requires verification on a supported desktop. After verifying the signal, the agreed puzzle adds three runes, Space to align each one, progress preservation on tracking loss, and the portal-opening scene. The submission requires a public repository, setup instructions, a demo video showing the live signal, and the official DEV template with the `#presagechallenge` tag and its Consent and Data Handling section.

[DEV challenge and submission template](https://dev.to/challenges/presage-2026-11-04/) · [Presage desktop guide](https://smartspectra.presagetech.com/docs/nodejs/) · [Presage telemetry and privacy](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/)
