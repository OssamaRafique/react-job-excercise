import { Request, Response } from "express";
import { createJob, getJobs, getJobById } from "../services/jobService";

export const createJobHandler = async (req: Request, res: Response) => {
  const jobId = await createJob();
  res.status(201).json({ jobId });
};

export const getJobsHandler = async (req: Request, res: Response) => {
  const jobs = await getJobs();
  res.json(jobs);
};

export const getJobByIdHandler = async (req: Request, res: Response) => {
  const job = await getJobById(req.params.id);
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ error: "Job not found" });
  }
};
