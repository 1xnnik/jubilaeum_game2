import { useId } from 'react';

// Each default picture is a viewport into the shared photographic contact sheet.
// Keep the old image keys so existing saved games automatically show the new photos.
export function ItemImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const clipId = useId();
  const match = /^\/items\/(\d+)\.svg$/.exec(src);
  const index = match ? Number(match[1]) - 1 : -1;
  if (index === 9) return <img className={className} src="/items/empty-beer-glass-photo.png" alt={alt} data-source={src} />;
  if (index === 14) return <img className={className} src="/items/beer-photo.png" alt={alt} data-source={src} />;
  if (index < 0 || index > 14) return <img className={className} src={src} alt={alt} />;
  const row = Math.floor(index / 5);
  const top = [0, 324, 632][row];
  const height = [324, 308, 339][row];
  const width = 1619 / 5;
  return <svg className={className} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} data-source={src} viewBox={`${(index % 5) * width} ${top} ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id={clipId}><rect x={(index % 5) * width} y={top} width={width} height={height} /></clipPath></defs>
    <image href="/items/objects-photo.png" width="1619" height="971" clipPath={`url(#${clipId})`} />
  </svg>;
}
