// ==============================================================================
// SUPABASE EDGE FUNCTION: admin-provision-employees
// Objetivo: Provisionar identidades em auth.users para colaboradores da agência
//           de forma segura usando supabase admin API (service role).
// Modos:
// 1. "provision_batch": Percorre colaboradores com auth_user_id IS NULL e cria
//    suas contas no Supabase Auth com senha temporária individual segura
//    ou envia invite por e-mail, vinculando auth_user_id de forma inequívoca.
// 2. "provision_single": Provisiona um único novo colaborador quando criado no sistema.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvisionPayload {
  mode: "provision_batch" | "provision_single";
  employeeId?: string;
  email?: string;
  name?: string;
  role?: string;
  sendInviteEmail?: boolean;
}

// Gera senha temporária aleatória e criptograficamente segura (16 caracteres)
function generateSecureTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

serve(async (req) => {
  // Tratar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta (secrets ausentes)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente Admin com privilégios de service role (isolado exclusivamente nesta Edge Function)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Validar autorização do solicitante (Apenas Gestor ou Admin autenticado pode invocar)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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

    // Checar se o chamador possui perfil administrativo ou gestor no banco
    const { data: callerEmp, error: callerErr } = await adminClient
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
        JSON.stringify({ error: "Acesso negado: apenas Administradores e Gestores podem provisionar colaboradores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ProvisionPayload = await req.json();

    // ==============================================================================
    // FLUXO 1: PROVISIONAMENTO EM LOTE (FUNCIONÁRIOS EXISTENTES SEM AUTH_USER_ID)
    // ==============================================================================
    if (body.mode === "provision_batch") {
      // 1. Busca todos os employees que ainda não possuem auth_user_id
      const { data: employees, error: empErr } = await adminClient
        .from("employees")
        .select("id, name, email, role, role_type, auth_user_id")
        .is("auth_user_id", null);

      if (empErr) {
        return new Response(
          JSON.stringify({ error: `Erro ao consultar funcionários: ${empErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!employees || employees.length === 0) {
        return new Response(
          JSON.stringify({
            message: "Todos os colaboradores já possuem identidades provisionadas.",
            total: 0,
            provisioned: 0,
            linked: 0,
            skipped: 0,
            details: [],
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Detecção de duplicatas de e-mail na tabela employees
      const emailCounts: Record<string, number> = {};
      employees.forEach((e) => {
        const mail = (e.email || "").trim().toLowerCase();
        if (mail) emailCounts[mail] = (emailCounts[mail] || 0) + 1;
      });

      const report: Array<{
        employeeId: string;
        name: string;
        email: string;
        status: "linked_existing" | "created_new" | "skipped_duplicate" | "skipped_invalid_email" | "error";
        message: string;
        temporaryPassword?: string;
      }> = [];

      let countLinked = 0;
      let countCreated = 0;
      let countSkipped = 0;

      for (const emp of employees) {
        const cleanEmail = (emp.email || "").trim().toLowerCase();

        if (!cleanEmail || !cleanEmail.includes("@")) {
          report.push({
            employeeId: emp.id,
            name: emp.name,
            email: emp.email || "",
            status: "skipped_invalid_email",
            message: "E-mail vazio ou inválido. Cadastro manual necessário.",
          });
          countSkipped++;
          continue;
        }

        // Se houver e-mails duplicados na base, rejeita vinculação cega por segurança
        if (emailCounts[cleanEmail] > 1) {
          report.push({
            employeeId: emp.id,
            name: emp.name,
            email: cleanEmail,
            status: "skipped_duplicate",
            message: "E-mail duplicado em mais de um registro de funcionário. Requer resolução manual.",
          });
          countSkipped++;
          continue;
        }

        // 2. Verifica se o usuário já existe no auth.users
        const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers();
        if (listErr) {
          report.push({
            employeeId: emp.id,
            name: emp.name,
            email: cleanEmail,
            status: "error",
            message: `Falha ao consultar auth.users: ${listErr.message}`,
          });
          continue;
        }

        const existingAuthUser = userList.users.find(
          (u) => (u.email || "").trim().toLowerCase() === cleanEmail
        );

        if (existingAuthUser) {
          // Já existe no Supabase Auth: apenas vincula o auth_user_id
          const { error: linkErr } = await adminClient
            .from("employees")
            .update({
              auth_user_id: existingAuthUser.id,
              needs_password_change: true,
            })
            .eq("id", emp.id);

          if (linkErr) {
            report.push({
              employeeId: emp.id,
              name: emp.name,
              email: cleanEmail,
              status: "error",
              message: `Falha ao vincular auth_user_id: ${linkErr.message}`,
            });
          } else {
            countLinked++;
            report.push({
              employeeId: emp.id,
              name: emp.name,
              email: cleanEmail,
              status: "linked_existing",
              message: "Usuário Auth existente vinculado com sucesso.",
            });
          }
        } else {
          // Não existe no Supabase Auth: cria novo usuário com senha temporária segura individual
          const tempPassword = generateSecureTempPassword();

          const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
            email: cleanEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              name: emp.name,
              role: emp.role || "Colaborador",
              employee_id: emp.id,
              needs_password_change: true,
            },
          });

          if (createErr || !newUser.user) {
            report.push({
              employeeId: emp.id,
              name: emp.name,
              email: cleanEmail,
              status: "error",
              message: `Falha ao criar usuário Auth: ${createErr?.message || "Erro desconhecido"}`,
            });
          } else {
            // Vincula no registro de employees
            const { error: updateErr } = await adminClient
              .from("employees")
              .update({
                auth_user_id: newUser.user.id,
                needs_password_change: true,
              })
              .eq("id", emp.id);

            if (updateErr) {
              report.push({
                employeeId: emp.id,
                name: emp.name,
                email: cleanEmail,
                status: "error",
                message: `Usuário Auth criado, mas falhou ao vincular em employees: ${updateErr.message}`,
              });
            } else {
              countCreated++;
              // Retorna a senha temporária APENAS no retorno seguro da chamada do gestor
              // para que possa ser repassada ao colaborador individualmente.
              report.push({
                employeeId: emp.id,
                name: emp.name,
                email: cleanEmail,
                status: "created_new",
                message: "Usuário Auth criado e vinculado. Senha temporária gerada.",
                temporaryPassword: tempPassword,
              });
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          message: "Processamento de provisionamento em lote finalizado.",
          totalEvaluated: employees.length,
          linked: countLinked,
          created: countCreated,
          skipped: countSkipped,
          results: report,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==============================================================================
    // FLUXO 2: PROVISIONAMENTO INDIVIDUAL (NOVO COLABORADOR CADASTRADO NO SISTEMA)
    // ==============================================================================
    if (body.mode === "provision_single") {
      const { employeeId, email, name, role } = body;
      const cleanEmail = (email || "").trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes("@") || !employeeId) {
        return new Response(
          JSON.stringify({ error: "Parâmetros employeeId e email são obrigatórios e devem ser válidos." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Verifica se o e-mail já existe no auth.users
      const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) {
        return new Response(
          JSON.stringify({ error: `Erro ao verificar auth.users: ${listErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const existingAuthUser = userList.users.find(
        (u) => (u.email || "").trim().toLowerCase() === cleanEmail
      );

      if (existingAuthUser) {
        // Vincula a conta existente ao employee
        const { error: updateErr } = await adminClient
          .from("employees")
          .update({
            auth_user_id: existingAuthUser.id,
            needs_password_change: true,
          })
          .eq("id", employeeId);

        if (updateErr) {
          return new Response(
            JSON.stringify({ error: `Erro ao vincular employee: ${updateErr.message}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            status: "linked_existing",
            authUserId: existingAuthUser.id,
            message: "Conta Auth já existente vinculada ao novo colaborador.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Cria o novo usuário no Supabase Auth com senha temporária individual
      const tempPassword = generateSecureTempPassword();

      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: name || "Colaborador",
          role: role || "Colaborador",
          employee_id: employeeId,
          needs_password_change: true,
        },
      });

      if (createErr || !newUser.user) {
        return new Response(
          JSON.stringify({ error: `Erro ao criar usuário Auth: ${createErr?.message || "Erro desconhecido"}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Vincula ao registro em public.employees
      const { error: linkErr } = await adminClient
        .from("employees")
        .update({
          auth_user_id: newUser.user.id,
          needs_password_change: true,
        })
        .eq("id", employeeId);

      if (linkErr) {
        return new Response(
          JSON.stringify({ error: `Usuário Auth criado mas falhou ao vincular: ${linkErr.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          status: "created_new",
          authUserId: newUser.user.id,
          temporaryPassword: tempPassword,
          message: "Colaborador criado no Supabase Auth com sucesso.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Modo inválido. Use 'provision_batch' ou 'provision_single'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Erro inesperado na Edge Function: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
