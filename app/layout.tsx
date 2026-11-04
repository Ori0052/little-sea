import type { Metadata } from 'next';
import './globals.css';
import './sea-design-system.css';
export const metadata: Metadata={title:'나의 작은 바다',icons:{icon:'/brand/app-icon-600.png?v=lavender-1',apple:'/brand/app-icon-600.png?v=lavender-1'},description:'멀리 가지 않아도 괜찮아. 언제든 쉬어가는 나의 작은 바다.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QMLBSGCBBL"/>
<script id="little-sea-ga4" dangerouslySetInnerHTML={{__html:`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-QMLBSGCBBL', {allow_google_signals: false, allow_ad_personalization_signals: false});`}}/>
</head><body>{children}</body></html>}
