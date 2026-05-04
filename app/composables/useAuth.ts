export const useAuth = () => {
  const { $pb } = useNuxtApp();
  const { loggedIn, user, clear, fetch: fetchSession } = useUserSession();

  const currentUser = computed(() => {
    if (user.value) {
      return {
        id: user.value.id,
        email: user.value.email,
        name: user.value.name,
        ...user.value,
      };
    }

    if ($pb?.authStore?.model) {
      return {
        id: $pb.authStore.model.id,
        email: $pb.authStore.model.email,
        name: $pb.authStore.model.name,
        ...$pb.authStore.model,
      };
    }

    return null;
  });

  const isAuthenticated = computed(() => {
    return loggedIn.value || $pb?.authStore?.isValid || false;
  });

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      await fetchSession();

      return { success: true, user: response.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.message || "Login failed",
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await $fetch("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });

      await fetchSession();

      return { success: true, user: response.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      $pb?.authStore?.clear();

      await clear();

      await $fetch("/auth/logout", { method: "POST" }).catch(() => {});

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const loginWithOAuth = async (provider: string) => {
    try {
      const authData = await $pb.collection("users").authWithOAuth2({
        provider: provider,
      });

      await $fetch("/auth/oauth", {
        method: "POST",
        body: {
          user: authData.record,
          token: authData.token,
        },
      });

      await fetchSession();

      return { success: true, user: authData.record };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "OAuth login failed",
      };
    }
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  return {
    user: currentUser,
    isAuthenticated,
    loggedIn,

    login,
    register,
    logout,
    loginWithOAuth,
    refreshSession,

    nuxtSession: { user, loggedIn, clear, fetch: fetchSession },
    pb: $pb,
  };
};
