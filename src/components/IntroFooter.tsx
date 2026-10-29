
type IntroFooterProps = {
  isExiting: boolean;
};

export default function IntroFooter({
  isExiting,
}: IntroFooterProps) {
  return (
    <footer
      className={`
        absolute inset-x-[15%] bottom-3 z-10
        hidden items-center justify-between gap-4
        border-t border-[#494538]/50 pt-2
        font-mono text-[9px] tracking-[0.1em]
        text-[#92958B]
        min-[900px]:flex
        transition-opacity duration-700
        ${isExiting ? "opacity-0" : "opacity-100"}
      `}
    >
      <span>
        © {new Date().getFullYear()} ADRIAN.JS
      </span>

      <span className="text-right">
        MADE IN ILOILO, PH / NEXT.JS + TYPESCRIPT
      </span>
    </footer>
  );
}
