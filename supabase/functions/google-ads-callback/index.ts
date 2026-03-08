import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const error = url.searchParams.get("error");

    if (error) {
      return new Response(redirectHtml("/integrations?error=access_denied"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!code || !state) {
      return new Response(redirectHtml("/integrations?error=missing_params"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Exchange code for tokens
    const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-ads-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return new Response(redirectHtml("/integrations?error=token_exchange_failed"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Store tokens in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    const { error: dbError } = await supabase.from("ad_platform_connections").upsert({
      user_id: state,
      platform: "google_ads",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: expiresAt,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform" });

    if (dbError) {
      console.error("DB save error:", dbError);
      return new Response(redirectHtml("/integrations?error=save_failed"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(redirectHtml("/integrations?success=google_ads"), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response(redirectHtml("/integrations?error=unknown"), {
      headers: { "Content-Type": "text/html" },
    });
  }
});

function redirectHtml(path: string) {
  // Redirect to the app's frontend
  const appUrl = Deno.env.get("SITE_URL") || "https://id-preview--69578342-0205-434b-b7ed-d91d0cee920f.lovable.app";
  return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${appUrl}${path}"></head><body>Yönlendiriliyor...</body></html>`;
}
