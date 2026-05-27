import type { Toss } from "@/lib/api.ts";

interface DartboardProps {
  tosses: Toss[];
  size?: number;
}

const BOARD_ORDER = [
  20,
  1,
  18,
  4,
  13,
  6,
  10,
  15,
  2,
  17,
  3,
  19,
  7,
  16,
  8,
  11,
  14,
  9,
  12,
  5,
] as const;

const RADIUS = {
  doubleOuter: 170,
  doubleInner: 162,
  tripleOuter: 107,
  tripleInner: 99,
  outerBull: 15.9,
  innerBull: 6.35,
};

const COLORS = {
  dark: "#1a1a1a",
  light: "#f5f0e1",
  red: "#c0392b",
  green: "#27ae60",
  wire: "#888",
  blue: "#56b7ff",
  orange: "#e36030",
};

function segmentColor(
  index: number,
  ring: "single" | "double" | "triple",
): string {
  const isDark = index % 2 === 0;
  if (ring === "double" || ring === "triple") {
    return isDark ? COLORS.red : COLORS.green;
  }
  return isDark ? COLORS.dark : COLORS.light;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function segmentPath(
  cx: number,
  cy: number,
  index: number,
  innerR: number,
  outerR: number,
) {
  const segmentAngle = 360 / 20;
  const startAngle = index * segmentAngle - segmentAngle / 2;
  const endAngle = index * segmentAngle + segmentAngle / 2;

  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);

  const largeArc = segmentAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function coordToSvg(
  x: number | null,
  y: number | null,
  cx: number,
  cy: number,
  scale: number,
) {
  if (x === null || y === null) return null;
  return {
    x: cx + x * scale,
    y: cy - y * scale,
  };
}

export function Dartboard({ tosses, size = 400 }: DartboardProps) {
  const viewSize = RADIUS.doubleOuter * 2 + 40;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  const scale = RADIUS.doubleOuter;

  const latestId = tosses[0]?.id;

  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      width={size}
      height={size}
      className="rounded-full shadow-lg bg-[#1a1a1a] text-white select-none"
    >
      <defs>
        <filter id="dot-shadow">
          <feDropShadow dx="0" dy="0" stdDeviation="1" floodOpacity="0.5" />
        </filter>
      </defs>

      {BOARD_ORDER.map((_, i) => (
        <path
          key={`inner-${i}`}
          d={segmentPath(cx, cy, i, RADIUS.outerBull, RADIUS.tripleInner)}
          fill={segmentColor(i, "single")}
          stroke={COLORS.wire}
          strokeWidth="0.5"
        />
      ))}

      {BOARD_ORDER.map((_, i) => (
        <path
          key={`base-${i}`}
          d={segmentPath(cx, cy, i, RADIUS.tripleOuter, RADIUS.doubleInner)}
          fill={segmentColor(i, "single")}
          stroke={COLORS.wire}
          strokeWidth="0.5"
        />
      ))}

      {BOARD_ORDER.map((_, i) => (
        <path
          key={`double-${i}`}
          d={segmentPath(cx, cy, i, RADIUS.doubleInner, RADIUS.doubleOuter)}
          fill={segmentColor(i, "double")}
          stroke={COLORS.wire}
          strokeWidth="0.5"
        />
      ))}

      {BOARD_ORDER.map((_, i) => (
        <path
          key={`triple-${i}`}
          d={segmentPath(cx, cy, i, RADIUS.tripleInner, RADIUS.tripleOuter)}
          fill={segmentColor(i, "triple")}
          stroke={COLORS.wire}
          strokeWidth="0.5"
        />
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={RADIUS.outerBull}
        fill={COLORS.green}
        stroke={COLORS.wire}
        strokeWidth="0.5"
      />
      <circle
        cx={cx}
        cy={cy}
        r={RADIUS.innerBull}
        fill={COLORS.red}
        stroke={COLORS.wire}
        strokeWidth="0.5"
      />

      {BOARD_ORDER.map((num, i) => {
        const angle = i * (360 / 20);
        const pos = polarToCartesian(cx, cy, RADIUS.doubleOuter + 12, angle);
        return (
          <text
            key={`label-${i}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontSize="10"
            fontWeight="600"
          >
            {num}
          </text>
        );
      })}

      {[...tosses].reverse().map((toss) => {
        const pos = coordToSvg(toss.coords.x, toss.coords.y, cx, cy, scale);
        if (!pos) return null;
        const isLatest = toss.id === latestId;
        return (
          <circle
            key={toss.id}
            cx={pos.x}
            cy={pos.y}
            r={isLatest ? 4 : 3}
            fill={isLatest ? COLORS.orange : COLORS.blue}
            stroke="#fff"
            strokeWidth="1"
            filter="url(#dot-shadow)"
          />
        );
      })}
    </svg>
  );
}
