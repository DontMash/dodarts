import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconCalendarEvent, IconCircleDashed } from "@tabler/icons-react";
import { api, type Toss } from "@/lib/api";
import { Dartboard } from "@/components/dartboard";
import { TossList } from "@/components/toss-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionStatus } from "@/components/session-status";

export const Route = createFileRoute("/")({ component: Dashboard });

const HISTORY_LIMIT = 50;

function Dashboard() {
  const navigate = useNavigate();
  const [tosses, setTosses] = useState<Toss[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: activeSession } = useQuery({
    queryKey: ["sessions", "active"],
    queryFn: () => api.session.active(),
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!activeSession) {
          setTosses([]);
          return;
        }

        const history = await api.toss.list({
          sessionId: activeSession.id,
          limit: HISTORY_LIMIT,
          offset: 0,
        });
        if (cancelled) return;
        setTosses(history);

        const subscription = await api.toss.subscribe({});
        if (cancelled) return;
        setConnected(true);

        for await (const toss of subscription) {
          if (cancelled) break;
          if (toss.sessionId === activeSession.id) {
            setTosses((prev) => [toss, ...prev].slice(0, 200));
          }
        }
      } catch (err) {
        console.log(err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Connection failed");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [activeSession]);

  return (
    <div className="flex min-h-svk flex-col p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-heading text-2xl font-semibold">dodarts</h1>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => navigate({ to: "/sessions" })}
            >
              <IconCalendarEvent className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <SessionStatus compact />
            <div className="flex items-center gap-2 text-sm">
              {error
                ? <span className="text-destructive">{error}</span>
                : connected
                ? (
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <span className="size-2 animate-pulse rounded-full bg-green-500" />
                    Live
                  </span>
                )
                : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <IconCircleDashed className="size-3 animate-spin" />
                    Connecting...
                  </span>
                )}
            </div>
          </div>
        </div>

        {activeSession
          ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dartboard</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <Dartboard tosses={tosses} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Throws</CardTitle>
                </CardHeader>
                <CardContent>
                  <TossList tosses={tosses} latestId={tosses[0]?.id} />
                </CardContent>
              </Card>
            </div>
          )
          : (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <p className="text-center text-muted-foreground">
                  No active session. Start a session to see throws here.
                </p>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
