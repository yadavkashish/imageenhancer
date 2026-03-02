import { user } from "@canva/app-middleware/express";
import cors from "cors";
import express from "express";
import { createBaseServer } from "../utils/backend/base_backend/create";
import { createImageRouter } from "./routers/image";

async function main() {
  const APP_ID = process.env.CANVA_APP_ID;

  if (!APP_ID) {
    throw new Error(
      "CANVA_APP_ID is missing. Please add it to your .env file."
    );
  }

  const router = express.Router();

  // ✅ Allow Canva + Localhost during development
  router.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, etc.)
        if (!origin) return callback(null, true);

        if (
          origin.includes("canva-apps.com") ||
          origin.includes("localhost")
        ) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );

  // ✅ Handle preflight requests
  router.options("*", cors());

  // ✅ Parse JSON and URL-encoded bodies (bumped to 50mb for large Base64 images)
  router.use(express.json({ limit: "50mb" }));
  router.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ✅ Verify Canva user JWT
  router.use(user.verifyToken({ appId: APP_ID }));

  // ✅ Image enhancement routes
  const imageRouter = createImageRouter();
  router.use(imageRouter);

  const server = createBaseServer(router);

  // 🚀 Backend runs on 3001 (from .env)
  server.start(process.env.CANVA_BACKEND_PORT || "3001");

  console.log("✅ Backend running on port 3001");
}

main();