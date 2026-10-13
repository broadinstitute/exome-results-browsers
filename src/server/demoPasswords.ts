const getDemoPasswords = (
  demoPasswords: string | undefined,
  demoPassword: string | undefined
): string[] => {
  const passwords = (demoPasswords ?? '')
    .trim()
    .replace(/^"|"$/g, '')
    .split(',')
    .map((password) => password.trim())
    .filter((password) => password.length > 0)

  if (passwords.length > 0) {
    return passwords
  }

  return [demoPassword?.replace(/^"|"$/g, '') || 'password']
}

export default getDemoPasswords
