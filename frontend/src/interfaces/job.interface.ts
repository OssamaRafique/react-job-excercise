import { JobStatus } from "@/enums/jobstatus.enum";

export interface IJob {
  id: number;
  status: JobStatus;
  result?: string;
}
