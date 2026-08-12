-- Last of the twelves. The roster is eleven and has been for three rounds;
-- this one sat in a detail line where nobody was looking.
update itinerary_blocks set detail = 'call ahead for 11'
  where detail = 'call ahead for 12';
