import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCircleCheck,
  IconCirclePlus,
  IconCircleX,
} from "@tabler/icons-react";
import { api, type Session } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SessionStatusProps {
  compact?: boolean;
}

export function SessionStatus({ compact = false }: SessionStatusProps) {
  const queryClient = useQueryClient();
  const [subscribed, setSubscribed] = useState(false);

  const { data: activeSession, isLoading } = useQuery<Session | null>({
    queryKey: ["sessions", "active"],
    queryFn: () => api.session.active(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.session.create(),
    onSuccess: (newSession) => {
      queryClient.setQueryData(["sessions", "active"], newSession);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => api.session.end({ id }),
    onSuccess: () => {
      queryClient.setQueryData(["sessions", "active"], null);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function subscribe() {
      try {
        const subscription = await api.session.subscribe({});
        if (cancelled) return;
        setSubscribed(true);

        for await (const session of subscription) {
          if (cancelled) break;
          if (session.ended_at === null) {
            queryClient.setQueryData(["sessions", "active"], session);
          } else {
            queryClient.setQueryData(["sessions", "active"], null);
          }
          queryClient.invalidateQueries({ queryKey: ["sessions"] });
        }
      } catch {
        if (!cancelled) {
          setSubscribed(false);
        }
      }
    }

    subscribe();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <IconCircleCheck className="size-3 animate-spin" />
        {!compact && "Loading..."}
      </span>
    );
  }

  if (activeSession) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          {compact ? "Active" : activeSession.id.slice(0, 8)}
        </Badge>
        {!compact && (
          <Button
            size="xs"
            variant="destructive"
            onClick={() => endMutation.mutate(activeSession.id)}
            disabled={endMutation.isPending}
          >
            <IconCircleX className="size-3" />
            End
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {subscribed ? "No active session" : "Connecting..."}
      </span>
      <Button
        size="xs"
        variant="outline"
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending}
      >
        <IconCirclePlus className="size-3" />
        {!compact && "Start Session"}
      </Button>
    </div>
  );
}
