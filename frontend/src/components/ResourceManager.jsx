import { useEffect, useMemo, useState } from "react";
import API from "../api/axios";
import Navbar from "./Navbar";
import { getCurrentUser } from "../utils/auth";

export default function ResourceManager({
  title,
  description,
  endpoint,
  fields,
  columns,
  searchFields,
  filters = [],
  summary,
  emptyText,
  getRowActions,
  bulkDelete = true,
  updateMethod = "put",
}) {
  const initialForm = makeInitialForm(fields);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const user = getCurrentUser();
  const canWrite = canWriteResource(user?.role, endpoint);

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(endpoint, { params: { page, limit: pageSize } });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(data);
      setCount(res.data?.count || data.length);
      setSelectedIds([]);
    } catch (err) {
      setError(getErrorMessage(err, `Unable to load ${title.toLowerCase()}`));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [endpoint, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const filterOptions = useMemo(() => {
    return filters.reduce((options, filter) => {
      options[filter.name] = [
        ...new Set(items.map((item) => item[filter.name]).filter(Boolean)),
      ].sort();
      return options;
    }, {});
  }, [filters, items]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !search ||
        searchFields
          .map((field) => valueForSearch(item[field]))
          .filter(Boolean)
          .some((value) => value.includes(search));

      const matchesFilters = filters.every((filter) => {
        const value = filterValues[filter.name] || "all";
        return value === "all" || item[filter.name] === value;
      });

      return matchesSearch && matchesFilters;
    });
  }, [items, query, searchFields, filters, filterValues]);

  const summaryCards = summary
    ? summary({ items, filteredItems, count })
    : [
        { label: `Total ${title}`, value: count },
        { label: "Visible Records", value: filteredItems.length },
      ];

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setNotice("");
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm(
      fields.reduce((nextForm, field) => {
        nextForm[field.name] =
          item[field.name] === undefined || item[field.name] === null
            ? field.defaultValue || ""
            : item[field.name];
        return nextForm;
      }, {})
    );
    setError("");
    setNotice("");
  };

  const resetForm = () => {
    setEditing(null);
    setForm(initialForm);
  };

  const saveItem = async (e) => {
    e.preventDefault();

    const validationError = validateForm(fields, form, Boolean(editing));
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = cleanPayload(fields, form, Boolean(editing));
      if (editing) {
        await API[updateMethod](`${endpoint}/${editing.id}`, payload);
        setNotice(`${singular(title)} updated successfully.`);
      } else {
        await API.post(endpoint, [payload]);
        setNotice(`${singular(title)} created successfully.`);
      }
      resetForm();
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, `Unable to save ${singular(title).toLowerCase()}`));
    } finally {
      setSaving(false);
    }
  };

  const patchItem = async (item, updates) => {
    setError("");
    setNotice("");
    try {
      await API.patch(`${endpoint}/${item.id}`, updates);
      setNotice(`${singular(title)} updated successfully.`);
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, `Unable to update ${singular(title).toLowerCase()}`));
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${displayName(item)}?`)) return;

    setError("");
    setNotice("");
    try {
      await API.delete(`${endpoint}/${item.id}`);
      setSelectedIds((ids) => ids.filter((id) => id !== item.id));
      setNotice(`${singular(title)} deleted successfully.`);
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, `Unable to delete ${singular(title).toLowerCase()}`));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected records?`)) return;

    setError("");
    setNotice("");
    try {
      await API.delete(endpoint, { data: selectedIds });
      setSelectedIds([]);
      setNotice("Selected records deleted successfully.");
      await loadItems();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete selected records"));
    }
  };

  const allVisibleSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((ids) => ids.filter((id) => !filteredItems.some((item) => item.id === id)));
      return;
    }

    setSelectedIds((ids) => [...new Set([...ids, ...filteredItems.map((item) => item.id)])]);
  };

  return (
    <>
      <Navbar />
      <main className="app-page">
        <div className="app-container">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="page-kicker">Records</p>
              <h1 className="page-title">{title}</h1>
              <p className="page-subtitle">{description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px]">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${title.toLowerCase()}`}
                className="control"
              />

              {filters.map((filter) => (
                <select
                  key={filter.name}
                  value={filterValues[filter.name] || "all"}
                  onChange={(e) =>
                    setFilterValues((current) => ({
                      ...current,
                      [filter.name]: e.target.value,
                    }))
                  }
                  className="control"
                >
                  <option value="all">{filter.label}</option>
                  {(filterOptions[filter.name] || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {error && <Alert tone="red">{error}</Alert>}
          {notice && <Alert tone="emerald">{notice}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} label={card.label} value={loading ? "..." : card.value} />
            ))}
          </div>

          <div className={canWrite ? "grid gap-6 xl:grid-cols-[360px_1fr]" : "grid gap-6"}>
            {canWrite && (
            <section className="panel p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    {editing ? `Edit ${singular(title)}` : `Add ${singular(title)}`}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Submit valid API fields.</p>
                </div>
                {editing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary px-3 py-1.5"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={saveItem} className="space-y-4">
                {fields.filter((field) => !(editing && field.createOnly)).map((field) => (
                  <FormField
                    key={field.name}
                    field={field}
                    value={form[field.name]}
                    onChange={handleChange}
                    disabled={saving}
                  />
                ))}

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full"
                >
                  {saving ? "Saving..." : editing ? "Update Record" : "Create Record"}
                </button>
              </form>
            </section>
            )}

            <section className="panel overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">{title} Directory</h2>
                  <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bulkDelete && canWrite && (
                    <button
                      type="button"
                      onClick={deleteSelected}
                      disabled={selectedIds.length === 0}
                      className="btn-danger py-1.5"
                    >
                      Delete Selected
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={loadItems}
                    className="btn-secondary py-1.5"
                  >
                    Refresh
                  </button>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size} / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="table-header">
                    <tr>
                      {bulkDelete && canWrite && (
                        <th className="px-4 py-3">
                          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                        </th>
                      )}
                      {columns.map((column) => (
                        <th key={column.key} className="px-4 py-3 font-semibold">
                          {column.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading && <TableSkeleton cells={columns.length + 2} />}
                    {!loading &&
                      filteredItems.map((item) => (
                        <tr key={item.id} className="table-row">
                          {bulkDelete && canWrite && (
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.id)}
                                onChange={() => toggleId(item.id, setSelectedIds)}
                              />
                            </td>
                          )}
                          {columns.map((column) => (
                            <td key={column.key} className="px-4 py-3 text-slate-700">
                              {column.render ? column.render(item) : item[column.key] || "-"}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <RowActions
                              item={item}
                              onEdit={startEdit}
                              onPatch={patchItem}
                              onDelete={deleteItem}
                              canWrite={canWrite}
                              customActions={getRowActions?.({
                                item,
                                reload: loadItems,
                                setError,
                                setNotice,
                              })}
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-100 lg:hidden">
                {loading &&
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="space-y-2 p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}

                {!loading &&
                  filteredItems.map((item) => (
                    <article key={item.id} className="space-y-3 p-4 transition hover:bg-blue-50/45">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-950">
                            {displayName(item)}
                          </h3>
                          <p className="truncate text-sm text-slate-500">ID {item.id}</p>
                        </div>
                        {bulkDelete && canWrite && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleId(item.id, setSelectedIds)}
                          />
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {columns.map((column) => (
                          <div key={column.key} className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {column.label}
                            </p>
                            <div className="truncate text-sm text-slate-700">
                              {column.render ? column.render(item) : item[column.key] || "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                      <RowActions
                        item={item}
                        onEdit={startEdit}
                        onPatch={patchItem}
                        onDelete={deleteItem}
                        canWrite={canWrite}
                        customActions={getRowActions?.({
                          item,
                          reload: loadItems,
                          setError,
                          setNotice,
                        })}
                      />
                    </article>
                  ))}
              </div>

              {!loading && filteredItems.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">{emptyText}</div>
              )}

              <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing {filteredItems.length} of {count} total records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || loading}
                    className="btn-secondary py-1.5"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-slate-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages || loading}
                    className="btn-secondary py-1.5"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function getErrorMessage(err, fallback = "Request failed") {
  if (typeof err.response?.data === "string") return err.response.data;
  return err.response?.data?.message || fallback;
}

function SummaryCard({ label, value }) {
  return (
    <div className="panel p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.09)]">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function FormField({ field, value, onChange, disabled }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{field.label}</span>
      {field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(field.name, parseValue(field, e.target.value))}
          disabled={disabled}
          className="control"
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type || "text"}
          value={value}
          placeholder={field.label}
          onChange={(e) => onChange(field.name, parseValue(field, e.target.value))}
          disabled={disabled}
          className="control"
        />
      )}
    </label>
  );
}

function RowActions({ item, onEdit, onPatch, onDelete, canWrite, customActions = [] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {canWrite && (
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="btn-secondary px-2.5 py-1.5 text-xs"
        >
          Edit
        </button>
      )}
      {customActions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => action.onClick({ item, onPatch })}
          className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 ${action.className || "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
        >
          {action.label}
        </button>
      ))}
      {canWrite && (
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="btn-danger px-2.5 py-1.5 text-xs"
        >
          Delete
        </button>
      )}
    </div>
  );
}

function Alert({ children, tone }) {
  return <div className={tone === "emerald" ? "alert-green" : "alert-red"}>{children}</div>;
}

function TableSkeleton({ cells }) {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index}>
      {Array.from({ length: cells }).map((__, cellIndex) => (
        <td key={cellIndex} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-slate-100" />
        </td>
      ))}
    </tr>
  ));
}

function makeInitialForm(fields) {
  return fields.reduce((form, field) => {
    form[field.name] = field.defaultValue ?? "";
    return form;
  }, {});
}

function cleanPayload(fields, form, isEditing) {
  return fields.reduce((payload, field) => {
    if (isEditing && field.createOnly) return payload;
    payload[field.name] = form[field.name];
    return payload;
  }, {});
}

function validateForm(fields, form, isEditing) {
  const missing = fields.find(
    (field) =>
      field.required &&
      !(isEditing && field.createOnly) &&
      !String(form[field.name] ?? "").trim()
  );
  if (missing) return `${missing.label} is required.`;
  return "";
}

function parseValue(field, value) {
  if (field.valueType === "boolean") return value === "true";
  return value;
}

function valueForSearch(value) {
  if (value === undefined || value === null) return "";
  return String(value).toLowerCase();
}

function toggleId(id, setSelectedIds) {
  setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
}

function displayName(item) {
  return [item.first_name, item.last_name].filter(Boolean).join(" ") || item.username || `ID ${item.id}`;
}

function canWriteResource(role, endpoint) {
  if (role === "admin") return true;
  if (role === "manager") return endpoint === "/students" || endpoint === "/teachers";
  return false;
}

function singular(title) {
  if (title.endsWith("s")) return title.slice(0, -1);
  return title;
}
