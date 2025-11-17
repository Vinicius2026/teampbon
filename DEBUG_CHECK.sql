-- Verificar TODOS os registros (independente de status)
select id, email, objetivo, status, created_at
from public.consultoria_cadastros
order by id desc
limit 10;

-- Contar por status
select status, count(*) as total
from public.consultoria_cadastros
group by status;

-- Ver status EXATO do último registro (com aspas para ver espaços)
select id, email, 
       concat('"', status, '"') as status_com_aspas,
       length(status) as tamanho_status,
       ascii(substring(status from 1 for 1)) as primeiro_char_ascii
from public.consultoria_cadastros
order by id desc
limit 1;

