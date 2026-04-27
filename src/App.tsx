import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import MyAgents from "./pages/my-agents";
import AgentMonitor from "./pages/agent-monitor";
import Workspace from "./pages/workspace";
import NotFound from "./pages/not-found";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/my-agents" element={<MyAgents />} />
      <Route path="/agent-monitor" element={<AgentMonitor />} />
      <Route path="/workspace" element={<Workspace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
