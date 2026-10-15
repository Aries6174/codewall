
type IntroTopBarProps = {
  hasEntered: boolean;
  isExiting: boolean;
};

export default function IntroTopBar({
  hasEntered,
  isExiting,
}: IntroTopBarProps) {
  return (
    <header
      className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between
        px-6 py-5
        transition-opacity duration-700
        ${isExiting ? "opacity-0" : "opacity-100"}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold tracking-[0.2em] text-[#F5C542]">
          A.JS
        </span>

        <span className="h-5 w-px bg-[#494538]" />

        <span className="text-[10px] tracking-[0.15em] text-[#92958B]">
          PORTFOLIO_SYSTEM v1.0
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${
            hasEntered ? "bg-[#F5C542]" : "bg-[#D94B43]"
          }`}
        />

        <span className="text-[10px] tracking-[0.2em] text-[#92958B]">
          {hasEntered ? "INITIALIZING" : "STANDBY"}
        </span>
      </div>
    </header>
  );
}
