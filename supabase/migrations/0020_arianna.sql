-- Spelling correction from Chris's second pass over the list: Arianna, two n's.
-- Renaming rather than replacing keeps the row id, so any device already
-- claimed against it stays claimed.
update members set name = 'Arianna' where name = 'Ariana';
