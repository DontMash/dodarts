import {
  tossCreate,
  tossList,
  tossRead,
  tossSubscribe,
} from "./toss/toss.procedure.ts";
import {
  sessionActive,
  sessionCreate,
  sessionEnd,
  sessionList,
  sessionRead,
  sessionSubscribe,
} from "./session/session.procedure.ts";
import { os } from "./contract.ts";

const router = os.router({
  toss: {
    create: tossCreate,
    read: tossRead,
    list: tossList,
    subscribe: tossSubscribe,
  },
  session: {
    create: sessionCreate,
    read: sessionRead,
    list: sessionList,
    end: sessionEnd,
    active: sessionActive,
    subscribe: sessionSubscribe,
  },
});
export default router;
