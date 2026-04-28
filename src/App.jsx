import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PortfolioV2 from "./PortfolioV2";
import ChandPortfolio from "./ChandPortfolio";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to="/ZmFpc2FsLWFsaS1iYWNrZWQtZW5naW5lZXI=" replace />
          }
        />
        <Route
          path="/ZmFpc2FsLWFsaS1iYWNrZWQtZW5naW5lZXI="
          element={<PortfolioV2 />}
        />
        <Route path="/em/cpm" element={<ChandPortfolio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
