import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CamVerify from "./pages/CamVerify";
import SetPin from "./pages/SetPin";
import AdminDashboard from "./pages/AdminDashboard";
import VoterDashboard from "./pages/VoterDashboard";
import CandidatePage from "./pages/CandidatePage";
import ForgotPin from "./pages/ForgotPin";

export default function App() {
    const navigate = useNavigate();

    return (
        <Routes>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/voter/dashboard" element={<VoterDashboard />} />
            <Route path="/voter/candidate" element={<CandidatePage />} />
            <Route path="/" element={<Login navigate={navigate} />} />
            <Route path="/CamVerify" element={<CamVerify />} />
            <Route path="/login" element={<Login navigate={navigate} />} />
            <Route path="/register/set-pin" element={<SetPin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-pin" element={<ForgotPin/>}/>
        </Routes>
    );
}