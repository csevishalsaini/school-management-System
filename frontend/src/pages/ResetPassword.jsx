import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";
import { getErrorMessage } from "../components/ResourceManager";
import { Alert, AuthShell } from "./ForgotPassword";

export default function ResetPassword() {
  const { resetcode } = useParams();
  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.new_password || !form.confirm_password) {
      setError("Both password fields are required.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await API.post(`/execs/resetpassword/reset/${resetcode}`, form);
      setNotice(typeof res.data === "string" ? res.data : "Password reset successfully.");
      setForm({ new_password: "", confirm_password: "" });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to reset password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset Password" subtitle="Choose a new password for your account.">
      <form onSubmit={submit} className="auth-card">
        {error && <Alert tone="red">{error}</Alert>}
        {notice && <Alert tone="emerald">{notice}</Alert>}

        <PasswordField
          label="New Password"
          value={form.new_password}
          onChange={(value) => setForm((current) => ({ ...current, new_password: value }))}
          disabled={loading}
        />
        <PasswordField
          label="Confirm Password"
          value={form.confirm_password}
          onChange={(value) => setForm((current) => ({ ...current, confirm_password: value }))}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <Link to="/" className="link-action mt-4 block text-center text-sm">
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}

function PasswordField({ label, value, onChange, disabled }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="control"
        placeholder={label}
        disabled={disabled}
      />
    </label>
  );
}
