import { useLocation, useNavigate } from "react-router";

type AppNavLinkProps = {
  to: string;
  children: string;
};

export function AppNavLink({ to, children }: AppNavLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive =
    location.pathname === to ||
    (to !== "/app" && location.pathname.startsWith(`${to}/`));

  return (
    <s-link
      href={to}
      {...(isActive ? { active: true } : {})}
      onClick={(event) => {
        event.preventDefault();
        if (location.pathname !== to) {
          navigate(to);
        }
      }}
    >
      {children}
    </s-link>
  );
}
