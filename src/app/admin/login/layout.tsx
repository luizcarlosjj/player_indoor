// Página de login não precisa do layout admin (sem sidebar)
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
