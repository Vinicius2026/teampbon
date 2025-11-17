-- ============================================================
-- CORREÇÃO: Função marcar_mensagem_lida
-- ============================================================
-- Problema: A variável v_updated estava declarada como boolean,
-- mas row_count retorna integer, causando erro "operator does not exist: boolean > integer"
-- Solução: Mudar o tipo da variável para integer

create or replace function public.marcar_mensagem_lida(p_mensagem_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_row_count integer;
begin
  update public.orientacoes_expert
  set lido = true,
      lido_em = now()
  where id = p_mensagem_id
    and user_id = p_user_id
    and lido = false;
  
  get diagnostics v_row_count = row_count;
  return v_row_count > 0;
end;
$$;

-- Verificar se a função foi atualizada
select 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  pg_get_function_arguments(oid) as arguments
from pg_proc
where proname = 'marcar_mensagem_lida';

