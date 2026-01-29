import { VercelRequest, VercelResponse } from '@vercel/node';
import { diagnoseShopify } from './shopify-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return diagnoseShopify(res);
}
