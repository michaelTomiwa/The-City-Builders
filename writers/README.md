# Inkhouse: writers' collective website

A one-page website for a collective of script writers: founder bio, team, what we do, the scripts we write, past projects and reviews, and a "start a project" form.

Built with Next.js 16, Tailwind CSS 4 and Framer Motion. It uses **Supabase** (free plan) to store project enquiries and reviews, and deploys on **Vercel** (free Hobby plan) with your own custom domain.

> This app lives in the `writers/` folder and is separate from the church site in the repository root.

---

## 1. Make it yours (5 minutes)

All the text is in **`src/content/site.ts`**. Anything marked `SAMPLE` is placeholder copy:

| What | Where in `site.ts` |
| --- | --- |
| Organisation name, tagline, email, socials | `site` |
| Your bio and photo | `founder` |
| Numbers (scripts delivered, etc.) | `stats` |
| What we do | `services` |
| Types of script | `scriptTypes` |
| Team members | `team` |
| Past projects | `projects` |
| Reviews you already have | `reviews` (delete the `sample: true` entries) |

**Photos:** put square or portrait JPGs in `public/team/` (for example `public/team/founder.jpg`) and set `photo: "/team/founder.jpg"`. With no photo, a purple and blue initials tile is shown instead.

**Colours** are defined once at the top of `src/app/globals.css`.

## 2. Set up Supabase (free)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste everything in `supabase/schema.sql`, then click **Run**.
3. Go to **Project Settings → API** and copy the **Project URL** and the **anon / publishable key**.

How it works:

- **Project enquiries** go to the `inquiries` table. Check them in **Table Editor → inquiries**. Visitors can send one but can never read any.
- **Reviews** that visitors submit go to the `reviews` table as unapproved. To publish one, set its `approved` column to `true`. It appears on the site within a minute.

## 3. Deploy on Vercel (free)

1. At [vercel.com/new](https://vercel.com/new), import this GitHub repository.
2. Set **Root Directory** to `writers`. Vercel will detect Next.js automatically.
3. Add these **Environment Variables** (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`: your domain, for example `https://yourdomain.com`
4. Click **Deploy**.

## 4. Connect your custom domain

1. In Vercel, open the project and go to **Settings → Domains**, then add `yourdomain.com` and `www.yourdomain.com`.
2. At the company you bought the domain from, add the DNS records Vercel shows you. These are usually:
   - an **A** record for `@` pointing to `76.76.21.21`
   - a **CNAME** record for `www` pointing to `cname.vercel-dns.com`
3. Wait for the domain to show as valid. HTTPS is set up automatically.
4. Make sure `NEXT_PUBLIC_SITE_URL` matches the domain, then redeploy.

## Run it locally

```bash
cd writers
cp .env.example .env.local   # fill in your Supabase values
npm install
npm run dev                  # http://localhost:3000
```

The site still works without Supabase. The forms will then ask visitors to email you instead.
