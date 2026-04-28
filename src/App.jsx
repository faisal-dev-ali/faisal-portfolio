import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PortfolioV2 from "./PortfolioV2";
import ChandPortfolio from "./ChandPortfolio";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/faisal" replace />} />
        <Route path="/faisal" element={<PortfolioV2 />} />
        <Route path="/chand" element={<ChandPortfolio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
