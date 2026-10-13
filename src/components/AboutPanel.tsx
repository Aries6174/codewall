
export default function AboutPanel() {
  return (
    <section
      id="about"
      className="border border-[#494538] bg-[#171816] p-3"
    >
      <div className="mb-3 flex items-center justify-between border-b border-[#494538] pb-2">
        <h2 className="text-sm font-bold text-[#F5C542]">
          / ABOUT_ME
        </h2>

        <span className="text-xs text-[#92958B]">
          PROFILE_001
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#F5C542] bg-[#0B0C0B]">
          <span className="text-lg font-bold text-[#F5C542]">
            AJ
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#E6DDC9]">
            Adrian Joel Jaspa
          </h3>

          <p className="mt-1 text-xs text-[#D94B43]">
            COMPUTER AND INFORMATION SCIENCE GRADUATE
          </p>

          <p className="mt-2 text-xs leading-5 text-[#92958B]">
            I'm a recent Computer and Information Science graduate
            who enjoys coding, designing interfaces, and building
            useful systems. I like turning ideas into working
            projects and learning new technologies along the way.
          </p>

          <p className="mt-2 text-xs leading-5 text-[#92958B]">
            Outside of coding, I enjoy creative projects, art, and
            organizing information. I'm always looking for ways to
            improve my skills and build things that solve real
            problems.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="border border-[#494538] px-2 py-1 text-xs text-[#F5C542]">
              CODE
            </span>

            <span className="border border-[#494538] px-2 py-1 text-xs text-[#F5C542]">
              DESIGN
            </span>

            <span className="border border-[#494538] px-2 py-1 text-xs text-[#F5C542]">
              BUILD
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
