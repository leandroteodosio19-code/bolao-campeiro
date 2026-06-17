INSERT INTO public.teams (name, code, group_name, flag_emoji)
VALUES
  ('Brasil', 'BRA', 'A', '🇧🇷'),
  ('Argentina', 'ARG', 'A', '🇦🇷'),
  ('França', 'FRA', 'B', '🇫🇷'),
  ('Alemanha', 'GER', 'B', '🇩🇪'),
  ('Espanha', 'ESP', 'C', '🇪🇸'),
  ('Portugal', 'POR', 'C', '🇵🇹'),
  ('Inglaterra', 'ENG', 'D', '🏴'),
  ('Estados Unidos', 'USA', 'D', '🇺🇸')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    group_name = EXCLUDED.group_name,
    flag_emoji = EXCLUDED.flag_emoji;

WITH t AS (
  SELECT code, id FROM public.teams WHERE code IN ('BRA','ARG','FRA','GER','ESP','POR','ENG','USA')
)
INSERT INTO public.matches (
  external_match_id,
  home_team_id,
  away_team_id,
  kickoff_at,
  stage,
  group_name,
  is_knockout,
  is_mock,
  status
)
VALUES
  ('mock-2026-001', (SELECT id FROM t WHERE code = 'BRA'), (SELECT id FROM t WHERE code = 'ARG'), '2026-06-20 16:00:00+00', 'group', 'A', false, true, 'scheduled'),
  ('mock-2026-002', (SELECT id FROM t WHERE code = 'FRA'), (SELECT id FROM t WHERE code = 'GER'), '2026-06-21 16:00:00+00', 'group', 'B', false, true, 'scheduled'),
  ('mock-2026-003', (SELECT id FROM t WHERE code = 'ESP'), (SELECT id FROM t WHERE code = 'POR'), '2026-06-22 16:00:00+00', 'group', 'C', false, true, 'scheduled'),
  ('mock-2026-004', (SELECT id FROM t WHERE code = 'ENG'), (SELECT id FROM t WHERE code = 'USA'), '2026-06-23 16:00:00+00', 'group', 'D', false, true, 'scheduled'),
  ('mock-2026-005', (SELECT id FROM t WHERE code = 'BRA'), (SELECT id FROM t WHERE code = 'FRA'), '2026-07-05 20:00:00+00', 'quarter', NULL, true, true, 'scheduled')
ON CONFLICT (external_match_id) DO UPDATE
SET home_team_id = EXCLUDED.home_team_id,
    away_team_id = EXCLUDED.away_team_id,
    kickoff_at = EXCLUDED.kickoff_at,
    stage = EXCLUDED.stage,
    group_name = EXCLUDED.group_name,
    is_knockout = EXCLUDED.is_knockout,
    is_mock = EXCLUDED.is_mock,
    status = EXCLUDED.status;
