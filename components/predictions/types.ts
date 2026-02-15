// /components/predictions/types.ts
export type DriverRow = {
  id: string;
  code: string;
  full_name: string;
  is_active: boolean;
};

export type TeamRow = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

export type Pick =
  | { kind: "driver"; id: string }
  | { kind: "team"; id: string }
  | null;