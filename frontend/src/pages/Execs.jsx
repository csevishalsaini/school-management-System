import ResourceManager, { Badge } from "../components/ResourceManager";
import { getCurrentUser } from "../utils/auth";

const fields = [
  { name: "first_name", label: "First Name", required: true },
  { name: "last_name", label: "Last Name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "username", label: "Username", required: true },
  { name: "password", label: "Password", type: "password", required: true, createOnly: true },
  {
    name: "inactive_status",
    label: "Account Status",
    type: "select",
    valueType: "boolean",
    defaultValue: false,
    options: [
      { label: "Active", value: false },
      { label: "Inactive", value: true },
    ],
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    defaultValue: "exec",
    required: true,
    options: [
      { label: "Student", value: "student" },
      { label: "Teacher", value: "teacher" },
      { label: "Exec", value: "exec" },
      { label: "Manager", value: "manager" },
      { label: "Admin", value: "admin" },
    ],
  },
];

const columns = [
  { key: "id", label: "ID" },
  {
    key: "first_name",
    label: "Name",
    render: (exec) => [exec.first_name, exec.last_name].filter(Boolean).join(" "),
  },
  { key: "username", label: "Username" },
  { key: "email", label: "Email" },
  {
    key: "role",
    label: "Role",
    render: (exec) => <Badge tone="amber">{exec.role || "No role"}</Badge>,
  },
  {
    key: "inactive_status",
    label: "Status",
    render: (exec) => (
      <Badge tone={exec.inactive_status ? "red" : "emerald"}>
        {exec.inactive_status ? "Inactive" : "Active"}
      </Badge>
    ),
  },
];

export default function Execs() {
  const user = getCurrentUser();

  return (
    <ResourceManager
      title="Execs"
      description="Manage executive users, roles, and account access."
      endpoint="/execs"
      updateMethod="patch"
      bulkDelete={false}
      fields={fields}
      columns={columns}
      searchFields={["id", "first_name", "last_name", "username", "email", "role"]}
      filters={[{ name: "role", label: "All roles" }]}
      emptyText="No execs match your filters."
      summary={({ items, filteredItems, count }) => [
        { label: "Total Execs", value: count },
        { label: "Active Accounts", value: items.filter((exec) => !exec.inactive_status).length },
        { label: "Inactive Accounts", value: items.filter((exec) => exec.inactive_status).length },
        { label: "Visible Records", value: filteredItems.length },
      ]}
      getRowActions={() =>
        user?.role === "admin"
          ? [
              {
                label: "Toggle Status",
                className: "border-amber-200 text-amber-700 hover:bg-amber-50",
                onClick: ({ item, onPatch }) =>
                  onPatch(item, { inactive_status: !item.inactive_status }),
              },
            ]
          : []
      }
    />
  );
}
