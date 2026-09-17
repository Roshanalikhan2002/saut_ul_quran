/**
 * Supabase Database types for Saut Ul Quran.
 * Hand-maintained to match supabase/migrations/001_schema.sql.
 * Regenerate later with: supabase gen types typescript --linked
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole = 'admin' | 'teacher' | 'student'
export type AppLocale = 'en' | 'ur'
export type ContentType =
  | 'video'
  | 'audio'
  | 'text'
  | 'pdf'
  | 'html'
  | 'quiz'
  | 'image'
  | 'link'
export type EnrollmentStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'withdrawn'
  | 'rejected'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type TestLifecycle = 'draft' | 'published' | 'archived'
export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'recitation'
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded'
export type GroupType = 'chat' | 'announcement'
export type NotificationType =
  | 'info'
  | 'announcement'
  | 'test'
  | 'attendance'
  | 'certificate'
  | 'badge'
  | 'enrollment'
  | 'live_class'
  | 'system'
export type HifzStatus =
  | 'not_started'
  | 'in_progress'
  | 'memorized'
  | 'revised'
  | 'weak'
export type LiveClassStatus = 'scheduled' | 'live' | 'ended' | 'cancelled'
export type ResourceType = 'pdf' | 'audio' | 'video' | 'link' | 'document' | 'image'
export type CertificateStatus = 'pending' | 'issued' | 'revoked'
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type RevelationType = 'makki' | 'madani'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          full_name_ur: string | null
          avatar_url: string | null
          phone: string | null
          locale: AppLocale
          bio: string | null
          is_active: boolean
          login_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          full_name_ur?: string | null
          avatar_url?: string | null
          phone?: string | null
          locale?: AppLocale
          bio?: string | null
          is_active?: boolean
          login_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          full_name_ur?: string | null
          avatar_url?: string | null
          phone?: string | null
          locale?: AppLocale
          bio?: string | null
          is_active?: boolean
          login_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: AppRole
          granted_by: string | null
          granted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: AppRole
          granted_by?: string | null
          granted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: AppRole
          granted_by?: string | null
          granted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          id: string
          profile_id: string
          student_code: string | null
          guardian_name: string | null
          guardian_phone: string | null
          date_of_birth: string | null
          gender: string | null
          address: string | null
          notes: string | null
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          student_code?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          notes?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          student_code?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          notes?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'students_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      teachers: {
        Row: {
          id: string
          profile_id: string
          title: string | null
          specialization: string | null
          bio_en: string | null
          bio_ur: string | null
          is_active: boolean
          hired_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title?: string | null
          specialization?: string | null
          bio_en?: string | null
          bio_ur?: string | null
          is_active?: boolean
          hired_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string | null
          specialization?: string | null
          bio_en?: string | null
          bio_ur?: string | null
          is_active?: boolean
          hired_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teachers_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          id: string
          slug: string
          cover_image_url: string | null
          difficulty: string | null
          estimated_hours: number | null
          is_published: boolean
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          cover_image_url?: string | null
          difficulty?: string | null
          estimated_hours?: number | null
          is_published?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          cover_image_url?: string | null
          difficulty?: string | null
          estimated_hours?: number | null
          is_published?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_translations: {
        Row: {
          id: string
          course_id: string
          locale: AppLocale
          title: string
          description: string | null
        }
        Insert: {
          id?: string
          course_id: string
          locale: AppLocale
          title: string
          description?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          locale?: AppLocale
          title?: string
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'course_translations_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          slug: string
          sort_order: number
          duration_minutes: number | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          slug: string
          sort_order?: number
          duration_minutes?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          slug?: string
          sort_order?: number
          duration_minutes?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_translations: {
        Row: {
          id: string
          lesson_id: string
          locale: AppLocale
          title: string
          summary: string | null
        }
        Insert: {
          id?: string
          lesson_id: string
          locale: AppLocale
          title: string
          summary?: string | null
        }
        Update: {
          id?: string
          lesson_id?: string
          locale?: AppLocale
          title?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_translations_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_content: {
        Row: {
          id: string
          lesson_id: string
          content_type: ContentType
          sort_order: number
          storage_path: string | null
          external_url: string | null
          body_markdown: string | null
          body_html: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          content_type: ContentType
          sort_order?: number
          storage_path?: string | null
          external_url?: string | null
          body_markdown?: string | null
          body_html?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          content_type?: ContentType
          sort_order?: number
          storage_path?: string | null
          external_url?: string | null
          body_markdown?: string | null
          body_html?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_content_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
        ]
      }
      course_teachers: {
        Row: {
          id: string
          course_id: string
          teacher_id: string
          is_primary: boolean
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          id?: string
          course_id: string
          teacher_id: string
          is_primary?: boolean
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          teacher_id?: string
          is_primary?: boolean
          assigned_at?: string
          assigned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'course_teachers_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'course_teachers_teacher_id_fkey'
            columns: ['teacher_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      enrollments: {
        Row: {
          id: string
          course_id: string
          student_id: string
          status: EnrollmentStatus
          enrolled_by: string | null
          enrolled_at: string
          completed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          status?: EnrollmentStatus
          enrolled_by?: string | null
          enrolled_at?: string
          completed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          status?: EnrollmentStatus
          enrolled_by?: string | null
          enrolled_at?: string
          completed_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'enrollments_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_progress: {
        Row: {
          id: string
          student_id: string
          lesson_id: string
          status: LessonProgressStatus
          progress_percent: number
          last_position_seconds: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          lesson_id: string
          status?: LessonProgressStatus
          progress_percent?: number
          last_position_seconds?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          lesson_id?: string
          status?: LessonProgressStatus
          progress_percent?: number
          last_position_seconds?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_progress_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      paras: {
        Row: {
          id: string
          number: number
          name_ar: string | null
          name_en: string | null
          name_ur: string | null
        }
        Insert: {
          id?: string
          number: number
          name_ar?: string | null
          name_en?: string | null
          name_ur?: string | null
        }
        Update: {
          id?: string
          number?: number
          name_ar?: string | null
          name_en?: string | null
          name_ur?: string | null
        }
        Relationships: []
      }
      surahs: {
        Row: {
          id: string
          number: number
          name_ar: string
          name_en: string
          name_ur: string | null
          revelation_type: RevelationType | null
          ayah_count: number
          created_at: string
        }
        Insert: {
          id?: string
          number: number
          name_ar: string
          name_en: string
          name_ur?: string | null
          revelation_type?: RevelationType | null
          ayah_count: number
          created_at?: string
        }
        Update: {
          id?: string
          number?: number
          name_ar?: string
          name_en?: string
          name_ur?: string | null
          revelation_type?: RevelationType | null
          ayah_count?: number
          created_at?: string
        }
        Relationships: []
      }
      ayahs: {
        Row: {
          id: string
          surah_id: string
          ayah_number: number
          text_ar: string
          text_uthmani: string | null
          translation_en: string | null
          translation_ur: string | null
          tajweed_markup: Json
          para_id: string | null
          page_number: number | null
          juz_number: number | null
        }
        Insert: {
          id?: string
          surah_id: string
          ayah_number: number
          text_ar: string
          text_uthmani?: string | null
          translation_en?: string | null
          translation_ur?: string | null
          tajweed_markup?: Json
          para_id?: string | null
          page_number?: number | null
          juz_number?: number | null
        }
        Update: {
          id?: string
          surah_id?: string
          ayah_number?: number
          text_ar?: string
          text_uthmani?: string | null
          translation_en?: string | null
          translation_ur?: string | null
          tajweed_markup?: Json
          para_id?: string | null
          page_number?: number | null
          juz_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'ayahs_surah_id_fkey'
            columns: ['surah_id']
            isOneToOne: false
            referencedRelation: 'surahs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ayahs_para_id_fkey'
            columns: ['para_id']
            isOneToOne: false
            referencedRelation: 'paras'
            referencedColumns: ['id']
          },
        ]
      }
      tajweed_rules: {
        Row: {
          id: string
          code: string
          name_en: string
          name_ur: string | null
          description_en: string | null
          description_ur: string | null
          color_hex: string | null
          example_ar: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name_en: string
          name_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          color_hex?: string | null
          example_ar?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name_en?: string
          name_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          color_hex?: string | null
          example_ar?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      ayah_audio: {
        Row: {
          id: string
          ayah_id: string
          reciter: string
          storage_path: string | null
          external_url: string | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          ayah_id: string
          reciter?: string
          storage_path?: string | null
          external_url?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          ayah_id?: string
          reciter?: string
          storage_path?: string | null
          external_url?: string | null
          duration_seconds?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ayah_audio_ayah_id_fkey'
            columns: ['ayah_id']
            isOneToOne: false
            referencedRelation: 'ayahs'
            referencedColumns: ['id']
          },
        ]
      }
      ayah_knowledge: {
        Row: {
          id: string
          student_id: string
          ayah_id: string
          mastery_level: number
          last_reviewed_at: string | null
          notes: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          ayah_id: string
          mastery_level?: number
          last_reviewed_at?: string | null
          notes?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          ayah_id?: string
          mastery_level?: number
          last_reviewed_at?: string | null
          notes?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ayah_knowledge_ayah_id_fkey'
            columns: ['ayah_id']
            isOneToOne: false
            referencedRelation: 'ayahs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ayah_knowledge_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      hifz_progress: {
        Row: {
          id: string
          student_id: string
          surah_id: string
          ayah_from: number
          ayah_to: number
          status: HifzStatus
          assigned_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          surah_id: string
          ayah_from: number
          ayah_to: number
          status?: HifzStatus
          assigned_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          surah_id?: string
          ayah_from?: number
          ayah_to?: number
          status?: HifzStatus
          assigned_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'hifz_progress_surah_id_fkey'
            columns: ['surah_id']
            isOneToOne: false
            referencedRelation: 'surahs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hifz_progress_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      hifz_daily_records: {
        Row: {
          id: string
          student_id: string
          record_date: string
          surah_id: string | null
          ayah_from: number | null
          ayah_to: number | null
          pages_revised: number | null
          quality_rating: number | null
          teacher_notes: string | null
          recorded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          record_date?: string
          surah_id?: string | null
          ayah_from?: number | null
          ayah_to?: number | null
          pages_revised?: number | null
          quality_rating?: number | null
          teacher_notes?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          record_date?: string
          surah_id?: string | null
          ayah_from?: number | null
          ayah_to?: number | null
          pages_revised?: number | null
          quality_rating?: number | null
          teacher_notes?: string | null
          recorded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'hifz_daily_records_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hifz_daily_records_surah_id_fkey'
            columns: ['surah_id']
            isOneToOne: false
            referencedRelation: 'surahs'
            referencedColumns: ['id']
          },
        ]
      }
      tests: {
        Row: {
          id: string
          course_id: string | null
          created_by: string | null
          title_en: string
          title_ur: string | null
          description_en: string | null
          description_ur: string | null
          duration_minutes: number | null
          passing_score: number
          max_attempts: number | null
          status: TestLifecycle
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          created_by?: string | null
          title_en: string
          title_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          duration_minutes?: number | null
          passing_score?: number
          max_attempts?: number | null
          status?: TestLifecycle
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          created_by?: string | null
          title_en?: string
          title_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          duration_minutes?: number | null
          passing_score?: number
          max_attempts?: number | null
          status?: TestLifecycle
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tests_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      test_questions: {
        Row: {
          id: string
          test_id: string
          sort_order: number
          question_type: QuestionType
          prompt_en: string
          prompt_ur: string | null
          points: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          sort_order?: number
          question_type?: QuestionType
          prompt_en: string
          prompt_ur?: string | null
          points?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          sort_order?: number
          question_type?: QuestionType
          prompt_en?: string
          prompt_ur?: string | null
          points?: number
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'test_questions_test_id_fkey'
            columns: ['test_id']
            isOneToOne: false
            referencedRelation: 'tests'
            referencedColumns: ['id']
          },
        ]
      }
      test_options: {
        Row: {
          id: string
          question_id: string
          sort_order: number
          label_en: string
          label_ur: string | null
          is_correct: boolean
        }
        Insert: {
          id?: string
          question_id: string
          sort_order?: number
          label_en: string
          label_ur?: string | null
          is_correct?: boolean
        }
        Update: {
          id?: string
          question_id?: string
          sort_order?: number
          label_en?: string
          label_ur?: string | null
          is_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'test_options_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'test_questions'
            referencedColumns: ['id']
          },
        ]
      }
      test_assignments: {
        Row: {
          id: string
          test_id: string
          student_id: string
          assigned_by: string | null
          due_at: string | null
          assigned_at: string
        }
        Insert: {
          id?: string
          test_id: string
          student_id: string
          assigned_by?: string | null
          due_at?: string | null
          assigned_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          student_id?: string
          assigned_by?: string | null
          due_at?: string | null
          assigned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'test_assignments_test_id_fkey'
            columns: ['test_id']
            isOneToOne: false
            referencedRelation: 'tests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'test_assignments_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      test_attempts: {
        Row: {
          id: string
          assignment_id: string | null
          test_id: string
          student_id: string
          status: AttemptStatus
          score: number | null
          started_at: string
          expires_at: string | null
          submitted_at: string | null
          graded_by: string | null
          graded_at: string | null
          feedback: string | null
        }
        Insert: {
          id?: string
          assignment_id?: string | null
          test_id: string
          student_id: string
          status?: AttemptStatus
          score?: number | null
          started_at?: string
          expires_at?: string | null
          submitted_at?: string | null
          graded_by?: string | null
          graded_at?: string | null
          feedback?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string | null
          test_id?: string
          student_id?: string
          status?: AttemptStatus
          score?: number | null
          started_at?: string
          expires_at?: string | null
          submitted_at?: string | null
          graded_by?: string | null
          graded_at?: string | null
          feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'test_attempts_test_id_fkey'
            columns: ['test_id']
            isOneToOne: false
            referencedRelation: 'tests'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'test_attempts_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      test_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_id: string | null
          answer_text: string | null
          is_correct: boolean | null
          points_awarded: number | null
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_id?: string | null
          answer_text?: string | null
          is_correct?: boolean | null
          points_awarded?: number | null
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_option_id?: string | null
          answer_text?: string | null
          is_correct?: boolean | null
          points_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'test_answers_attempt_id_fkey'
            columns: ['attempt_id']
            isOneToOne: false
            referencedRelation: 'test_attempts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'test_answers_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'test_questions'
            referencedColumns: ['id']
          },
        ]
      }
      attendance_sessions: {
        Row: {
          id: string
          course_id: string
          teacher_id: string | null
          session_date: string
          title: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          teacher_id?: string | null
          session_date?: string
          title?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          teacher_id?: string | null
          session_date?: string
          title?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_sessions_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          student_id: string
          status: AttendanceStatus
          notes: string | null
          marked_by: string | null
          marked_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          status?: AttendanceStatus
          notes?: string | null
          marked_by?: string | null
          marked_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          status?: AttendanceStatus
          notes?: string | null
          marked_by?: string | null
          marked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_records_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'attendance_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_records_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      recorded_classes: {
        Row: {
          id: string
          course_id: string | null
          title_en: string
          title_ur: string | null
          description_en: string | null
          description_ur: string | null
          storage_path: string | null
          external_url: string | null
          duration_seconds: number | null
          recorded_at: string | null
          uploaded_by: string | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          title_en: string
          title_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          storage_path?: string | null
          external_url?: string | null
          duration_seconds?: number | null
          recorded_at?: string | null
          uploaded_by?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          title_en?: string
          title_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          storage_path?: string | null
          external_url?: string | null
          duration_seconds?: number | null
          recorded_at?: string | null
          uploaded_by?: string | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recorded_classes_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      live_classes: {
        Row: {
          id: string
          course_id: string | null
          title_en: string
          title_ur: string | null
          description_en: string | null
          description_ur: string | null
          scheduled_at: string
          ends_at: string | null
          meeting_url: string | null
          status: LiveClassStatus
          host_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          title_en: string
          title_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          scheduled_at: string
          ends_at?: string | null
          meeting_url?: string | null
          status?: LiveClassStatus
          host_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          title_en?: string
          title_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          scheduled_at?: string
          ends_at?: string | null
          meeting_url?: string | null
          status?: LiveClassStatus
          host_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'live_classes_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      library_resources: {
        Row: {
          id: string
          course_id: string | null
          title_en: string
          title_ur: string | null
          description_en: string | null
          description_ur: string | null
          resource_type: ResourceType
          storage_path: string | null
          external_url: string | null
          is_public: boolean
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          title_en: string
          title_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          resource_type?: ResourceType
          storage_path?: string | null
          external_url?: string | null
          is_public?: boolean
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          title_en?: string
          title_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          resource_type?: ResourceType
          storage_path?: string | null
          external_url?: string | null
          is_public?: boolean
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'library_resources_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      daily_duas: {
        Row: {
          id: string
          slug: string | null
          title_en: string
          title_ur: string | null
          arabic_text: string
          transliteration: string | null
          translation_en: string | null
          translation_ur: string | null
          audio_path: string | null
          category: string | null
          sort_order: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug?: string | null
          title_en: string
          title_ur?: string | null
          arabic_text: string
          transliteration?: string | null
          translation_en?: string | null
          translation_ur?: string | null
          audio_path?: string | null
          category?: string | null
          sort_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string | null
          title_en?: string
          title_ur?: string | null
          arabic_text?: string
          transliteration?: string | null
          translation_en?: string | null
          translation_ur?: string | null
          audio_path?: string | null
          category?: string | null
          sort_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          id: string
          student_id: string
          course_id: string
          certificate_number: string
          status: CertificateStatus
          issued_at: string | null
          issued_by: string | null
          storage_path: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          certificate_number: string
          status?: CertificateStatus
          issued_at?: string | null
          issued_by?: string | null
          storage_path?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          certificate_number?: string
          status?: CertificateStatus
          issued_at?: string | null
          issued_by?: string | null
          storage_path?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'certificates_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certificates_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      points_ledger: {
        Row: {
          id: string
          student_id: string
          points: number
          reason: string
          reference_type: string | null
          reference_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          points: number
          reason: string
          reference_type?: string | null
          reference_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          points?: number
          reason?: string
          reference_type?: string | null
          reference_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'points_ledger_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      badges: {
        Row: {
          id: string
          code: string
          name_en: string
          name_ur: string | null
          description_en: string | null
          description_ur: string | null
          icon_url: string | null
          points_required: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name_en: string
          name_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          icon_url?: string | null
          points_required?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name_en?: string
          name_ur?: string | null
          description_en?: string | null
          description_ur?: string | null
          icon_url?: string | null
          points_required?: number | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      student_badges: {
        Row: {
          id: string
          student_id: string
          badge_id: string
          awarded_at: string
          awarded_by: string | null
        }
        Insert: {
          id?: string
          student_id: string
          badge_id: string
          awarded_at?: string
          awarded_by?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          badge_id?: string
          awarded_at?: string
          awarded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'student_badges_badge_id_fkey'
            columns: ['badge_id']
            isOneToOne: false
            referencedRelation: 'badges'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'student_badges_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title_en: string
          title_ur: string | null
          body_en: string | null
          body_ur: string | null
          link: string | null
          is_read: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: NotificationType
          title_en: string
          title_ur?: string | null
          body_en?: string | null
          body_ur?: string | null
          link?: string | null
          is_read?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title_en?: string
          title_ur?: string | null
          body_en?: string | null
          body_ur?: string | null
          link?: string | null
          is_read?: boolean
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      groups: {
        Row: {
          id: string
          name: string
          name_ur: string | null
          group_type: GroupType
          course_id: string | null
          description: string | null
          created_by: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ur?: string | null
          group_type?: GroupType
          course_id?: string | null
          description?: string | null
          created_by?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_ur?: string | null
          group_type?: GroupType
          course_id?: string | null
          description?: string | null
          created_by?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'groups_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role_in_group: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role_in_group?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role_in_group?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      group_messages: {
        Row: {
          id: string
          group_id: string
          sender_id: string
          body: string | null
          media_path: string | null
          metadata: Json
          created_at: string
          edited_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          sender_id: string
          body?: string | null
          media_path?: string | null
          metadata?: Json
          created_at?: string
          edited_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          sender_id?: string
          body?: string | null
          media_path?: string | null
          metadata?: Json
          created_at?: string
          edited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'group_messages_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'group_messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      announcements: {
        Row: {
          id: string
          course_id: string | null
          group_id: string | null
          title_en: string
          title_ur: string | null
          body_en: string
          body_ur: string | null
          published_by: string | null
          published_at: string
          is_pinned: boolean
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id?: string | null
          group_id?: string | null
          title_en: string
          title_ur?: string | null
          body_en: string
          body_ur?: string | null
          published_by?: string | null
          published_at?: string
          is_pinned?: boolean
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string | null
          group_id?: string | null
          title_en?: string
          title_ur?: string | null
          body_en?: string
          body_ur?: string | null
          published_by?: string | null
          published_at?: string
          is_pinned?: boolean
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'announcements_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      about_jamia: {
        Row: {
          id: string
          name_en: string
          name_ur: string | null
          location_en: string | null
          location_ur: string | null
          head_ustazah_en: string | null
          head_ustazah_ur: string | null
          mission_en: string | null
          mission_ur: string | null
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          extra: Json
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          name_en: string
          name_ur?: string | null
          location_en?: string | null
          location_ur?: string | null
          head_ustazah_en?: string | null
          head_ustazah_ur?: string | null
          mission_en?: string | null
          mission_ur?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          extra?: Json
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          name_en?: string
          name_ur?: string | null
          location_en?: string | null
          location_ur?: string | null
          head_ustazah_en?: string | null
          head_ustazah_ur?: string | null
          mission_en?: string | null
          mission_ur?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          extra?: Json
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          user_id: string
          locale: AppLocale
          theme: string
          notification_email: boolean
          notification_push: boolean
          settings: Json
          updated_at: string
          created_at: string
        }
        Insert: {
          user_id: string
          locale?: AppLocale
          theme?: string
          notification_email?: boolean
          notification_push?: boolean
          settings?: Json
          updated_at?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          locale?: AppLocale
          theme?: string
          notification_email?: boolean
          notification_push?: boolean
          settings?: Json
          updated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      has_role: {
        Args: { check_role: AppRole }
        Returns: boolean
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_teacher: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_staff: {
        Args: Record<string, never>
        Returns: boolean
      }
      teacher_manages_course: {
        Args: { p_course_id: string }
        Returns: boolean
      }
      student_enrolled: {
        Args: { p_course_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      is_group_muted: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      resolve_login_email: {
        Args: { p_login: string }
        Returns: string
      }
      submit_and_grade_attempt: {
        Args: { p_attempt_id: string }
        Returns: {
          id: string
          assignment_id: string | null
          test_id: string
          student_id: string
          status: AttemptStatus
          score: number | null
          started_at: string
          expires_at: string | null
          submitted_at: string | null
          graded_by: string | null
          graded_at: string | null
          feedback: string | null
        }
      }
      verify_certificate: {
        Args: { p_number: string }
        Returns: {
          valid: boolean
          certificate_number: string
          status: CertificateStatus
          student_name: string | null
          student_name_ur: string | null
          course_title_en: string | null
          course_title_ur: string | null
          issued_at: string | null
        }[]
      }
    }
    Enums: {
      app_role: AppRole
      app_locale: AppLocale
      content_type: ContentType
      enrollment_status: EnrollmentStatus
      attendance_status: AttendanceStatus
      test_lifecycle: TestLifecycle
      question_type: QuestionType
      attempt_status: AttemptStatus
      group_type: GroupType
      notification_type: NotificationType
      hifz_status: HifzStatus
      live_class_status: LiveClassStatus
      resource_type: ResourceType
      certificate_status: CertificateStatus
      lesson_progress_status: LessonProgressStatus
      revelation_type: RevelationType
    }
    CompositeTypes: Record<string, never>
  }
}

/** Convenience helpers matching supabase-js generated style */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
