export default function Metric({
  label,
  value,
  tone = "neutral",
  sub
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warn" | "danger";
  sub?: string;
}) {
  return (
    <div className={`metric ${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}