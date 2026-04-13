import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AgentPage from "./pages/AgentPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agent" element={<AgentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;