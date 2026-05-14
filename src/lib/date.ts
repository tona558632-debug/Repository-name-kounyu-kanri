import { format, parseISO, isValid } from "date-fns";
import { ja } from "date-fns/locale";

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "yyyy/MM/dd", { locale: ja });
}

export function formatDatetime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "yyyy/MM/dd HH:mm", { locale: ja });
}

export function toInputDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
}

export function todayInputDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}
