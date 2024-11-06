import { create } from "zustand";
import axios from "axios";
import { IJob } from "@/interfaces/job.interface";
import { JobStatus } from "@/enums/jobstatus.enum";
import { toast } from "react-toastify";
const WS_URL = "ws://localhost:3000"; // Replace with your WebSocket URL
const API_BASE_URL = "http://localhost:3000";

// Define the state interface for the store
interface JobStoreState {
  isLoading: boolean;
  jobs: IJob[];
  wsConnected: boolean;
  reconnectAttempts: number;
  ws?: WebSocket;

  fetchJobs: () => Promise<void>;
  createJob: () => Promise<void>;
  updateJob: (updatedJob: IJob) => void;
  connectWebSocket: () => void;
  reconnectWebSocket: () => void;
}

// Create the Zustand store without devtools
export const useJobStore = create<JobStoreState>((set, get) => ({
  isLoading: false,
  jobs: [],
  wsConnected: false,
  reconnectAttempts: 0,

  // Fetch all jobs from the backend
  fetchJobs: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs`);
      const jobs: IJob[] = response.data;
      set({ jobs });
    } catch {
      toast.error("Error fetching jobs");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchJob: async (jobId: number) => {
    const response = await axios.get(`${API_BASE_URL}/api/jobs/${jobId}`);
    const updatedJob: IJob = response.data;

    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId ? { ...job, ...updatedJob } : job
      ),
    }));
  },

  // Create a new job and reload the jobs list
  createJob: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/jobs`);
      const { jobId } = response.data;
      await get().fetchJobs(); // Reload jobs after creating a new one
      toast.success(`Created job with ID: ${jobId}`);
    } catch {
      toast.error("Error creating job");
    }
  },

  // Update job status in the store
  updateJob: (updatedJob: IJob) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === updatedJob.id ? { ...job, ...updatedJob } : job
      ),
    }));
  },

  // Initialize WebSocket connection
  connectWebSocket: () => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      set({ wsConnected: true, reconnectAttempts: 0 });
      get().fetchJobs(); // Reload data upon reconnecting
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.jobId) {
        get().updateJob({
          id: data.jobId,
          result: data.result,
          status: data.status as JobStatus,
        });
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      set({ wsConnected: false });
      get().reconnectWebSocket();
    };

    set({ ws });
  },

  // Handle WebSocket reconnection with exponential backoff
  reconnectWebSocket: () => {
    const { reconnectAttempts } = get();
    if (reconnectAttempts < 5) {
      const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000); // Exponential backoff
      setTimeout(() => {
        set({ reconnectAttempts: reconnectAttempts + 1 });
        get().connectWebSocket();
      }, delay);
    } else {
      toast.error("Max reconnection attempts reached");
      console.error("Max reconnection attempts reached");
    }
  },
}));
