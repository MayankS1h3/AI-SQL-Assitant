import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import Login from "./pages/Login";

function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<div>Dashboard</div>} />
          <Route path="/connections" element={<div>Connections Page</div>} />
          <Route path="/query" element={<div>Query Page</div>} />
          <Route path="/history" element={<div>History Page</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

export default App;
