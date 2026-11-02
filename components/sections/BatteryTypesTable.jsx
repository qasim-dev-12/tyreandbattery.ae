const TYPES = [
  {
    type: "DIN",
    bestFor: "European sedans & SUVs",
    notes: "Taller case, side terminals common on older European models.",
  },
  {
    type: "JIS",
    bestFor: "Japanese & Korean cars",
    notes: "Compact case sizing used by most Toyota, Honda, Nissan and Hyundai models.",
  },
  {
    type: "AGM",
    bestFor: "Start-stop vehicles",
    notes: "Handles frequent engine shut-off/restart cycles and higher electrical loads.",
  },
  {
    type: "Standard",
    bestFor: "Budget-friendly replacement",
    notes: "A reliable flooded-lead-acid option for vehicles without start-stop.",
  },
];

export default function BatteryTypesTable() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-dark">Battery Types We Stock</h2>
      <p className="mt-1 max-w-2xl text-sm text-dark/60">
        Not sure which one fits your car? Tell us the make and model and we'll confirm the right type.
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-dark/10 bg-white">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-dark/10 text-dark/50">
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Best For</th>
              <th className="p-4 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {TYPES.map((row) => (
              <tr key={row.type} className="border-b border-dark/5 last:border-0">
                <td className="p-4 font-semibold text-primary">{row.type}</td>
                <td className="p-4 text-dark/80">{row.bestFor}</td>
                <td className="p-4 text-dark/60">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
