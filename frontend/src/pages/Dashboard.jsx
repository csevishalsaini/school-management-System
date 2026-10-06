import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";

const emptyStats = {
  students: { count: 0, data: [] },
  teachers: { count: 0, data: [] },
  execs: { count: 0, data: [] },
};

export default function Dashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [studentsRes, teachersRes, execsRes] = await Promise.all([
          API.get("/students"),
          API.get("/teachers"),
          API.get("/execs"),
        ]);

        setStats({
          students: normalizeResponse(studentsRes.data),
          teachers: normalizeResponse(teachersRes.data),
          execs: normalizeResponse(execsRes.data),
        });
        setError("");
      } catch (err) {
        setError(err.response?.data || "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const classCount = useMemo(() => {
    return new Set(stats.students.data.map((student) => student.class).filter(Boolean)).size;
  }, [stats.students.data]);

  const cards = [
    {
      label: "Students",
      value: stats.students.count,
      href: "/students",
      color: "border-l-blue-500",
    },
    {
      label: "Teachers",
      value: stats.teachers.count,
      href: "/teachers",
      color: "border-l-emerald-500",
    },
    {
      label: "Execs",
      value: stats.execs.count,
      href: "/execs",
      color: "border-l-amber-500",
    },
    {
      label: "Classes",
      value: classCount,
      href: "/students",
      color: "border-l-rose-500",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="app-page">
        <div className="app-container">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
            <div>
              <p className="page-kicker">Command Center</p>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Monitor records, enrollment coverage, teacher assignments, and account activity.</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
              Live records overview
            </div>
          </div>

          {error && (
            <div className="alert-red">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={card.href}
                className={`panel border-l-4 ${card.color} p-4 transition hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,0.10)]`}
              >
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {loading ? "..." : card.value}
                </p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <RecentList
              title="Recent Students"
              items={stats.students.data}
              loading={loading}
              emptyText="No students found"
              renderItem={(student) => (
                <RecordItem
                  title={fullName(student)}
                  subtitle={student.email}
                  meta={student.class}
                />
              )}
            />

            <RecentList
              title="Recent Teachers"
              items={stats.teachers.data}
              loading={loading}
              emptyText="No teachers found"
              renderItem={(teacher) => (
                <RecordItem
                  title={fullName(teacher)}
                  subtitle={teacher.email}
                  meta={teacher.subject || teacher.class}
                />
              )}
            />

            <RecentList
              title="Exec Team"
              items={stats.execs.data}
              loading={loading}
              emptyText="No execs found"
              renderItem={(exec) => (
                <RecordItem
                  title={fullName(exec)}
                  subtitle={exec.email || exec.username}
                  meta={exec.role}
                />
              )}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function RecentList({ title, items, loading, emptyText, renderItem }) {
  const recentItems = items.slice(0, 5);

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {loading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2 px-4 py-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          ))}

        {!loading && recentItems.length === 0 && (
          <p className="px-4 py-5 text-sm text-slate-500">{emptyText}</p>
        )}

        {!loading && recentItems.map((item) => (
          <div key={item.id} className="px-4 py-3 transition hover:bg-blue-50/45">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecordItem({ title, subtitle, meta }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{title || "Unnamed"}</p>
        {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
      </div>
      {meta && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          {meta}
        </span>
      )}
    </div>
  );
}

function normalizeResponse(response) {
  return {
    count: response?.count || 0,
    data: Array.isArray(response?.data) ? response.data : [],
  };
}

function fullName(record) {
  return [record.first_name, record.last_name].filter(Boolean).join(" ");
}
