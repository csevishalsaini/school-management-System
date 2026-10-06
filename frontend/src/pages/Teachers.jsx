import { useState } from "react";
import API from "../api/axios";
import ResourceManager, { Badge, getErrorMessage } from "../components/ResourceManager";

const fields = [
  { name: "first_name", label: "First Name", required: true },
  { name: "last_name", label: "Last Name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "class", label: "Class", required: true },
  { name: "subject", label: "Subject", required: true },
];

const columns = [
  { key: "id", label: "ID" },
  {
    key: "first_name",
    label: "Name",
    render: (teacher) => [teacher.first_name, teacher.last_name].filter(Boolean).join(" "),
  },
  { key: "email", label: "Email" },
  {
    key: "subject",
    label: "Subject",
    render: (teacher) => <Badge tone="emerald">{teacher.subject || "No subject"}</Badge>,
  },
  {
    key: "class",
    label: "Class",
    render: (teacher) => <Badge>{teacher.class || "No class"}</Badge>,
  },
];

export default function Teachers() {
  const [teacherStudents, setTeacherStudents] = useState(null);

  return (
    <>
      <ResourceManager
        title="Teachers"
        description="Manage teachers, classes, subjects, and assigned students."
        endpoint="/teachers"
        fields={fields}
        columns={columns}
        searchFields={["id", "first_name", "last_name", "email", "class", "subject"]}
        filters={[
          { name: "subject", label: "All subjects" },
          { name: "class", label: "All classes" },
        ]}
        emptyText="No teachers match your filters."
        summary={({ items, filteredItems, count }) => [
          { label: "Total Teachers", value: count },
          { label: "Subjects", value: new Set(items.map((teacher) => teacher.subject).filter(Boolean)).size },
          { label: "Classes", value: new Set(items.map((teacher) => teacher.class).filter(Boolean)).size },
          { label: "Visible Records", value: filteredItems.length },
        ]}
        getRowActions={({ item, setError }) => [
          {
            label: "Students",
            className: "border-blue-200 text-blue-700 hover:bg-blue-50",
            onClick: async () => {
              try {
                const [studentsRes, countRes] = await Promise.all([
                  API.get(`/teachers/${item.id}/students`),
                  API.get(`/teachers/${item.id}/studentcount`),
                ]);
                setTeacherStudents({
                  teacher: item,
                  students: studentsRes.data?.data || [],
                  count: countRes.data?.count ?? studentsRes.data?.count ?? 0,
                });
              } catch (err) {
                setError(getErrorMessage(err, "Unable to load teacher students"));
              }
            },
          },
        ]}
      />

      {teacherStudents && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="panel max-h-[85vh] w-full max-w-2xl overflow-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {[teacherStudents.teacher.first_name, teacherStudents.teacher.last_name]
                    .filter(Boolean)
                    .join(" ")}
                </h2>
                <p className="text-sm text-slate-500">
                  {teacherStudents.count} assigned student{teacherStudents.count === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTeacherStudents(null)}
                className="btn-secondary px-3 py-1.5"
              >
                Close
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {teacherStudents.students.length === 0 && (
                <p className="p-4 text-sm text-slate-500">No assigned students found.</p>
              )}
              {teacherStudents.students.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-4 p-4 transition hover:bg-blue-50/45">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {[student.first_name, student.last_name].filter(Boolean).join(" ")}
                    </p>
                    <p className="truncate text-sm text-slate-500">{student.email}</p>
                  </div>
                  <Badge>{student.class}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
