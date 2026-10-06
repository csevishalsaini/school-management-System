import { useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { getErrorMessage } from "../components/ResourceManager";
import { getCurrentUser } from "../utils/auth";

export default function ChangePassword() {
  const user = getCurrentUser();
  const [form, setForm] = useState({ current_password: "", new_password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.current_password || !form.new_password) {
      setError("Current and new password are required.");
      return;
    }
    if (form.new_password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await API.post(`/execs/${user.id}/updatepassword`, form);
      if (res.data?.token) localStorage.setItem("token", res.data.token);
      setNotice(res.data?.message || "Password updated successfully.");
      setForm({ current_password: "", new_password: "" });
      setConfirmPassword("");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="app-page">
        <div className="mx-auto max-w-xl space-y-6">
          <div>
            <p className="page-kicker">Security</p>
            <h1 className="page-title">Change Password</h1>
            <p className="page-subtitle">Update password for {user?.username || "your account"}.</p>
          </div>

          <form onSubmit={submit} className="panel p-6">
            {error && <Alert tone="red">{error}</Alert>}
            {notice && <Alert tone="emerald">{notice}</Alert>}

            <PasswordField
              label="Current Password"
              value={form.current_password}
              onChange={(value) => setForm((current) => ({ ...current, current_password: value }))}
              disabled={loading}
            />
            <PasswordField
              label="New Password"
              value={form.new_password}
              onChange={(value) => setForm((current) => ({ ...current, new_password: value }))}
              disabled={loading}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !user?.id}
              className="btn-primary w-full"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </main>
    </>
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

function Alert({ tone, children }) {
  return <div className={`${tone === "emerald" ? "alert-green" : "alert-red"} mb-4`}>{children}</div>;
}
