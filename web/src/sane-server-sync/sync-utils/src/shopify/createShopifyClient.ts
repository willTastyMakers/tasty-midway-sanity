import { ShopifyClient, ShopifySecrets, Variables } from '../../../types/src';
import LeakyBucket from '@good-idea/leaky-bucket';
import { DocumentNode } from 'graphql';

const getErrorMessage = (r: Response): string => {
  switch (r.status) {
    case 401:
    case 403:
      return 'Authentication failed. Please make sure you have entered the correct Storefront name and API Key.';
    default:
      return `There was an error connecting to Shopify (${r.status}: ${r.statusText})`;
  }
};

const deduplicateFragments = (queryString: string | undefined): string => {
  if (!queryString) throw new Error('No query string provided');
  return queryString
    .split(/\n\s+\n/)
    .map((group) => group.replace(/^([\n\s])+/, '').replace(/\n+$/, ''))
    .reduce<string[]>((acc, current) => {
      if (acc.includes(current)) return acc;
      return [...acc, current];
    }, [])
    .join('\n\n');
};
export const createShopifyClient = (
  secrets?: ShopifySecrets,
): ShopifyClient => {
  if (!secrets) {
    return {
      query: async () => {
        throw new Error(
          'You must provide a shopify storefront name and access token',
        );
      },
    };
  }
  const { shopName, accessToken } = secrets;
  // const url = `https://${shopName}.myshopify.com/api/${STOREFRONT_API_VERSION}/graphql`
  console.log('[sync-utils/src/shopify/  createShopifyClient =', `https://${shopName}.myshopify.com/api/graphql`  )
  console.log('[sync-utils/src/shopify/  createShopifyClient secrets =',   secrets);
  const url = `https://${shopName}.myshopify.com/api/graphql`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': accessToken,
  };

  const bucket = new LeakyBucket({
    capacity: 40,
    interval: 30,
  });

  const query = async <ResponseType>(
    q: string | DocumentNode,
    variables?: Variables,
  ): Promise<ResponseType> => {
    const queryString =
      typeof q === 'string' ? q : deduplicateFragments(q?.loc?.source.body);

    await bucket.throttle();

    console.log('[sync-utils/src/shopify/  createShopifyClient fetch url =',  url);
    console.log('[sync-utils/src/shopify/  createShopifyClient fetch queryString =',  queryString);
    return fetch(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        variables,
        query: queryString,
      }),
    }).then(async (r) => {
      console.log('[sync-utils/src/shopify/  createShopifyClient r =',   r);
      if (!r.ok) {
        throw new Error(getErrorMessage(r));
      }
      const json = await r.json();
      return json;
    });
  };
  console.log('[sync-utils/src/shopify/  createShopifyClient fetch query =',  query);
  return { query };
};
