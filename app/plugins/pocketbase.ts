import PocketBase from "pocketbase";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const pbUrl = config.public.pocketbaseUrl || "http://127.0.0.1:8090";

  const pb = new PocketBase(pbUrl);

  const pbAuthCookie = useCookie<string | null>("pb_auth", {
    path: "/",
    secure: true,
    sameSite: "lax",
    httpOnly: false,
    maxAge: 604800,
  });

  if (pbAuthCookie.value) {
    try {
      if (typeof pbAuthCookie.value === "string") {
        const authData = JSON.parse(pbAuthCookie.value);
        if (authData.token) {
          pb.authStore.save(authData.token, authData.record || authData.model);
        }
      }
    } catch (e) {
      try {
        pb.authStore.loadFromCookie(`pb_auth=${pbAuthCookie.value}`);
      } catch (e2) {
        console.warn("Failed to load PocketBase auth from cookie");
      }
    }
  }

  pb.authStore.onChange((token, model) => {
    if (token && model) {
      pbAuthCookie.value = JSON.stringify({
        token: token,
        record: model,
      });
    } else {
      pbAuthCookie.value = null;
    }
  });

  const pbUser = computed(() => pb.authStore.model);
  const isAuthenticated = computed(() => pb.authStore.isValid);

  return {
    provide: {
      pb,
      pbUser,
      isAuthenticated,
    },
  };
});
