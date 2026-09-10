import { describe, expect, it } from 'vitest'
import {
  mapVerifyCertificateRpcRow,
  type VerifyCertificateRpcRow,
} from '@/services/certificates'

const issuedRow: VerifyCertificateRpcRow = {
  valid: true,
  certificate_number: 'SUQ-2026-ABC123',
  status: 'issued',
  student_name: 'Amina',
  student_name_ur: 'آمنہ',
  course_title_en: 'Tajweed',
  course_title_ur: 'تجوید',
  issued_at: '2026-01-15T10:00:00.000Z',
}

describe('mapVerifyCertificateRpcRow', () => {
  it('maps a valid issued RPC row', () => {
    const result = mapVerifyCertificateRpcRow(issuedRow)
    expect(result.valid).toBe(true)
    expect(result.certificate).toEqual({
      certificate_number: 'SUQ-2026-ABC123',
      student_name: 'Amina',
      student_name_ur: 'آمنہ',
      course_title_en: 'Tajweed',
      course_title_ur: 'تجوید',
      issued_at: '2026-01-15T10:00:00.000Z',
      status: 'issued',
    })
  })

  it('returns invalid when row is null or undefined', () => {
    expect(mapVerifyCertificateRpcRow(null)).toEqual({
      valid: false,
      certificate: null,
    })
    expect(mapVerifyCertificateRpcRow(undefined)).toEqual({
      valid: false,
      certificate: null,
    })
  })

  it('keeps certificate payload but valid=false when RPC marks invalid', () => {
    const revoked: VerifyCertificateRpcRow = {
      ...issuedRow,
      valid: false,
      status: 'revoked',
    }
    const result = mapVerifyCertificateRpcRow(revoked)
    expect(result.valid).toBe(false)
    expect(result.certificate?.status).toBe('revoked')
    expect(result.certificate?.certificate_number).toBe('SUQ-2026-ABC123')
  })
})
