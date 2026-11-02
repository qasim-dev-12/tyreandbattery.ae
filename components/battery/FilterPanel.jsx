"use client";

function CheckboxGroup({ title, options, selected, onToggle, scrollable = false }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-dark">{title}</h3>
      <div className={`mt-2 flex flex-col gap-1.5 ${scrollable ? "max-h-48 overflow-y-auto pr-1" : ""}`}>
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center justify-between gap-2 text-sm text-dark/70">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
                disabled={opt.count === 0 && !selected.includes(opt.value)}
                className="h-4 w-4 rounded border-dark/30 text-primary focus:ring-primary"
              />
              {opt.label}
            </span>
            <span className="text-xs text-dark/40">{opt.count}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FilterPanel({
  brandOptions,
  typeOptions,
  capacityOptions,
  selectedBrands,
  selectedTypes,
  selectedCapacities,
  onToggleBrand,
  onToggleType,
  onToggleCapacity,
  onClearAll,
}) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-dark/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-dark">Filters</h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Clear all filters
        </button>
      </div>

      <CheckboxGroup
        title="Brand"
        options={brandOptions}
        selected={selectedBrands}
        onToggle={onToggleBrand}
        scrollable
      />

      <CheckboxGroup
        title="Battery Type"
        options={typeOptions}
        selected={selectedTypes}
        onToggle={onToggleType}
      />

      <CheckboxGroup
        title="Capacity"
        options={capacityOptions}
        selected={selectedCapacities}
        onToggle={onToggleCapacity}
        scrollable
      />
    </div>
  );
}
