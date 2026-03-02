import express from "express";
import sharp from "sharp";

export const createImageRouter = () => {
  const enum Routes {
    QUEUE_ENHANCEMENT = "/api/queue-enhancement",
    JOB_STATUS = "/api/job-status",
    CANCEL_JOB = "/api/job-status/cancel",
  }

  const router = express.Router();
  router.use(express.json({ limit: "50mb" }));

  const jobQueue: { jobId: string; timeoutId: NodeJS.Timeout }[] = [];
  const completedJobs: Record<string, string> = {};
  const cancelledJobs: { jobId: string }[] = [];

  router.post(Routes.QUEUE_ENHANCEMENT, async (req, res) => {
    const { image, settings } = req.body;

    if (!image) return res.status(400).send("Missing image data.");

    const jobId = generateJobId();

    // Process the image asynchronously so we don't block the Express thread
    const timeoutId = setTimeout(async () => {
      try {
        const index = jobQueue.findIndex((job) => job.jobId === jobId);
        if (index === -1) return; // Job was cancelled

        // 1. Strip the Base64 header and convert to a Buffer for Sharp
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");

        // 2. Initialize Sharp pipeline
        let pipeline = sharp(imageBuffer);

        // 3. Map -100 to 100 slider values to Sharp multipliers (0.0 to 2.0)
        const bMult = 1 + settings.brightness / 100;
        const sMult = 1 + settings.saturation / 100;
        
        pipeline = pipeline.modulate({
          brightness: bMult,
          saturation: sMult,
        });

        // 4. Apply Contrast (using a linear formula to keep midtones centered at 128)
        if (settings.contrast !== 0) {
          const cMult = 1 + settings.contrast / 100;
          pipeline = pipeline.linear(cMult, -(128 * cMult) + 128);
        }

        // 5. Apply Clarity (Sharpen for positive, Blur for negative)
        if (settings.clarity > 0) {
          pipeline = pipeline.sharpen({ sigma: 1 + settings.clarity / 50 });
        } else if (settings.clarity < 0) {
          pipeline = pipeline.blur(Math.abs(settings.clarity) / 20 || 0.3);
        }

        // 6. Output to high-quality JPEG Buffer
        const outputBuffer = await pipeline.jpeg({ quality: 95 }).toBuffer();
        const finalDataUrl = `data:image/jpeg;base64,${outputBuffer.toString("base64")}`;

        // Save result and remove from queue
        completedJobs[jobId] = finalDataUrl;
        jobQueue.splice(index, 1);

      } catch (error) {
        console.error("Sharp processing failed:", error);
      }
    }, 0);

    jobQueue.push({ jobId, timeoutId });

    return res.status(200).send({ jobId });
  });

  router.get(Routes.JOB_STATUS, async (req, res) => {
    const jobId = req.query.jobId as string;

    if (completedJobs[jobId]) {
      return res.status(200).send({ status: "completed", resultImageUrl: completedJobs[jobId] });
    }
    if (jobQueue.some((job) => job.jobId === jobId)) {
      return res.status(200).send({ status: "processing" });
    }
    if (cancelledJobs.some((job) => job.jobId === jobId)) {
      return res.status(200).send({ status: "cancelled" });
    }
    return res.status(404).send("Job not found.");
  });

 router.post(Routes.CANCEL_JOB, async (req, res) => {
  const jobId = req.query.jobId as string;
  if (!jobId) return res.status(400).send("Missing jobId");

  const index = jobQueue.findIndex((job) => job.jobId === jobId);
  
  // FIX: Check if index is not -1 and if the job exists
  const job = jobQueue[index];
  if (index !== -1 && job) {
    cancelledJobs.push({ jobId });
    
    // Now TypeScript knows 'job' is not undefined
    clearTimeout(job.timeoutId);
    
    jobQueue.splice(index, 1);
    return res.status(200).send("Job successfully cancelled.");
  }

  return res.status(404).send("Job not found.");
});

  function generateJobId() { return Math.random().toString(36).substring(2, 15); }
  return router;
};