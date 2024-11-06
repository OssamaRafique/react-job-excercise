import fs from "fs";
import fsExt from "fs-ext";
import path from "path";
import { IJob } from "../interfaces/job.interface";

const filePath = path.join(__dirname, "../data/jobs.json");
let writeQueue: { jobId: string; updatedJob: Partial<IJob> }[] = []; // Queue to store job updates
let isProcessing = false;

const initializeFile = () => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([])); // Create an empty array in the JSON file
  }
};

// Locking mechanism to ensure exclusive access to the file
const lockFile = (fd: number, lockType: "ex" | "sh") => {
  return new Promise((resolve, reject) => {
    fsExt.flock(fd, lockType, (err: any) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// Unlocking the file after operations
const unlockFile = (fd: number) => {
  return new Promise((resolve, reject) => {
    fsExt.flock(fd, "un", (err: any) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// Function to read the file with a shared lock
export const readJobsFromFile = async (): Promise<any[]> => {
  initializeFile();
  const fd = fs.openSync(filePath, "r+"); // Open file descriptor

  let data = [];
  try {
    await lockFile(fd, "sh"); // Acquire shared lock
    const fileData = fs.readFileSync(fd, "utf-8");
    data = JSON.parse(fileData);
  } catch (error) {
    console.error("Error reading file", error);
  } finally {
    await unlockFile(fd); // Release lock
    fs.closeSync(fd);
  }
  return data;
};

// Write to file directly with an exclusive lock to ensure atomic write
const writeJobsToFile = async (jobs: Partial<IJob>[]) => {
  const fd = fs.openSync(filePath, "w"); // Open file for writing
  try {
    await lockFile(fd, "ex"); // Exclusive lock for writing
    fs.writeFileSync(fd, JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error("Error writing to file", error);
  } finally {
    await unlockFile(fd); // Release lock
    fs.closeSync(fd);
  }
};

// Process next write in the queue
const processNextWrite = async () => {
  if (writeQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { jobId, updatedJob } = writeQueue.shift()!;

  // Read current jobs from file, update, and write back
  try {
    const jobs = await readJobsFromFile();
    const jobIndex = jobs.findIndex((job) => job.id === jobId);
    if (jobIndex !== -1) {
      jobs[jobIndex] = { ...jobs[jobIndex], ...updatedJob };
    } else {
      jobs.push({
        id: jobId,
        ...updatedJob,
      });
    }
    await writeJobsToFile(jobs);
  } catch (error) {
    console.error("Error processing write queue", error);
  } finally {
    processNextWrite(); // Process next item in the queue
  }
};

// Schedule a job update in the write queue
export const updateJob = (jobId: string, updatedJob: any): void => {
  writeQueue.push({ jobId, updatedJob });

  if (!isProcessing) {
    processNextWrite();
  }
};

// Adding a job, similar to update, but for new entries
export const addJob = (newJob: any): void => {
  writeQueue.push({ jobId: newJob.id, updatedJob: newJob });

  if (!isProcessing) {
    processNextWrite();
  }
};
