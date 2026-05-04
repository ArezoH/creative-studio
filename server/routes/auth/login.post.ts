import PocketBase from "pocketbase";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const { email, password } = await readBody(event);

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email and password required",
      });
    }

    const pb = new PocketBase(config.pocketbaseUrl || "http://127.0.0.1:8090");

    const authData = await pb
      .collection("users")
      .authWithPassword(email, password);

    setCookie(
      event,
      "pb_auth",
      JSON.stringify({
        token: authData.token,
        record: {
          id: authData.record.id,
          email: authData.record.email,
          name: authData.record.name,
          avatar: authData.record.avatar,
          created: authData.record.created,
          updated: authData.record.updated,
        },
      }),
      {
        httpOnly: false,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      }
    );
    await setUserSession(event, {
      user: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
        avatar: authData.record.avatar,
      },
      loggedInAt: Date.now(),
    });

    return {
      success: true,
      user: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
      },
    };
  } catch (error: any) {
    console.error("Login error:", error);

    deleteCookie(event, "pb_auth");

    if (error.statusCode) throw error;

    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }
});
