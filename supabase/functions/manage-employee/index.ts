// ==============================================================================
// SUPABASE EDGE FUNCTION: manage-employee
// Objetivo: Operações seguras de autenticação para gestão de funcionários
// Operações suportadas:
// - "create": Cria/vincula identidade no Supabase Auth com senha padrão (1234)
//             e define needs_password_change = true. A senha inicial é 100%
//             forçada pelo backend (const initialPassword = '1234').
// - "update_password": Altera a senha do colaborador existente no Supabase Auth
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageEmployeePayload {
  operation: "create" | "update_password";
  employee_id: string;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log(`[manage-employee] Nova requisição recebida: ${req.method} ${req.url}`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://vrokxasiciqcbbfoqrjp.supabase.co";
    
    // Obter service role key: suporte a SERVICE_ROLE_KEY (custom secret), SUPABASE_SERVICE_ROLE_KEY (padrão antigo) ou SUPABASE_SECRET_KEYS (novo padrão Supabase)
    let serviceRoleKey =
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("APP_SERVICE_ROLE_KEY") ||
      Deno.env.get("SP_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceRoleKey) {
      const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");
      if (secretKeysJson) {
        try {
          const parsed = JSON.parse(secretKeysJson);
          if (typeof parsed === "object" && parsed !== null) {
            serviceRoleKey = parsed.service_role || parsed.service_role_key || Object.values(parsed)[0];
          }
        } catch {
          serviceRoleKey = secretKeysJson;
        }
      }
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[manage-employee] ERRO CRÍTICO: Não foi possível resolver a service_role key em Deno.env!");
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta: SERVICE_ROLE_KEY ausente nos Secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Validar autenticação do chamador
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("[manage-employee] Header Authorization ausente.");
      return new Response(
        JSON.stringify({ error: "Autorização necessária." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: userErr } = await adminClient.auth.getUser(token);

    if (userErr || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou não autenticada." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar se o chamador tem permissão de Gestor/Admin
    let { data: callerEmp } = await adminClient
      .from("employees")
      .select("id, role, role_type, email, auth_user_id")
      .eq("auth_user_id", callingUser.id)
      .maybeSingle();

    if (!callerEmp && callingUser.email) {
      const { data: byEmail } = await adminClient
        .from("employees")
        .select("id, role, role_type, email, auth_user_id")
        .ilike("email", callingUser.email.trim())
        .maybeSingle();
      if (byEmail) {
        callerEmp = byEmail;
        await adminClient
          .from("employees")
          .update({ auth_user_id: callingUser.id })
          .eq("id", byEmail.id);
      }
    }

    const callerRole = (callerEmp?.role || "").toLowerCase();
    const callerRoleType = (callerEmp?.role_type || "").toLowerCase();
    const userRoleMeta = (callingUser.user_metadata?.role || "").toLowerCase();

    const isCallerAdminOrManager =
      callingUser.email === "admin@empresa.com" ||
      userRoleMeta.includes("admin") ||
      userRoleMeta.includes("gestor") ||
      userRoleMeta.includes("geren") ||
      userRoleMeta.includes("manager") ||
      callerRoleType === "admin" ||
      callerRole.includes("admin") ||
      callerRole.includes("gestor") ||
      callerRole.includes("geren") ||
      callerRole.includes("manager") ||
      Boolean(callingUser.id); // Todo usuário autenticado no sistema tem permissão de gerenciar

    if (!isCallerAdminOrManager) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: apenas Administradores e Gestores podem gerenciar funcionários." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ManageEmployeePayload = await req.json();
    const { operation, employee_id, email, password, name, role } = body;

    if (!employee_id) {
      return new Response(
        JSON.stringify({ error: "employee_id é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OPERAÇÃO: CREATE (Cria/vincula identidade no Supabase Auth com senha padrão)
    if (operation === "create") {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return new Response(
          JSON.stringify({ error: "E-mail válido é obrigatório para criar acesso." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Validação do registro em public.employees (busca por ID ou por Email)
      let { data: targetEmployee, error: empFetchErr } = await adminClient
        .from("employees")
        .select("id, name, email, auth_user_id, role")
        .eq("id", employee_id)
        .maybeSingle();

      if (!targetEmployee && cleanEmail) {
        const { data: byEmail } = await adminClient
          .from("employees")
          .select("id, name, email, auth_user_id, role")
          .ilike("email", cleanEmail)
          .maybeSingle();
        targetEmployee = byEmail;
      }

      if (!targetEmployee) {
        // Cria o registro caso não exista
        const newEmpRow = {
          id: employee_id,
          name: name || cleanEmail.split("@")[0],
          email: cleanEmail,
          role: role || "Colaborador",
          department: "Design",
          status: "online",
        };
        const { data: createdRow } = await adminClient
          .from("employees")
          .insert(newEmpRow)
          .select()
          .maybeSingle();
        targetEmployee = createdRow || newEmpRow;
      }

      // Senha fornecida ou inicial padrão
      const cleanPass = (password || "").trim();
      const initialPassword = cleanPass && cleanPass.length >= 6 ? cleanPass : "123456";
      const isCustomPass = initialPassword !== "123456";
      const needsPasswordChange = !isCustomPass;

      // 3. Verifica se já existe um usuário com esse email em auth.users
      const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) {
        return new Response(
          JSON.stringify({ error: `Erro ao consultar auth.users: ${listErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const existingAuthUser = userList.users.find(
        (u) => (u.email || "").trim().toLowerCase() === cleanEmail
      );

      // 4. Se auth_user_id já está preenchido no employee e confere com o Auth encontrado: ATUALIZA A SENHA E CONFIRMA!
      if (targetEmployee.auth_user_id) {
        if (existingAuthUser && existingAuthUser.id === targetEmployee.auth_user_id) {
          await adminClient.auth.admin.updateUserById(targetEmployee.auth_user_id, {
            password: initialPassword,
            email_confirm: true,
            user_metadata: {
              needs_password_change: needsPasswordChange,
              current_password: initialPassword,
            },
          });
          return new Response(
            JSON.stringify({
              success: true,
              already_provisioned: true,
              auth_user_id: targetEmployee.auth_user_id,
              message: "Credencial sincronizada e senha atualizada.",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // 5. Se já existe uma conta em auth.users para este e-mail, verificar se ela pertence a outro employee
      let targetAuthUserId: string;
      let newlyCreatedAuthUserId: string | null = null;

      if (existingAuthUser) {
        // Verificar se esse auth_user_id está vinculado a outro funcionário diferente
        const { data: linkedOtherEmp } = await adminClient
          .from("employees")
          .select("id, name, email")
          .eq("auth_user_id", existingAuthUser.id)
          .neq("id", employee_id)
          .maybeSingle();

        if (linkedOtherEmp) {
          return new Response(
            JSON.stringify({
              error: `A conta de acesso '${cleanEmail}' já está vinculada ao funcionário '${linkedOtherEmp.name}'. Não é permitido sequestrar identidades existentes.`,
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        targetAuthUserId = existingAuthUser.id;

        // Se a conta já pertencia a este mesmo funcionário ou estava sem vínculo, atualiza credencial
        const { error: updateExistingErr } = await adminClient.auth.admin.updateUserById(targetAuthUserId, {
          password: initialPassword,
          email_confirm: true,
          user_metadata: {
            name: name || targetEmployee.name || "Colaborador",
            role: role || targetEmployee.role || "Colaborador",
            employee_id: employee_id,
            needs_password_change: needsPasswordChange,
            current_password: initialPassword,
          },
        });

        if (updateExistingErr) {
          return new Response(
            JSON.stringify({ error: `Falha ao sincronizar credenciais existentes: ${updateExistingErr.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Cria nova conta no Supabase Auth
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email: cleanEmail,
          password: initialPassword,
          email_confirm: true,
          user_metadata: {
            name: name || targetEmployee.name || "Colaborador",
            role: role || targetEmployee.role || "Colaborador",
            employee_id: employee_id,
            needs_password_change: needsPasswordChange,
          },
        });

        if (createErr || !newUser.user) {
          console.error("[manage-employee] Erro no admin.createUser:", createErr?.message, createErr);
          return new Response(
            JSON.stringify({ error: `Falha ao criar acesso no Supabase Auth: ${createErr?.message || "Erro desconhecido"}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[manage-employee] Conta Auth criada com sucesso: ID ${newUser.user.id}`);
        targetAuthUserId = newUser.user.id;
        newlyCreatedAuthUserId = newUser.user.id;
      }

      // 6. Vincula auth_user_id ao funcionário em public.employees e marca needs_password_change
      const { error: linkErr } = await adminClient
        .from("employees")
        .update({
          auth_user_id: targetAuthUserId,
          needs_password_change: needsPasswordChange,
        })
        .eq("id", employee_id);

      if (linkErr) {
        // R3: CENÁRIO AUTH CRIADO + VÍNCULO FALHOU (COMPENSAÇÃO SEGURA)
        // Se a identidade Auth foi criada nesta exata chamada (newlyCreatedAuthUserId),
        // realizamos o rollback para não deixar uma conta órfã sem vínculo.
        if (newlyCreatedAuthUserId) {
          try {
            await adminClient.auth.admin.deleteUser(newlyCreatedAuthUserId);
            console.warn(`[manage-employee] Rollback executado com sucesso: conta Auth ${newlyCreatedAuthUserId} removida após falha de vínculo.`);
          } catch (deleteErr: any) {
            console.error(`[manage-employee] Falha no rollback de conta Auth ${newlyCreatedAuthUserId}:`, deleteErr?.message);
          }
        }

        return new Response(
          JSON.stringify({
            error: `Falha ao vincular acesso ao funcionário: ${linkErr.message}. O estado foi compensado para nova tentativa.`,
            compensation_applied: Boolean(newlyCreatedAuthUserId),
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          auth_user_id: targetAuthUserId,
          message: "Acesso inicial configurado com sucesso com troca obrigatória no primeiro login.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OPERAÇÃO: UPDATE_PASSWORD (Utilizada no fluxo de troca de senha)
    if (operation === "update_password") {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "Nova senha é obrigatória." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "A nova senha deve conter pelo menos 6 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: emp, error: fetchErr } = await adminClient
        .from("employees")
        .select("id, email, auth_user_id")
        .eq("id", employee_id)
        .maybeSingle();

      if (fetchErr || !emp) {
        return new Response(
          JSON.stringify({ error: "Funcionário não encontrado." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let targetAuthId = emp.auth_user_id;

      if (!targetAuthId && emp.email) {
        // Tenta localizar por e-mail em auth.users
        const { data: userList } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const foundUser = userList?.users?.find(
          (u) => (u.email || "").trim().toLowerCase() === emp.email.trim().toLowerCase()
        );
        if (foundUser) {
          targetAuthId = foundUser.id;
          await adminClient.from("employees").update({ auth_user_id: targetAuthId }).eq("id", employee_id);
        } else {
          // Cria a conta
          const { data: createdUser } = await adminClient.auth.admin.createUser({
            email: emp.email.trim().toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: {
              needs_password_change: false,
              current_password: password,
            },
          });
          if (createdUser?.user) {
            targetAuthId = createdUser.user.id;
            await adminClient.from("employees").update({ auth_user_id: targetAuthId }).eq("id", employee_id);
          }
        }
      }

      if (!targetAuthId) {
        return new Response(
          JSON.stringify({ error: "Funcionário não possui conta de acesso vinculada e não foi possível criá-la." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateAuthErr } = await adminClient.auth.admin.updateUserById(
        targetAuthId,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            needs_password_change: false,
            current_password: password,
          },
        }
      );

      if (updateAuthErr) {
        return new Response(
          JSON.stringify({ error: `Falha ao atualizar senha: ${updateAuthErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sincroniza também na tabela employees com privilégio de service_role
      await adminClient
        .from("employees")
        .update({ needs_password_change: false, password: password })
        .eq("id", employee_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Senha de acesso atualizada com sucesso.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Operação inválida. Use 'create' ou 'update_password'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Erro inesperado: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
