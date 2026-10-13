
"use client";

import {
  siTypescript,
  siReact,
  siNextdotjs,
  siTailwindcss,
  siPostgresql,
} from "simple-icons";

// Java logo supplied from your SVG.
// The outer square background has been removed.
const javaIconPath =
  "M14.256 13.08c1.56 0 2.28 1.08 2.304 2.64h-1.608c.024-.288-.048-.6-.144-.84-.096-.192-.288-.264-.552-.264-.456 0-.696.264-.696.84-.024.576.288.888.768 1.08.72.288 1.608.744 1.92 1.296q.432.648.432 1.656c0 1.608-.912 2.592-2.496 2.592-1.656 0-2.4-1.032-2.424-2.688h1.68c0 .792.264 1.176.792 1.176.264 0 .456-.072.552-.24.192-.312.24-1.176-.048-1.512-.312-.408-.912-.6-1.32-.816q-.828-.396-1.224-.936c-.24-.36-.36-.888-.36-1.536 0-1.44.936-2.472 2.424-2.448m5.4 0c1.584 0 2.304 1.08 2.328 2.64h-1.608c0-.288-.048-.6-.168-.84-.096-.192-.264-.264-.528-.264-.48 0-.72.264-.72.84s.288.888.792 1.08c.696.288 1.608.744 1.92 1.296.264.432.408.984.408 1.656.024 1.608-.888 2.592-2.472 2.592-1.68 0-2.424-1.056-2.448-2.688h1.68c0 .744.264 1.176.792 1.176.264 0 .456-.072.552-.24.216-.312.264-1.176-.048-1.512-.288-.408-.888-.6-1.32-.816-.552-.264-.96-.576-1.2-.936s-.36-.888-.36-1.536c-.024-1.44.912-2.472 2.4-2.448m-11.031.018c.711-.006 1.419.198 1.839.63.432.432.672 1.128.648 1.992H9.336c.024-.456-.096-.792-.432-.96-.312-.144-.768-.048-.888.24-.12.264-.192.576-.168.864v3.504c0 .744.264 1.128.768 1.128a.65.65 0 0 0 .552-.264c.168-.24.192-.552.168-.84h1.776c.096 1.632-.984 2.712-2.568 2.688-1.536 0-2.496-.864-2.472-2.472v-4.032c0-.816.24-1.44.696-1.848.432-.408 1.146-.624 1.857-.63";

// Keep each technology's icon and status together.
const technologies = [
  { name: "TypeScript", icon: siTypescript, status: "ACTIVE" },
  { name: "React", icon: siReact, status: "ACTIVE" },
  { name: "Next.js", icon: siNextdotjs, status: "ACTIVE" },
  { name: "Tailwind CSS", icon: siTailwindcss, status: "ACTIVE" },
  { name: "Java", icon: { path: javaIconPath }, status: "LEARNING" },
  { name: "PostgreSQL", icon: siPostgresql, status: "PLANNED" },
];

export default function TechStackPanel() {
  return (
    <section
      id="tech"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden border border-[#494538] bg-[#171816] p-3"
    >
      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-[#494538] pb-2">
        <h2 className="text-sm font-bold text-[#F5C542]">
          / TECH_STACK
        </h2>

        <span className="text-xs text-[#92958B]">
          MODULE_002
        </span>
      </div>

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

            {/* Hover tooltip */}
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

      <div className="mt-auto pt-3">
        <p className="text-[10px] text-[#92958B]">
          6 MODULES // HOVER TO INSPECT
        </p>
      </div>
    </section>
  );
}
