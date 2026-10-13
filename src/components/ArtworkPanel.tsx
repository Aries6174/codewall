export default function ArtworkPanel(){
    return(
        <section
            aria-label="Character artwork"
            className="relative flex h-full min-h-0 items-center justify-center overflow-hidden border border-[#494538] bg-[#0B0C0B] p-4"
        >
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#F5C54220,_transparent_60%)]" />

            <div className="absolute left-4 top-4 text-xs text-[#F5C542]">
                FIG_001 // CHARACTER FILE
            </div>

            <div className="absolute right-4 top-4 text-xs text-[#92958B]">
                [ CLASSIFIED ]
            </div>

            {/* Temporary artwork */}
            <div className="relative z-10 text-center">
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-[#F5C542] bg-[#171816]">
                    <span className="text-6xl font-bold text-[#F5C542]">
                        {"</>"}
                    </span>
                </div>

                <h2 className="mt-6 text-lg font-bold text-[#F5C542]">
                    ARTWORK MODULE
                </h2>

                <p className="mt-2 text-xs leading-6 text-[#D94B43]">
                    STATUS: AWAITING ASSET
                </p>

                <div className="absolute bottom-4 left-4 text-xs text-[#92958B]">
                    001 / 001
                </div>
            </div>
        </section>
    );
}