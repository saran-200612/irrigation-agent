import React from 'react';

const formatTableDate = (isoString) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return isoString;
  }
};

export default function HistoryTable({ history = [] }) {
  return (
    <div className="bg-surface border border-water/10 rounded-[6px] p-4 overflow-hidden">
      <h3 className="font-display text-[13px] tracking-wider uppercase text-text-dim mb-3">
        Recommendation Log & History
      </h3>

      {history.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-water/10 rounded-[4px]">
          <p className="text-[12px] text-text-dim">No historical advice logs recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] border-collapse">
            <thead>
              <tr className="border-b border-water/10 font-display text-[11px] text-text-dim uppercase tracking-wider">
                <th className="pb-2 font-semibold">Recommended Date/Time</th>
                <th className="pb-2 font-semibold text-right">Water (mm)</th>
                <th className="pb-2 font-semibold text-right">Duration (m)</th>
                <th className="pb-2 font-semibold text-right">Confidence</th>
                <th className="pb-2 pb-2 pl-4 font-semibold">Reasoning Highlight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface">
              {history.map((item, idx) => {
                const risksCount = item.risk_flags?.length ?? 0;
                
                return (
                  <tr
                    key={item.id}
                    className={`${
                      idx % 2 === 0 ? 'bg-bg/10' : 'bg-bg/40'
                    } hover:bg-water/5 transition-colors`}
                  >
                    <td className="py-2.5 font-mono text-[11.5px] text-text whitespace-nowrap">
                      {formatTableDate(item.recommended_datetime)}
                    </td>
                    <td className="py-2.5 font-mono text-right text-water font-bold">
                      {item.water_mm.toFixed(1)}
                    </td>
                    <td className="py-2.5 font-mono text-right text-text">
                      {item.duration_minutes}
                    </td>
                    <td className="py-2.5 font-mono text-right text-text-dim">
                      {(item.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-2.5 pl-4 max-w-[280px] truncate text-text-dim hover:text-text cursor-help" title={item.reasoning}>
                      {risksCount > 0 && (
                        <span className="bg-wheat/10 text-wheat border border-wheat/30 px-1 py-0.5 rounded-[2px] text-[10px] font-mono mr-1.5 font-bold">
                          {risksCount} risk{risksCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {item.reasoning}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
