import ResourceManager, { Badge } from "../components/ResourceManager";

const fields = [
  { name: "first_name", label: "First Name", required: true },
  { name: "last_name", label: "Last Name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "class", label: "Class", required: true },
];

const columns = [
  { key: "id", label: "ID" },
  {
    key: "first_name",
    label: "Name",
    render: (student) => [student.first_name, student.last_name].filter(Boolean).join(" "),
  },
  { key: "email", label: "Email" },
  {
    key: "class",
    label: "Class",
    render: (student) => <Badge>{student.class || "No class"}</Badge>,
  },
];

export default function Students() {
  return (
    <ResourceManager
      title="Students"
      description="Create, update, search, filter, and delete student records."
      endpoint="/students"
      fields={fields}
      columns={columns}
      searchFields={["id", "first_name", "last_name", "email", "class"]}
      filters={[{ name: "class", label: "All classes" }]}
      emptyText="No students match your filters."
      summary={({ items, filteredItems, count }) => [
        { label: "Total Students", value: count },
        { label: "Classes", value: new Set(items.map((student) => student.class).filter(Boolean)).size },
        { label: "Visible Records", value: filteredItems.length },
      ]}
    />
  );
}
