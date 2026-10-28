
"use client";

import { useEffect, useRef, useState } from "react";

type PointerPosition = {
  x: number;
  y: number;
  flip: boolean;
  flipY: boolean;
};

export default function PointerTracker() {
  const [position, setPosition] =
    useState<PointerPosition | null>(null);

  const [isTracking, setIsTracking] = useState(false);

  const idleTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

    setPosition({
        x: event.clientX,
        y: event.clientY,
        flip: event.clientX > window.innerWidth - 200,
        flipY: event.clientY > window.innerHeight - 110,
    });

      setIsTracking(true);

      if (idleTimer.current !== null) {
        clearTimeout(idleTimer.current);
      }

      idleTimer.current = setTimeout(() => {
        setIsTracking(false);
      }, 900);
    };

    const handleBlur = () => {
      setIsTracking(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handleBlur);

      if (idleTimer.current !== null) {
        clearTimeout(idleTimer.current);
      }
    };
  }, []);

  if (!position) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div
        className={`absolute transition-opacity duration-300 motion-reduce:transition-none ${
          isTracking ? "opacity-100" : "opacity-0"
        }`}
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Tracking box */}
        <div
        className={`absolute left-0 top-0 h-8 w-8
            -translate-x-1/2 -translate-y-1/2
            transition-transform duration-300
            ease-[cubic-bezier(0.16,1,0.3,1)]
            motion-reduces:transition-none
            ${
            isTracking
                ? "scale-100 rotate-0"
                : "scale-25 rotate-45"
            }`}
        >

          {/* Top left */}
          <span className="absolute left-0 top-0 h-2 w-2 border-l-[0.5px] border-t-[0.5px] border-[#F5C542]" />

          {/* Top right */}
          <span className="absolute right-0 top-0 h-2 w-2 border-r-[0.5px] border-t-[0.5px] border-[#F5C542]" />

          {/* Bottom left */}
          <span className="absolute bottom-0 left-0 h-2 w-2 border-b-[0.5px] border-l-[0.5px] border-[#F5C542]" />

          {/* Bottom right */}
          <span className="absolute bottom-0 right-0 h-2 w-2 border-b-[0.5px] border-r-[0.5px] border-[#F5C542]" />

          {/* Center tracking dot */}
          <span className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D94B43]" />
        </div>

        {/* Coordinate readout */}
        <div
          className={`absolute flex items-start gap-2 ${
            position.flipY
                ? "bottom-0"
                : "top-0"
          } ${
            position.flip
                ? "right-[28px] flex-row-reverse"
                : "left-[28px]"
          }`}
        >
          {/* Connecting line */}
          <div className="mt-[2px] h-px w-3 bg-[#494538]" />

          <div
            className={`min-w-[100px] font-mono transition-all duration-200 motion-reduce:transition-none ${
              isTracking
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0"
            }`}
          >
            <p className="mb-1 text-[8px] tracking-widest text-[#92958B]">
              CURSOR / TRACK
            </p>

            <p className="text-[10px] tabular-nums text-[#F5C542]">
              X {position.x.toFixed(2)}
            </p>

            <p className="text-[10px] tabular-nums text-[#F5C542]">
              Y {position.y.toFixed(2)}
            </p>


          </div>
        </div>
      </div>
    </div>
  );
}
