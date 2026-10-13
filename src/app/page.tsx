
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import AboutPanel from "@/components/AboutPanel";
import ProjectsPanel from "@/components/ProjectsPanel";
import TechStackPanel from "@/components/TechStackPanel";
import ActivityPanel from "@/components/ActivityPanel";
import ArtworkPanel from "@/components/ArtworkPanel";

export default function Home() {
  return (
    <main
      id="home"
      className="h-screen overflow-hidden bg-background text-foreground"
    >
      <TopBar />

      <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden">
        <Sidebar />

        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] gap-3 overflow-hidden p-3">
          {/* Center dashboard */}
          <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_minmax(0,0.8fr)] gap-3 overflow-hidden">
            {/* Introduction */}
            <section className="min-h-0 overflow-hidden border border-[#494538] bg-[#171816] p-4">
              <p className="mb-2 text-xs text-[#D94B43]">
                {">"} WHOAMI
              </p>

              <h1 className="text-2xl font-bold tracking-tight 2xl:text-4xl">
                Adrian Joel{" "}
                <span className="text-[#F5C542]">Jaspa_</span>
              </h1>

              <p className="mt-3 text-sm text-[#F5C542]">
                Developer / Web Creator / Problem Solver
              </p>

              <p className="mt-3 max-w-xl text-xs leading-5 text-[#92958B]">
                I'm a Computer and Information Science graduate
                who enjoys building websites, managing databases,
                and turning ideas into real projects. I enjoy
                coding, art, organization, and play.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="#projects"
                  className="border border-[#F5C542] px-4 py-3 text-xs transition-colors hover:bg-[#F5C542] hover:text-black"
                >
                  VIEW PROJECTS →
                </a>

                <a
                  href="#about"
                  className="border border-[#494538] px-4 py-3 text-xs transition-colors hover:border-[#F5C542]"
                >
                  ABOUT ME →
                </a>
              </div>
            </section>

            {/* Projects and tech stack */}
            <div className="grid min-h-0 min-w-0 grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <ProjectsPanel />
              <TechStackPanel />
            </div>

            {/* About and activity */}
            <div className="grid h-full min-h-0 min-w-0 grid-cols-1 gap-3 overflow-hidden md:grid-cols-2">
              <AboutPanel />
              <ActivityPanel />
            </div>
          </div>

          {/* Right artwork column */}
          <div className="min-h-0 min-w-0 overflow-hidden">
            <ArtworkPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
