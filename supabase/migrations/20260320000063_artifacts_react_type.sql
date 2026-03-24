-- Add 'react' type to artifacts (and align DB constraint with validator enum)
ALTER TABLE artifacts
  DROP CONSTRAINT IF EXISTS artifacts_type_check;

ALTER TABLE artifacts
  ADD CONSTRAINT artifacts_type_check
  CHECK (type IN ('code', 'table', 'document', 'list', 'react', 'data', 'image', 'other'));
