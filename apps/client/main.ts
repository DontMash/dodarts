import { createClient } from "@dodarts/api/client";

const BACKEND_URL = "ws://localhost:8000/api";

try {
  const client = createClient({ websocketUrl: BACKEND_URL });
  const router = client.websocket;

  const list = await router.toss.list({
    limit: 20,
    offset: 10,
  });
  console.log(list);
  const subscription = await router.toss.subscribe();
  for await (const toss of subscription) {
    console.log(toss);
  }
} catch (err) {
  console.error(err);
}
