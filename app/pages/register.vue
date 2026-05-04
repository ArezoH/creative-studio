<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const { loggedIn, fetch } = useUserSession();
import { FetchError } from "ofetch";
const route = useRoute();

const { t } = useI18n();

const redirectTo =
  typeof route.query.redirect === "string" &&
  route.query.redirect.startsWith("/")
    ? route.query.redirect
    : "/";

const schema = z.object({
  name: z.string(),
  email: z.string().email(t("auth.validation.invalidEmail")),
  password: z.string().min(8, t("auth.validation.passwordMin")),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined,
  password: undefined,
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await $fetch("/auth/register", {
      method: "POST",
      body: {
        ...event.data,
        emailVisibility: true,
      },
    });
    fetch();
    navigateTo(redirectTo);
    toast.add({
      title: t("auth.toast.registerSuccess.title"),
      description: t("auth.toast.registerSuccess.description"),
      color: "success",
    });
  } catch (error) {
    if (error instanceof FetchError) {
      toast.add({
        title: t("auth.toast.errors.registerTitle"),
        description: error.data.message,
        color: "error",
      });
    } else {
      toast.add({
        title: t("auth.toast.errors.registerTitle"),
        description: t("auth.toast.errors.registerGeneric"),
        color: "error",
      });
    }
  }
}

watch(loggedIn, () => {
  if (loggedIn.value) navigateTo(redirectTo);
});
const { $pb } = useNuxtApp();
const router = useRouter();

const registerWithProvider = async (providerName: string) => {
  try {
    const authData = await $pb.collection("users").authWithOAuth2({
      provider: providerName,
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
      },
    });

    await fetch();
    router.push(redirectTo);
  } catch (err) {
    console.error("OAuth failed:", err);
  }
};
</script>

<template>
  <NuxtLayout>
    <UCard class="max-w-md m-auto my-10">
      <template #header>
        <h1 class="text-2xl text-center">{{ $t("auth.register.title") }}</h1>
      </template>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="$t('auth.fields.name')" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField :label="$t('auth.fields.email')" name="email">
          <UInput v-model="state.email" class="w-full" />
        </UFormField>

        <UFormField :label="$t('auth.fields.password')" name="password">
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>

        <UButton type="submit" block>
          {{ $t("auth.register.submitButton") }}
        </UButton>
      </UForm>
      <div class="text-center mt-4 text-sm text-gray-600">
        {{ $t("auth.register.hasAccount") }}
        <NuxtLink to="/login" class="text-primary hover:underline font-medium">
          {{ $t("auth.register.loginLink") }}
        </NuxtLink>
      </div>
      <UButton
        variant="outline"
        block
        class="mt-5"
        @click="registerWithProvider('google')"
      >
        <UIcon name="i-simple-icons-google" class="mr-2" />
        {{ $t("auth.oauth.google") }}
      </UButton>
      <UButton
        variant="outline"
        block
        class="mt-5"
        @click="registerWithProvider('github')"
      >
        <UIcon name="i-simple-icons-github" class="mr-2" />
        {{ $t("auth.oauth.github") }}
      </UButton>
      <UButton
        variant="outline"
        block
        class="mt-5"
        @click="registerWithProvider('microsoft')"
      >
        <UIcon name="i-simple-icons-microsoft" class="mr-2" />
        {{ $t("auth.oauth.microsoft") }}
      </UButton>
    </UCard>
  </NuxtLayout>
</template>
