import { Link } from "react-router-dom";
import ManageCookiesLink from "./CookieConsent/ManageCookiesLink";

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white p-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-300">
                <Link to="/privacy" className="hover:text-white">Privacy</Link>
                <span aria-hidden="true">·</span>
                <Link to="/cookie-policy" className="hover:text-white">Cookie policy</Link>
                <span aria-hidden="true">·</span>
                <ManageCookiesLink className="hover:text-white">Gestisci cookie</ManageCookiesLink>
            </div>
        </footer>
    );
};

export default Footer;
