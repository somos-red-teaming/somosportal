import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://3249157c7da661f1672101b41a257d2c@o4510471620132864.ingest.us.sentry.io/4510471621050368",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
