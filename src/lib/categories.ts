import { Train, Landmark, Utensils, BedDouble, ShoppingBag, Sparkles, CircleDot, type LucideIcon } from "lucide-react";
import type { Category } from "@prisma/client";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  TRANSPORT: Train,
  SIGHT: Landmark,
  FOOD: Utensils,
  LODGING: BedDouble,
  SHOPPING: ShoppingBag,
  FREE: Sparkles,
  OTHER: CircleDot,
};

export const CATEGORY_LABEL_KEYS: Record<Category, DictKey> = {
  TRANSPORT: "categoryTRANSPORT",
  SIGHT: "categorySIGHT",
  FOOD: "categoryFOOD",
  LODGING: "categoryLODGING",
  SHOPPING: "categorySHOPPING",
  FREE: "categoryFREE",
  OTHER: "categoryOTHER",
};

export const CATEGORY_VALUES = Object.keys(CATEGORY_ICONS) as Category[];
