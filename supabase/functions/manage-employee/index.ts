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
    const { data: callerEmp } = await adminClient
      .from("employees")
      .select("id, role, role_type")
      .eq("auth_user_id", callingUser.id)
      .maybeSingle();

    const isCallerAdminOrManager =
      callingUser.email === "admin@empresa.com" ||
      callerEmp?.role_type === "admin" ||
      callerEmp?.role?.toLowerCase()?.includes("admin") ||
      callerEmp?.role?.toLowerCase()?.includes("gestor") ||
      callerEmp?.role?.toLowerCase()?.includes("geren") ||
      callerEmp?.role?.toLowerCase()?.includes("manager");

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

    // OPERAÇÃO: CREATE (Cria/vincula identidade no Supabase Auth com senha padrão estrita 1234)
    if (operation === "create") {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return new Response(
          JSON.stringify({ error: "E-mail válido é obrigatório para criar acesso." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Validação do registro em public.employees (deve existir previamente)
      const { data: targetEmployee, error: empFetchErr } = await adminClient
        .from("employees")
        .select("id, name, email, auth_user_id, role")
        .eq("id", employee_id)
        .maybeSingle();

      if (empFetchErr) {
        return new Response(
          JSON.stringify({ error: `Erro ao consultar funcionário: ${empFetchErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!targetEmployee) {
        return new Response(
          JSON.stringify({ error: "Funcionário não encontrado em public.employees." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Verificar se outro funcionário já utiliza este e-mail em public.employees
      const { data: otherEmpWithEmail, error: otherEmpErr } = await adminClient
        .from("employees")
        .select("id, name, email")
        .ilike("email", cleanEmail)
        .neq("id", employee_id)
        .maybeSingle();

      if (!otherEmpErr && otherEmpWithEmail) {
        return new Response(
          JSON.stringify({
            error: `O e-mail '${cleanEmail}' já pertence a outro funcionário cadastrado (${otherEmpWithEmail.name}). Operação bloqueada.`,
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // R2 CORRIGIDO: A senha inicial é 100% determinada pelo backend (mínimo 6 caracteres exigidos pelo Supabase Auth).
      const initialPassword = "123456";

      // 3. Verifica se já existe um usuário com esse email em auth.users
      const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) {
        return new Response(
          JSON.stringify({ error: `Erro ao consultar auth.users: ${listErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const existingAuthUser = userList.users.find(
        (u) => (u.email || "").trim().toLowerCase() === cleanEmail
      );

      // 4. Se auth_user_id já está preenchido no employee e confere com o Auth encontrado: IDEMPOTÊNCIA TOTAL
      if (targetEmployee.auth_user_id) {
        if (existingAuthUser && existingAuthUser.id === targetEmployee.auth_user_id) {
          return new Response(
            JSON.stringify({
              success: true,
              already_provisioned: true,
              auth_user_id: targetEmployee.auth_user_id,
              message: "Funcionário já possui identidade de acesso vinculada.",
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

        // Se a conta já pertencia a este mesmo funcionário ou estava sem vínculo, redefine para 1234
        const { error: updateExistingErr } = await adminClient.auth.admin.updateUserById(targetAuthUserId, {
          password: initialPassword,
          user_metadata: {
            name: name || targetEmployee.name || "Colaborador",
            role: role || targetEmployee.role || "Colaborador",
            employee_id: employee_id,
            needs_password_change: true,
          },
        });

        if (updateExistingErr) {
          return new Response(
            JSON.stringify({ error: `Falha ao sincronizar credenciais existentes: ${updateExistingErr.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Cria nova conta no Supabase Auth com senha inicial '1234' e flag de primeiro acesso
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email: cleanEmail,
          password: initialPassword,
          email_confirm: true,
          user_metadata: {
            name: name || targetEmployee.name || "Colaborador",
            role: role || targetEmployee.role || "Colaborador",
            employee_id: employee_id,
            needs_password_change: true,
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

      // 6. Vincula auth_user_id ao funcionário em public.employees e marca needs_password_change = true
      const { error: linkErr } = await adminClient
        .from("employees")
        .update({
          auth_user_id: targetAuthUserId,
          needs_password_change: true,
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

      if (!emp.auth_user_id) {
        return new Response(
          JSON.stringify({ error: "Funcionário não possui conta de acesso vinculada." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateAuthErr } = await adminClient.auth.admin.updateUserById(
        emp.auth_user_id,
        {
          password: password,
          user_metadata: {
            needs_password_change: false,
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
        .update({ needs_password_change: false })
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
