import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { clearAuth, getCurrentUser, getToken } from "../utils/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getCurrentUser();
  const canViewExecs = user?.role === "manager" || user?.role === "admin";

  const logout = async () => {
    try {
      await API.post("/execs/logout");
    } catch (err) {
      console.error("Logout API failed");
    }

    clearAuth();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <Link to={token ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white shadow-sm">
              SA
            </span>
            School Admin
          </Link>

        {token && (
            <nav className="flex flex-wrap gap-1 text-sm font-semibold text-slate-600">
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-blue-800" to="/dashboard">Dashboard</Link>
              {canViewExecs && <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-blue-800" to="/execs">Execs</Link>}
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-blue-800" to="/students">Students</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100 hover:text-blue-800" to="/teachers">Teachers</Link>
            </nav>
        )}
        </div>

        <div className="flex items-center gap-3 text-sm">
        {!token ? (
          <>
              <Link className="link-action" to="/">Login</Link>
              <Link className="btn-primary px-3 py-1.5" to="/signup">
                Signup
              </Link>
          </>
        ) : (
            <>
              <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600 sm:inline">
                {user?.username || "Signed in"}{user?.role ? ` (${user.role})` : ""}
              </span>
              <Link className="link-action" to="/change-password">
                Password
              </Link>
              <button onClick={logout} className="rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white transition hover:bg-red-700">
                Logout
              </button>
            </>
        )}
        </div>
      </div>
    </header>
  );
}
