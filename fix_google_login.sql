create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
  final_username text;
begin
  -- 1. 이름 결정 (구글 이름 -> 이메일 앞부분 순서)
  base_username := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  
  -- 2. 최소 길이(3자) 충족 확인
  if char_length(base_username) < 3 then
    base_username := base_username || '_user';
  end if;

  final_username := base_username;

  -- 3. 프로필 저장 (충돌 시 업데이트)
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id, 
    final_username, 
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update 
  set 
    username = excluded.username,
    avatar_url = excluded.avatar_url,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;
