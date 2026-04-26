import { useNavigate } from 'react-router-dom'
import { Heart, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  const navigate = useNavigate()

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ]

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Sahayogam Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white leading-tight">
                  Sahayogam
                </span>
                <span className="text-xs text-brand-400 font-medium -mt-1">
                  सहयोगम्
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Connecting volunteers with real-world needs using smart technology
              and data-driven insights. Together we save lives.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-gray-400 hover:text-brand-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-brand-400" />
                <span>contact@sahayogam.org</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-brand-400" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin size={16} className="text-brand-400 mt-0.5" />
                <span>Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Sahayogam. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
