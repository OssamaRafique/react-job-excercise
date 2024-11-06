import axios from "axios";
import { readJobsFromFile, updateJob } from "../utils/fileHandler";
import { notifyJobCompletion } from "../server";
import { IJob } from "../interfaces/job.interface";
import { JobStatus } from "../enums/jobstatus.enum";

// TODO: Move to env
const UNSPLASH_ACCESS_KEY = "7tHKYItkBop06uB--0umseuCTT4ObZ1JeWo_I3emxlA";

export const createJob = async (): Promise<string> => {
  const jobs = (await readJobsFromFile()) as IJob[];
  const newJob: IJob = {
    id: Date.now().toString(),
    status: JobStatus.PENDING,
  };
  jobs.push(newJob);
  updateJob(newJob.id, newJob); // Queue the new job for file writing
  processJob(newJob.id); // Start processing the job asynchronously
  return newJob.id;
};

export const getJobs = async (): Promise<IJob[]> => readJobsFromFile();

export const getJobById = async (id: string): Promise<IJob | undefined> => {
  const jobs = (await readJobsFromFile()) as IJob[];
  return jobs.find((job) => job.id === id);
};

// Process job with delay and notify when completed
const processJob = async (jobId: string): Promise<void> => {
  const delay = Math.floor(Math.random() * 12) * 5000 + 5000; // Random delay between 5s and 5m
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    const response = await axios.get("https://api.unsplash.com/photos/random", {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
      params: {
        query: "food",
      },
    });
    const imageUrl = response.data.urls.regular;

    // Update job status and result upon successful completion
    const updatedJob = {
      status: JobStatus.RESOLVED,
      result: imageUrl,
    };
    updateJob(jobId, updatedJob); // Update file safely via the queue

    // Notify clients about job completion
    notifyJobCompletion(jobId, imageUrl);
  } catch (error) {
    console.error("Error fetching image", error);

    // Update job to mark it as still pending
    updateJob(jobId, { status: JobStatus.PENDING });
  }
};
