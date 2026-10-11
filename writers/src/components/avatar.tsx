import Image from "next/image";

const gradients = [
  "from-purple to-blue",
  "from-blue to-blue-hot",
  "from-purple-hot to-purple",
  "from-blue-hot to-purple",
];

export function Avatar({
  name,
  photo,
  index = 0,
  className = "",
}: {
  name: string;
  photo?: string | null;
  index?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (photo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={photo} alt={name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradients[index % gradients.length]} ${className}`}
      aria-label={name}
    >
      <span className="font-display text-[clamp(2.5rem,8vw,5rem)] font-extrabold tracking-tighter text-white/90">
        {initials}
      </span>
      <div className="grain absolute inset-0" />
    </div>
  );
}
