import { IJob } from "@/interfaces/job.interface";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2 } from "lucide-react";
import { JobStatus } from "@/enums/jobstatus.enum";

export interface IJobCardProps {
  job: IJob;
}

export function JobCard({ job }: IJobCardProps) {
  return (
    <Card key={job.id}>
      <CardHeader className="justify-self-start">
        <CardTitle>Job {job.id}</CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <Badge
            variant={job.status === JobStatus.PENDING ? "outline" : "default"}
          >
            {job.status}
          </Badge>
        </div>
        {job.status === JobStatus.RESOLVED && job.result && (
          <img
            src={job.result}
            alt="Job result"
            className="mt-2 w-full h-40 object-cover rounded"
          />
        )}
      </CardContent>
      <CardFooter>
        {job.status === JobStatus.PENDING && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
