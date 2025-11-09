import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFullAgentWithModelsAndActions, updateAgentRecord } from '@/lib/db/agent-queries';

/**
 * Facebook OAuth Callback for Agent-Specific Authentication
 * 
 * This endpoint handles the OAuth callback from Facebook and stores the tokens
 * in the agent's fbAuth field
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

    // Fallback to query param if state parsing failed
    if (!agentId) {
      agentId = searchParams.get('agentId');
    }

    if (error) {
      console.error('❌ OAuth error from Facebook:', error);
      return NextResponse.redirect(
        new URL(`/dashboard?error=oauth_failed&provider=facebook`, request.url)
      );
    }

    if (!agentId || !code) {
      console.error('❌ Missing agentId or code in callback');
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_oauth_callback', request.url)
      );
    }

    // Verify agent belongs to user
    const agent = await getFullAgentWithModelsAndActions(agentId);
    if (!agent || agent.agent.userId !== session.user.id) {
      return NextResponse.redirect(
        new URL('/dashboard?error=forbidden', request.url)
      );
    }

    // Exchange authorization code for tokens manually
    // We need to call Facebook's token endpoint directly to get access/refresh tokens
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', process.env.FACEBOOK_CLIENT_ID || '');
    tokenUrl.searchParams.append('client_secret', process.env.FACEBOOK_CLIENT_SECRET || '');
    tokenUrl.searchParams.append('redirect_uri', `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/agent/oauth/callback/facebook`);
    tokenUrl.searchParams.append('code', code);

    const tokenResp = await fetch(tokenUrl.toString());

    if (!tokenResp.ok) {
      const errorData = await tokenResp.text();
      console.error('❌ Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/dashboard?error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResp.json();

    if (!tokens.access_token) {
      console.error('❌ No access token in response');
      return NextResponse.redirect(
        new URL('/dashboard?error=no_access_token', request.url)
      );
    }

    // Prepare OAuth data to store
    const oauthData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : undefined,
      scope: tokens.scope || '',
      tokenType: tokens.token_type || 'Bearer',
      updatedAt: new Date().toISOString(),
    };

    console.log('💾 Storing Facebook OAuth data for agent:', agentId);

    // Find the Agent model record for this agent
    const agentModel = agent.models.find((m: any) => m.name === 'Agent');
    if (!agentModel) {
      console.error('❌ Agent model not found');
      return NextResponse.redirect(
        new URL('/dashboard?error=agent_model_not_found', request.url)
      );
    }

    const agentRecord = agentModel.records?.[0];
    if (!agentRecord) {
      console.error('❌ Agent record not found');
      return NextResponse.redirect(
        new URL('/dashboard?error=agent_record_not_found', request.url)
      );
    }

    // Update the agent record with OAuth tokens in fbAuth field
    await updateAgentRecord(agentRecord.id, {
      fbAuth: JSON.stringify(oauthData),
    });

    console.log('✅ Stored Facebook OAuth tokens in agent\'s fbAuth field');

    // Redirect to success page (will close popup and notify parent)
    return NextResponse.redirect(
      new URL(`/${locale}/oauth-success?provider=facebook&agent=${agentId}`, request.url)
    );

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/${locale}/my-agents?error=oauth_callback_failed`, request.url)
    );
  }
}

