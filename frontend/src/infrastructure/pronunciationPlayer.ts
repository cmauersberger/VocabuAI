import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

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
  player.pause();
  player.replace(audioUrl);
  await player.seekTo(0);
  player.play();
}
