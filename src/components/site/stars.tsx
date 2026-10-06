const stars = [
  [6, 14], [14, 30], [22, 8], [31, 22], [38, 12], [47, 34], [55, 6], [63, 26],
  [71, 16], [78, 38], [86, 10], [93, 28], [18, 44], [52, 46], [82, 50], [4, 52],
  [27, 4], [42, 24], [67, 4], [97, 12], [11, 22], [59, 40], [89, 36], [35, 40],
];

/** A still night sky with a few stars twinkling and the occasional shooting star. */
export function Stars({ shooting = false }: { shooting?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full">
        {stars.map(([x, y], i) => (
          <circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={i % 3 === 0 ? 1.4 : 0.9}
            fill="#e9ecf5"
            opacity={i % 2 === 0 ? 0.75 : 0.4}
            className={i % 4 === 0 ? "star-twinkle" : undefined}
            style={i % 4 === 0 ? { animationDelay: `${(i * 0.7) % 5}s` } : undefined}
          />
        ))}
      </svg>
      {shooting && (
        <>
          <span className="shooting-star left-[62%] top-[10%]" />
          <span className="shooting-star left-[24%] top-[6%] [animation-delay:7s]" />
        </>
      )}
    </div>
  );
}
