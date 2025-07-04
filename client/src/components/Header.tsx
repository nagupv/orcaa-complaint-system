import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-orcaa-blue text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>(360) 539-7610</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>info@orcaa.org</span>
              </div>
            </div>
            <div className="hidden md:block">
              <span>Olympic Region Clean Air Agency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orcaa-blue rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ORCAA</h1>
                <p className="text-sm text-gray-600">Olympic Region Clean Air Agency</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-orcaa-blue font-medium">
              Home
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-orcaa-blue font-medium">
              Services
            </Link>
            <Link href="/air-quality" className="text-gray-700 hover:text-orcaa-blue font-medium">
              Air Quality
            </Link>
            <Link href="/burning" className="text-gray-700 hover:text-orcaa-blue font-medium">
              Burning
            </Link>
            <Link href="/asbestos" className="text-gray-700 hover:text-orcaa-blue font-medium">
              Asbestos
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-orcaa-blue font-medium">
              Contact
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            className="lg:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Home
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Services
              </Link>
              <Link href="/air-quality" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Air Quality
              </Link>
              <Link href="/burning" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Burning
              </Link>
              <Link href="/asbestos" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Asbestos
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-orcaa-blue font-medium py-2">
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>


    </header>
  );
}