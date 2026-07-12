import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BLOG_USER_ROLES, type BlogUserRole } from "@shared/schema";

const AVATAR_FILE_MAX_BYTES = 200_000;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [stagedAvatarDataUrl, setStagedAvatarDataUrl] = useState<string | null>(
    null,
  );
  const [role, setRole] = useState<BlogUserRole>("admin");

  useEffect(() => {
    const r = user?.role;
    if (r === "admin" || r === "editor" || r === "writer") {
      setRole(r);
    }
  }, [user?.role]);

  const profileMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      await apiRequest("PATCH", "/api/auth/profile", body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Saved", description: "Your profile was updated." });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length > 0 && newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    profileMutation.mutate({
      currentPassword,
      newPassword: newPassword || undefined,
    });
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
  }

  function handleAvatarSave() {
    if (stagedAvatarDataUrl === null) {
      toast({
        title: "No image selected",
        description: "Choose a file under the size limit, then click Save.",
        variant: "destructive",
      });
      return;
    }
    profileMutation.mutate(
      { avatarUrl: stagedAvatarDataUrl },
      {
        onSuccess: () => {
          setStagedAvatarDataUrl(null);
        },
      },
    );
  }

  function handleAvatarFile(file: File | null) {
    if (!file) {
      return;
    }
    if (file.size > AVATAR_FILE_MAX_BYTES) {
      toast({
        title: "File too large",
        description: `Use an image under ${Math.round(AVATAR_FILE_MAX_BYTES / 1024)} KB.`,
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result.length > 120_000) {
        toast({
          title: "Image too large",
          description: "Try a smaller image.",
          variant: "destructive",
        });
        return;
      }
      setStagedAvatarDataUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    profileMutation.mutate(
      { avatarUrl: "" },
      {
        onSuccess: () => {
          setStagedAvatarDataUrl(null);
        },
      },
    );
  }

  function handleRole(e: React.FormEvent) {
    e.preventDefault();
    profileMutation.mutate({
      currentPassword,
      role,
    });
    setCurrentPassword("");
  }

  const isAdmin = user?.role === "admin";
  const busy = profileMutation.isPending;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <p className="text-gray-600">Password, profile picture, and role</p>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Signed in as <span className="font-medium">{user?.username}</span>
                {user?.role ? (
                  <Badge variant="secondary" className="ml-2">
                    {user.role}
                  </Badge>
                ) : null}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Use this form only when you want a new password. Profile picture can be
                updated below without your account password. Changing role requires your
                current password in the role section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pw-current">Current password</Label>
                  <Input
                    id="pw-current"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={busy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-new">New password (min 8 characters)</Label>
                  <Input
                    id="pw-new"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw-confirm">Confirm new password</Label>
                  <Input
                    id="pw-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <Button type="submit" disabled={busy || !newPassword}>
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile picture</CardTitle>
              <CardDescription>
                Upload a small image (max{" "}
                {Math.round(AVATAR_FILE_MAX_BYTES / 1024)} KB), then click Save. Use
                Remove picture to clear your avatar. No password required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-file">Upload image</Label>
                <Input
                  id="avatar-file"
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (f) {
                      handleAvatarFile(f);
                    }
                  }}
                />
                {stagedAvatarDataUrl ? (
                  <p className="text-sm text-muted-foreground">
                    New picture selected — click Save to apply.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleAvatarSave}
                  disabled={busy || stagedAvatarDataUrl === null}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={busy || !user?.avatarUrl}
                >
                  Remove picture
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blog role</CardTitle>
              <CardDescription>
                <strong>Admin</strong>: full access. <strong>Editor</strong>: create,
                edit, publish, delete. <strong>Writer</strong>: drafts only; cannot
                publish or delete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <form onSubmit={handleRole} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={role}
                      onValueChange={(v) => setRole(v as BlogUserRole)}
                      disabled={busy}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOG_USER_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-current">Current password</Label>
                    <Input
                      id="role-current"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={busy}
                    />
                  </div>
                  <Button type="submit" disabled={busy || role === user?.role}>
                    Update role
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Only administrators can change roles. Yours is{" "}
                  <Badge variant="outline">{user?.role}</Badge>.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
