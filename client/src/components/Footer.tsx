import { Link } from "wouter";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">ORCAA</h3>
            <p className="text-gray-300 text-sm">
              Olympic Region Clean Air Agency promotes air quality and takes actions that protect 
              the health and welfare of people and the natural environment.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>Serving 6 counties in Washington State</span>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/air-quality" className="text-gray-300 hover:text-white transition-colors">
                  Air Quality Monitoring
                </Link>
              </li>
              <li>
                <Link href="/burning" className="text-gray-300 hover:text-white transition-colors">
                  Burn Permits
                </Link>
              </li>
              <li>
                <Link href="/asbestos" className="text-gray-300 hover:text-white transition-colors">
                  Asbestos & Demolition
                </Link>
              </li>
              <li>
                <Link href="/complaints" className="text-gray-300 hover:text-white transition-colors">
                  File Complaints
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://client.pointandpay.net/web/OlympicRegCleanAirAgencyWA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>Make a Payment</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.orcaa.org/public-resources/file-an-air-quality-complaint/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>File a Complaint</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.orcaa.org/air-quality/current-air-quality/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>Current Air Quality</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.orcaa.org/regulations" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>Regulations</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>2940 Limited Lane NW</p>
                  <p>Olympia, WA 98502</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+1-360-539-7610" className="hover:text-white transition-colors">
                  (360) 539-7610
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:info@orcaa.org" className="hover:text-white transition-colors">
                  info@orcaa.org
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Counties Served */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="text-center">
            <h4 className="text-sm font-semibold mb-3">Counties Served</h4>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-300">
              <span>Clallam</span>
              <span>•</span>
              <span>Grays Harbor</span>
              <span>•</span>
              <span>Jefferson</span>
              <span>•</span>
              <span>Mason</span>
              <span>•</span>
              <span>Pacific</span>
              <span>•</span>
              <span>Thurston</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div className="mb-2 md:mb-0">
              <p>&copy; 2025 Olympic Region Clean Air Agency. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a 
                href="https://www.orcaa.org/privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="https://www.orcaa.org/accessibility" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Accessibility
              </a>
              <a 
                href="mailto:info@orcaa.org?subject=Website Feedback" 
                className="hover:text-white transition-colors"
              >
                Website Feedback
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}