-- "Rolling in all day" carried no information once its detail line went; the
-- staggered arrivals are self-evident from the day itself.

delete from itinerary_blocks where day_id = 'fri' and title = 'Rolling in all day';
