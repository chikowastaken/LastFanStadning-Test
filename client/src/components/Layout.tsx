import Footer from "./Footer";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  /**
   * Whether to show the header
   * @default true
   */
  showHeader?: boolean;
}

export default function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header showHeader={showHeader} />
      {/* Main content */}
      <main className="pt-16 min-h-screen">{children}</main>

      <Footer />
    </div>
  );
}
