export interface PlayerState {
  userId: string;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  streak: number;
  title: string;
  stats?: {
    int: number;
    wis: number;
    str: number;
    end: number;
    cre: number;
    soc: number;
  };
  facilities?: Array<{ facilityId: string; level: number }>;
}

export interface AssignmentData {
  id: string;
  title: string;
  subject: string;
  priority: number;
  status: string;
  dueDate?: string;
}

export interface FacilityData {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockLevel: number;
  maxLevel: number;
  baseCost: number;
  effectType: 'xp_bonus' | 'gold_bonus' | 'streak_protect';
  effectPerLevel: number;
  position: { x: number; y: number };
  buildingType: string;
}

export interface MonsterData {
  subject: string;
  difficulty: number;
  assignmentId: string;
  hp: number;
  maxHp: number;
  xpReward: number;
  goldReward: number;
  spawnPeriod?: string;
  isActivePeriod?: boolean;
}
