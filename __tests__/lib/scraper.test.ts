/**
 * @jest-environment node
 */
import { extractText } from '@/lib/scraper';

describe('extractText', () => {
  it('extracts paragraph text from an article element', () => {
    const html = `
      <html><body>
        <article>
          <p>Dette er en lang nok paragraf til å bli inkludert i resultatet fra scraperen.</p>
          <p>Dette er en annen paragraf med nok innhold for at den skal passere tegnsgrensen.</p>
        </article>
      </body></html>
    `;
    const result = extractText(html);
    expect(result).toContain('Dette er en lang nok paragraf');
    expect(result).toContain('Dette er en annen paragraf');
  });

  it('excludes nav, header, footer, and script elements', () => {
    const html = `
      <html><body>
        <nav>Navigasjon</nav>
        <header>Topp</header>
        <article>
          <p>Dette er artikkelinnhold som er langt nok til å bli tatt med i resultatet.</p>
        </article>
        <footer>Bunn</footer>
        <script>alert(1)</script>
      </body></html>
    `;
    const result = extractText(html);
    expect(result).not.toContain('Navigasjon');
    expect(result).not.toContain('Topp');
    expect(result).not.toContain('Bunn');
    expect(result).toContain('artikkelinnhold');
  });

  it('filters out paragraphs shorter than 40 characters', () => {
    const html = `
      <html><body>
        <article>
          <p>Kort.</p>
          <p>Dette er en paragraf som er lang nok til å bli inkludert i det endelige resultatet fra scraperen.</p>
        </article>
      </body></html>
    `;
    const result = extractText(html);
    expect(result).not.toContain('Kort.');
    expect(result).toContain('lang nok til å bli inkludert');
  });

  it('returns empty string when no meaningful content found', () => {
    const html = '<html><body><div class="paywall">Abonner for å lese</div></body></html>';
    expect(extractText(html)).toBe('');
  });
});
