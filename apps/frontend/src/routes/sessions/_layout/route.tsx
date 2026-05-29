import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { SessionStatus } from "@/components/session-status";

export const Route = createFileRoute("/sessions/_layout")({
  component: SessionsLayout,
});

function SessionsLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svk flex-col p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => navigate({ to: "/" })}
            >
              <IconArrowLeft className="size-4" />
            </Button>
            <h1 className="font-heading text-2xl font-semibold">Sessions</h1>
          </div>
          <SessionStatus />
        </div>

        <Outlet />
      </div>
    </div>
  );
}
