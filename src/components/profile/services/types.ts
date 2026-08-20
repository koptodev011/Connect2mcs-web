export type ServiceKind = "tiffin" | "maid" | "taxi" | "mentor";

export type OwnedService = {
  kind: ServiceKind;
  id: number;
  title: string;
  subtitle: string;
  meta: string[];
  updatedAt: string;
  record: Record<string, unknown>;
};
