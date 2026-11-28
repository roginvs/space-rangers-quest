export type QuestPassedAt = undefined | false | true | Date;

export interface QuestPassingProof {
  performedJumps: ReadonlyArray<{
    dateUnix: number;
  }>;
}

export interface QuestPassing {
  seed: string;
  started: number;
  end: number;
  durationsMins: number;
}

export interface QuestPassedInfo {
  loading: boolean;
  passedAt: QuestPassedAt;
  passings: QuestPassing[];
}

export function getQuestPassedInfo(
  proofs: { [seed: string]: QuestPassingProof } | false | null | undefined,
  loaded: boolean,
): QuestPassedInfo {
  if (!loaded) {
    return {
      loading: true,
      passedAt: undefined,
      passings: [],
    };
  }

  if (typeof proofs !== "object" || proofs === null || Object.keys(proofs).length < 1) {
    return {
      loading: false,
      passedAt: false,
      passings: [],
    };
  }

  const firstPassedAt = Math.min(
    ...Object.keys(proofs).map(
      (key) => proofs[key].performedJumps.slice(-1).pop()?.dateUnix || Infinity,
    ),
  );
  const passedAt: QuestPassedAt = firstPassedAt === Infinity ? true : new Date(firstPassedAt);

  const passings = Object.keys(proofs)
    .map((seed) => {
      const log = proofs[seed];
      const firstStep = log.performedJumps.slice(0).shift();
      const lastStep = log.performedJumps.slice(-1).shift();
      if (!firstStep || !lastStep) {
        return null;
      }
      const durationsMins = Math.ceil(
        (new Date(lastStep.dateUnix).getTime() - new Date(firstStep.dateUnix).getTime()) /
          (1000 * 60),
      );
      return {
        seed,
        started: firstStep.dateUnix,
        end: lastStep.dateUnix,
        durationsMins,
      };
    })
    .filter((x): x is QuestPassing => x !== null)
    .sort((a, b) => a.started - b.started);

  return {
    loading: false,
    passedAt,
    passings,
  };
}
