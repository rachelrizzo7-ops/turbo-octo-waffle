import "dotenv/config";
import cors from "cors";
import express from "express";
import { UPLOAD_DIR } from "./services/storage";
import authRouter from "./routes/auth";
import itemsRouter from "./routes/items";
import avatarRouter from "./routes/avatar";
import outfitsRouter from "./routes/outfits";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/items", itemsRouter);
app.use("/avatar", avatarRouter);
app.use("/outfits", outfitsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Closet AI backend listening on :${port}`);
});
