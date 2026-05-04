export default defineEventHandler(async (event) => {
  try {
    deleteCookie(event, "pb_auth", {
      path: "/login",
    });

    await clearUserSession(event);

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error: any) {
    console.error("Logout error:", error);

    deleteCookie(event, "pb_auth", { path: "/login" });

    throw createError({
      statusCode: 500,
      statusMessage: "Logout failed",
    });
  }
});
