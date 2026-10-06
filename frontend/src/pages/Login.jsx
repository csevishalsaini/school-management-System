import { useEffect, useState } from "react";
import API from "../api/axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({
    username: localStorage.getItem("rememberedUsername") || "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(
    Boolean(localStorage.getItem("rememberedUsername"))
  );
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setError("");
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const login = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await API.post("/execs/login", form);
      localStorage.setItem("token", res.data.token);

      if (rememberUsername) {
        localStorage.setItem("rememberedUsername", form.username.trim());
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="brand-mark">
            SA
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">School Admin</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to manage records</p>
        </div>

        <form
          onSubmit={login}
          className="auth-card"
        >
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-950">Login</h2>
            <p className="mt-1 text-sm text-slate-500">Use your account credentials.</p>
          </div>

          {error && (
            <div className="alert-red mb-4">
              {error}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Username</span>
            <input
              type="text"
              name="username"
              value={form.username}
              placeholder="Enter username"
              autoComplete="username"
              className="control"
              onChange={handleChange}
              disabled={loading}
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Password</span>
            <div className="control-shell">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                placeholder="Enter password"
                autoComplete="current-password"
                className="min-w-0 flex-1 rounded-l bg-transparent px-3 py-2 text-sm outline-none"
                onChange={handleChange}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="shrink-0 px-3 text-sm font-semibold text-slate-600 hover:text-slate-950"
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={rememberUsername}
              onChange={(e) => setRememberUsername(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              disabled={loading}
            />
            Remember username
          </label>

          <div className="mb-5 text-right">
            <Link to="/forgot-password" className="link-action text-sm">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-600">
            Need an account?{" "}
            <Link to="/signup" className="link-action">
              Create one
            </Link>
          </p>
        </form>

        <p className="text-center text-xs font-medium text-slate-500">
          Protected access for authorized school accounts.
        </p>
      </div>
    </div>
  );
}

function getErrorMessage(err) {
  if (typeof err.response?.data === "string") {
    return err.response.data;
  }

  return err.response?.data?.message || "Login failed. Please try again.";
}
