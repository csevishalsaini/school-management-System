import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { getErrorMessage } from "../components/ResourceManager";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await API.post("/execs/forgotpassword", { email: email.trim() });
      setNotice(typeof res.data === "string" ? res.data : "Password reset link sent.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to send reset link"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot Password" subtitle="Send a password reset link to your email.">
      <form onSubmit={submit} className="auth-card">
        {error && <Alert tone="red">{error}</Alert>}
        {notice && <Alert tone="emerald">{notice}</Alert>}

        <label className="mb-5 block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setNotice("");
            }}
            className="control"
            placeholder="Enter account email"
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <Link to="/" className="link-action mt-4 block text-center text-sm">
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="brand-mark">
            SA
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Alert({ tone, children }) {
  return <div className={`${tone === "emerald" ? "alert-green" : "alert-red"} mb-4`}>{children}</div>;
}
