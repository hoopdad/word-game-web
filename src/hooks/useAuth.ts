import { useCallback } from 'react'
import { useMsal } from '@azure/msal-react'
import apiClient from '@/services/apiClient'

export const useAuth = () => {
  const { instance, accounts } = useMsal()
  const account = accounts[0]

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!account) throw new Error('No account found')

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await instance.acquireTokenSilent({
        account,
        scopes: ['api://word-game/user_impersonation'],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response as any).accessToken
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await instance.acquireTokenRedirect({
        account,
        scopes: ['api://word-game/user_impersonation'],
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response as any)?.accessToken || ''
    }
  }, [account, instance])

  const login = useCallback(async () => {
    await instance.loginPopup({
      scopes: ['api://word-game/user_impersonation'],
    })
  }, [instance])

  const logout = useCallback(async () => {
    await instance.logoutPopup()
  }, [instance])

  const setTokenInApi = useCallback(async () => {
    const token = await getAccessToken()
    apiClient.setAuthToken(token)
  }, [getAccessToken])

  return {
    isAuthenticated: !!account,
    account,
    login,
    logout,
    getAccessToken,
    setTokenInApi,
  }
}
