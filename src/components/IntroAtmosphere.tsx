
import Image from "next/image";

type IntroAtmosphereProps = {
  isExiting: boolean;
};

export default function IntroAtmosphere({
  isExiting,
}: IntroAtmosphereProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0
        hidden overflow-hidden bg-[#020202]
        min-[900px]:block
        transition-opacity duration-700
        ${isExiting ? "opacity-0" : "opacity-100"}`}
    >
      {/* Background image */}
      <Image
        src="/images/moonlit-landscape-wide.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-contain object-right"
      />

      {/* Dark overlay to preserve UI readability */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to right,
            #020202 0%,
            rgba(2, 2, 2, 0.98) 30%,
            rgba(2, 2, 2, 0.9) 55%,
            rgba(2, 2, 2, 0.78) 70%,
            rgba(2, 2, 2, 0.3) 100%
          )`,
        }}
      />

        {/* Animated moonlight - aligned with the image*/}
        <div
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2"
            style={{
                width: "min(100%, 177.68dvh)",
                aspectRatio: "1672 / 941",
            }}
        >
            <div
                className="landscape-moon-glow pointer-events-none absolute inset-0"
                style={{
                    background: `
                    radial-gradient(
                        circle 200px at 86% 29%,
                        rgba(245, 197, 66, 0.22) 0%,
                        rgba(245, 197, 66, 0.08) 45%,
                        transparent 100%
                    )
                    `,
                }}
            />
        </div>

        
        {/* Animated water reflections */}
        <Image
        src="/images/moonlit-landscape-wide.webp"
        alt=""
        fill
        sizes="100vw"
        className="landscape-water-shimmer object-contain object-right"
        style={{
            maskImage: `
            radial-gradient(
                ellipse 13% 32% at 82% 7%,
                black 10%,
                transparent 100%
            )
            `,
            WebkitMaskImage: `
            radial-gradient(
                ellipse 16% 27% at 80% 73%,
                black 25%,
                transparent 100%
            )
            `,
            filter: "brightness(1.35) saturate(1.15)",
        }}
        />


    </div>

    
  );
}
