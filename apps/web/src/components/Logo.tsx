interface LogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

/** Marca do RisoAgenda: uma flor estilizada (unha/beleza) com um check de agenda. Tudo em SVG, sem assets externos. */
export function Logo({ size = 40, withText = true, className = "" }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="24" cy="24" r="24" fill="var(--color-brand-100)" />
        <g>
          <path
            d="M24 10c2.4 0 4 2.1 4 4.6 0 1.6-.8 3-1.9 4 1.5-.5 3.3-.4 4.6.7 2 1.6 2.2 4.4.8 6.3-.9 1.3-2.5 1.9-4 1.8 1.1 1 1.8 2.5 1.6 4.1-.3 2.5-2.6 4.2-5 3.9-1.5-.2-2.7-1.1-3.4-2.3-.7 1.2-1.9 2.1-3.4 2.3-2.5.3-4.7-1.4-5-3.9-.2-1.6.5-3.1 1.6-4.1-1.5.1-3.1-.5-4-1.8-1.4-1.9-1.2-4.7.8-6.3 1.3-1.1 3.1-1.2 4.6-.7-1.1-1-1.9-2.4-1.9-4 0-2.5 1.6-4.6 4-4.6z"
            fill="var(--color-brand-500)"
          />
          <circle cx="24" cy="25" r="3.4" fill="var(--color-gold-400)" />
        </g>
        <path
          d="M15.5 32.5l2.4 2.6 5-5.4"
          stroke="var(--color-brand-700)"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0.5 1)"
        />
      </svg>
      {withText && (
        <span className="font-semibold tracking-tight leading-none" style={{ fontSize: size * 0.5 }}>
          <span className="text-brand-700">Riso</span>
          <span className="text-gold-600">Agenda</span>
        </span>
      )}
    </div>
  );
}
