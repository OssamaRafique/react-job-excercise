import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { AppLayout } from "./components/layouts/layout";
import { JobsDashboard } from "./JobsDashboard";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <AppLayout>
      <ToastContainer stacked />
      <JobsDashboard />
    </AppLayout>
  );
}

export default App;
