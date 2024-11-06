import express from "express";
import {
  createJobHandler,
  getJobsHandler,
  getJobByIdHandler,
} from "../controllers/jobController";

const router = express.Router();

router.post("/jobs", createJobHandler);
router.get("/jobs", getJobsHandler);
router.get("/jobs/:id", getJobByIdHandler);

export default router;
