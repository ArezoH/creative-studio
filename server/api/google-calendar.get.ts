import PocketBase from "pocketbase";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const userId = session.user?.id;
  const config = useRuntimeConfig();
  const pb = new PocketBase(config.pocketbaseUrl);

  let tokenRecord;
  try {
    tokenRecord = await pb
      .collection("oauth_tokens")
      .getFirstListItem(`user="${userId}" && provider="google"`);
  } catch {
    throw createError({
      statusCode: 404,
      statusMessage:
        "No Google account linked. Please login with Google first.",
    });
  }

  let accessToken = tokenRecord.access_token;

  const isExpired =
    tokenRecord.expiry && new Date(tokenRecord.expiry).getTime() < Date.now();

  if (isExpired && tokenRecord.refresh_token) {
    try {
      accessToken = await refreshGoogleToken(
        tokenRecord.refresh_token,
        tokenRecord.id,
        pb,
        config,
      );
      console.log(" Token refreshed successfully");
    } catch (err) {
      console.error("Token refresh failed, trying existing token:", err);
    }
  }

  const query = getQuery(event);
  const timeMin = (query.timeMin as string) || new Date().toISOString();
  const timeMax =
    (query.timeMax as string) ||
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const maxResults = (query.maxResults as string) || "50";

  try {
    const response = await $fetch<GoogleCalendarResponse>(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        query: {
          timeMin,
          timeMax,
          maxResults,
          singleEvents: "true",
          orderBy: "startTime",
        },
      },
    );

    const events = (response.items || []).map((item: any) => ({
      id: item.id,
      title: item.summary || "Untitled Event",
      description: item.description || "",
      date: item.start?.date || item.start?.dateTime?.split("T")[0] || "",
      startTime: item.start?.dateTime || null,
      endTime: item.end?.dateTime || null,
      isAllDay: !!item.start?.date,
      location: item.location || "",
      status: item.status,
      htmlLink: item.htmlLink,
      source: "google",
    }));

    return {
      success: true,
      events,
      syncedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("Google Calendar API error:", err);

    if (
      (err?.status === 401 || err?.statusCode === 401) &&
      tokenRecord.refresh_token
    ) {
      try {
        console.log("🔄 Token rejected by Google, attempting refresh...");
        accessToken = await refreshGoogleToken(
          tokenRecord.refresh_token,
          tokenRecord.id,
          pb,
          config,
        );

        const retryResponse = await $fetch<GoogleCalendarResponse>(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            query: {
              timeMin,
              timeMax,
              maxResults,
              singleEvents: "true",
              orderBy: "startTime",
            },
          },
        );

        const events = (retryResponse.items || []).map((item: any) => ({
          id: item.id,
          title: item.summary || "Untitled Event",
          description: item.description || "",
          date: item.start?.date || item.start?.dateTime?.split("T")[0] || "",
          startTime: item.start?.dateTime || null,
          endTime: item.end?.dateTime || null,
          isAllDay: !!item.start?.date,
          location: item.location || "",
          status: item.status,
          htmlLink: item.htmlLink,
          source: "google",
        }));

        return {
          success: true,
          events,
          syncedAt: new Date().toISOString(),
        };
      } catch (retryErr) {
        console.error(" Retry after refresh also failed:", retryErr);
      }
    }

    throw createError({
      statusCode: 401,
      statusMessage: "Google token expired. Please re-login with Google.",
    });
  }
});

async function refreshGoogleToken(
  refreshToken: string,
  recordId: string,
  pb: PocketBase,
  config: any,
): Promise<string> {
  const response = await $fetch<any>("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: {
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    },
  });

  const newAccessToken = response.access_token;
  const expiresIn = response.expires_in;

  await pb.collection("oauth_tokens").update(recordId, {
    access_token: newAccessToken,
    expiry: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });

  return newAccessToken;
}

interface GoogleCalendarResponse {
  items: any[];
  nextPageToken?: string;
}
