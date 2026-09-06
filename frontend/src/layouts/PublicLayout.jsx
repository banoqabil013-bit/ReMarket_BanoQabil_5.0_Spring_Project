import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

const PublicLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
