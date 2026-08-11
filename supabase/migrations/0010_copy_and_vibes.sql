-- Two fixes.
--
-- 1. Friday's dinner entry stops promising tacos — the menu isn't settled and
--    lives on the Food tab.
--
-- 2. Repair survey.wants rows orphaned by the questionnaire relabel: answers
--    picked under the v2 labels stayed in the column while v3 picks appended,
--    so cards showed both vocabularies. Translate v2 -> v3 and keep the first
--    occurrence of each label, preserving pick order.

update itinerary_blocks
   set title = 'Cook dinner at camp', detail = 'menu''s on the Food tab'
 where day_id = 'fri' and title = 'Taco night at camp';

update itinerary_blocks
   set title = 'Campfire, plan Saturday'
 where day_id = 'fri' and title = 'Campfire + plan Saturday';

with parts as (
  select s.user_id, trim(u.part) as raw, u.ord
    from survey s
    cross join lateral unnest(string_to_array(s.wants, ' · '))
      with ordinality as u(part, ord)
   where s.wants <> '' and trim(u.part) <> ''
), mapped as (
  select user_id, ord,
         case raw
           when 'Big hikes'       then 'A big hike'
           when 'Sunsets + views' then 'Views + sunsets'
           when 'Camp hangs'      then 'Hanging at camp'
           when 'Bar Harbor'      then 'Town food + shops'
           else raw
         end as label
    from parts
), first_seen as (
  select user_id, label, min(ord) as ord
    from mapped
   group by user_id, label
), rebuilt as (
  select user_id, string_agg(label, ' · ' order by ord) as wants
    from first_seen
   group by user_id
)
update survey s
   set wants = r.wants
  from rebuilt r
 where s.user_id = r.user_id and s.wants <> r.wants;
