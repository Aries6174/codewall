export default function TopBar(){
    return (
        <header className="flex h-10 items-center justify-between border border-[#494538] bg-[#0B0C0B] px-3 text-xs">
            <div className="flex items-center gap-3">
                <span className="font-bold text-[#f5c542]">
                    ADRIAN PORTFOLIO
                </span>
                <span className="hidden text-[#92958B] sm:inline">
                    &gt;_
                </span>
                <span className="hidden text-[#92958B] md:inline">
                    1&nbsp;&nbsp;2&nbsp;&nbsp;3&nbsp;&nbsp;4&nbsp;&nbsp;5
                </span>
            </div>

            <span className="hidden text-[#92958B] md:inline">
                build / code / create / repeat
            </span>

            <div className="flex items-center gap-2 text-[#F5C542]">
                <span className="h-2 w-2 rounded-full bg-[#F5c542]" />
                <span>ONLINE</span>
            </div>
        </header>
    );
}