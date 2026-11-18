-- Review and apply manually after approval. This migration tightens grade visibility:
-- generic giao_ly_vien accounts must also hold a class-specific role to read that class.
-- Ban Giáo lý uses truong_ban_giao_ly; leadership roles retain global access.
CREATE OR REPLACE FUNCTION public.can_manage_class(target_class uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(public.current_roles(), ARRAY[]::text[]) && ARRAY[
      'admin','bdh','xu_doan_truong','pho_nghien_huan','pho_noi_vu',
      'thu_ky','truong_ban_giao_ly'
    ]
    OR EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = target_class AND (
        (c.name = 'Lớp Khai Tâm' AND COALESCE(public.current_roles(), ARRAY[]::text[]) && ARRAY['glv_khai_tam','tro_giang_khai_tam'])
        OR (c.name = 'Lớp Đến Bàn Tiệc Thánh' AND COALESCE(public.current_roles(), ARRAY[]::text[]) && ARRAY['glv_den_ban_tiec_thanh','tro_giang_den_ban_tiec_thanh'])
        OR (c.name = 'Lớp Thêm Sức' AND COALESCE(public.current_roles(), ARRAY[]::text[]) && ARRAY['glv_them_suc','tro_giang_them_suc'])
        OR (c.name = 'Lớp Sống đạo' AND COALESCE(public.current_roles(), ARRAY[]::text[]) && ARRAY['glv_song_dao','tro_giang_song_dao'])
      )
    );
$function$;

DROP POLICY IF EXISTS student_grades_select ON public.student_grades;
CREATE POLICY student_grades_select
ON public.student_grades
FOR SELECT
TO authenticated
USING (
  member_id = public.current_member_id()
  OR 'bdh' = ANY(COALESCE(public.current_roles(), ARRAY[]::text[]))
);
