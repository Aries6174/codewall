export default function IntroSidebar() {
    const navigation = [
        { number: "01", label: "HOME" },
        { number: "02", label: "ABOUT" },
        { number: "03", label: "PROJECTS" },
        { number: "04", label: "CONTACT" },
    ];

    return (
        <aside className="flex h-full flex-col justify-between border-r border-[#494538] pr-5 font-mono">
            {/* Navigation */}
            <nav aria-label="Portfolio navigation" className="flex flex-col gap-5">
                {navigation.map((item, index) => (
                    <div
                        key={item.number}
                        className="flex items-center gap-4 text-[11px]"
                    >
                        <span className="text-[#D94B43]">
                            {item.number}
                        </span>

                        <span
                            className={
                                index === 0
                                ? "text-[#F5C542]"
                                : "text-[#92958B]"
                            }
                        >
                            {item.label}
                        </span>
                    </div>
                ))}
            </nav>

            {/* Location */}
                <div className="flex flex-col gap-2 text-[10px]">
                    <span className="text-[#F5C542]">
                        PH / 063
                    </span>

                    <span className="text-[#92958B]">
                        BASED IN THE PHILIPPINES
                    </span>
                </div>

        </aside>
    );
}