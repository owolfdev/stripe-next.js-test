import Link from "next/link";
import DonateButton from "./DonateButton";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">
              Stripe Subscription App
            </h3>
            <p className="text-gray-300 mb-4">
              A powerful subscription management platform built with Next.js,
              Stripe, and Supabase.
            </p>
            <p className="text-gray-400 text-sm">
              Secure payments, seamless user management, and flexible
              subscription plans.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/upgrade"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Manage Subscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Donate */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Support
            </h4>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Love this project? Help keep it running!
              </p>
              <DonateButton
                amount={50}
                currency="thb"
                label="Support Us"
                className="w-full justify-center"
              />
              <p className="text-gray-400 text-xs">
                Powered by Stripe • Secure donations
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2024 Stripe Subscription App. Built with ❤️ using Next.js,
              Stripe & Supabase.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
