// Ponto de entrada da API como função serverless da Vercel.
// A Vercel roteia toda requisição para cá (ver vercel.json) e invoca o app
// Express diretamente, sem precisar de app.listen() (usado só no dev local,
// em src/server.ts).
import { app } from "../src/app";

export default app;
