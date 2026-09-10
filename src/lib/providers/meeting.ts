/**
 * Meeting provider abstraction.
 * Free-tier default: open an external meeting URL (Zoom/Meet/etc.) in a new tab.
 * Swap implementation later for embedded SDKs without changing call sites.
 */

export interface MeetingProvider {
  /** Build or normalize a join URL for a live class / session. */
  getJoinUrl(meetingUrl: string): string
  /** Open the meeting for the current user (browser fallback). */
  join(meetingUrl: string): void
}

export const externalUrlMeetingProvider: MeetingProvider = {
  getJoinUrl(meetingUrl: string) {
    return meetingUrl.trim()
  },
  join(meetingUrl: string) {
    const url = this.getJoinUrl(meetingUrl)
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  },
}

/** Active provider — replace when wiring a paid/embedded meeting SDK. */
export const meetingProvider: MeetingProvider = externalUrlMeetingProvider
