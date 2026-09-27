import { muted, statValue } from './styles';

export function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={statValue}>{value}</span>
      <span style={{ ...muted, fontSize: 13 }}>{label}</span>
    </div>
  );
}
