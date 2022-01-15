export interface FirebaseCustomQuest {
  quest_qmm_gz_base64: string;
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
  getMyUserId(): string | null;
}
