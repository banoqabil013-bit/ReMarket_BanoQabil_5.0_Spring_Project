import { Link } from "react-router-dom";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left - Branding */}
        <div className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-950" />

          {/* Decorative 3D-style objects */}
          <div className="absolute left-20 top-24 h-32 w-32 rotate-12 rounded-3xl bg-white/10 backdrop-blur-xl" />

          <div className="absolute bottom-32 right-20 h-44 w-44 -rotate-12 rounded-[40px] bg-cyan-400/20 backdrop-blur-xl" />

          <div className="relative z-10 flex flex-col justify-center px-16">
            <Link to="/login" className="mb-8 text-2xl font-bold">
              ReMarket
            </Link>

            <h1 className="max-w-lg text-5xl font-bold leading-tight">
              Buy better.
              <br />
              Sell smarter.
            </h1>

            <p className="mt-6 max-w-md text-lg text-white/70">
              A modern marketplace for buying and selling new and pre-loved
              products.
            </p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
