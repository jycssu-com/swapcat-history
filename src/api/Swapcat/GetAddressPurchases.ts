import { gql, GraphQLClient } from 'graphql-request'

const USDC = '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83'
const XDAI = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d'

export interface AddressPurchase {
  id: string;
  offerId: string;
  seller: string;
  offerToken: string;
  buyerToken: string;
  price: number;
  quantity: number;
  createdAtTimestamp: number;
  offerCreatedAtTimestamp: number;
}

interface GetAddressPurchases {
  account: {
    purchases: {
      id: string;
      price: number;
      quantity: number;
      createdAtTimestamp: number;
      offer: {
        id: string;
        offerToken: { address: string };
        buyerToken: { address: string };
        seller: { address: string };
        createdAtTimestamp: number;
      };
    }[];
  };
}

interface GetAddressPurchasesVariables {
  address: string;
}

function parsePrice (purchase: GetAddressPurchases['account']['purchases'][0], price: number) {
  const buyerToken = purchase.offer.buyerToken.address
  return price / Math.pow(10, buyerToken === USDC ? 6 : 18)
}

function parsePurchases (purchases: GetAddressPurchases['account']['purchases'][0][]): AddressPurchase[] {
  return purchases
    .map(purchase => ({
      id: purchase.id,
      offerId: purchase.offer.id,
      seller: purchase.offer.seller.address,
      offerToken: purchase.offer.offerToken.address,
      buyerToken: purchase.offer.buyerToken.address,
      price: parsePrice(purchase, purchase.price),
      quantity: purchase.quantity / Math.pow(10, 18),
      createdAtTimestamp: purchase.createdAtTimestamp,
      offerCreatedAtTimestamp: purchase.offer.createdAtTimestamp,
    }))
    .filter(item => [USDC, XDAI].includes(item.buyerToken))
    .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp)
}

export function getAddressPurchases (client: GraphQLClient) {
  return async (variables: GetAddressPurchasesVariables) => {
    const response = await client.request<GetAddressPurchases>(gql`
      query GetAddressPurchases ($address: String) {
        account(id: $address) {
          purchases (orderBy: createdAtTimestamp, orderDirection: desc) {
            id
            price
            quantity
            createdAtTimestamp
            offer {
              id
              offerToken { address }
              buyerToken { address }
              seller { address }
              createdAtTimestamp
            }
          }
        }
      }
    `, { address: variables.address.toLowerCase() })

    return parsePurchases(response.account.purchases)
  }
}
