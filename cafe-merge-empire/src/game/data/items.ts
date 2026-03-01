/* AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY. */
export interface MergeItemDefinition {
  id: string;
  name: string;
  level: number;
  mergeTargetId: string | null;
  imageKey: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  production: number;
  sellPrice: number;
  unlockLevel: number;
  category: 'ingredient' | 'recipe' | 'furniture' | 'decoration' | 'special';
  tags: string[];
  description: string;
  placementCost: number;
}

export const mergeItems: MergeItemDefinition[] = [];
