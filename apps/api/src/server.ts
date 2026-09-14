import { app } from "./expressApp";
import { env } from "./lib/env";

app.listen(env.port, () => {
  console.log(`RisoAgenda API rodando em http://localhost:${env.port}`);
});
