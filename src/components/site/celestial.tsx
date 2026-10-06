/** The sun and moon, placed on their arcs by the --sun-* and --moon-* variables applySky() sets. */
export function Celestial() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="celestial sun">
        <span className="sun-glow" />
        <span className="sun-disc" />
      </div>
      <div className="celestial moon">
        <span className="moon-disc">
          <span className="absolute left-[22%] top-[30%] h-[18%] w-[18%] rounded-full bg-[#e6d5ad]" />
          <span className="absolute left-[55%] top-[55%] h-[12%] w-[12%] rounded-full bg-[#e6d5ad]" />
          <span className="absolute left-[60%] top-[22%] h-[9%] w-[9%] rounded-full bg-[#e6d5ad]" />
        </span>
      </div>
    </div>
  );
}
