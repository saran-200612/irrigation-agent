import React from 'react';
import { Link } from 'react-router-dom';
import FieldForm from '../components/FieldForm';

export default function FieldCreatePage({ onSubmit, isLoading }) {
  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-text-dim">Field registration</p>
          <h1 className="font-display text-2xl font-bold text-text">Register a New Field</h1>
        </div>
        <Link to="/fields" className="text-sm text-water hover:underline">← Back to fields</Link>
      </div>

      <div className="bg-surface border border-water/10 rounded-[8px] p-6 shadow-sm">
        <FieldForm onSubmit={onSubmit} isLoading={isLoading} />
      </div>
    </section>
  );
}
