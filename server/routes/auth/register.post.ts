import PocketBase from "pocketbase";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  try {
    const { name, email, password, emailVisibility } = await readBody(event);

    if (!name || !email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name, email, and password are required",
      });
    }

    const pb = new PocketBase(config.pocketbaseUrl || "http://127.0.0.1:8090");

    const newUser = await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password,
      name,
      emailVisibility,
    });

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
        secure: process.env.NODE_ENV === "production",
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
    console.error("Register error:", error);

    if (error.statusCode) throw error;

    if (error.data?.email) {
      throw createError({
        statusCode: 409,
        statusMessage: "Email already exists",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.data?.message || "Registration failed",
    });
  }
});
