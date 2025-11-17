-- 1) Atualizar app_metadata do admin (force refresh)
update auth.users
set raw_app_meta_data = jsonb_build_object('role', 'admin', 'name', 'Poubel'),
    updated_at = now()
where email = 'aurenospagamento@gmail.com';

-- 2) Verificar se salvou
select email, raw_app_meta_data
from auth.users
where email = 'aurenospagamento@gmail.com';

-- 3) Manter a policy permissiva por enquanto (já está criada)
-- Depois que o JWT vier com role=admin, podemos voltar à policy restrita

