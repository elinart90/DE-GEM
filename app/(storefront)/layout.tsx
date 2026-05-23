import { CartProvider } from '@/components/CartProvider'
import Header from '@/components/storefront/Header'
import Footer from '@/components/storefront/Footer'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </CartProvider>
  )
}
