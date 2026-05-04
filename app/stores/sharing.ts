import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import { nanoid } from "nanoid";

export interface Collaborator {
  id: string;
  userId: string;
  userName?: string;
  userEmail: string;
  role: "owner" | "editor" | "viewer";
  grantedBy: string;
  grantedByName?: string;
  grantedAt: string;
  isCurrentUser: boolean;
  isExternal: boolean;
}

export interface ShareLinkInfo {
  id: string;
  token: string;
  role: "editor" | "viewer";
  expiresAt: string;
  createdAt: string;
  recipientEmail?: string;
  redeemedBy?: string;
  redeemedAt?: string;
  forRegisteredUser?: string;
}

export interface PendingShare {
  id: string;
  email: string;
  role: "editor" | "viewer";
  createdAt: string;
  linkToken?: string;
  isRegisteredUser: boolean;
}

const expirationToISO = (value: string) => {
  const now = new Date();
  const match = value.match(/^(\d+)([dh])$/);
  if (!match) throw new Error("Invalid expiration format");

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === "d") now.setDate(now.getDate() + amount);
  if (unit === "h") now.setHours(now.getHours() + amount);

  return now.toISOString();
};

export const useSharingStore = defineStore("sharing", () => {
  const { $pb } = useNuxtApp();
  const { user } = useAuth();

  const shareModalOpen = ref(false);
  const shareWidgetId = ref<string | null>(null);
  const shareWidgetName = ref<string>("");
  const shareWidgetOwner = ref<{
    id: string;
    name?: string;
    email: string;
  } | null>(null);
  const currentUserRole = ref<"owner" | "editor" | "viewer" | null>(null);

  // All collaborators
  const collaborators = ref<Collaborator[]>([]);
  const pendingShares = ref<PendingShare[]>([]);
  const isLoadingCollaborators = ref(false);

  // Sharing actions
  const isSharingWithUser = ref(false);
  const shareError = ref<string | null>(null);
  const shareSuccess = ref<string | null>(null);

  // Share links
  const shareLinks = ref<ShareLinkInfo[]>([]);
  const isLoadingLinks = ref(false);
  const isGeneratingLink = ref(false);
  const linkError = ref<string | null>(null);
  const linkSuccess = ref<string | null>(null);

  // Computed
  const isOwner = computed(() => currentUserRole.value === "owner");
  const canManagePermissions = computed(
    () => currentUserRole.value === "owner",
  );
  const canEdit = computed(
    () =>
      currentUserRole.value === "owner" || currentUserRole.value === "editor",
  );

  const allCollaborators = computed(() => {
    const registered = collaborators.value;

    const registeredEmails = new Set(
      registered.map((c) => c.userEmail?.toLowerCase()).filter(Boolean),
    );

    // external users
    const pending = pendingShares.value
      .filter((p) => !registeredEmails.has(p.email?.toLowerCase()))
      .map((p) => ({
        id: p.id,
        userId: "",
        userName: undefined,
        userEmail: p.email,
        role: p.role as "owner" | "editor" | "viewer",
        grantedBy: user.value?.id || "",
        grantedByName: user.value?.name,
        grantedAt: p.createdAt,
        isCurrentUser: false,
        isExternal: true,
      }));

    return [...registered, ...pending];
  });

  // helpers
  const fetchUserDetails = async (
    userId: string,
  ): Promise<{ id: string; name?: string; email: string } | null> => {
    try {
      const userRecord = await $pb.collection("users").getOne(userId);
      return {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
      };
    } catch (e) {
      console.error(`Failed to fetch user ${userId}:`, e);
      return null;
    }
  };

  // Modal
  const openShareModal = async (widgetId: string, widgetName: string) => {
    shareWidgetId.value = widgetId;
    shareWidgetName.value = widgetName;
    shareError.value = null;
    shareSuccess.value = null;
    linkError.value = null;
    linkSuccess.value = null;
    shareModalOpen.value = true;

    await loadWidgetInfo();
    await loadCollaborators();
    await loadPendingShares();
  };

  const closeShareModal = () => {
    shareModalOpen.value = false;
    shareWidgetId.value = null;
    shareWidgetName.value = "";
    shareWidgetOwner.value = null;
    currentUserRole.value = null;
    collaborators.value = [];
    pendingShares.value = [];
    shareLinks.value = [];
  };

  // Loading
  const loadWidgetInfo = async () => {
    if (!shareWidgetId.value || !user.value?.id) return;

    try {
      const widget = await $pb
        .collection("widgets")
        .getOne(shareWidgetId.value, {
          expand: "owner",
        });

      let ownerDetails = {
        id: widget.owner,
        name: widget.expand?.owner?.name,
        email: widget.expand?.owner?.email,
      };

      if (!ownerDetails.email) {
        const fetchedOwner = await fetchUserDetails(widget.owner);
        if (fetchedOwner) {
          ownerDetails = fetchedOwner;
        }
      }

      shareWidgetOwner.value = ownerDetails;

      if (widget.owner === user.value.id) {
        currentUserRole.value = "owner";
      } else {
        try {
          const perm = await $pb
            .collection("widget_permissions")
            .getFirstListItem(
              `widget="${shareWidgetId.value}" && user="${user.value.id}"`,
            );
          currentUserRole.value = perm.role;
        } catch {
          currentUserRole.value = null;
        }
      }
    } catch (e) {
      console.error("Failed to load widget info:", e);
    }
  };

  const loadCollaborators = async () => {
    if (!shareWidgetId.value) return;

    isLoadingCollaborators.value = true;

    try {
      const permissions = await $pb
        .collection("widget_permissions")
        .getFullList({
          filter: `widget="${shareWidgetId.value}"`,
          expand: "user,granted_by",
          sort: "created",
        });

      const processedCollaborators: Collaborator[] = [];

      for (const perm of permissions) {
        let userName = perm.expand?.user?.name;
        let userEmail = perm.expand?.user?.email;
        let grantedByName = perm.expand?.granted_by?.name;

        if (!userEmail && perm.user) {
          const fetchedUser = await fetchUserDetails(perm.user);
          if (fetchedUser) {
            userName = fetchedUser.name;
            userEmail = fetchedUser.email;
          }
        }

        if (perm.granted_by && !grantedByName) {
          const fetchedGranter = await fetchUserDetails(perm.granted_by);
          if (fetchedGranter) {
            grantedByName = fetchedGranter.name;
          }
        }

        const role = perm.role || "viewer";
        const userId = perm.user;

        if (!userId) {
          console.warn(
            `[Sharing] Permission ${perm.id} has no user ID, skipping`,
          );
          continue;
        }

        processedCollaborators.push({
          id: perm.id,
          userId: userId,
          userName: userName || undefined,
          userEmail: userEmail || "Unknown user",
          role: role as "owner" | "editor" | "viewer",
          grantedBy: perm.granted_by,
          grantedByName: grantedByName || undefined,
          grantedAt: perm.created,
          isCurrentUser: userId === user.value?.id,
          isExternal: false,
        });
      }
      collaborators.value = processedCollaborators;
    } catch (e) {
      console.error("Failed to load collaborators:", e);
      collaborators.value = [];
    } finally {
      isLoadingCollaborators.value = false;
    }
  };

  const loadPendingShares = async () => {
    if (!shareWidgetId.value) return;

    try {
      const links = await $pb.collection("widget_share_links").getFullList({
        filter: `widget="${shareWidgetId.value}"`,
        sort: "-created",
      });

      const now = new Date();
      const registeredEmails = new Set(
        collaborators.value
          .map((c) => c.userEmail?.toLowerCase())
          .filter(Boolean),
      );

      pendingShares.value = links
        .filter((l: any) => {
          const expireDate = l.expiresAt || l.expires_at;
          const isExpired = new Date(expireDate) < now;
          const isRedeemed = !!l.redeemed_by;
          const hasRecipient = !!l.recipient_email;
          const isForRegisteredUser = !!l.for_registered_user;
          const emailAlreadyHasAccess = registeredEmails.has(
            l.recipient_email?.toLowerCase(),
          );

          return (
            !isExpired &&
            !isRedeemed &&
            hasRecipient &&
            !isForRegisteredUser &&
            !emailAlreadyHasAccess
          );
        })
        .map((l: any) => ({
          id: l.id,
          email: l.recipient_email,
          role: l.role || "viewer",
          createdAt: l.created,
          linkToken: l.token,
          isRegisteredUser: false,
        }));

      shareLinks.value = links.map((l: any) => ({
        id: l.id,
        token: l.token,
        role: l.role || "viewer",
        expiresAt: l.expiresAt || l.expires_at,
        createdAt: l.created,
        recipientEmail: l.recipient_email,
        redeemedBy: l.redeemed_by,
        redeemedAt: l.redeemed_at,
        forRegisteredUser: l.for_registered_user,
      }));
    } catch (e) {
      console.error("Failed to load pending shares:", e);
      pendingShares.value = [];
      shareLinks.value = [];
    }
  };

  const shareWithEmail = async (
    email: string,
    role: "editor" | "viewer" = "viewer",
  ) => {
    if (!shareWidgetId.value || !user.value?.id) {
      return { success: false, error: "Not ready" };
    }

    if (!canManagePermissions.value) {
      return { success: false, error: "Only the owner can share" };
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: "Invalid email format" };
    }

    if (normalizedEmail === user.value.email?.toLowerCase()) {
      return { success: false, error: "Cannot share with yourself" };
    }

    const existingCollab = collaborators.value.find(
      (c) => c.userEmail?.toLowerCase() === normalizedEmail,
    );
    if (existingCollab) {
      return { success: false, error: "Already shared with this user" };
    }

    const existingPending = pendingShares.value.find(
      (p) => p.email.toLowerCase() === normalizedEmail,
    );
    if (existingPending) {
      return { success: false, error: "Invitation already sent to this email" };
    }

    isSharingWithUser.value = true;
    shareError.value = null;
    shareSuccess.value = null;

    try {
      let targetUser = null;
      try {
        targetUser = await $pb
          .collection("users")
          .getFirstListItem(`email="${normalizedEmail}"`);
      } catch {
        console.error("User doesn't exist");
      }

      // Generate token for both cases
      const token = nanoid(32);
      const expiresAt = expirationToISO("1d");

      if (targetUser) {
        await $pb.collection("widget_permissions").create({
          widget: shareWidgetId.value,
          user: targetUser.id,
          role: role, // Use the passed role parameter
          granted_by: user.value.id,
        });

        await $pb.collection("widget_share_links").create({
          widget: shareWidgetId.value,
          token,
          role: role,
          expiresAt: expiresAt,
          recipient_email: normalizedEmail,
          created_by: user.value.id,
          for_registered_user: targetUser.id,
        });

        try {
          const notificationStore = useNotificationStore();
          await notificationStore.notifyWidgetShared(
            targetUser.id,
            shareWidgetId.value,
            shareWidgetName.value,
            role,
            {
              id: user.value.id,
              name: user.value.name,
              email: user.value.email,
            },
            token,
          );
        } catch (notifError) {
          console.error("[Sharing] Failed to send notification:", notifError);
        }

        const roleLabel = role === "editor" ? "Editor" : "Viewer";
        shareSuccess.value = `Shared with ${
          targetUser.name || targetUser.email
        } as ${roleLabel}`;
        await loadCollaborators();
        await loadPendingShares();

        return {
          success: true,
          isRegistered: true,
          role: role,
          token,
          user: {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
          },
        };
      } else {
        await $pb.collection("widget_share_links").create({
          widget: shareWidgetId.value,
          token,
          role: role,
          expiresAt: expiresAt,
          recipient_email: normalizedEmail,
          created_by: user.value.id,
        });
        const roleLabel = role === "editor" ? "Editor" : "Viewer";
        shareSuccess.value = `Invitation sent to ${normalizedEmail} (${roleLabel} access)`;
        await loadPendingShares();

        return {
          success: true,
          isRegistered: false,
          role: role,
          email: normalizedEmail,
          token,
          shareLink: `${window.location.origin}/share/${token}`,
        };
      }
    } catch (e: any) {
      const errorMsg = e.message || "Failed to share widget";
      shareError.value = errorMsg;
      return { success: false, error: errorMsg };
    } finally {
      isSharingWithUser.value = false;
    }
  };

  const shareWithUser = async (
    email: string,
    role: "editor" | "viewer" = "viewer",
  ) => {
    return shareWithEmail(email, role);
  };
  const updateCollaboratorRole = async (
    permissionId: string,
    newRole: "editor" | "viewer",
  ) => {
    if (!canManagePermissions.value) {
      return { success: false, error: "Only the owner can manage permissions" };
    }

    const collab = collaborators.value.find((c) => c.id === permissionId);
    if (!collab) {
      return { success: false, error: "Collaborator not found" };
    }

    if (collab.role === "owner") {
      return { success: false, error: "Cannot change owner's role" };
    }

    try {
      await $pb.collection("widget_permissions").update(permissionId, {
        role: newRole,
      });
      try {
        const notificationStore = useNotificationStore();
        await notificationStore.notifyRoleChanged(
          collab.userId,
          shareWidgetId.value!,
          shareWidgetName.value,
          newRole,
          {
            id: user.value!.id,
            name: user.value!.name,
            email: user.value!.email,
          },
        );
      } catch (notifError) {
        console.error(
          "[Sharing] Failed to send role change notification:",
          notifError,
        );
      }

      collab.role = newRole;

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update role" };
    }
  };

  const removeCollaborator = async (permissionId: string) => {
    if (!canManagePermissions.value) {
      return { success: false, error: "Only the owner can manage permissions" };
    }

    const collab = collaborators.value.find((c) => c.id === permissionId);
    if (!collab) {
      return { success: false, error: "Collaborator not found" };
    }

    if (collab.role === "owner") {
      return { success: false, error: "Cannot remove the owner" };
    }

    const targetUserId = collab.userId;
    const targetEmail = collab.userEmail;
    const widgetId = shareWidgetId.value;
    const widgetName = shareWidgetName.value;

    try {
      await $pb.collection("widget_permissions").delete(permissionId);
      if (targetUserId || targetEmail) {
        try {
          const filterParts = [];
          if (widgetId) filterParts.push(`widget="${widgetId}"`);
          if (targetEmail) filterParts.push(`recipient_email="${targetEmail}"`);
          if (targetUserId)
            filterParts.push(`for_registered_user="${targetUserId}"`);

          if (filterParts.length > 1) {
            const links = await $pb
              .collection("widget_share_links")
              .getFullList({
                filter: `${filterParts[0]} && (${filterParts
                  .slice(1)
                  .join(" || ")})`,
              });

            for (const link of links) {
              await $pb.collection("widget_share_links").delete(link.id);
            }
          }
        } catch (e) {
          console.error("[Sharing] Error deleting share links:", e);
        }
      }

      if (targetUserId) {
        try {
          const notificationStore = useNotificationStore();
          await notificationStore.notifyAccessRemoved(
            targetUserId,
            widgetId!,
            widgetName,
            {
              id: user.value!.id,
              name: user.value!.name,
              email: user.value!.email,
            },
          );
        } catch (notifError) {
          console.error(
            "[Sharing] Failed to send access removed notification:",
            notifError,
          );
        }
      } else {
        console.warn(
          "[Sharing] No targetUserId found, cannot send notification",
        );
      }

      collaborators.value = collaborators.value.filter(
        (c) => c.id !== permissionId,
      );

      return { success: true };
    } catch (e: any) {
      console.error("[Sharing] Remove collaborator failed:", e);
      return {
        success: false,
        error: e.message || "Failed to remove collaborator",
      };
    }
  };

  const removePendingShare = async (shareId: string) => {
    if (!canManagePermissions.value) {
      return { success: false, error: "Only the owner can manage permissions" };
    }

    try {
      await $pb.collection("widget_share_links").delete(shareId);
      pendingShares.value = pendingShares.value.filter((p) => p.id !== shareId);
      shareLinks.value = shareLinks.value.filter((l) => l.id !== shareId);
      return { success: true };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || "Failed to revoke invitation",
      };
    }
  };

  const leaveWidget = async (dashboardWidgetId?: string) => {
    if (!shareWidgetId.value || !user.value?.id) {
      return { success: false, error: "Not ready" };
    }

    const myPermission = collaborators.value.find((c) => c.isCurrentUser);
    if (!myPermission && currentUserRole.value !== "owner") {
    }

    if (currentUserRole.value === "owner") {
      return {
        success: false,
        error: "Owner cannot leave. Transfer ownership or delete the widget.",
      };
    }

    try {
      const widgetId = shareWidgetId.value;
      const widgetName = shareWidgetName.value;
      let ownerId = shareWidgetOwner.value?.id;
      let ownerName = shareWidgetOwner.value?.name;
      try {
        const widget = await $pb.collection("widgets").getOne(widgetId, {
          expand: "owner",
        });
        ownerId = widget.owner;
        ownerName = widget.expand?.owner?.name || widget.expand?.owner?.email;
      } catch (e) {
        console.error("[Sharing] Failed to fetch widget owner:", e);
      }

      const leavingUserId = user.value.id;
      const leavingUserName = user.value.name || user.value.email;
      const leavingUserEmail = user.value.email;

      if (myPermission) {
        await $pb.collection("widget_permissions").delete(myPermission.id);
      } else {
        try {
          const perm = await $pb
            .collection("widget_permissions")
            .getFirstListItem(
              `widget="${widgetId}" && user="${leavingUserId}"`,
            );
          await $pb.collection("widget_permissions").delete(perm.id);
        } catch {
          console.error("[Sharing] No permission record found to delete");
        }
      }
      try {
        const userLinks = await $pb
          .collection("widget_share_links")
          .getFullList({
            filter: `widget="${widgetId}" && (recipient_email="${leavingUserEmail}" || for_registered_user="${leavingUserId}" || redeemed_by="${leavingUserId}")`,
          });

        for (const link of userLinks) {
          await $pb.collection("widget_share_links").delete(link.id);
        }
      } catch (e) {
        console.error("[Sharing] Error deleting share links:", e);
      }

      try {
        const dashboardWidgets = await $pb
          .collection("dashboard_widgets")
          .getFullList({
            filter: `widget="${widgetId}"`,
            expand: "dashboard",
          });
        for (const dw of dashboardWidgets) {
          if (dw.expand?.dashboard?.owner === leavingUserId) {
            await $pb.collection("dashboard_widgets").delete(dw.id);
          }
        }
      } catch (e) {
        console.error("[Sharing] Error deleting dashboard widgets:", e);
      }

      if (ownerId && ownerId !== leavingUserId) {
        try {
          const notificationRecord = await $pb
            .collection("notifications")
            .create({
              user: ownerId,
              type: "collaborator_left",
              title: "Collaborator Left",
              message: `${leavingUserName} removed "${widgetName}" from their dashboard`,
              widget: widgetId,
              widget_name: widgetName,
              from_user: leavingUserId,
              from_user_name: leavingUserName,
              read: false,
            });
        } catch (notifError) {
          console.error("[Sharing] Failed to notify owner:", notifError);
          // Log more details about the error
          if (notifError instanceof Error) {
            console.error("[Sharing] Error details:", notifError.message);
          }
        }
      }

      return { success: true };
    } catch (e: any) {
      console.error("[Sharing] Leave widget failed:", e);
      return { success: false, error: e.message || "Failed to leave widget" };
    }
  };

  const generateShareLink = async (
    role: "editor" | "viewer" = "viewer",
    recipientEmail?: string,
  ) => {
    if (
      !shareWidgetId.value ||
      !user.value?.id ||
      !canManagePermissions.value
    ) {
      return { success: false, error: "Not authorized" };
    }

    isGeneratingLink.value = true;
    linkError.value = null;
    linkSuccess.value = null;

    try {
      const token = nanoid(32);

      await $pb.collection("widget_share_links").create({
        widget: shareWidgetId.value,
        token,
        role: role,
        expiresAt: expirationToISO("7d"),
        recipient_email: recipientEmail?.trim().toLowerCase() || null,
        created_by: user.value.id,
      });

      await loadPendingShares();

      const link = `${window.location.origin}/share/${token}`;
      linkSuccess.value = recipientEmail
        ? `Link created for ${recipientEmail}`
        : "Link generated successfully";

      return { success: true, link, token };
    } catch (e: any) {
      const errorMsg = e.message || "Failed to generate link";
      linkError.value = errorMsg;
      return { success: false, error: errorMsg };
    } finally {
      isGeneratingLink.value = false;
    }
  };

  const revokeShareLink = async (linkId: string) => {
    try {
      await $pb.collection("widget_share_links").delete(linkId);
      shareLinks.value = shareLinks.value.filter((l) => l.id !== linkId);
      pendingShares.value = pendingShares.value.filter((p) => p.id !== linkId);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const copyLinkToClipboard = async (token: string) => {
    const link = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      return { success: true, link };
    } catch {
      return { success: false };
    }
  };

  // Helpers
  const formatExpiration = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 30) return date.toLocaleDateString();
    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return "< 1h left";
  };

  const isLinkExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "primary";
      case "editor":
        return "success";
      case "viewer":
        return "neutral";
      default:
        return "neutral";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return "i-heroicons-key";
      case "editor":
        return "i-heroicons-pencil-square";
      case "viewer":
        return "i-heroicons-eye";
      default:
        return "i-heroicons-user";
    }
  };

  const clearMessages = () => {
    shareError.value = null;
    shareSuccess.value = null;
    linkError.value = null;
    linkSuccess.value = null;
  };

  return {
    // Modal state
    shareModalOpen: readonly(shareModalOpen),
    shareWidgetId: readonly(shareWidgetId),
    shareWidgetName: readonly(shareWidgetName),
    shareWidgetOwner: readonly(shareWidgetOwner),
    currentUserRole: readonly(currentUserRole),

    // Computed
    isOwner,
    canManagePermissions,
    canEdit,

    // Collaborators
    collaborators: readonly(collaborators),
    pendingShares: readonly(pendingShares),
    allCollaborators,
    isLoadingCollaborators: readonly(isLoadingCollaborators),
    isSharingWithUser: readonly(isSharingWithUser),
    shareError,
    shareSuccess,

    // Links
    shareLinks: readonly(shareLinks),
    isLoadingLinks: readonly(isLoadingLinks),
    isGeneratingLink: readonly(isGeneratingLink),
    linkError,
    linkSuccess,

    // Actions
    openShareModal,
    closeShareModal,
    loadCollaborators,
    loadPendingShares,
    shareWithEmail,
    shareWithUser,
    updateCollaboratorRole,
    removeCollaborator,
    removePendingShare,
    leaveWidget,
    generateShareLink,
    revokeShareLink,
    copyLinkToClipboard,
    clearMessages,

    // Helpers
    formatExpiration,
    isLinkExpired,
    getRoleColor,
    getRoleIcon,
  };
});
