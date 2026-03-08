import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { token, full_name, password } = await req.json();

    if (!token || !full_name || !password) {
      throw new Error("Token, ad soyad ve şifre gerekli");
    }

    if (password.length < 6) {
      throw new Error("Şifre en az 6 karakter olmalı");
    }

    // Find the invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("team_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .maybeSingle();

    if (inviteError || !invite) {
      throw new Error("Geçersiz veya süresi dolmuş davet linki");
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      await supabaseAdmin.from("team_invites").update({ status: "expired" }).eq("id", invite.id);
      throw new Error("Davet linkinin süresi dolmuş");
    }

    // Create user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      if (createError.message.includes("already been registered")) {
        throw new Error("Bu e-posta adresi zaten kayıtlı");
      }
      throw createError;
    }

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ full_name })
      .eq("user_id", newUser.user.id);

    // Assign client role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "client" });

    // Create team membership
    await supabaseAdmin
      .from("team_members")
      .insert({
        client_user_id: invite.client_user_id,
        member_user_id: newUser.user.id,
        permission: invite.permission,
      });

    // Mark invite as accepted
    await supabaseAdmin
      .from("team_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    return new Response(JSON.stringify({ success: true, email: invite.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
