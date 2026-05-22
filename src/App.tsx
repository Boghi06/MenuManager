import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import MenuPlanner from "./pages/MenuPlanner"
import MenuComposer from "./pages/MenuComposer"
import { ProtectedRoute } from "./components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/menu" element={
          <ProtectedRoute>
            <MenuPlanner />
          </ProtectedRoute>
        } />
        <Route path="/menu/:anno/:mese/:bisett" element={
          <ProtectedRoute>
            <MenuComposer />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
