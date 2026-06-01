import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Speech from "expo-speech";

const player = createAudioPlayer(null);
let isAudioModeConfigured = false;

async function ensureAudioModeAsync() {
  if (isAudioModeConfigured) {
    return;
  }

  await setAudioModeAsync({
    interruptionMode: "mixWithOthers",
    shouldPlayInBackground: false,
    playsInSilentMode: true
  });
  isAudioModeConfigured = true;
}

export async function playPronunciationAudioAsync(audioUrl: string) {
  await ensureAudioModeAsync();
  await Speech.stop();
  player.pause();
  player.replace(audioUrl);
  await player.seekTo(0);
  player.play();
}

export async function speakPronunciationFallbackAsync(
  text: string,
  languageCode: string
) {
  await ensureAudioModeAsync();
  player.pause();
  await Speech.stop();

  await new Promise<void>((resolve, reject) => {
    Speech.speak(text, {
      language: languageCode,
      pitch: 1,
      rate: 0.9,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (error) => reject(error)
    });
  });
}
