-- Round 27: the one advisor warning that wasn't the accepted posture.
--
-- personal_seed_rows() had a role-mutable search_path. It returns a static
-- VALUES list, so there was nothing real to hijack — but pinning it is one
-- line, and it leaves the advisor page showing only the open-by-design
-- warnings the README already documents.

alter function public.personal_seed_rows() set search_path = '';
