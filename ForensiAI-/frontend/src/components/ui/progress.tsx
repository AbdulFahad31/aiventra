export function Progress({ value, tone = "blue" }: { value: number; tone?: "blue" | "red" | "yellow" | "green" }) {
  const color = {
    blue: "#dc2626",
    red: "#ef4444",
    yellow: "#f59e0b",
    green: "#dc2626"
  }[tone];

  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#2d1515]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}


