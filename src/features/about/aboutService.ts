import { DEFAULT_JAMIA } from '@/lib/constants'
import { isDemoAuthMode } from '@/lib/demoAuth'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesUpdate } from '@/types/database'

export type AboutJamiaRow = Tables<'about_jamia'>

export type JamiaAbout = {
  id: string | null
  nameEn: string
  nameUr: string
  locationEn: string
  locationUr: string
  headUstazahEn: string
  headUstazahUr: string
  missionEn: string
  missionUr: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
}

export type JamiaAboutInput = Omit<JamiaAbout, 'id'> & { id?: string | null }

function fromDefaults(): JamiaAbout {
  return {
    id: null,
    nameEn: DEFAULT_JAMIA.nameEn,
    nameUr: DEFAULT_JAMIA.nameUr,
    locationEn: DEFAULT_JAMIA.locationEn,
    locationUr: DEFAULT_JAMIA.locationUr,
    headUstazahEn: DEFAULT_JAMIA.headUstazahEn,
    headUstazahUr: DEFAULT_JAMIA.headUstazahUr,
    missionEn: DEFAULT_JAMIA.missionEn,
    missionUr: DEFAULT_JAMIA.missionUr,
    phone: DEFAULT_JAMIA.phone,
    email: DEFAULT_JAMIA.email,
    website: DEFAULT_JAMIA.website,
    logoUrl: DEFAULT_JAMIA.logoUrl,
  }
}

/** Sync fallback used while fetching / when Supabase is unavailable. */
export function getDefaultJamiaAbout(): JamiaAbout {
  return fromDefaults()
}

function fromRow(row: AboutJamiaRow): JamiaAbout {
  return {
    id: row.id,
    nameEn: row.name_en || DEFAULT_JAMIA.nameEn,
    nameUr: row.name_ur || DEFAULT_JAMIA.nameUr,
    locationEn: row.location_en || DEFAULT_JAMIA.locationEn,
    locationUr: row.location_ur || DEFAULT_JAMIA.locationUr,
    headUstazahEn: row.head_ustazah_en || DEFAULT_JAMIA.headUstazahEn,
    headUstazahUr: row.head_ustazah_ur || DEFAULT_JAMIA.headUstazahUr,
    missionEn: row.mission_en || DEFAULT_JAMIA.missionEn,
    missionUr: row.mission_ur || DEFAULT_JAMIA.missionUr,
    phone: row.phone ?? DEFAULT_JAMIA.phone,
    email: row.email ?? DEFAULT_JAMIA.email,
    website: row.website ?? DEFAULT_JAMIA.website,
    logoUrl: row.logo_url ?? DEFAULT_JAMIA.logoUrl,
  }
}

export function pickLocaleText(
  en: string,
  ur: string | null | undefined,
  locale: string,
) {
  return locale === 'ur' && ur ? ur : en
}

export function whatsappUrl(phone: string | null | undefined) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}`
}

/** Fetch the first about_jamia row; fall back to DEFAULT_JAMIA on empty/error. */
export async function fetchAboutJamia(): Promise<JamiaAbout> {
  try {
    if (isDemoAuthMode()) return fromDefaults()

    const { data, error } = await supabase
      .from('about_jamia')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !data) return fromDefaults()
    return fromRow(data)
  } catch {
    return fromDefaults()
  }
}

export async function updateAboutJamia(
  input: JamiaAboutInput,
): Promise<JamiaAbout> {
  const payload: TablesUpdate<'about_jamia'> = {
    name_en: input.nameEn,
    name_ur: input.nameUr,
    location_en: input.locationEn,
    location_ur: input.locationUr,
    head_ustazah_en: input.headUstazahEn,
    head_ustazah_ur: input.headUstazahUr,
    mission_en: input.missionEn,
    mission_ur: input.missionUr,
    phone: input.phone,
    email: input.email,
    website: input.website,
    logo_url: input.logoUrl,
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('about_jamia')
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single()

    if (error || !data) {
      throw error ?? new Error('Failed to update about_jamia')
    }
    return fromRow(data)
  }

  const { data, error } = await supabase
    .from('about_jamia')
    .insert({
      name_en: input.nameEn,
      name_ur: input.nameUr,
      location_en: input.locationEn,
      location_ur: input.locationUr,
      head_ustazah_en: input.headUstazahEn,
      head_ustazah_ur: input.headUstazahUr,
      mission_en: input.missionEn,
      mission_ur: input.missionUr,
      phone: input.phone,
      email: input.email,
      website: input.website,
      logo_url: input.logoUrl,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw error ?? new Error('Failed to create about_jamia')
  }
  return fromRow(data)
}
