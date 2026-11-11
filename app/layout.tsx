import type { Metadata } from 'next';
import './globals.css';
import './sea-design-system.css';
const siteUrl='https://little-sea.rhfenrdltkfk.chatgpt.site';
const title='나의 작은 바다';
const description='멀리 가지 않아도 괜찮아. 파도 소리를 들으며 쉬고, 작은 섬을 탐험하는 나만의 바다.';
const shareImage={url:siteUrl+'/brand/app-icon-600.png?v=lavender-1',width:600,height:600,alt:'나의 작은 바다 · 작은 섬과 파도 로고'};
export const metadata: Metadata={
 metadataBase:new URL(siteUrl),title,description,
 icons:{icon:'/brand/app-icon-600.png?v=lavender-1',apple:'/brand/app-icon-600.png?v=lavender-1'},
 alternates:{canonical:siteUrl+'/'},
 openGraph:{type:'website',locale:'ko_KR',url:siteUrl+'/',siteName:title,title,description,images:[shareImage]},
 twitter:{card:'summary',title,description,images:[shareImage.url]},
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QMLBSGCBBL"/>
<script id="little-sea-ga4" dangerouslySetInnerHTML={{__html:`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-QMLBSGCBBL', {allow_google_signals: false, allow_ad_personalization_signals: false});`}}/>
</head><body>{children}</body></html>}
