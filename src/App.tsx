import { Suspense } from "react"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import Login from "@/core/auth/Login"
import { ProtectedRoute } from "@/core/auth/ProtectedRoute"
import { RequireRole } from "@/core/auth/RequireRole"
import { clientConfig } from "@/config/clients"
import { getEnabledModules } from "@/modules/registry"

const enabledModules = getEnabledModules(clientConfig.enabledModules)
const homePath = enabledModules[0]?.defaultPath ?? "/login"

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          {enabledModules.flatMap((mod) => mod.routes).map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.roles
                ? <RequireRole roles={route.roles}>{route.element}</RequireRole>
                : route.element}
            />
          ))}
          <Route path="/" element={<Navigate to={homePath} replace />} />
          <Route path="/dashboard" element={<Navigate to={homePath} replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
