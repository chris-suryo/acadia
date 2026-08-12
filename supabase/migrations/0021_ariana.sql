-- Spelling, settled on the third pass over the guest list: Ariana, one n.
-- Renaming rather than replacing keeps the row id, so a device already claimed
-- against it stays claimed.
update members set name = 'Ariana' where name in ('Arianna', 'Ariana ');
