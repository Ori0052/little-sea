# Fonts

Brand lockup, onboarding headings, collection titles and other existing serif accents use **Maru Buri** (Regular 400 / Bold 700). The base UI text continues to use Noto Sans KR or the platform sans-serif fallback.

Maru Buri is bundled locally as two WOFF2 files under `public/fonts/maru-buri/` (575,500 bytes total). `font-display: swap` keeps text visible while loading. Web and Apps in Toss share the same CSS and font files; the native build copies the files and license into its static bundle.

Copyright: NAVER Corp. / NAVER Cultural Foundation Corp. Full SIL OFL 1.1 text and the NAVER copyright/reserved-name notice are included at `public/fonts/maru-buri/LICENSE.txt`.

- Official distribution and usage notice: https://hangeul.naver.com/font
- Official license: https://help.naver.com/service/30016/contents/18088?osType=PC&lang=ko
- Font binary mirror (unmodified WOFF2 files): https://github.com/fonts-archive/MaruBuri

Verification: mobile onboarding/home and desktop home screenshots; Chromium reports the embedded Maru Buri font rendering Korean glyphs; both bundled native font files and the license match the source files byte-for-byte. Web/Toss builds and native platform checks pass.
