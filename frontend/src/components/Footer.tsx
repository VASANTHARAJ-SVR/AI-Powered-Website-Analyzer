import './Footer.css';

export function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-content">
                <p>&copy; {new Date().getFullYear()} AI Web Analyser · Built by Neo Perion SVR</p>
            </div>
        </footer>
    );
}
