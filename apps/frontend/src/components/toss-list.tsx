import type { Toss } from "@/lib/api.ts";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "../lib/utils.ts";

interface TossListProps {
  tosses: Toss[];
  latestId?: string;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getPoints(toss: Toss): number {
  return toss.value * toss.multiplier;
}

function getSegmentBadge(toss: Toss): string {
  switch (toss.segment) {
    case "Double":
      return "D";
    case "Triple":
      return "T";
    case "Single":
    case "SingleInner":
    case "SingleOuter":
      return "S";
    case "Outside":
      return "M";
    default:
      return "";
  }
}

function getBadgeColor(toss: Toss): string {
  if (toss.name === "Bull") return "bg-red-500 text-white";
  if (toss.name === "25") return "bg-green-500 text-white";
  if (toss.segment === "Triple") {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
  if (toss.segment === "Double") {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  if (toss.name === "Miss" || toss.segment === "Outside") {
    return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  }
  return "bg-muted text-muted-foreground";
}

export function TossList({ tosses, latestId }: TossListProps) {
  if (tosses.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center text-muted-foreground">
        No throws yet. Start throwing!
      </p>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="flex flex-col gap-1 pl-1 py-1 pr-3">
        {tosses.map((toss) => {
          const isLatest = toss.id === latestId;
          const points = getPoints(toss);
          const badge = getSegmentBadge(toss);

          return (
            <div
              key={toss.id}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all ${
                isLatest
                  ? "bg-primary/10 ring-1 ring-primary/30"
                  : "hover:bg-muted/50"
              }`}
            >
              <span className="flex min-w-[60px] items-center gap-1.5">
                {badge && (
                  <Badge className={cn(getBadgeColor(toss))}>
                    {badge}
                  </Badge>
                )}
                <span className="font-medium">
                  {toss.name === "Miss" || toss.name === "25" ||
                      toss.name === "Bull"
                    ? toss.name
                    : toss.name.slice(badge.length)}
                </span>
              </span>

              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="font-mono text-xs">{toss.value}</span>
                {toss.multiplier > 1 && (
                  <>
                    <span className="text-xs">×</span>
                    <span className="font-mono text-xs">{toss.multiplier}</span>
                  </>
                )}
              </span>

              <span
                className={`ml-auto font-mono font-semibold ${
                  points === 0 ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {points}
              </span>

              <span className="min-w-[70px] text-right text-xs text-muted-foreground">
                {formatTime(toss.meta.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
