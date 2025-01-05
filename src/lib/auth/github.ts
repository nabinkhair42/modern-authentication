const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!

export async function getGithubOAuthToken(code: string) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  return response.json()
}

export async function getGithubUser(access_token: string) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })

  return response.json()
}

export function getGithubOAuthURL() {
  const rootUrl = 'https://github.com/login/oauth/authorize'
  const options = {
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/github/callback`,
    scope: 'read:user user:email',
  }
  
  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}
