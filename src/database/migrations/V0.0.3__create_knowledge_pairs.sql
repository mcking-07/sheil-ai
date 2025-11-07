drop table if exists knowledge_pairs cascade;

create table if not exists knowledge_pairs (
  id           uuid primary key default uuid_generate_v4(),
  
  content      text not null,
  content_hash varchar(64) not null,

  embedding    vector(1024) not null,
  metadata     jsonb not null default '{}'::jsonb,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
