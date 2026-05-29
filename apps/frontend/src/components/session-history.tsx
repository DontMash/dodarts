import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconChevronRight } from "@tabler/icons-react";
import { api, type Session } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTimestamp } from "@/lib/utils";

const PAGE_SIZE = 20;

interface SessionHistoryProps {
  activeSession?: Session | null;
}

export function SessionHistory({ activeSession }: SessionHistoryProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["sessions", "list"],
    queryFn: () => api.session.list({ limit: PAGE_SIZE, offset: 0 }),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading sessions...</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions found.</p>;
  }

  const filteredSessions = activeSession
    ? data.filter((s) => s.id !== activeSession.id)
    : data;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Ended</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredSessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="font-mono text-xs">
              {session.id.slice(0, 8)}...
            </TableCell>
            <TableCell className="text-xs">
              {formatTimestamp(session.meta.created_at)}
            </TableCell>
            <TableCell className="text-xs">
              {session.ended_at ? formatTimestamp(session.ended_at) : "—"}
            </TableCell>
            <TableCell>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() =>
                  navigate({
                    to: "/sessions/$sessionId",
                    params: { sessionId: session.id },
                  })}
              >
                <IconChevronRight className="size-3" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
