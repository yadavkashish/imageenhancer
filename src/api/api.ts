import { auth } from "@canva/user";


interface QueueEnhancementResponse {
  jobId: string;
}

interface JobStatusResponse {
  status: "completed" | "processing" | "cancelled";
  resultImageUrl?: string;
}

const endpoints = {
  queueEnhancement: "/api/queue-enhancement",
  getJobStatus: "/api/job-status",
  cancelJob: "/api/job-status/cancel",
};

/**
 * Queue image enhancement
 */
export const queueEnhancement = async (
  image: string,
  settings: any
): Promise<QueueEnhancementResponse> => {
  const url = new URL(endpoints.queueEnhancement, BACKEND_HOST);

  return sendRequest<QueueEnhancementResponse>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image, settings }),
  });
};

/**
 * Check job status
 */
export const checkJobStatus = async (
  jobId: string
): Promise<JobStatusResponse> => {
  const url = new URL(endpoints.getJobStatus, BACKEND_HOST);
  url.searchParams.append("jobId", jobId);

  return sendRequest<JobStatusResponse>(url);
};

/**
 * Cancel job
 */
export const cancelJob = async (jobId: string): Promise<void> => {
  const url = new URL(endpoints.cancelJob, BACKEND_HOST);
  url.searchParams.append("jobId", jobId);

  await sendRequest<void>(url, {
    method: "POST",
  });
};

/**
 * Common request handler
 * Automatically injects Canva user token
 */
const sendRequest = async <T>(
  url: URL,
  options?: RequestInit
): Promise<T> => {
  const userToken = await auth.getCanvaUserToken();

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${userToken}`,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Backend error:", errorText);
    throw new Error(`Request failed with status ${res.status}`);
  }

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
};