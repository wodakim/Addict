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

export const mergeItems: MergeItemDefinition[] = [
  {
    "id": "coffee-bean-lv1",
    "name": "Coffee Bean",
    "level": 1,
    "mergeTargetId": "coffee-bean-lv2",
    "imageKey": "merge-items/coffee-bean-lv1",
    "rarity": "common",
    "production": 1,
    "sellPrice": 2,
    "unlockLevel": 1,
    "category": "decoration",
    "tags": [
      "bean",
      "starter"
    ],
    "description": "Freshly roasted starter bean.",
    "placementCost": 10
  },
  {
    "id": "coffee-bean-lv2",
    "name": "Premium Coffee Bean",
    "level": 2,
    "mergeTargetId": null,
    "imageKey": "merge-items/coffee-bean-lv2",
    "rarity": "rare",
    "production": 3,
    "sellPrice": 6,
    "unlockLevel": 1,
    "category": "furniture",
    "tags": [
      "bean",
      "premium"
    ],
    "description": "Richer aroma and higher output.",
    "placementCost": 25
  }
];
