-- Votes are signal; someone still has to say "this is what we're cooking" so
-- the shopping list has something stable to point at.
alter table menu_items add column if not exists picked boolean not null default false;

-- The one dish that was already a decision rather than a suggestion.
update menu_items set picked = true where dish = 'Tacos' and night = 'Friday';
