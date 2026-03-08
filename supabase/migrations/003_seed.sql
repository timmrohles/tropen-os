-- Tropen OS v2 – Seed: model_catalog mit model_class
-- model_class: fast = schnell & günstig, deep = leistungsstark, safe = EU/OSS-konform

INSERT INTO model_catalog (name, provider, model_class, cost_per_1k_input, cost_per_1k_output, description) VALUES
  ('gpt-4o-mini',      'openai',    'fast', 0.000150, 0.000600, 'OpenAI GPT-4o Mini – schnell & günstig'),
  ('claude-haiku-4-5', 'anthropic', 'fast', 0.000250, 0.001250, 'Anthropic Claude Haiku – sehr günstig'),
  ('gpt-4o',           'openai',    'deep', 0.005000, 0.015000, 'OpenAI GPT-4o – leistungsstark, multimodal'),
  ('claude-sonnet-4-5','anthropic', 'deep', 0.003000, 0.015000, 'Anthropic Claude Sonnet – ausgewogen');
