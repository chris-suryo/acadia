-- Seed the packing-hierarchy example: one child bundle item under the camp
-- stove (BUILD_SPEC §7.2). Claiming the parent claims the bundle.

insert into gear_items (category, parent_id, label, sort)
select 'Camp Kitchen', id, 'Propane canisters ×2', 1
from gear_items
where label = 'Camp stove + fuel' and parent_id is null
  and not exists (select 1 from gear_items where label = 'Propane canisters ×2');
