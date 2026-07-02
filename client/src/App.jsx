import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import RoomPage from "./pages/RoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";

import DocumentationPage from "./pages/DocumentationPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
        <Route path="/dashboard" element={<ProtectedRoute> <PageTransition><DashboardPage /></PageTransition> </ProtectedRoute> } />
        <Route path="/join/:roomId" element={ <ProtectedRoute> <PageTransition><JoinRoomPage /></PageTransition> </ProtectedRoute>}/>
        <Route path="/room/:roomId" element={ <ProtectedRoute> <PageTransition><RoomPage /></PageTransition> </ProtectedRoute> } />
        
        <Route path="/documentation" element={<PageTransition><DocumentationPage /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;