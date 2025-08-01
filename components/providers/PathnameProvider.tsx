"use client"

import { usePathname } from "next/navigation";
import Header from "../Header";

const PathnameProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth")

  return (
    <div data-pathname={pathname} data-is-auth-page={isAuthPage}>
      {!isAuthPage && <Header />}
      {children}
    </div>
  );
};

export default PathnameProvider;