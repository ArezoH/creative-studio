import PocketBase from "pocketbase";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user, token, providerMeta } = body;

  if (providerMeta?.accessToken) {
    try {
      const config = useRuntimeConfig();
      const pb = new PocketBase(config.pocketbaseUrl);

      let expiryDate: string;
      if (providerMeta.expiry) {
        const parsed = new Date(providerMeta.expiry);
        expiryDate = isNaN(parsed.getTime())
          ? new Date(Date.now() + 3600 * 1000).toISOString()
          : parsed.toISOString();
      } else {
        expiryDate = new Date(Date.now() + 3600 * 1000).toISOString();
      }

      try {
        const existing = await pb
          .collection("oauth_tokens")
          .getFirstListItem(`user="${user.id}" && provider="google"`);

        await pb.collection("oauth_tokens").update(existing.id, {
          access_token: providerMeta.accessToken,
          refresh_token: providerMeta.refreshToken || existing.refresh_token,
          expiry: expiryDate,
        });
      } catch {
        await pb.collection("oauth_tokens").create({
          user: user.id,
          provider: "google",
          access_token: providerMeta.accessToken,
          refresh_token: providerMeta.refreshToken || "",
          expiry: expiryDate,
        });
      }
    } catch (err) {
      console.error("Failed to store OAuth tokens:", err);
    }
  }
  await setUserSession(event, { user: user });
  return { success: true };
});
