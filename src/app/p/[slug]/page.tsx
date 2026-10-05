import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { supabase, type Page } from "@/lib/supabase";

export const revalidate = 60;

export default async function CustomPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;

  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const page = data as Page | null;
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-paper sm:text-5xl">{page.title}</h1>
      <div className="prose-sermon mt-10 space-y-5 text-lg leading-relaxed text-paper-dim [&_a]:text-gold-text [&_h2]:font-display [&_h2]:text-paper [&_h2]:text-2xl [&_h2]:pt-4 [&_strong]:text-paper">
        <ReactMarkdown>{page.content}</ReactMarkdown>
      </div>
    </article>
  );
}
