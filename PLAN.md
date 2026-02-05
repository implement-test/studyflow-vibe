# StudyFlow_Vibe - Implementation Plan

## 1. Project Overview
*   **Project Name:** StudyFlow_Vibe
*   **Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Supabase (Auth/Database/Storage), Framer Motion, browser-image-compression, Lucide-react.
*   **Objective:** Create a minimal, high-performance study group portal for <10 users.

## 2. Architecture & Standards
*   **Workflow:** Plan-First (this document).
*   **Database:** Supabase with strict RLS policies on all tables. Snake_case naming convention.
*   **Design System:** Modern Minimalist theme.
    *   **Tokens:** Mapped to Tailwind utility classes.
    *   **Motion:** Framer Motion for all interactions (page transitions, modals, hover effects).
    *   **Responsiveness:** Mobile-first approach.

## 3. Database Schema (Supabase)

### Tables
1.  **`profiles`**
    *   `id` (uuid, primary key, references auth.users)
    *   `username` (text)
    *   `avatar_url` (text)
    *   `updated_at` (timestamptz)

2.  **`topics`**
    *   `id` (uuid, primary key)
    *   `title` (text)
    *   `description` (text)
    *   `category` (text) - Enum: 'Vibe Coding', 'Game Engine', '3D Modeling'
    *   `tags` (text[])
    *   `created_by` (uuid, references profiles.id)
    *   `created_at` (timestamptz)
    *   `updated_at` (timestamptz)

3.  **`topic_schedules`**
    *   `id` (uuid, primary key)
    *   `topic_id` (uuid, references topics.id)
    *   `start_date` (timestamptz)
    *   `end_date` (timestamptz)

4.  **`comments`**
    *   `id` (uuid, primary key)
    *   `topic_id` (uuid, references topics.id)
    *   `user_id` (uuid, references profiles.id)
    *   `parent_id` (uuid, references comments.id, nullable for top-level)
    *   `content` (text)
    *   `created_at` (timestamptz)
    *   `updated_at` (timestamptz)

5.  **`attachments`**
    *   `id` (uuid, primary key)
    *   `topic_id` (uuid, references topics.id, nullable)
    *   `comment_id` (uuid, references comments.id, nullable)
    *   `file_url` (text)
    *   `file_type` (text)
    *   `uploaded_by` (uuid, references profiles.id)
    *   `created_at` (timestamptz)

### RLS Policies
*   Enable RLS on all tables.
*   **Read:** Public/Authenticated users (depending on privacy level, assume authenticated users can read all for a study group).
*   **Write:** Users can edit/delete their own content.
*   **Uploads:** Authenticated users can upload; only owner can delete.

## 4. Frontend Architecture (Next.js 14)

### Page Structure
*   `/login`: Auth form (Supabase Auth UI or Custom).
*   `/dashboard`:
    *   Client Component wrapper for state (view toggle).
    *   `CalendarView` component.
    *   `ListView` component.
*   `/topic/[id]`:
    *   Server Component for fetching topic details.
    *   `CommentSection` (Client Component for nesting and interaction).
    *   `FileUpload` (Client Component).

### Key Components
*   **Layout:** Sidebar/Navbar with navigation and Dark Mode toggle.
*   **UI Primitives:** Button, Input, Modal, Card (styled with Tailwind & Design Tokens).
*   **Comments:** Recursive component for nested threads.
*   **Media:** Image uploader with client-side compression.

## 5. Implementation Steps

### Phase 1: Setup & Configuration
1.  Initialize Next.js project.
2.  Install dependencies (Tailwind, Framer Motion, Supabase Client, etc.).
3.  Configure Tailwind with Design Tokens.
4.  Set up Supabase client helper.

### Phase 2: Database & Auth
1.  Generate SQL script for Schema, RLS, and Triggers.
2.  Implement `auth-helpers` in Next.js.
3.  Build `/login` page.

### Phase 3: Core Features (Dashboard & Topics)
1.  Create `profiles` table handling (triggers on auth.signup).
2.  Build `/dashboard` with mock data first, then real data.
3.  Implement Topic creation modal (title, category, date ranges).
4.  Implement Topic Detail view (`/topic/[id]`).

### Phase 4: Interaction & Media
1.  Implement Comment system (CRUD + Nesting).
2.  Integrate `browser-image-compression` and Storage upload.
3.  Apply Framer Motion animations to all page transitions and UI elements.

### Phase 5: Polish & Review
1.  Verify RLS policies.
2.  Check responsiveness.
3.  Final UI tweaks (Dark/Light mode).
