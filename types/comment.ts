export type Comment = {
  id: string
  topic_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  profiles: {
    username: string
    avatar_url: string
  }
}

export type CommentWithChildren = Comment & {
  children?: CommentWithChildren[]
}
