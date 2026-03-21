import { copilotApi } from 'copilot-node-sdk';
import { need } from '@/utils/need';

async function attachCustomFields(
  copilot: ReturnType<typeof copilotApi>,
  company: any,
) {
  try {
    const response = await fetch(
      `https://api.copilot.app/v1/companies/${company.id}`,
      {
        headers: {
          'X-API-Key': process.env.COPILOT_API_KEY!,
        },
        cache: 'no-store',
      }
    );

    const data = await response.json();
    company.customFields = data.customFields ?? data.custom_fields ?? {};
  } catch (err) {
    console.error('Failed to fetch custom field values:', err);
    company.customFields = {};
  }

  return company;
}

export async function getSession(searchParams: SearchParams) {
  const apiKey = need<string>(
    process.env.COPILOT_API_KEY,
    'COPILOT_API_KEY is required, guide available at: https://docs.copilot.app/docs/custom-apps-setting-up-your-first-app#step-2-register-your-app-and-get-an-api-key',
  );

  const copilot = copilotApi({
    apiKey,
    token:
      'token' in searchParams && typeof searchParams.token === 'string'
        ? searchParams.token
        : undefined,
  });

  const data: {
    workspace: Awaited<ReturnType<typeof copilot.retrieveWorkspace>>;
    client?: Awaited<ReturnType<typeof copilot.retrieveClient>>;
    company?: Awaited<ReturnType<typeof copilot.retrieveCompany>>;
    internalUser?: Awaited<ReturnType<typeof copilot.retrieveInternalUser>>;
  } = {
    workspace: await copilot.retrieveWorkspace(),
  };

  const tokenPayload = await copilot.getTokenPayload?.();

  if (tokenPayload?.clientId) {
    data.client = await copilot.retrieveClient({ id: tokenPayload.clientId });
  }
  if (tokenPayload?.companyId) {
    const company = await copilot.retrieveCompany({ id: tokenPayload.companyId });
    data.company = await attachCustomFields(copilot, company);
  }
  if (tokenPayload?.internalUserId) {
    data.internalUser = await copilot.retrieveInternalUser({
      id: tokenPayload.internalUserId,
    });
  }

  return data;
}

export async function getSessionFromRoute(searchParams: URLSearchParams) {
  const rawToken = searchParams.get('token');
  const token =
    rawToken && rawToken !== 'null' && rawToken !== 'undefined'
      ? rawToken
      : undefined;

  const companyId = searchParams.get('companyId');
  if (!token && companyId && process.env.COPILOT_ENV !== 'local') {
    const apiKey = need<string>(process.env.COPILOT_API_KEY, 'COPILOT_API_KEY is required');
    const copilot = copilotApi({ apiKey });

    const [workspace, company] = await Promise.all([
      copilot.retrieveWorkspace(),
      copilot.retrieveCompany({ id: companyId }),
    ]);

    const companyWithFields = await attachCustomFields(copilot, company);
    return { workspace, company: companyWithFields };
  }

  if (!token && process.env.COPILOT_ENV === 'local' && process.env.DEV_COMPANY_ID) {
    const apiKey = need<string>(
      process.env.COPILOT_API_KEY,
      'COPILOT_API_KEY is required',
    );

    const copilot = copilotApi({ apiKey });

    const [workspace, company] = await Promise.all([
      copilot.retrieveWorkspace(),
      copilot.retrieveCompany({ id: process.env.DEV_COMPANY_ID }),
    ]);

    const companyWithFields = await attachCustomFields(copilot, company);

    return { workspace, company: companyWithFields };
  }

  return getSession(token ? { token } : {});
}

function getField(fields: Record<string, any>, canonical: string): string | null {
  if (fields[canonical] != null && fields[canonical] !== '') return String(fields[canonical]);
  const lc = canonical.toLowerCase();
  for (const [key, val] of Object.entries(fields)) {
    if (key.toLowerCase() === lc && val != null && val !== '') return String(val);
  }
  return null;
}

export function getCompanyConfig(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session.company) return null;

  const fields = (session.company as any).customFields ?? {};

  console.log('Custom fields received:', JSON.stringify(fields));

  return {
    companyId:              session.company.id,
    name:                   (session.company as any).name ?? 'Unknown Company',
    ga4PropertyId:          getField(fields, 'ga4PropertyId'),
    metricoolBlogId:        getField(fields, 'metricoolBlogId'),
    gbpLocationId:          getField(fields, 'gbpLocationId'),
    whatConvertsAccountId:  getField(fields, 'whatConvertsAccountId'),
  };
}