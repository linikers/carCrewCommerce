import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
