import express, { type Express, Request, Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Logger
app.use(
pinoHttp({
logger,
serializers: {
req(req) {
return {
id: (req as any).id,
method: req.method,
url: req.url?.split("?")[0],
};
},
res(res) {
return {
statusCode: res.statusCode,
};
},
},
})
);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root route (IMPORTANT)
app.get("/", (_req: Request, res: Response) => {
return res.send("Server is running 🚀");
});

// ✅ API test route
app.get("/api", (_req: Request, res: Response) => {
return res.send("API working ✅");
});

// Routes
app.use("/api", router);

export default app;
