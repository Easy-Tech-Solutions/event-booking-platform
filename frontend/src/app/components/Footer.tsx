import { Link } from "react-router";
import { Ticket, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#004406] text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">EventHub</span>
            </Link>
            <p className="text-sm">
              Discover and book amazing events near you. Create unforgettable experiences.
            </p>
          </div>

          {/* For Attendees */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Attendees</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/discover" className="hover:text-white transition-colors">Discover Events</Link></li>
              <li><Link to="/user/tickets" className="hover:text-white transition-colors">My Tickets</Link></li>
              <li><Link to="/user/saved" className="hover:text-white transition-colors">Saved Events</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Organizers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/organizer/create" className="hover:text-white transition-colors">Create Event</Link></li>
              <li><Link to="/organizer/dashboard" className="hover:text-white transition-colors">Organizer Dashboard</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Resources</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 EventHub. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors" aria-label="Facebook"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
