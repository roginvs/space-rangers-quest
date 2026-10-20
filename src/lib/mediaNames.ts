/**
 * Quests are referencing audible media by name which could have ".ogg"/".mp3" extension
 * or no extension at all:
 *   "QuestSoundtrack.ForQuest_COSMIC"
 *   "seed.ogg"
 *
 * All audible media is stored and served as ".mp3" (ogg files are transcoded into mp3
 * while packing game data, see packGameData/music.ts), so this converts any of such names
 * into lowercased ".mp3" filename.
 */
export function audioMediaNameToMp3FileName(mediaName: string): string {
  return mediaName.toLowerCase().replace(/\.(ogg|mp3)$/, "") + ".mp3";
}
