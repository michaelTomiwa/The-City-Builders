/** The public half of the web push key pair. Safe to ship to browsers; the private half lives on Vercel. */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BL1w4zLNshFQIDXS9cczxR0yGW-45LE0QQB6tHNaenHbAnJxH1EIpZvRBKS9E7RbpezVMDMV2fNjWVGnm9pU3To";
