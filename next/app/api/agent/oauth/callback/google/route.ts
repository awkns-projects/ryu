import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFullAgentWithModelsAndActions, updateAgentRecord } from '@/lib/db/agent-queries';

/**
 * Google OAuth Callback for Agent-Specific Authentication
 * 
 * This endpoint handles the OAuth callback from Google and stores the tokens
 * in the agent's googleAuth or googleEmailScopes field
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

    // Parse state to get agent ID and scope update flag
    let agentId: string | null = null;
    let scopeUpdate = false;

    if (stateParam) {
      try {
        const state = JSON.parse(decodeURIComponent(stateParam));
        agentId = state.agentId;
        scopeUpdate = state.scopeUpdate || false;
      } catch (e) {
        console.error('❌ Failed to parse state parameter:', e);
      }
    }

    // Fallback to query param if state parsing failed
    if (!agentId) {
      agentId = searchParams.get('agentId');
      scopeUpdate = searchParams.get('scopeUpdate') === 'true';
    }

    if (error) {
      console.error('❌ OAuth error from Google:', error);
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=oauth_failed&provider=google`, request.url)
      );
    }

    if (!agentId || !code) {
      console.error('❌ Missing agentId or code in callback');
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=invalid_oauth_callback`, request.url)
      );
    }

    // Verify agent belongs to user
    let agent = await getFullAgentWithModelsAndActions(agentId);
    if (!agent || agent.agent.userId !== session.user.id) {
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=forbidden`, request.url)
      );
    }

    // Exchange authorization code for tokens manually
    // We need to call Google's token endpoint directly to get access/refresh tokens
    let baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${baseUrl}/api/agent/oauth/callback/google`,
        grant_type: 'authorization_code',
      }),
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
      refreshToken: tokens.refresh_token || '',
      expiresAt: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : undefined,
      scope: tokens.scope || '',
      tokenType: tokens.token_type || 'Bearer',
      updatedAt: new Date().toISOString(),
    };

    console.log('💾 Storing Google OAuth data for agent:', agentId);

    // Find the Workspace model record for this agent (or any model with OAuth fields)
    let agentModel = agent.models.find((m: any) => m.name === 'Workspace' || m.name === 'Agent');

    // If no suitable model exists, create a Workspace model for storing OAuth tokens
    if (!agentModel) {
      console.log('📝 Creating Workspace model for storing OAuth tokens...');
      const { createAgentModel } = await import('@/lib/db/agent-queries');

      const newModel = await createAgentModel({
        agentId,
        name: 'Workspace',
        fields: [
          {
            name: 'name',
            title: 'Workspace Name',
            type: 'text',
            required: true,
          },
          {
            name: 'googleAuth',
            title: 'Google Authentication',
            type: 'oauth',
            oauthProvider: 'google',
            oauthScopes: ['profile', 'email'],
          },
          {
            name: 'fbAuth',
            title: 'Facebook Authentication',
            type: 'oauth',
            oauthProvider: 'facebook',
            oauthScopes: ['email', 'public_profile'],
          },
        ],
      });

      console.log('✅ Created Workspace model:', newModel.id);

      // Reload agent to get the model with records
      const reloadedAgent = await getFullAgentWithModelsAndActions(agentId);
      if (reloadedAgent) {
        agent = reloadedAgent;
        agentModel = agent.models.find((m: any) => m.id === newModel.id);
      }
    }

    if (!agentModel) {
      console.error('❌ Agent model not found after creation');
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=agent_model_not_found&agent=${agentId}`, request.url)
      );
    }

    // Get or create workspace record
    let agentRecord = agentModel.records?.[0];

    if (!agentRecord) {
      console.log('📝 Creating Workspace record for OAuth tokens...');
      const { createAgentRecord } = await import('@/lib/db/agent-queries');

      agentRecord = await createAgentRecord({
        modelId: agentModel.id,
        data: {
          name: agent.agent?.name || agent.agent?.title || 'Workspace Configuration',
        },
      });

      console.log('✅ Created Workspace record:', agentRecord.id);
    }

    if (!agentRecord) {
      console.error('❌ Failed to get/create workspace record');
      return NextResponse.redirect(
        new URL(`/${locale}/my-agents?error=failed_to_create_record&agent=${agentId}`, request.url)
      );
    }

    // Determine which field to update based on scopeUpdate flag
    const fieldToUpdate = scopeUpdate ? 'googleEmailScopes' : 'googleAuth';

    // Update the agent record with OAuth tokens
    await updateAgentRecord(agentRecord.id, {
      [fieldToUpdate]: JSON.stringify(oauthData),
    });

    console.log(`✅ Stored Google OAuth tokens in agent's ${fieldToUpdate} field`);

    // Redirect to success page (will close popup and notify parent)
    return NextResponse.redirect(
      new URL(`/${locale}/oauth-success?provider=google&agent=${agentId}`, request.url)
    );

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/${locale}/my-agents?error=oauth_callback_failed`, request.url)
    );
  }
}

