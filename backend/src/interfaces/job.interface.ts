import { JobStatus } from "../enums/jobstatus.enum";

export interface IJob {
  id: string;
  status: JobStatus;
  result?: string;
}
