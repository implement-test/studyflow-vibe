-- 🚨 강력한 초기화: 모든 제약 조건 무시하고 테이블 삭제
-- 1. 트리거 및 함수 정리
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists handle_updated_at() cascade;

-- 2. 모든 테이블 삭제 (CASCADE를 사용하여 연결된 트리거/제약조건 함께 삭제)
drop table if exists attachments cascade;
drop table if exists comments cascade;
drop table if exists topic_schedules cascade;
drop table if exists topics cascade;
drop table if exists profiles cascade;

-- 3. UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- 4. 테이블 생성

-- Profiles
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  constraint username_length check (char_length(username) >= 3)
);

-- Topics
create table topics (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  category text check (category in ('Vibe Coding', 'Game Engine', '3D Modeling')),
  tags text[],
  status text check (status in ('Not Started', 'In Progress', 'Done')) default 'Not Started',
  created_by uuid references profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Schedules
create table topic_schedules (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null
);

-- Comments
create table comments (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Attachments
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

-- 5. 보안 정책(RLS) 및 권한 설정

alter table profiles enable row level security;
alter table topics enable row level security;
alter table topic_schedules enable row level security;
alter table comments enable row level security;
alter table attachments enable row level security;

create policy "Public profiles viewable" on profiles for select using (true);
create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

create policy "Topics viewable" on topics for select using (true);
create policy "Auth users create topics" on topics for insert with check (auth.role() = 'authenticated');
create policy "Users update own topics" on topics for update using (auth.uid() = created_by);
create policy "Users delete own topics" on topics for delete using (auth.uid() = created_by);

create policy "Schedules viewable" on topic_schedules for select using (true);
create policy "Users manage own schedules" on topic_schedules for all using (exists (select 1 from topics where id = topic_id and created_by = auth.uid()));

create policy "Comments viewable" on comments for select using (true);
create policy "Auth users create comments" on comments for insert with check (auth.role() = 'authenticated');
create policy "Users manage own comments" on comments for all using (auth.uid() = user_id);

create policy "Attachments viewable" on attachments for select using (true);
create policy "Auth users upload attachments" on attachments for insert with check (auth.role() = 'authenticated');
create policy "Users delete own attachments" on attachments for delete using (auth.uid() = uploaded_by);

-- 6. 트리거 함수

-- updated_at 핸들러
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated before update on profiles for each row execute procedure handle_updated_at();
create trigger on_topics_updated before update on topics for each row execute procedure handle_updated_at();
create trigger on_comments_updated before update on comments for each row execute procedure handle_updated_at();

-- 사용자 가입 시 프로필 자동 생성 (구글 로그인 완벽 대응)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
begin
  base_username := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  if char_length(base_username) < 3 then
    base_username := base_username || '_user';
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, base_username, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do update 
  set 
    username = excluded.username,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 7. 스토리지 설정
insert into storage.buckets (id, name, public) values ('project_files', 'project_files', true) on conflict (id) do nothing;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Auth Upload" on storage.objects;
drop policy if exists "Owner Delete" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'project_files' );
create policy "Auth Upload" on storage.objects for insert with check ( bucket_id = 'project_files' and auth.role() = 'authenticated' );
create policy "Owner Delete" on storage.objects for delete using ( bucket_id = 'project_files' and auth.uid() = owner );