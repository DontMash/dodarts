import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconArrowLeft, IconCircleX } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dartboard } from "@/components/dartboard";
import { TossList } from "@/components/toss-list";
import { formatTimestamp } from "@/lib/utils";

export const Route = createFileRoute("/sessions/_layout/$sessionId")({
  component: SessionDetailPage,
});

const TOSS_LIMIT = 200;

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: () => api.session.read({ id: sessionId }),
  });

  const { data: tosses, isLoading: tossesLoading } = useQuery({
    queryKey: ["tosses", sessionId],
    queryFn: () => api.toss.list({ sessionId, limit: TOSS_LIMIT, offset: 0 }),
    enabled: !!session,
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => api.session.end({ id }),
    onSuccess: (endedSession) => {
      queryClient.setQueryData(["sessions", sessionId], endedSession);
      queryClient.setQueryData(["sessions", "active"], null);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  if (sessionLoading) {
    return <p className="text-sm text-muted-foreground">Loading session...</p>;
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => navigate({ to: "/sessions" })}
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <p className="text-sm text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const isActive = session.ended_at === null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => navigate({ to: "/sessions" })}
          >
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="font-heading text-xl font-semibold">
              Session {session.id.slice(0, 8)}
            </h2>
            <p className="text-xs text-muted-foreground">
              Created {formatTimestamp(session.meta.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isActive
            ? (
              <Badge variant="outline">
                <span className="size-2 rounded-full bg-green-500 mr-1.5 animate-pulse inline-block" />
                Active
              </Badge>
            )
            : <Badge variant="secondary">Ended</Badge>}

          {isActive && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                endMutation.mutate(sessionId, {
                  onSuccess: () => navigate({ to: "/sessions" }),
                })}
              disabled={endMutation.isPending}
            >
              <IconCircleX className="size-3" />
              End Session
            </Button>
          )}
        </div>
      </div>

      {session.ended_at && (
        <p className="text-xs text-muted-foreground">
          Ended {formatTimestamp(session.ended_at)}
        </p>
      )}

      {tossesLoading
        ? <p className="text-sm text-muted-foreground">Loading tosses...</p>
        : tosses && tosses.length > 0
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
                <CardTitle>Throws ({tosses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <TossList tosses={tosses} latestId={tosses[0]?.id} />
              </CardContent>
            </Card>
          </div>
        )
        : (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-sm text-muted-foreground">
                No throws recorded for this session.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
