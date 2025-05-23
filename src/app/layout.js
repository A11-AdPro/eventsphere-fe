import './globals.css'
import { AuthProvider } from './contexts/AuthContext'

export const metadata = {
  title: 'EventSphere',
  description: 'Platform manajemen event terbaik',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}