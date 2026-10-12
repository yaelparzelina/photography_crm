// Address of the live site. Links created while running locally still point at it,
// so a link saved from a dev session works when sent to a client.
export const PRODUCTION_ORIGIN = 'https://yaelparzelina.github.io'

export function appOrigin() {
  return import.meta.env.DEV ? PRODUCTION_ORIGIN : window.location.origin
}

// Full link to a public page of the app, e.g. publicUrl('/unsubscribe')
export function publicUrl(path, origin = appOrigin(), base = import.meta.env.BASE_URL) {
  return `${origin}${base}#${path}`
}
