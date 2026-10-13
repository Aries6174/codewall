
const projects = [
  {
    id: "01",
    title: "Task Management App",
    technologies: "React / TypeScript",
  },
  {
    id: "02",
    title: "Elvicor Management System",
    technologies: "TypeScript / Database Design",
  },
  {
    id: "03",
    title: "Creative Portfolio",
    technologies: "Next.js / TypeScript / Tailwind CSS",
  },
];

export default function ProjectsPanel() {
  return (
    <section
      id="projects"
      
className="flex min-h-0 min-w-0 flex-col overflow-hidden border border-[#494538] bg-[#171816] p-3"

    >
      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-[#494538] pb-2">
        <h2 className="text-sm font-bold text-[#F5C542]">
          / FEATURED_PROJECTS
        </h2>

        <span className="text-xs text-[#92958B]">
          001—003
        </span>
      </div>

      <div className="flex min-h-0 flex-col gap-2">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className="group grid min-h-10 grid-cols-[36px_minmax(0,1fr)_auto_16px] items-center gap-2 border border-[#494538] px-3 py-2 text-left transition-colors hover:border-[#F5C542] hover:bg-[#0B0C0B]"
          >
            <span className="text-xs font-bold text-[#F5C542]">
              [{project.id}]
            </span>

            <span className="min-w-0 text-xs font-bold text-[#E6DDC9]">
              {project.title}
            </span>

            <span className="hidden text-right text-[10px] text-[#92958B] lg:block">
              {project.technologies}
            </span>

            <span className="text-right text-sm text-[#F5C542] transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
