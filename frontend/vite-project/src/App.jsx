import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useContext } from "react";
import GroupChat from "./GroupChat";
import { Signup, Login, Dashboard } from "./pages";
import { AuthContext } from "./context/AuthContext";

// ✅ Private route (protect logged-in pages)
const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return token ? children : <Navigate to="/login" />;
};

// ✅ Public route (prevent logged-in users from going back to login/signup)
const PublicRoute = ({ children }) => {
  const { token } = useContext(AuthContext);

  return !token ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* ✅ Private routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/chat/:groupId"
          element={
            <PrivateRoute>
              <GroupChat />
            </PrivateRoute>
          }
        />

        {/* ✅ Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* ✅ Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;