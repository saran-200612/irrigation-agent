import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Sprout } from 'lucide-react';

export default function FieldsList({ fields, fieldsLoading, setSelectedField, selectedField }) {
  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-text-dim">Field management</p>
          <h1 className="font-display text-2xl font-bold text-text">Fields</h1>
        </div>
        <Link to="/fields/new" className="inline-flex items-center gap-2 rounded-[6px] bg-water px-4 py-2 text-sm font-semibold text-bg hover:bg-water/80 transition-colors">
          <PlusCircle className="h-4 w-4" /> Register your first field
        </Link>
      </div>

      {fieldsLoading ? (
        <div className="space-y-2 rounded-[8px] border border-water/10 bg-surface p-4 shadow-sm">
          <div className="h-8 bg-bg animate-pulse rounded"></div>
          <div className="h-8 bg-bg animate-pulse rounded"></div>
        </div>
      ) : fields.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-water/20 bg-surface p-10 text-center shadow-sm">
          <Sprout className="mx-auto mb-3 h-10 w-10 text-water/40" />
          <h2 className="font-display text-lg font-semibold text-text">No fields yet</h2>
          <p className="mt-2 text-sm text-text-dim">Add your first field to start receiving irrigation recommendations.</p>
          <Link to="/fields/new" className="mt-5 inline-flex items-center gap-2 rounded-[6px] bg-water px-4 py-2 text-sm font-semibold text-bg hover:bg-water/80 transition-colors">
            <PlusCircle className="h-4 w-4" /> Register your first field
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-water/10 bg-surface shadow-sm">
          <table className="w-full table-auto">
            <thead className="bg-bg/60">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dim">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dim">Crop</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dim">Action</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id} className="border-t border-water/5 transition-colors hover:bg-water/5">
                  <td className="px-4 py-3 text-text">{field.name}</td>
                  <td className="px-4 py-3 text-text">{field.crop}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/fields/${field.id}`}
                      onClick={() => setSelectedField(field)}
                      className={`inline-flex items-center rounded-[6px] px-3 py-1.5 text-sm transition-colors ${selectedField?.id === field.id ? 'bg-water/10 text-text font-semibold' : 'bg-bg/40 text-text-dim hover:bg-water/5 hover:text-text'}`}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
