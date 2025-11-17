// supabase/functions/create-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, nome_completo, dias_acesso, app_metadata } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing email or password' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!nome_completo || !nome_completo.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing nome_completo' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar dias_acesso (deve ser 30 ou 90)
    const diasAcessoValido = dias_acesso && (dias_acesso === 30 || dias_acesso === 90) ? dias_acesso : 30;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome_completo: nome_completo.trim()
      },
      app_metadata: app_metadata || { role: "consultoria" },
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = data.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User created but no ID returned' }), 
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar se já existe registro com este user_id
    const { data: existingByUserId } = await supabase
      .from('consultoria_cadastros')
      .select('id, user_id, email, nome_completo')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingByUserId) {
      // Já existe registro com este user_id, atualizar nome e dias de acesso se necessário
      const nomeAtual = existingByUserId.nome_completo;
      const precisaAtualizarNome = !nomeAtual || nomeAtual === '' || (typeof nomeAtual === 'string' && nomeAtual.trim() === '');
      
      // Calcular nova data de expiração se dias_acesso foi alterado
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + diasAcessoValido);
      
      if (precisaAtualizarNome) {
        // Atualizar nome e dias de acesso
        const { error: updateError } = await supabase
          .from('consultoria_cadastros')
          .update({
            nome_completo: nome_completo.trim(),
            dias_acesso: diasAcessoValido,
            data_expiracao: dataExpiracao.toISOString().split('T')[0],
            acesso_bloqueado: false
          })
          .eq('id', existingByUserId.id);
        
        if (updateError) {
          console.error('Error updating consultoria_cadastros:', updateError);
        } else {
          console.log('Updated nome_completo and dias_acesso for existing user:', userId);
        }
      } else {
        // Atualizar apenas dias de acesso
        const { error: updateError } = await supabase
          .from('consultoria_cadastros')
          .update({
            dias_acesso: diasAcessoValido,
            data_expiracao: dataExpiracao.toISOString().split('T')[0],
            acesso_bloqueado: false
          })
          .eq('id', existingByUserId.id);
        
        if (updateError) {
          console.error('Error updating dias_acesso:', updateError);
        }
      }
      console.log('Record already exists for user_id:', userId);
    } else {
      // Verificar se existe registro com este email (sem user_id)
      const { data: existingByEmail } = await supabase
        .from('consultoria_cadastros')
        .select('id, user_id, email')
        .eq('email', email)
        .is('user_id', null)
        .maybeSingle();

      if (existingByEmail) {
        // Existe registro com este email mas sem user_id, atualizar
        // Calcular data de expiração: hoje + dias_acesso
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + diasAcessoValido);
        
        const { error: updateError } = await supabase
          .from('consultoria_cadastros')
          .update({
            user_id: userId,
            nome_completo: nome_completo.trim(),
            dias_acesso: diasAcessoValido,
            dias_adicionais: 0,
            data_expiracao: dataExpiracao.toISOString().split('T')[0],
            acesso_bloqueado: false,
            status: 'pending',
            form_preenchido: false
          })
          .eq('id', existingByEmail.id);
        
        if (updateError) {
          console.error('Error updating consultoria_cadastros record:', updateError);
        }
      } else {
        // Calcular data de expiração: hoje + dias_acesso
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + diasAcessoValido);
        
        // Criar novo registro inicial em consultoria_cadastros com status pending
        const { error: insertError } = await supabase
          .from('consultoria_cadastros')
          .insert({
            user_id: userId,
            email: email,
            nome_completo: nome_completo.trim(),
            dias_acesso: diasAcessoValido,
            dias_adicionais: 0,
            data_expiracao: dataExpiracao.toISOString().split('T')[0],
            acesso_bloqueado: false,
            status: 'pending',
            form_preenchido: false
          });

        if (insertError) {
          // Log erro mas não falha - usuário foi criado, apenas o registro não
          console.error('Error creating consultoria_cadastros record:', insertError);
        }
      }
    }

    return new Response(
      JSON.stringify({ userId: userId }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

