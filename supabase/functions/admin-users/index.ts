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

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Unauthorized");

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!callerRole) throw new Error("Admin access required");

    const { action, ...payload } = await req.json();

    if (action === "create_user") {
      const { email, password, full_name, company } = payload;

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) throw createError;

      // Update profile with company
      if (company) {
        await supabaseAdmin
          .from("profiles")
          .update({ company, full_name })
          .eq("user_id", newUser.user.id);
      }

      // Assign client role
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: "client" });

      return new Response(JSON.stringify({ user: newUser.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "toggle_active") {
      const { user_id, is_active } = payload;
      await supabaseAdmin.from("profiles").update({ is_active }).eq("user_id", user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      const { user_id } = payload;
      await supabaseAdmin.auth.admin.deleteUser(user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_invite") {
      const { client_user_id, email, permission } = payload;
      if (!client_user_id || !email || !permission) throw new Error("Missing fields");

      // Check if invite already exists
      const { data: existing } = await supabaseAdmin
        .from("team_invites")
        .select("id")
        .eq("client_user_id", client_user_id)
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) throw new Error("Bu e-posta için zaten bekleyen bir davet var");

      const { data: invite, error: invErr } = await supabaseAdmin
        .from("team_invites")
        .insert({ client_user_id, email, permission })
        .select()
        .single();

      if (invErr) throw invErr;

      return new Response(JSON.stringify({ invite }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_team") {
      const { client_user_id } = payload;

      const [membersRes, invitesRes] = await Promise.all([
        supabaseAdmin
          .from("team_members")
          .select("*, profiles:member_user_id(full_name, email)")
          .eq("client_user_id", client_user_id),
        supabaseAdmin
          .from("team_invites")
          .select("*")
          .eq("client_user_id", client_user_id)
          .eq("status", "pending"),
      ]);

      return new Response(JSON.stringify({
        members: membersRes.data || [],
        invites: invitesRes.data || [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove_team_member") {
      const { member_id } = payload;
      await supabaseAdmin.from("team_members").delete().eq("id", member_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel_invite") {
      const { invite_id } = payload;
      await supabaseAdmin.from("team_invites").update({ status: "cancelled" }).eq("id", invite_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
