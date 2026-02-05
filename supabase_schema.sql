-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);

-- Create a table for topics
create table topics (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  category text check (category in ('Vibe Coding', 'Game Engine', '3D Modeling')),
  tags text[],
  created_by uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for topic schedules (multiple date ranges)
create table topic_schedules (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null
);

-- Create a table for nested comments
create table comments (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  parent_id uuid references comments(id) on delete cascade, -- Nullable for top-level comments
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for attachments
create table attachments (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references topics(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  file_url text not null,
  file_type text not null,
  uploaded_by uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint topic_or_comment check (
    (topic_id is not null and comment_id is null) or
    (topic_id is null and comment_id is not null)
  )
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table topics enable row level security;
alter table topic_schedules enable row level security;
alter table comments enable row level security;
alter table attachments enable row level security;

-- RLS Policies

-- Profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Topics
create policy "Topics are viewable by everyone." on topics
  for select using (true);

create policy "Authenticated users can create topics." on topics
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their own topics." on topics
  for update using (auth.uid() = created_by);

create policy "Users can delete their own topics." on topics
  for delete using (auth.uid() = created_by);

-- Topic Schedules
create policy "Schedules are viewable by everyone." on topic_schedules
  for select using (true);

create policy "Users can insert schedules for their own topics." on topic_schedules
  for insert with check (
    exists (select 1 from topics where id = topic_id and created_by = auth.uid())
  );

create policy "Users can update schedules for their own topics." on topic_schedules
  for update using (
    exists (select 1 from topics where id = topic_id and created_by = auth.uid())
  );

create policy "Users can delete schedules for their own topics." on topic_schedules
  for delete using (
    exists (select 1 from topics where id = topic_id and created_by = auth.uid())
  );

-- Comments
create policy "Comments are viewable by everyone." on comments
  for select using (true);

create policy "Authenticated users can create comments." on comments
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their own comments." on comments
  for update using (auth.uid() = user_id);

create policy "Users can delete their own comments." on comments
  for delete using (auth.uid() = user_id);

-- Attachments
create policy "Attachments are viewable by everyone." on attachments
  for select using (true);

create policy "Authenticated users can upload attachments." on attachments
  for insert with check (auth.role() = 'authenticated');

create policy "Users can delete their own attachments." on attachments
  for delete using (auth.uid() = uploaded_by);

-- Triggers for updated_at
create function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on profiles
  for each row execute procedure handle_updated_at();

create trigger on_topics_updated
  before update on topics
  for each row execute procedure handle_updated_at();

create trigger on_comments_updated
  before update on comments
  for each row execute procedure handle_updated_at();

-- Trigger for creating a profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Bucket Setup
-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('project_files', 'project_files', true)
on conflict (id) do nothing;

-- 2. Storage Policies
create policy "Public Access" on storage.objects 
  for select using ( bucket_id = 'project_files' );

create policy "Auth Upload" on storage.objects 
  for insert with check ( 
    bucket_id = 'project_files' 
    and auth.role() = 'authenticated' 
  );

create policy "Owner Delete" on storage.objects 
  for delete using ( 
    bucket_id = 'project_files' 
    and auth.uid() = owner 
  );

-- Migration: Add status to topics
alter table topics add column status text check (status in ('Not Started', 'In Progress', 'Done')) default 'Not Started';