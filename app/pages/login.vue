<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
const { loggedIn, fetch } = useUserSession();
const route = useRoute();
import { FetchError } from "ofetch";
const { t } = useI18n();

const schema = z.object({
  email: z.string().email(t("auth.validation.invalidEmail")),
  password: z.string().min(8, t("auth.validation.passwordMin")),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  password: undefined,
});

const toast = useToast();

const extractErrorMessage = (error: any): string => {
  if (error instanceof FetchError) {
    if (error.data?.message) {
      return error.data.message;
    } else if (error.data?.error) {
      return error.data.error;
    } else if (error.data?.detail) {
      return error.data.detail;
    } else if (typeof error.data === "string") {
      return error.data;
    } else if (error.statusMessage) {
      return error.statusMessage;
    }
  }
  return t("auth.toast.errors.loginGeneric");
};

const redirectTo =
  typeof route.query.redirect === "string" ? route.query.redirect : "/";

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    await $fetch("/auth/login", {
      method: "POST",
      body: event.data,
    });
    toast.add({
      title: t("auth.toast.loginSuccess.title"),
      description: t("auth.toast.loginSuccess.description"),
      color: "primary",
    });
    fetch();
    navigateTo(redirectTo);
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    toast.add({
      title: t("auth.toast.errors.loginTitle"),
      description: errorMessage,
      color: "error",
    });
  }
};

watch(loggedIn, () => {
  if (loggedIn.value) navigateTo(redirectTo);
});

const { $pb } = useNuxtApp();
const router = useRouter();

const loginWithProvider = async (providerName: string) => {
  try {
    const authData = await $pb.collection("users").authWithOAuth2({
      provider: providerName,
      scopes:
        providerName === "google"
          ? [
              "email",
              "profile",
              "openid",
              "https://www.googleapis.com/auth/calendar.readonly",
            ]
          : undefined,
    });

    try {
      await $pb.collection("users").update(authData.record.id, {
        emailVisibility: true,
      });
    } catch (e) {
      console.error("Failed to update emailVisibility:", e);
    }

    await $fetch("/auth/oauth", {
      method: "POST",
      body: {
        user: authData.record,
        token: authData.token,
        providerMeta:
          providerName === "google"
            ? {
                accessToken: authData.meta?.accessToken,
                refreshToken: authData.meta?.refreshToken,
                expiry: authData.meta?.expiry,
              }
            : null,
      },
    });

    await fetch();
    router.push("/");
  } catch (err) {
    console.error("OAuth failed:", err);
  }
};
</script>

<template>
  <NuxtLayout>
    <UCard class="max-w-md m-auto my-10">
      <template #header>
        <h1 class="text-2xl text-center">{{ $t("auth.login.title") }}</h1>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="$t('auth.fields.email')" name="email">
          <UInput v-model="state.email" class="w-full" />
        </UFormField>

        <UFormField :label="$t('auth.fields.password')" name="password">
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>

        <UButton type="submit" block>
          {{ $t("auth.login.submitButton") }}
        </UButton>
      </UForm>

      <div class="text-center mt-4 text-sm text-gray-600">
        {{ $t("auth.login.noAccount") }}
        <NuxtLink
          to="/register"
          class="text-primary hover:underline font-medium"
        >
          {{ $t("auth.login.signUpLink") }}
        </NuxtLink>
      </div>
      <UButton
        variant="outline"
        block
        class="mt-5"
        @click="loginWithProvider('google')"
      >
        <UIcon name="i-simple-icons-google" class="mr-2" />
        {{ $t("auth.oauth.google") }}
      </UButton>
      <UButton
        variant="outline"
        block
        class="mt-5"
        @click="loginWithProvider('github')"
      >
        <UIcon name="i-simple-icons-github" class="mr-2" />
        {{ $t("auth.oauth.github") }}
      </UButton>
      <UButton
        variant="outline"
        block
        class="mt-5"
        @click="loginWithProvider('microsoft')"
      >
        <UIcon name="i-simple-icons-microsoft" class="mr-2" />
        {{ $t("auth.oauth.microsoft") }}
      </UButton>
    </UCard>
  </NuxtLayout>
</template>
