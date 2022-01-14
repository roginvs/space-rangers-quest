export interface FirebaseCustomQuest {
  quest_qmm_gz: Uint8Array;
  isPublic: boolean;
  updatedAt: number;
}

export interface CloudQuestsProps {
  saveCustomQuest(questName: string, data: FirebaseCustomQuest | null): Promise<void>;
  loadCustomQuest(
    targetUserId: string | undefined,
    questName: string,
  ): Promise<FirebaseCustomQuest | null>;
  getAllMyCustomQuests(): Promise<Record<string, FirebaseCustomQuest> | null>;
}
