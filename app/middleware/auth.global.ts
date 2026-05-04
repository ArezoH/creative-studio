export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth();

  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(to.path);
  const isShareRoute = to.path.startsWith("/share/");

  if (isPublicRoute || isShareRoute) {
    if (user.value && (to.path === "/login" || to.path === "/register")) {
      return navigateTo("/");
    }
    return;
  }

  if (!user.value) {
    return navigateTo("/login");
  }
});