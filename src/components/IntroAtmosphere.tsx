
import Image from "next/image";

type IntroAtmosphereProps = {
  isExiting: boolean;
};

export default function IntroAtmosphere({
  isExiting,
}: IntroAtmosphereProps) {

    const waterMask= `
    radial-gradient(
        ellipse 16% 27% at 80% 73%
        black 25%
        transparent 100%
        )
    `;

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

            {/* Slowly drifting mountain mist */}
            <div
            className="landscape-mist pointer-events-none absolute
                left-[59%] top-[43%] h-[22%] w-[36%]
                rounded-full blur-2xl"
            style={{
                background: `
                radial-gradient(
                    ellipse,
                    rgba(230, 221, 201, 0.14) 0%,
                    rgba(178, 147, 91, 0.08) 45%,
                    transparent 75%
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
            maskImage: waterMask,
            WebkitMaskImage: waterMask,
            filter: "brightness(1.35) saturate(1.15)",
        }}
        />


    </div>

    
  );
}
