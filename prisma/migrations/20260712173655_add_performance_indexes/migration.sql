-- Historical migration — indexes already present in the
-- 20260717000000_baseline snapshot (this migration predates
-- baseline by 5 days). Added here only so migrate status stops
-- reporting a phantom mismatch against databases that resolved
-- this migration before baseline was adopted. No SQL to run.

SELECT 1;
