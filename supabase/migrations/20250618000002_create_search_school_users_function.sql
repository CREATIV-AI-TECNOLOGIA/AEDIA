CREATE OR REPLACE FUNCTION public.search_school_users(p_escola_id integer, p_search_term text)
RETURNS TABLE(user_id uuid, nome text, avatar_url text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
    WITH school_users AS (
      SELECT p.user_id, 'professor' AS user_role
      FROM public.professores p
      WHERE p.escola_id = p_escola_id
      UNION
      SELECT d.user_id, 'diretora' AS user_role
      FROM public.diretoras d
      WHERE d.escola_id = p_escola_id
    )
    SELECT
      u.id AS user_id,
      u.raw_user_meta_data->>'full_name' AS nome,
      u.raw_user_meta_data->>'avatar_url' AS avatar_url,
      su.user_role AS role
    FROM auth.users u
    JOIN school_users su ON u.id = su.user_id
    WHERE u.raw_user_meta_data->>'full_name' ILIKE '%' || p_search_term || '%';
END;
$function$; 