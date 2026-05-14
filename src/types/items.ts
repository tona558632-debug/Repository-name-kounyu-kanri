import type { CategoryCode, UsageStatus, HaiaceInstallStatus, HaiaceRoadLegal, FashionItemType } from "@/lib/validators/enums";

export type Marketplace = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  is_other: boolean;
};

export type Category = {
  id: string;
  code: CategoryCode;
  name: string;
  sort_order: number;
};

export type HaiacePosition = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

export type HaiacePurpose = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

export type ItemPhoto = {
  id: string;
  item_id: string;
  storage_path: string;
  kind: "product" | "receipt";
  sort_order: number;
  created_at: string;
  signed_url?: string | null;
};

export type FashionDetails = {
  item_id: string;
  item_type: FashionItemType | null;
  size: string | null;
  brand: string | null;
  color: string | null;
};

export type HaiaceDetails = {
  item_id: string;
  install_status: HaiaceInstallStatus;
  road_legal: HaiaceRoadLegal;
  positions: HaiacePosition[];
  purposes: HaiacePurpose[];
};

export type Item = {
  id: string;
  user_id: string;
  category_id: string;
  marketplace_id: string;
  marketplace_other_name: string | null;
  seller_name: string | null;
  name: string;
  purchase_price: number;
  shipping_fee: number;
  purchase_date: string;
  memo: string | null;
  usage_status: UsageStatus;
  last_used_at: string | null;
  storage_location: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  marketplace?: Marketplace;
  photos?: ItemPhoto[];
  fashion_details?: FashionDetails | null;
  haiace_details?: HaiaceDetails | null;
};
