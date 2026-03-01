export function maskName(fullName: string): string {
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) return "";

  const maskPart = (part: string) => {
    if (part.length <= 2) return part[0] + "*";
    return part[0] + "*".repeat(part.length - 2) + part[part.length - 1];
  };

  return parts.map(maskPart).join(" ");
}

export function ageToRange(age: number): string {
  if (age <= 17) return "0–17";
  if (age <= 25) return "18–25";
  if (age <= 35) return "26–35";
  if (age <= 45) return "36–45";
  if (age <= 55) return "46–55";
  return "56+";
}

