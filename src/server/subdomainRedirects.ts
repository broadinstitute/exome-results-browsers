import { RequestHandler } from 'express'

export type SubdomainRedirectMap = Readonly<Partial<Record<string, string>>>

const PERMANENT_REDIRECT_STATUS = 308

const SUBDOMAIN_REDIRECTS: SubdomainRedirectMap = {
  asc: 'agb',
}

export const getSubdomainRedirectUrl = (
  hostname: string,
  originalUrl: string,
  redirects: SubdomainRedirectMap = SUBDOMAIN_REDIRECTS
): string | undefined => {
  const [subdomain, ...domainParts] = hostname.toLowerCase().split('.')
  if (domainParts.length === 0 || !Object.prototype.hasOwnProperty.call(redirects, subdomain)) {
    return undefined
  }

  const targetSubdomain = redirects[subdomain]
  if (!targetSubdomain || targetSubdomain === subdomain) {
    return undefined
  }

  return `https://${targetSubdomain}.${domainParts.join('.')}${originalUrl}`
}

const redirectSubdomain: RequestHandler = (request, response, next) => {
  const redirectUrl = getSubdomainRedirectUrl(request.hostname, request.originalUrl)
  if (redirectUrl) {
    response.redirect(PERMANENT_REDIRECT_STATUS, redirectUrl)
    return
  }
  next()
}

export default redirectSubdomain
