-- Allow compliance flags for events where no user can be inferred (e.g. spoofed B2C callbacks).

alter table public.compliance_flags
  alter column user_id drop not null;

comment on column public.compliance_flags.user_id is
  'Null when the subject user cannot be determined from the flagged event.';
