import TopBar from "@/components/TopBar"
import Sidebar from "@/components/Sidebar"

export default function Home(){
  return(
    <main id="home" className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <TopBar />

      {/* Dashboard Layout */}
      <div className="flex min-h-[calc(100vh-6rem)]">
        <Sidebar />

        {/* Main Content */}
        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <p className="mb-4 text-sm text-[#d94b43]">
              [ DEVELOPER PROFILE / 001 ]
            </p>

            <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">
              ADRIAN JOEL
              <span className="block text-[#f5c542]">
                JASPA_
              </span>
            </h2>

            <p className="mt-6 max-w-lg leading-7 text-[#92958B]">
              Computer and Information Science graduate.
              Building systems, interfaces, and digital experiences
              one line of code at a time.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#projects"
                className="border border-[#f5c542] px-5 py-3 text-sm text-[#f5c542] transition-colors hover:bg-[#f5c542] hover:text-black"
                >
                  [ VIEW PROJECTS ]
                </a>

                <a
                  href="#about"
                  className="border border-[#494538] px-5 py-3 text-sm transition-colors hover:border-[#e6ddc9]"
                >
                  [ ABOUT ME ]
                </a>
            </div>
          </div>

          {/* Artwork placeholder */}
          <div className="flex min-h-72 items-center justify-center border border-[#494538] bg-[#171816] p-8">
            <div className="text-center">
              <p className="text-5xl text-[#f5c542]">{"</>"}</p>
              <p className="mt-4 text-sm text-[#f5c542]">
                ARTWORK MODULE
              </p>
              <p className="mt-2 text-xs text-[#92958B]">
                FILIPINO CYBERPUNK // COMING SOON
              </p>
            </div>
          </div>
        </section>
      </div>
      {/* Footer */}
      <footer className="border-t border-[#494538] px-6 py-4 text-xs text-[#92958b]">
        ILOILO, PHILIPPINES // DESIGNED & BUILT BY ADRIAN
      </footer>
    </main>
  );
}