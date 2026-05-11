import Container from "@/components/layouts/Container";
import { Outlet } from "react-router-dom";

export const AuthLayout = () => {
  return (
    <Container
      noGutter
      // display="flex"
      className="overflow-hidden bg-[#F7F9FE] dark:bg-gray-950 h-full transition-colors"
    >
      <Outlet />
    </Container>
  );
};
