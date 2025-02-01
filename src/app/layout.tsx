import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import WithFirebase from "./firebase";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Genkit by Example",
    default: "Genkit by Example",
  },
  description:
    "Common patterns for apps incorporating GenAI, powered by Firebase Genkit.",
};

function App({ children }: { children: React.ReactNode }) {
  return (
    <WithFirebase>
      <AppSidebar />
      <div className="flex-1">{children}</div>
    </WithFirebase>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunitoSans.className} antialiased dark`}>
        <SidebarProvider>
          <App>{children}</App>
        </SidebarProvider>
      </body>
    </html>
  );
}
