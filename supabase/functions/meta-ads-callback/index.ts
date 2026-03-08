import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const error = url.searchParams.get("error");

    if (error) {
      return new Response(redirectHtml("/integrations?error=meta_access_denied"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!code || !state) {
      return new Response(redirectHtml("/integrations?error=missing_params"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    const appId = Deno.env.get("META_ADS_APP_ID")!;
    const appSecret = Deno.env.get("META_ADS_APP_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-ads-callback`;

    // Exchange code for short-lived token
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Meta token exchange failed:", tokenData);
      return new Response(redirectHtml("/integrations?error=meta_token_failed"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Exchange short-lived token for long-lived token
    const longTokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", appId);
    longTokenUrl.searchParams.set("client_secret", appSecret);
    longTokenUrl.searchParams.set("fb_exchange_token", tokenData.access_token);

    const longTokenRes = await fetch(longTokenUrl.toString());
    const longTokenData = await longTokenRes.json();

    const finalToken = longTokenData.access_token || tokenData.access_token;
    const expiresIn = longTokenData.expires_in || tokenData.expires_in || 5184000; // ~60 days default

    // Get ad account info
    let accountName = null;
    let accountId = null;
    try {
      const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=name&access_token=${finalToken}`);
      const meData = await meRes.json();
      accountName = meData.name || null;

      const adAccountRes = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=name,account_id&limit=1&access_token=${finalToken}`);
      const adAccountData = await adAccountRes.json();
      if (adAccountData.data?.[0]) {
        accountId = adAccountData.data[0].account_id;
        accountName = adAccountData.data[0].name || accountName;
      }
    } catch (e) {
      console.error("Failed to fetch Meta account info:", e);
    }

    // Store in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: dbError } = await supabase.from("ad_platform_connections").upsert({
      user_id: state,
      platform: "meta_ads",
      access_token: finalToken,
      refresh_token: null,
      token_expires_at: expiresAt,
      account_id: accountId,
      account_name: accountName,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform" });

    if (dbError) {
      console.error("DB save error:", dbError);
      return new Response(redirectHtml("/integrations?error=save_failed"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(redirectHtml("/integrations?success=meta_ads"), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error("Meta callback error:", err);
    return new Response(redirectHtml("/integrations?error=unknown"), {
      headers: { "Content-Type": "text/html" },
    });
  }
});

function redirectHtml(path: string) {
  const appUrl = Deno.env.get("SITE_URL") || "https://id-preview--69578342-0205-434b-b7ed-d91d0cee920f.lovable.app";
  return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${appUrl}${path}"></head><body>Yönlendiriliyor...</body></html>`;
}
