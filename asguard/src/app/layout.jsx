import './globals.css'

export const metadata = {
  title: 'ASGUARD — AI Smart Guardian',
  description: 'Transform your home into an intelligent Digital Twin with AI-powered SmartThings energy recommendations.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
