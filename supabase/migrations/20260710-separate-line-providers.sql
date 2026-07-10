-- YOLO公式LINEとLetter.公式LINEを別の連携元として保存する。
-- Letter.側で既に付与されている識別名を使い、既存データも振り分ける。

begin;

update user_identities
set provider = 'line_letter'
where provider = 'line'
  and display_name = 'Letter. LINE';

update user_identities
set provider = 'line_yolo'
where provider = 'line';

-- 過去の一般LINEログはYOLO公式LINE由来として明示する。
-- Letter.のログはすでに line_letter で記録されている。
update activity_logs
set provider = 'line_yolo'
where provider = 'line';

commit;
