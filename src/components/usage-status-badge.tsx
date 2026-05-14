import { Badge } from "@/components/ui/badge";
import { usageStatusLabels, type UsageStatus } from "@/lib/validators/enums";

const variantMap: Record<UsageStatus, "default" | "secondary" | "success" | "warning" | "info" | "outline" | "destructive"> = {
  in_use: "success",
  storing: "secondary",
  unused: "warning",
  listing: "info",
  sold: "outline",
  disposed: "outline",
};

export function UsageStatusBadge({ status }: { status: string }) {
  const s = status as UsageStatus;
  return (
    <Badge variant={variantMap[s] ?? "outline"} className="text-xs">
      {usageStatusLabels[s] ?? status}
    </Badge>
  );
}
