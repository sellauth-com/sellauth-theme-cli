export default async function resolveShop(api, providedShopId) {
  if (providedShopId) return providedShopId;

  const shops = await api.getShops();

  if (!shops || shops.length === 0) {
    throw new Error('No shops found for this account.');
  }

  if (shops.length === 1) {
    return shops[0].id;
  }

  throw new Error('Multiple shops found. Please specify --shop <shopId>.');
}
