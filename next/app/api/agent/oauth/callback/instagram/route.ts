import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFullAgentWithModelsAndActions, updateAgentRecord } from '@/lib/db/agent-queries';

/**
 * Instagram OAuth Callback for Agent-Specific Authentication
 * Note: Instagram API has known redirect_uri validation issues
 */
export async function GET(request: NextRequest) {
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';

  try {
    // Get session to verify user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login?error=unauthorized`, request.url));
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ OAuth error from Instagram:', error);
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=oauth_failed&provider=instagram`, request.url)
      );
    }

    // Parse state to get agent ID
    let agentId: string | null = null;

    if (stateParam) {
      try {
        const state = JSON.parse(decodeURIComponent(stateParam));
        agentId = state.agentId;
      } catch (e) {
        console.error('❌ Failed to parse state parameter:', e);
      }
    }

    if (!agentId || !code) {
      console.error('❌ Missing agentId or code');
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=invalid_oauth_callback`, request.url)
      );
    }

    // Verify agent belongs to user
    const agent = await getFullAgentWithModelsAndActions(agentId);
    if (!agent || agent.agent.userId !== session.user.id) {
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=forbidden&agent=${agentId}`, request.url)
      );
    }

    // Exchange authorization code for tokens
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '';
    const appSecret = process.env.NEXT_PUBLIC_INSTAGRAM_APP_SECRET || '';
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/agent/oauth/callback/instagram`;

    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch(`https://api.instagram.com/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=token_exchange_failed&agent=${agentId}`, request.url)
      );
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error('❌ No access token in response');
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=no_access_token&agent=${agentId}`, request.url)
      );
    }

    // Prepare OAuth data to store
    const oauthData = {
      accessToken: tokens.access_token,
      refreshToken: '',
      expiresAt: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : undefined,
      userId: tokens.user_id || '',
      tokenType: 'Bearer',
      updatedAt: new Date().toISOString(),
    };

    console.log('💾 Storing Instagram OAuth data for agent:', agentId);

    // Find the Workspace model record for this agent
    const agentModel = agent.models.find((m: any) => m.name === 'Workspace' || m.name === 'Agent');
    if (!agentModel) {
      console.error('❌ Workspace/Agent model not found');
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=agent_model_not_found&agent=${agentId}`, request.url)
      );
    }

    const agentRecord = agentModel.records?.[0];
    if (!agentRecord) {
      console.error('❌ Workspace record not found');
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=agent_record_not_found&agent=${agentId}`, request.url)
      );
    }

    // Update the agent record with OAuth tokens in instagramAuth field
    await updateAgentRecord(agentRecord.id, {
      instagramAuth: JSON.stringify(oauthData),
    });

    console.log('✅ Stored Instagram OAuth tokens in agent\'s instagramAuth field');

    // Redirect to success page (will close popup and notify parent)
    return NextResponse.redirect(
      new URL(`/${locale}/oauth-success?provider=instagram&agent=${agentId}`, request.url)
    );

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/${locale}/my-agents?error=oauth_callback_failed`, request.url)
    );
  }
}

