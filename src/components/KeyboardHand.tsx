
type Finger = {
  name: string;
  joints: [number, number][];
};

type KeyboardHandProps = {
  side: "left" | "right";
  activeFinger: string | null;
  offsetX: number;
  offsetY: number;
};

const fingers: Finger[] = [
  {
    name: "pinky",
    joints: [[45, 113], [29, 79], [20, 62], [14, 48]],
  },
  {
    name: "ring",
    joints: [[64, 104], [57, 64], [54, 44], [51, 31]],
  },
  {
    name: "middle",
    joints: [[88, 102], [87, 56], [87, 36], [88, 22]],
  },
  {
    name: "index",
    joints: [[111, 106], [120, 67], [124, 49], [127, 37]],
  },
  {
    name: "thumb",
    joints: [[134, 123], [158, 104], [175, 96], [190, 91]],
  },
];

export default function KeyboardHand({
  side,
  activeFinger,
  offsetX,
  offsetY,
}: KeyboardHandProps) {
  return (
    <svg
      viewBox="0 0 220 170"
      className="h-[82px] w-[180px]"
      fill="none"
      aria-hidden="true"
    >
        <g
            style={{
                transform: `translate(${offsetX}px, ${offsetY}px)`,
                transition:
                    "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
        >
            <g
                transform={
                side === "right"
                    ? "translate(220 0) scale(-1 1)"
                    : undefined
                }
            >
                {/* Palm outline */}
                <path
                d="M38 111 Q48 101 70 105
                    L111 106 L134 123
                    Q147 139 136 158
                    L60 158 Q38 149 38 111Z"
                stroke="#494538"
                strokeWidth="1"
                />

                {/* Palm structure */}
                {fingers.map((finger) => {
                const base = finger.joints[0];

                return (
                    <line
                    key={finger.name}
                    x1="91"
                    y1="149"
                    x2={base[0]}
                    y2={base[1]}
                    stroke="#494538"
                    strokeWidth="0.7"
                    />
                );
                })}

                {/* Fingers and joints */}
                {fingers.map((finger) => {
                const [base, middle, upper, tip] = finger.joints;

                const pressed =
                    activeFinger === `${side}-${finger.name}`;

                const color = pressed ? "#F5C542" : "#77715C";

                return (
                    <g
                    key={finger.name}
                    stroke={color}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    >
                    {/* First bone */}
                    <line
                        x1={base[0]}
                        y1={base[1]}
                        x2={middle[0]}
                        y2={middle[1]}
                    />

                    <circle
                        cx={middle[0]}
                        cy={middle[1]}
                        r="2"
                        fill="#080909"
                    />

                    {/* Middle joint rotation */}
                    <g
                        style={{
                        transformOrigin: `${middle[0]}px ${middle[1]}px`,
                        transform: pressed
                            ? "rotate(14deg)"
                            : "rotate(0deg)",
                        transition: "transform 140ms ease-out",
                        }}
                    >
                        <line
                        x1={middle[0]}
                        y1={middle[1]}
                        x2={upper[0]}
                        y2={upper[1]}
                        />

                        <circle
                        cx={upper[0]}
                        cy={upper[1]}
                        r="2"
                        fill="#080909"
                        />

                        {/* Fingertip joint rotation */}
                        <g
                        style={{
                            transformOrigin: `${upper[0]}px ${upper[1]}px`,
                            transform: pressed
                            ? "rotate(22deg)"
                            : "rotate(0deg)",
                            transition: "transform 140ms ease-out",
                        }}
                        >
                        <line
                            x1={upper[0]}
                            y1={upper[1]}
                            x2={tip[0]}
                            y2={tip[1]}
                        />

                        <circle
                            cx={tip[0]}
                            cy={tip[1]}
                            r="1.5"
                            fill={color}
                        />
                        </g>
                    </g>
                    </g>
                );
                })}
            </g>
        </g>
    </svg>
  );
}
