import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionHistory } from "@/components/session-history";
import { SessionStatus } from "@/components/session-status";

export const Route = createFileRoute("/sessions/_layout/")({
  component: SessionsPage,
});

function SessionsPage() {
  const { data: activeSession } = useQuery({
    queryKey: ["sessions", "active"],
    queryFn: () => api.session.active(),
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Session</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionStatus />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionHistory activeSession={activeSession ?? null} />
        </CardContent>
      </Card>
    </div>
  );
}
