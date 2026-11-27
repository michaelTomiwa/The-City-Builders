import { Bodoni_Moda, Jost } from "next/font/google";

const bodoni = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500", "600"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["400", "500"] });

export default function WeddingLayout({ children }: LayoutProps<"/wedding">) {
  return <div className={`wedding ${bodoni.variable} ${jost.variable} min-h-screen`}>{children}</div>;
}
