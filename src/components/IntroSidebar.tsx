import IntroLocationGraphic from "./IntroLocationGraphic";

export default function IntroSidebar() {
    const navigation = [
        { number: "01", label: "HOME" },
        { number: "02", label: "ABOUT" },
        { number: "03", label: "PROJECTS" },
        { number: "04", label: "CONTACT" },
    ];

    return (
        <aside className="flex h-full min-h-0 flex-col justify-between border-r border-[#494538] pr-5 font-mono">
            
            {/* Navigation */}
            <nav aria-label="Portfolio navigation" className="flex flex-col">

            {/* Section header */}
            <div className="mb-5 flex items-center justify-between border-b border-[#494538] pb-3">
                <span className="text-[11px] tracking-[0.15em] text-[#92958B]">
                NAVIGATION
                </span>

                <span className="text-[11px] text-[#F5C542]">
                [ 01 / 04 ]
                </span>
            </div>

            {/* Navigation items */}
            <div className="flex flex-col gap-5">
                {navigation.map((item, index) => (
                <div
                    key={item.number}
                    className="flex items-center gap-3 text-[15px]"
                >
                    <span
                    className={`h-3.5 w-[2px] ${
                        index === 0 ? "bg-[#F5C542]" : "bg-transparent"
                    }`}
                    />

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
            </div>

            </nav>

            {/* Location */}
            <div className="flex flex-col gap-3">

                <IntroLocationGraphic marker={{ x: 92, y:129 }} />

                <div className="border-t border-[#494538] pt-3">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[#F5C542]">
                            PH / 063
                        </span>

                        <span className="text-[#92958B]">
                            VISAYAS
                        </span>
                    </div>

                    <p className="mt-2 font-mono text-[10px] text-[#92958B]">
                        BASED IN THE PHILIPPINES
                    </p>
                </div>
            </div>
        </aside>
    );
}