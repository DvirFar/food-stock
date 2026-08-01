import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthClientInfo = { name?: string | null };
type AuthorizationDetails = {
  client?: AuthClientInfo | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

const OAuthConsent = () => {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("חסר מזהה בקשת הרשאה");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error: decideError } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("שרת ההרשאות לא החזיר כתובת חזרה");
      return;
    }
    window.location.href = target;
  };

  const clientName = details?.client?.name ?? "האפליקציה";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">חיבור אפליקציה לחשבון שלך</CardTitle>
          <CardDescription>
            {error ? "לא ניתן לטעון את בקשת ההרשאה" : details ? `${clientName} מבקשת גישה לנתונים שלך` : "טוען..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!error && details && (
            <>
              <p className="text-sm text-muted-foreground">
                אישור יאפשר ל{clientName} לקרוא ולעדכן את המלאי, רשימת הקניות, המתכונים והאירועים שלך בשמך.
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                  אישור
                </Button>
                <Button className="flex-1" variant="outline" disabled={busy} onClick={() => decide(false)}>
                  דחייה
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthConsent;
