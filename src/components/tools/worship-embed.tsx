export function WorshipEmbed() {
  return (
    <div>
      <div className="aspect-video w-full overflow-hidden rounded-sm border border-steel">
        <iframe
          className="h-full w-full"
          src="https://www.youtube-nocookie.com/embed/xWma4QfQSms"
          title="The City Builders — Your Season Is Not a Mistake"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="mt-3 text-sm text-paper-dim">
        Night Watch — &ldquo;Your Season Is Not a Mistake,&rdquo; Pastor Michael
        Tomiwa.{" "}
        <a
          href="https://www.youtube.com/@thecitybuilderscity/streams"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-text hover:text-ink"
        >
          See all messages
        </a>
      </p>
    </div>
  );
}
