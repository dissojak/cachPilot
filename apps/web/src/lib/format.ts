export function money(millimes: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(millimes / 1000) + " DNT";
}

export function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
