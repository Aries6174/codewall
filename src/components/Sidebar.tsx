export default function Sidebar(){
    return (
        <aside className="flex h-full w-14 shrink-0 flex-col items-center gap-6 border border-[#494538] bg-[#171816] py-6">
            <a
                href="#home"
                title="Home"
                className="text-lg text-[#F5C542] transition-colors hover:text-[#E6DDC9]"
            >
                ⌂   
            </a>

            <a
                href="#tech"
                title="Tech"
                className="text-lg text-[#92958B] transition-colors hover:text-[#f5c542]"
            >
                ⌘
            </a>

            <a
                href="#about"
                title="About Me"
                className="text-lg text-[#92958b] transition-colord hover:text-[#f5sc542]"
            >
                ◉
            </a>
        </aside>
    );
}