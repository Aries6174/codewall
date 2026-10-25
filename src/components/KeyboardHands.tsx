
"use client";

import { useEffect, useRef, useState } from "react";

type Point = {
x: number;
y: number;
};

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

const reach = Math.min(
    minReach,
    Math.min(distance, maxReach)
);

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


type KeyboardHandsProps = {
width: number;
height: number;
activeFinger: string | null;
target: Point | null;
};

type HandPose = {
finger: string | null;
target: Point | null;
progress: number;
};

const fingerNames = [
"pinky",
"ring",
"middle",
"index",
"thumb",
];

export default function KeyboardHands({
width,
height,
activeFinger,
target,
}: KeyboardHandsProps) {
const [pose, setPose] = useState<HandPose>({
finger: null,
target: null,
progress: 0,
});

const poseRef = useRef(pose);

// Smoothly animate toward or away from the key.
useEffect(() => {
const pressing = activeFinger !== null && target !== null;

const startPose = poseRef.current;
const startProgress = startPose.progress;
const endProgress = pressing ? 1 : 0;

const finger = activeFinger ?? startPose.finger;
const position = target ?? startPose.target;

const duration = pressing ? 140 : 220;
const startTime = performance.now();

let animationFrame: number;

const animate = (time: number) => {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);

    // Ease out: fast at first, slower near the end.
    const eased = 1 - Math.pow(1 - t, 3);

    const progress =
    startProgress +
    (endProgress - startProgress) * eased;

    const nextPose: HandPose = {
    finger,
    target: position,
    progress,
    };

    poseRef.current = nextPose;
    setPose(nextPose);

    if (t < 1) {
    animationFrame = requestAnimationFrame(animate);
    } else if (!pressing) {
    const restingPose: HandPose = {
        finger: null,
        target: null,
        progress: 0,
    };

    poseRef.current = restingPose;
    setPose(restingPose);
    }
};

animationFrame = requestAnimationFrame(animate);

return () => cancelAnimationFrame(animationFrame);
}, [activeFinger, target]);

const renderHand = (side: "left" | "right") => {
const direction = side === "left" ? 1 : -1;
const restingX = width * (side === "left" ? 0.3 : 0.7);

const activeIndex = fingerNames.findIndex(
    (name) => pose.finger === `${side}-${name}`
);

const activeBaseX =
    restingX + direction * (activeIndex * 17 - 34);

const desiredShift =
    pose.target && activeIndex !== -1
    ? Math.max(-45, Math.min(45, pose.target.x - activeBaseX))
    : 0;

const palmX = restingX + desiredShift * pose.progress;
const palmY = height - 22;

return (
    <g key={side} fill="none" strokeLinejoin="round">
    {/* Palm */}
    <path
        d={`
        M ${palmX - 32} ${palmY - 35}
        L ${palmX + 32} ${palmY - 35}
        L ${palmX + 23} ${palmY}
        L ${palmX - 23} ${palmY}
        Z
        `}
        stroke="#494538"
        strokeWidth="1"
    />

    {fingerNames.map((name, index) => {
        const pressing =
        pose.finger === `${side}-${name}` &&
        pose.target !== null;

        const baseX =
        palmX + direction * (index * 17 - 34);

        const baseY = palmY - 35;

        // Resting fingertip position.
        const restX = baseX + direction * (index - 2) * 5;
        const restY = height - 93 - index * 2;

        // Interpolate toward the real key position.
        const tipX = pressing
        ? restX + (pose.target!.x - restX) * pose.progress
        : restX;

        const tipY = pressing
        ? restY + (pose.target!.y - restY) * pose.progress
        : restY;


        // Finger base and desired fingertip
        const base = {
        x: baseX,
        y: baseY,
        };

        // Keep the fingertip within the finger's reach.
        const length1 = 75;
        const length2 = 95;

        const dx = tipX - baseX;
        const dy = tipY - baseY;
        const distance = Math.hypot(dx, dy);

        const maxReach = length1 + length2 - 0.001;
        const reachScale = Math.min(1, maxReach / Math.max(distance, 0.001));

        const finalTip = {
        x: baseX + dx * reachScale,
        y: baseY + dy * reachScale,
        };

        // Calculate the bending joint.
        const joint1 = solveJoint(
        base,
        finalTip,
        length1,
        length2,
        side === "left" ? 1 : -1
        );

        // Divide the second segment to show another joint.
        const joint2 = {
        x: joint1.x + (finalTip.x - joint1.x) * 0.55,
        y: joint1.y + (finalTip.y - joint1.y) * 0.55,
        };

        const color = pressing ? "#F5C542" : "#77715C";

        return (
        <g key={name} stroke={color} strokeWidth="1">
            <path
            d={`
                M ${baseX} ${baseY}
                L ${joint1.x} ${joint1.y}
                L ${joint2.x} ${joint2.y}
                L ${finalTip.x} ${finalTip.y}
            `}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            />

            <circle cx={joint1.x} cy={joint1.y} r="2" fill="#080909" />
            <circle cx={joint2.x} cy={joint2.y} r="2" fill="#080909" />
            <circle cx={finalTip.x} cy={finalTip.y} r="2" fill={color} />
        </g>
        );
    })}
    </g>
);
};

return (
<svg
    viewBox={`0 0 ${width} ${height}`}
    className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    aria-hidden="true"
>
    {renderHand("left")}
    {renderHand("right")}
</svg>
);
}
