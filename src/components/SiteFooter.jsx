// The shared footer, in the Oranburg family style: the deep-navy band, the
// centered links, the credit line. It mirrors the footer the other Oranburg sites
// render so this app sits inside the same house.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__links">
          <a href="https://oranburg.law" target="_blank" rel="noreferrer">
            oranburg.law
          </a>
          <a href="https://www.sefaria.org" target="_blank" rel="noreferrer">
            Sefaria
          </a>
        </div>
        <p className="site-footer__note">
          Chumash by Seth Oranburg. The text is fetched from Sefaria at read time.
        </p>
      </div>
    </footer>
  );
}
