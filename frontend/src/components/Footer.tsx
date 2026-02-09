import './Footer.css';

export function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-content">
                <p>&copy; {new Date().getFullYear()} web analyzer using ai powerby neo perion SVR</p>
            </div>
        </footer>
    );
}
