import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BBO Creator App",
  description: "Your smart friend for growing your page and getting paid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a" }}>
        {children}
      </body>
    </html>
  );
}
