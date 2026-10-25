
import Image from "next/image";

export default function IntroLocationGraphic() {
  return (
    <div className="w-full font-mono">
      <div className="flex items-center justify-between text-[9px] tracking-widest">
        <span className="text-[#92958B]">GEO / PH</span>
        <span className="text-[#F5C542]">063</span>
      </div>

      <Image
        src="/philippines-dots.svg"
        alt="Dot-matrix map of the Philippine islands with a marker in Iloilo"
        width={160}
        height={228}
        className="mt-3 h-auto w-full"
        priority
      />
    </div>
  );
}
