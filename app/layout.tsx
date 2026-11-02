import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'나의 작은 바다',description:'멀리 가지 않아도 괜찮아. 언제든 쉬어가는 나의 작은 바다.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>}
