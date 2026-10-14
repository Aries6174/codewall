
"use client";

import {
  siTypescript,
  siReact,
  siNextdotjs,
  siTailwindcss,
  siJavascript,
  siPostgresql,
} from "simple-icons";

const technologies = [
  { name: "TypeScript", icon: siTypescript, status: "ACTIVE" },
  { name: "React", icon: siReact, status: "ACTIVE" },
  { name: "Next.js", icon: siNextdotjs, status: "ACTIVE" },
  { name: "Tailwind CSS", icon: siTailwindcss, status: "ACTIVE" },
  { name: "JavaScript", icon: siJavascript, status: "ACTIVE" },
  { name: "PostgreSQL", icon: siPostgresql, status: "PLANNED" },
];

export default function TechStackPanel() {
  return (
    <section
      id="tech"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden border border-[#494538] bg-[#171816] p-3"
    >
      {/* Panel header */}
      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-[#494538] pb-2">
        <h2 className="text-sm font-bold text-[#F5C542]">
          / TECH_STACK
        </h2>

        <span className="text-xs text-[#92958B]">
          MODULE_002
        </span>
      </div>

      {/* Technology icons */}
      <div className="grid grid-cols-3 gap-2">
        {technologies.map((tech) => (
          <div key={tech.name} className="group relative">
            <div
              tabIndex={0}
              aria-label={`${tech.name} — ${tech.status}`}
              className="flex h-12 w-full items-center justify-center border border-[#494538] bg-[#0B0C0B] transition-all duration-200 hover:border-[#F5C542] hover:bg-[#F5C542]/10 hover:shadow-[0_0_12px_#F5C54220] focus-visible:border-[#F5C542] focus-visible:outline-none"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                  tech.status === "LEARNING"
                    ? "text-[#D94B43]"
                    : tech.status === "PLANNED"
                      ? "text-[#92958B]"
                      : "text-[#F5C542]"
                }`}
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={tech.icon.path} />
              </svg>
            </div>

            {/* Hover and keyboard-focus tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 border border-[#494538] bg-[#0B0C0B] px-3 py-2 text-center opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              <p className="text-xs font-bold text-[#F5C542]">
                {tech.name}
              </p>

              <p
                className={`mt-1 text-[10px] ${
                  tech.status === "LEARNING"
                    ? "text-[#D94B43]"
                    : tech.status === "PLANNED"
                      ? "text-[#92958B]"
                      : "text-[#E6DDC9]"
                }`}
              >
                [{tech.status}]
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Panel footer */}
      <div className="mt-auto pt-3">
        <p className="text-[10px] text-[#92958B]">
          6 MODULES // HOVER TO INSPECT
        </p>
      </div>
    </section>
  );
}
