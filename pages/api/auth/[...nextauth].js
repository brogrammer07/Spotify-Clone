import NextAuth from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import spotifyApi, { LOGIN_URL } from "../../../lib/spotify"

async function refreshAccessToken(token){
    try{
        spotifyApi.setAccessToken(token.accessToken);
        spotifyApi.setRefreshToken(token.refreshToken);
        const {body: refreshedToken} = await spotifyApi.refreshAccessToken();
        console.log("REFRESHED TOKEN IS", refreshedToken);
        return {
            ...token,
            accessToken: refreshedToken.access_token,
            accessTokenExpires:Date.now + refreshedToken.expires_in * 1000,
            refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
        }
    } catch (error){
        console.error(error)
        return {
            ...token,
            error: 'RefreshAccessTokenError',
        }
    }
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: process.env.React_App_NEXT_PUBLIC_CLIENT_ID,
        // clientId: 'c37363d3fbd94a0b9474b417a2fc51da',
      clientSecret: process.env.React_App_NEXT_PUBLIC_CLIENT_SECRET,
        // clientSecret: 'e9ec9d21b61a42c592fcadaa28f4b741',
      authorization: LOGIN_URL,
    }),
    // ...add more providers here
  ],
  secret: process.env.React_App_JWT_SECRET,
  pages: {
      signIn: '/login'
  },
  callbacks: {
      async jwt ({token,account,user}){
          if(account && user){
              return {
                  ...token,
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  username: account.providerAccountId,
                  accessTokenExpires: account.expires_at * 1000,
              }
          }

          if(Date.now() < token.accessTokenExpires){
              console.log("EXISTING ACCESS TOKEN IS VALID")
              return token;
          }

          console.log("ACCESS TOKEN HAS EXPIRED, REFRESHING...");
          return await refreshAccessToken(token)
      },
      async session({session,token}){
        session.user.accessToken = token.accessToken;
        session.user.refreshToken = token.refreshToken;
        session.user.username = token.username;
        return session;
      }
  }
})