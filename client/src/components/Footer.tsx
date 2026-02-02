import { Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
    const year = new Date().getFullYear()

    return (
        <footer className="py-12 border-t border-border bg-background">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Logo & Copyright */}
                    <div className="md:col-span-1 flex flex-col justify-between h-full">
                        <div className="flex items-start justify-start mb-8 animate-scale-in">
                            <img
                                src="/images/horizontal-full-logo-text.png"
                                alt="LastFanStanding Logo"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {year} Last Fan Standing. ყველა უფლება დაცულია.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="md:col-span-1">
                        <h4 className="font-display font-semibold text-lg mb-4">ბმულები</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/leaderboard"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    რეიტინგი
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/grand-tournament"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    გრანდ ტურნირი
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terms"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    წესები
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    კონფიდენციალურობის პოლიტიკა
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-1">
                        <h4 className="font-display font-semibold text-lg mb-4">კონტაქტი</h4>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="mailto:lastfanstanding07@gmail.com"
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">lastfanstanding07@gmail.com</span>
                                </a>
                            </li>
                            {/* <li>
                                <a
                                    href="tel:+995598102030"
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">+995 598 10 20 30</span>
                                </a>
                            </li> */}
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div className="md:col-span-1">
                        <h4 className="font-display font-semibold text-lg mb-4">სოციალური მედია</h4>
                        <div className="flex items-center gap-4">
                            <a
                                href="https://www.facebook.com/profile.php?id=61587365460631"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors group"
                            >
                                <svg
                                    className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a
                                href="https://www.instagram.com/lastfanstanding.ge/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors group"
                            >
                                <svg
                                    className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                            </a>
                            <a
                                href="https://www.tiktok.com/@lastfanstanding.ge"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors group"
                            >
                                <svg
                                    className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground/70 text-center">
                        ეს არ არის „ჩემი ცოლის დაქალების" ოფიციალური პროდუქტი. პლატფორმა შექმნილია ფანების მიერ, ფანებისთვის.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer