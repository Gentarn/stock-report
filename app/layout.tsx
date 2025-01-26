import Providers from "./providers"

const Layout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default Layout



import './globals.css'