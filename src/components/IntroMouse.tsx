"use client";

import { useEffect, useRef, useState } from "react";

type IntroMouseProps ={
    isMouseActive: boolean;
    mouseOffset: {
      x: number;
      y: number;
    };
};

export default function IntroMouse({ 
  isMouseActive,
  mouseOffset,
 }: IntroMouseProps) {
    const [leftPressed, setLeftPressed] = useState(false);
    const [rightPressed, setRightPressed] = useState(false);
    const [scrollDirection, setScrollDirection] = useState(0);

    const scrollTimeoutRef = useRef<ReturnType<
    typeof setTimeout
    > | null>(null);

  // Detect left and right mouse clicks
    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
        if (event.button === 0) {
            setLeftPressed(true);
        }

        if (event.button === 2) {
            setRightPressed(true);
        }
        };

        const handleMouseUp = (event: MouseEvent) => {
        if (event.button === 0) {
            setLeftPressed(false);
        }

        if (event.button === 2) {
            setRightPressed(false);
        }
        };

        const handleBlur = () => {
        setLeftPressed(false);
        setRightPressed(false);
        };

        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("blur", handleBlur);

        return () => {
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("blur", handleBlur);
        };
    }, []);

    // Detect mouse wheel scrolling
    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
        if (event.deltaY === 0) return;

        const direction = event.deltaY > 0 ? 1 : -1;

        setScrollDirection(direction);

        // Clear the previous timeout
        if (scrollTimeoutRef.current !== null) {
            clearTimeout(scrollTimeoutRef.current);
        }

        // Return the wheel to its resting position
        scrollTimeoutRef.current = setTimeout(() => {
            setScrollDirection(0);
            scrollTimeoutRef.current = null;
        }, 180);
        };

        window.addEventListener("wheel", handleWheel, {
        passive: true,
        });

        return () => {
        window.removeEventListener("wheel", handleWheel);

        if (scrollTimeoutRef.current !== null) {
            clearTimeout(scrollTimeoutRef.current);
        }
        };
    }, []);

  return (
    <div className="w-full max-w-[180px] font-mono">
      {/* Header */}
      <div className="flex justify-between text-[9px] tracking-widest text-[#92958B]">
        <span>INPUT / MOUSE</span>
        <span className="text-[#F5C542]">
        {isMouseActive ? "ACTIVE" : "IDLE"}
        </span>
      </div>

      {/* Mouse wireframe */}
      <svg
        data-intro-mouse
        viewBox="0 0 180 220"
        className="mt-3 h-auto w-full"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Wireframe mouse visualizer"
      >
        <g
          style={{
            transform: isMouseActive
              ? `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`
              : "translate(0px, 0px)",
            transition: "transform 120ms ease-out",
          }}
        >
          {/* Left mouse button highlight */}
          <path
          d="
              M 90 12
              C 55 12, 40 38, 40 82
              L 40 88
              L 90 88
              Z
          "
          fill={leftPressed ? "#F5C542" : "none"}
          fillOpacity="0.25"
          />

          {/* Right mouse button highlight */}
          <path
          d="
              M 90 12
              C 125 12, 140 38, 140 82
              L 140 88
              L 90 88
              Z
          "
          fill={rightPressed ? "#F5C542" : "none"}
          fillOpacity="0.25"
          />


          {/* Outer mouse shell */}
          <path
            d="
              M 90 12
              C 55 12, 40 38, 40 82
              L 40 135
              C 40 175, 60 195, 90 195
              C 120 195, 140 175, 140 135
              L 140 82
              C 140 38, 125 12, 90 12
              Z
            "
            stroke="#77715C"
            strokeWidth="1"
          />

          {/* Left and right mouse buttons */}
          <path
            d="M 90 12 L 90 88"
            stroke="#77715C"
            strokeWidth="1"
          />

          <path
            d="M 40 88 L 140 88"
            stroke="#494538"
            strokeWidth="1"
          />

          {/* Scroll wheel */}
          <rect
            x="85"
            y="36"
            width="10"
            height="27"
            rx="4"
            stroke="#F5C542"
            strokeWidth="1"
          />

          <line
          x1="90"
          y1="42"
          x2="90"
          y2="57"
          stroke="#F5C542"
          className="transition-transform duration-150 ease-out"
          style={{
              transform: `translateY(${scrollDirection * 5}px)`,
          }}
          />

          {/* Internal wireframe connections */}
          <path
            d="
              M 40 88
              L 90 122
              L 140 88

              M 90 122
              L 58 173

              M 90 122
              L 122 173

              M 58 173
              L 90 195
              L 122 173
            "
            stroke="#494538"
            strokeWidth="1"
          />

          {/* Connection points */}
          {[
            [40, 88],
            [140, 88],
            [90, 122],
            [58, 173],
            [122, 173],
            [90, 195],
          ].map(([x, y], index) => (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#0B0C0B"
              stroke="#77715C"
              strokeWidth="1"
            />
          ))}

          {/* Bottom indicator */}
          <circle
            cx="90"
            cy="195"
            r="3"
            fill="#F5C542"
          />
        </g>
      </svg>
    </div>
  );
}
