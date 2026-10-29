
import Image from "next/image";

type LocationMarker = {
  x: number;
  y: number;
};

type IntroLocationGraphicProps = {
  marker?: LocationMarker | null;
};

export default function IntroLocationGraphic({
  marker = null,
}: IntroLocationGraphicProps) {
  return (
    <div className="w-full font-mono">
      <div className="flex items-center justify-between text-[11px] tracking-widest">
        <span className="text-[#92958B]">GEO / PH</span>
        <span className="text-[#F5C542]">063</span>
      </div>

      {/* Map and marker container */}
      <div
        className="
          relative mt-3
          w-[110%]
          [@media(max-height:760px)]:w-[85%]
        "
      >
        <Image
          src="/philippines-dots.svg"
          alt="Dot-matrix map of the Philippines"
          width={160}
          height={228}
          className="block h-auto w-full"
          priority
        />

        {/* Location marker overlay */}
        {marker && (
          <svg
            viewBox="0 0 160 228.4"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-label="Location marker"
          >
            
            {/* Animated radar pulse */}
            <circle
              cx={marker.x}
              cy={marker.y}
              r="5"
              fill="none"
              stroke="#F5C542"
              strokeWidth="1.5"
              className="marker-pulse"
            />

            <circle
              cx={marker.x}
              cy={marker.y}
              r="8"
              fill="none"
              stroke="#F5C542"
              strokeWidth="0.8"
              opacity="0.6"
            />

            <circle
              cx={marker.x}
              cy={marker.y}
              r="2.5"
              fill="#F5C542"
            />

            {/* Location label */}
            <line
              x1={marker.x - 5}
              y1={marker.y - 5}
              x2={marker.x - 13}
              y2={marker.y - 14}
              stroke="#F5C542"
              strokeWidth="0.6"
              opacity="0.8"
            />

            <text
              x={marker.x - 15}
              y={marker.y - 16}
              textAnchor="end"
              fill="#F5C542"
              fontSize="9"
              fontFamily="monospace"
              letterSpacing="0.5"
            >
              ILOILO / PH
            </text>

          </svg>
        )}
      </div>
    </div>
  );
}
