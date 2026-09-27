export function BusinessCardBack({
  artUrl,
  widthMm,
  heightMm,
}: {
  artUrl: string;
  widthMm: number;
  heightMm: number;
}) {
  return (
    <div className="pf-bcard" style={{ width: `${widthMm}mm`, height: `${heightMm}mm` }}>
      <img className="pf-bcard__art" src={artUrl} alt="" />
    </div>
  );
}
