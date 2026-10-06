import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  username: "",
  password: "",
  role: "student",
};

export default function Signup() {
  const [form, setForm] = useState(initialForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setError("");
    setSuccess("");
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const signup = async (e) => {
    e.preventDefault();

    const validationError = validateForm(form, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await API.post("/execs/signup", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        role: form.role.trim(),
      });

      setSuccess("Account created successfully. You can login now.");
      setForm(initialForm);
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 900);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="brand-mark">
            SA
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Create Account</h1>
          <p className="mt-2 text-sm text-slate-600">Register a new school account</p>
        </div>

        <form
          onSubmit={signup}
          className="auth-card"
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Signup</h2>
              <p className="mt-1 text-sm text-slate-500">All fields are required.</p>
            </div>
            <Link to="/" className="link-action text-sm">
              Back to login
            </Link>
          </div>

          {error && (
            <div className="alert-red mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="alert-green mb-4">
              {success}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="First name"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              disabled={loading}
            />

            <Field
              label="Last name"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              disabled={loading}
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />

            <Field
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
            />

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Role</span>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={loading}
                className="control"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="exec">Exec</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <div />

            <Field
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />

            <Field
              label="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-6 w-full"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", disabled }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="control"
      />
    </label>
  );
}

function validateForm(form, confirmPassword) {
  if (
    !form.first_name ||
    !form.last_name ||
    !form.email ||
    !form.username ||
    !form.password
  ) {
    return "Please fill all fields";
  }

  if (form.password !== confirmPassword) {
    return "Passwords do not match";
  }

  return "";
}

function getErrorMessage(err) {
  return err.response?.data || "Signup failed";
}
