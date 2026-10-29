
"use client";

import { useEffect, useRef, useState } from "react";

type Telemetry = {
  velocity: number;
  direction: string;
};

export default function PointerTelemetry() {
  const [telemetry, setTelemetry] = useState<Telemetry>({
    velocity: 0,
    direction: "STILL",
  });

  const previousPointer = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const resetTelemetry = () => {
      previousPointer.current = null;
      setTelemetry({
        velocity: 0,
        direction: "STILL",
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const now = performance.now();
      const previous = previousPointer.current;

      if (previous) {
        const dx = event.clientX - previous.x;
        const dy = event.clientY - previous.y;

        const distance = Math.hypot(dx, dy);
        const elapsed = now - previous.time;

        const velocity =
          elapsed > 0 ? (distance / elapsed) * 1000 : 0;

        const directions = [
          "E", "SE", "S", "SW",
          "W", "NW", "N", "NE",
        ];

        const angle = Math.atan2(dy, dx);
        const index =
          (Math.round(angle / (Math.PI / 4)) + 8) % 8;

        setTelemetry({
          velocity,
          direction: distance > 0.5
            ? directions[index]
            : "STILL",
        });
      }

      previousPointer.current = {
        x: event.clientX,
        y: event.clientY,
        time: now,
      };

      if (idleTimer !== null) {
        clearTimeout(idleTimer);
      }

      // Reset when the mouse stops moving.
      idleTimer = setTimeout(resetTelemetry, 400);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("blur", resetTelemetry);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetTelemetry);

      if (idleTimer !== null) {
        clearTimeout(idleTimer);
      }
    };
  }, []);

  const velocityLevel = Math.min(
    8,
    Math.floor(telemetry.velocity / 200)
  );

  return (
    <>
      <span className="text-[#92958B]">
        › MOVEMENT VECTOR
      </span>
      <span className="text-right text-[#F5C542]">
        {telemetry.direction}
      </span>

      <span className="text-[#92958B]">
        › SPEED
      </span>

      <div className="flex items-center justify-end gap-[3px]">
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className={`h-[3px] w-[9px] transition-colors duration-100 ${
              index < velocityLevel
                ? "bg-[#F5C542]"
                : "bg-[#494538]"
            }`}
          />
        ))}
      </div>
    </>
  );
}
