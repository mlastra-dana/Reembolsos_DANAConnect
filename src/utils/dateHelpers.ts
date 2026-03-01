export function todayAsString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

