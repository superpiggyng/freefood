/* Funders shown as a continuous strip. The track is duplicated so the loop is
   seamless, it pauses on hover, and it falls back to a static row for anyone
   who prefers reduced motion. */

import { sponsorLogos } from '../data/sponsors';

interface SponsorMarqueeProps {
  label?: string;
  note?: string;
}

export function SponsorMarquee({ label = 'Sponsored by', note }: SponsorMarqueeProps) {
  const track = [...sponsorLogos, ...sponsorLogos];

  return (
    <section className="sponsor-strip" aria-labelledby="sponsor-strip-title">
      <div className="page-shell">
        <div className="sponsor-strip__head">
          <h2 id="sponsor-strip-title">{label}</h2>
          {note && <p>{note}</p>}
        </div>
        <div className="sponsor-marquee">
          <ul className="sponsor-marquee__track">
            {track.map((sponsor, index) => (
              <li key={`${sponsor.name}-${index}`} aria-hidden={index >= sponsorLogos.length}>
                <img src={sponsor.logo} alt={index < sponsorLogos.length ? sponsor.name : ''} loading="lazy" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default SponsorMarquee;
