
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = {
  x: number;
  y: number;
};

type HandSide = "left" | "right";

type FingerName =
  | "pinky"
  | "ring"
  | "middle"
  | "index"
  | "thumb";

type FingerLayout = {
  baseX: number;
  baseY: number;
  tipX: number;
  tipY: number;
  upper: number;
  lower: number;
};

type KeyboardHandsProps = {
  width: number;
  height: number;
  fingerTargets: Record<string, Point>;
  homePositions: {
    left: number | null;
    right: number | null;
  };
  isMouseActive: boolean;
};

type AnimationState = {
  shifts: Record<HandSide, Point>;
  tips: Record<string, Point>;
};

const fingerNames: FingerName[] = [
  "pinky",
  "ring",
  "middle",
  "index",
  "thumb",
];

const handLayouts: Record<
  HandSide,
  Record<FingerName, FingerLayout>
> = {
  left: {
    pinky: {
      baseX: -28, baseY: -30,
      tipX: -58, tipY: -92,
      upper: 36, lower: 36,
    },
    ring: {
      baseX: -14, baseY: -32,
      tipX: -34, tipY: -104,
      upper: 38, lower: 40,
    },
    middle: {
      baseX: 0, baseY: -34,
      tipX: -8, tipY: -110,
      upper: 39, lower: 40,
    },
    index: {
      baseX: 14, baseY: -32,
      tipX: 18, tipY: -102,
      upper: 36, lower: 37,
    },
    thumb: {
      baseX: 26, baseY: -18,
      tipX: 42, tipY: -62,
      upper: 25, lower: 25,
    },
  },

  right: {
    pinky: {
      baseX: 28, baseY: -30,
      tipX: 58, tipY: -92,
      upper: 36, lower: 36,
    },
    ring: {
      baseX: 14, baseY: -32,
      tipX: 34, tipY: -104,
      upper: 38, lower: 40,
    },
    middle: {
      baseX: 0, baseY: -34,
      tipX: 8, tipY: -110,
      upper: 39, lower: 40,
    },
    index: {
      baseX: -14, baseY: -32,
      tipX: -18, tipY: -102,
      upper: 36, lower: 37,
    },
    thumb: {
      baseX: -26, baseY: -18,
      tipX: -42, tipY: -62,
      upper: 25, lower: 25,
    },
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const moveToward = (
  current: Point,
  destination: Point,
  amount: number
): Point => ({
  x: current.x + (destination.x - current.x) * amount,
  y: current.y + (destination.y - current.y) * amount,
});

function solveJoint(
  base: Point,
  tip: Point,
  length1: number,
  length2: number,
  direction: number
): Point {
  const dx = tip.x - base.x;
  const dy = tip.y - base.y;

  const distance = Math.max(0.001, Math.hypot(dx, dy));

  const minReach = Math.abs(length1 - length2) + 0.001;
  const maxReach = length1 + length2 - 0.001;
  const reach = clamp(distance, minReach, maxReach);

  const a =
    (length1 ** 2 - length2 ** 2 + reach ** 2) /
    (2 * reach);

  const h = Math.sqrt(
    Math.max(0, length1 ** 2 - a ** 2)
  );

  const ux = dx / distance;
  const uy = dy / distance;

  return {
    x: base.x + ux * a - uy * h * direction,
    y: base.y + uy * a + ux * h * direction,
  };
}

const emptyState = (): AnimationState => ({
  shifts: {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  },
  tips: {},
});

export default function KeyboardHands({
  width,
  height,
  fingerTargets,
  homePositions,
  isMouseActive,
}: KeyboardHandsProps) {
  const [frame, setFrame] = useState<AnimationState>(emptyState);
  const frameRef = useRef<AnimationState>(emptyState());
  const svgRef = useRef<SVGSVGElement>(null);
  const [mouseTarget, setMouseTarget] = useState<Point | null>(null);
  const [mouseFingerTargets, setMouseFingerTargets] = useState<
    Partial<Record<FingerName, Point>>
  >({});
  const [leftMousePressed, setLeftMousePressed] = useState(false);
  const [rightMousePressed, setRightMousePressed] = useState(false);

  void isMouseActive;

  const getRestingX = useCallback(
    (side: HandSide) =>
      side === "left"
        ? (homePositions.left ?? width * 0.3) - 18
        : (homePositions.right ?? width * 0.7) + 18,
    [homePositions.left, homePositions.right, width]
  );

  useEffect(() => {
    if (!isMouseActive) return;

    const keyboardSvg = svgRef.current;

    const mouseSvg = document.querySelector<SVGSVGElement>(
      "[data-intro-mouse]"
    );

    if (!keyboardSvg || !mouseSvg) return;

    const updateMousePosition = () => {
      const keyboardRect = keyboardSvg.getBoundingClientRect();
      const mouseRect = mouseSvg.getBoundingClientRect();

      if (
        keyboardRect.width === 0 ||
        keyboardRect.height === 0 ||
        mouseRect.width === 0 ||
        mouseRect.height === 0
      ) {
        return;
      }

      const scaleX = width / keyboardRect.width;
      const scaleY = height / keyboardRect.height;

      // Convert coordinates from the mouse SVG
      // into the keyboard's SVG coordinate system.
      const toKeyboardPoint = (
        x: number,
        y: number
      ): Point => ({
        x:
          (mouseRect.left +
            (x / 180) * mouseRect.width -
            keyboardRect.left) *
          scaleX,
        y:
          (mouseRect.top +
            (y / 220) * mouseRect.height -
            keyboardRect.top) *
          scaleY,
      });

      // Wrist position on the mouse body
      setMouseTarget(toKeyboardPoint(90, 185));

      // Resting positions for each finger
      setMouseFingerTargets({
        index: toKeyboardPoint(68, 52),
        middle: toKeyboardPoint(112,52),
        ring: toKeyboardPoint(128, 72),
        pinky: toKeyboardPoint(132, 87),
        thumb: toKeyboardPoint(35, 81),
      });
    }

    const observer = new ResizeObserver(updateMousePosition);

    observer.observe(keyboardSvg);
    observer.observe(mouseSvg);

    window.addEventListener("resize", updateMousePosition);
    window.addEventListener("scroll", updateMousePosition, true);

    updateMousePosition();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMousePosition);
      window.removeEventListener("scroll", updateMousePosition, true);
    };
  }, [isMouseActive, width, height]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        setLeftMousePressed(true);
      }

      if (event.button === 2) {
        setRightMousePressed(true);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        setLeftMousePressed(false);
      }

      if (event.button === 2) {
        setRightMousePressed(false);
      }
    };

    const resetButtons = () => {
      setLeftMousePressed(false);
      setRightMousePressed(false);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", resetButtons);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", resetButtons);
    };
  }, []);

  // Animate all ten fingers independently.
  useEffect(() => {
    let animationFrame = 0;
    let lastTime = 0;

    const animate = (time: number) => {
      const deltaTime = lastTime
        ? Math.min(time - lastTime, 50)
        : 16;

      lastTime = time;

      // Smaller response time means faster movement.
      const wristAmount = 1 - Math.exp(-deltaTime / 125);
      const fingerAmount = 1 - Math.exp(-deltaTime / 85);

      const previous = frameRef.current;

      const next: AnimationState = {
        shifts: {
          left: { ...previous.shifts.left },
          right: { ...previous.shifts.right },
        },
        tips: { ...previous.tips },
      };

      let moving = false;

      for (const side of ["left", "right"] as const) {
        const layout = handLayouts[side];
        const restingX = getRestingX(side);
        const restingY = height - 22;

        const mouseDestination =
          side === "right" && isMouseActive
            ? mouseTarget
            : null;

        // The right wrist travels to the mouse.
        // Otherwise, both hands follow their keyboard targets.
        const desiredShift: Point = mouseDestination
          ? {
              x: mouseDestination.x - restingX,
              y: mouseDestination.y - restingY,
            }
          : { x: 0, y: 0 };

        // Several passes allow multiple fingers on
        // the same hand to influence wrist placement.

        if (!mouseDestination) {
          for (let pass = 0; pass < 8; pass++) {
            for (const name of fingerNames) {
              const id = `${side}-${name}`;
              const target = fingerTargets[id];

              if (!target) continue;

              const finger = layout[name];

              // Finger base with the proposed wrist shift.
              const baseX =
                restingX + finger.baseX + desiredShift.x;

              const baseY =
                restingY + finger.baseY + desiredShift.y;

              const dx = target.x - baseX;
              const dy = target.y - baseY;

              const distance = Math.hypot(dx, dy);

              // Maximum distance this finger can reach.
              const maxReach =
                finger.upper + finger.lower - 2;

              if (distance > maxReach) {
                const correction =
                  (distance - maxReach) / distance;

                // Move the wrist toward the key
                // until the finger can reach it.
                desiredShift.x += dx * correction;
                desiredShift.y += dy * correction;
              }
            }
          }

          // Safety limits for extreme key positions.
          desiredShift.x = clamp(desiredShift.x, -120, 120);
          desiredShift.y = clamp(desiredShift.y, -110, 30);
        }

        const currentShift = previous.shifts[side];

        const nextShift = moveToward(
          currentShift,
          desiredShift,
          wristAmount
        );

        // Distance the wrist moved during this animation frame.
        const wristMovement: Point = {
          x: nextShift.x - currentShift.x,
          y: nextShift.y - currentShift.y,
        };

        next.shifts[side] = nextShift;

        if (
          Math.hypot(
            nextShift.x - desiredShift.x,
            nextShift.y - desiredShift.y
          ) > 0.15
        ) {
          moving = true;
        }

        for (const name of fingerNames) {
          const id = `${side}-${name}`;
          const finger = layout[name];

          const restingTip: Point = {
            x: restingX + nextShift.x + finger.tipX,
            y: restingY + nextShift.y + finger.tipY,
          };

          // When using the mouse, right-hand fingers
          // return to their natural positions.
          const mouseFingerPosition = mouseFingerTargets[name];

          const isMouseClicking =
            (name === "index" && leftMousePressed) ||
            (name === "middle" && rightMousePressed);

          const destination =
            side === "right" && mouseDestination && mouseFingerPosition
              ? {
                  x: mouseFingerPosition.x,
                  y: mouseFingerPosition.y + (isMouseClicking ? 6 : 0),
                }
              : fingerTargets[id] ?? restingTip;

          const currentTip =
            previous.tips[id] ?? {
              x: restingTip.x - wristMovement.x,
              y: restingTip.y - wristMovement.y,
            };

          // Carry the finger along with the moving wrist.
          const carriedTip: Point = {
            x: currentTip.x + wristMovement.x,
            y: currentTip.y + wristMovement.y,
          };

          // Smoothly adjust the finger toward its destination.
          const nextTip = moveToward(
            carriedTip,
            destination,
            fingerAmount
          );

          next.tips[id] = nextTip;

          if (
            Math.hypot(
              nextTip.x - destination.x,
              nextTip.y - destination.y
            ) > 0.15
          ) {
            moving = true;
          }
        }
      }

      frameRef.current = next;
      setFrame(next);

      // Stop drawing when every finger settles.
      if (moving) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [
    fingerTargets,
    height,
    getRestingX,
    isMouseActive,
    mouseTarget,
    mouseFingerTargets,
    leftMousePressed,
    rightMousePressed,
  ]);

  const renderHand = (side: HandSide) => {
    const layout = handLayouts[side];

    const restingX = getRestingX(side);
    const shift = frame.shifts[side];

    const palmX = restingX + shift.x;
    const palmY = height - 22 + shift.y;

    // Endpoints where the fingers connect to the hand.
    const getEndpoint = (name: FingerName): Point => ({
      x: palmX + layout[name].baseX,
      y: palmY + layout[name].baseY,
    });

    const endpoints = {
      pinky: getEndpoint("pinky"),
      ring: getEndpoint("ring"),
      middle: getEndpoint("middle"),
      index: getEndpoint("index"),
      thumb: getEndpoint("thumb"),
    };

    const wristPoint: Point = {
      x: palmX,
      y: palmY + 6,
    };

    const fingerData = fingerNames.map((name) => {
      const finger = layout[name];
      const id = `${side}-${name}`;

      const base = endpoints[name];

      const restingTip: Point = {
        x: palmX + finger.tipX,
        y: palmY + finger.tipY,
      };

      const requestedTip =
        frame.tips[id] ?? restingTip;

      const dx = requestedTip.x - base.x;
      const dy = requestedTip.y - base.y;
      const distance = Math.hypot(dx, dy);

      const minReach =
        Math.abs(finger.upper - finger.lower) + 0.001;

      const maxReach =
        finger.upper + finger.lower - 0.001;

      const reach = clamp(distance, minReach, maxReach);

      const finalTip: Point = {
        x: base.x + dx / Math.max(distance, 0.001) * reach,
        y: base.y + dy / Math.max(distance, 0.001) * reach,
      };

      const ikJoint = solveJoint(
        base,
        finalTip,
        finger.upper,
        finger.lower,
        side === "left" ? -1 : 1
      );

      // Preserve the clean resting shape.
      const restingJoint1: Point = {
        x: base.x + (finalTip.x - base.x) * 0.38,
        y: base.y + (finalTip.y - base.y) * 0.38,
      };

      const restingJoint2: Point = {
        x: base.x + (finalTip.x - base.x) * 0.72,
        y: base.y + (finalTip.y - base.y) * 0.72,
      };

      // More reach = more visible joint bending.
      const displacement = Math.hypot(
        requestedTip.x - restingTip.x,
        requestedTip.y - restingTip.y
      );

      const bendAmount = clamp(
        displacement / 55,
        0,
        0.65
      );

      const joint1 = moveToward(
        restingJoint1,
        ikJoint,
        bendAmount
      );

      const ikJoint2: Point = {
        x: ikJoint.x + (finalTip.x - ikJoint.x) * 0.55,
        y: ikJoint.y + (finalTip.y - ikJoint.y) * 0.55,
      };

      const joint2 = moveToward(
        restingJoint2,
        ikJoint2,
        bendAmount
      );

      const mouseClickActive =
        side === "right" &&
        isMouseActive &&
        (
          (name === "index" && leftMousePressed) ||
          (name === "middle" && rightMousePressed)
        );

      const active =
        mouseClickActive ||
        (!(side === "right" && isMouseActive) &&
          Boolean(fingerTargets[id]));

      return {
        name,
        base,
        joint1,
        joint2,
        finalTip,
        color: active ? "#F5C542" : "#77715C",
      };
    });

    return (
      <g key={side} fill="none" strokeLinejoin="round">
        {/* Connected finger endpoints */}
        <path
          d={`
            M ${endpoints.pinky.x} ${endpoints.pinky.y}
            L ${endpoints.ring.x} ${endpoints.ring.y}
            L ${endpoints.middle.x} ${endpoints.middle.y}
            L ${endpoints.index.x} ${endpoints.index.y}
          `}
          stroke="#77715C"
          strokeWidth="1"
        />

        {/* Pinky, index, and thumb connect to wrist */}
        <path
          d={`
            M ${endpoints.pinky.x} ${endpoints.pinky.y}
            L ${wristPoint.x} ${wristPoint.y}
            L ${endpoints.index.x} ${endpoints.index.y}
          `}
          stroke="#494538"
          strokeWidth="1"
        />

        <line
          x1={wristPoint.x}
          y1={wristPoint.y}
          x2={endpoints.thumb.x}
          y2={endpoints.thumb.y}
          stroke="#494538"
          strokeWidth="1"
        />

        <circle
          cx={wristPoint.x}
          cy={wristPoint.y}
          r="2"
          fill="#080909"
          stroke="#F5C542"
        />

        {/* Independently animated fingers */}
        {fingerData.map((finger) => (
          <g
            key={finger.name}
            stroke={finger.color}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d={`
                M ${finger.base.x} ${finger.base.y}
                L ${finger.joint1.x} ${finger.joint1.y}
                L ${finger.joint2.x} ${finger.joint2.y}
                L ${finger.finalTip.x} ${finger.finalTip.y}
              `}
              fill="none"
            />

            <circle
              cx={finger.joint1.x}
              cy={finger.joint1.y}
              r="2"
              fill="#080909"
            />

            <circle
              cx={finger.joint2.x}
              cy={finger.joint2.y}
              r="2"
              fill="#080909"
            />

            <circle
              cx={finger.finalTip.x}
              cy={finger.finalTip.y}
              r="2"
              fill={finger.color}
            />
          </g>
        ))}
      </g>
    );
  };


  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {renderHand("left")}
      {renderHand("right")}
    </svg>
  );
}
