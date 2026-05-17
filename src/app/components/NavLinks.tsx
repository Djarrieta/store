import Button from "@/app/components/Button";

interface NavLinksProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
}

export default function NavLinks({ isAuthenticated, isAdmin }: NavLinksProps) {
  return (
    <nav className="flex items-center gap-2">
      <Button href="/about" variant="secondary" size="sm">
        Nosotros
      </Button>
      {isAdmin && (
        <Button href="/admin/products" variant="secondary" size="sm">
          Admin
        </Button>
      )}
      {!isAuthenticated && (
        <Button href="/login" variant="primary" size="sm" shadow>
          Ingresar
        </Button>
      )}
    </nav>
  );
}
