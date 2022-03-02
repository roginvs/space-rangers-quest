import { Quest } from "../lib/qmplayer/funcs";

export function checkQuest(quest: Quest, onWarn: (msg: string) => void) {
  quest.locations.forEach((l, idx, arr) => {
    const locationWithsSameId = arr.filter((candidateLocation) => l.id === candidateLocation.id);
    if (locationWithsSameId.length > 1) {
      onWarn(`Collision location id=${l.id}, locations count=${locationWithsSameId.length}`);
    }
  });
  quest.jumps.forEach((j, idx, arr) => {
    const jumpsWithSameId = arr.filter((candidateJump) => j.id === candidateJump.id);
    if (jumpsWithSameId.length > 1) {
      onWarn(`Collision jump id=${j.id}, jumps count=${jumpsWithSameId.length}`);
    }
  });
}
