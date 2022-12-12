import { gql, GraphQLClient } from 'graphql-request'

const USDC = '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83'
const XDAI = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d'

export interface TokenTransaction {
  id: string;
  offerId: string;
  seller: string;
  buyer: string;
  buyerToken: string;
  price: number;
  quantity: number;
  createdAtTimestamp: number;
  offerCreatedAtTimestamp: number;
}

interface GetTokenTransactions {
  token: {
    offers: {
      id: string;
      buyerToken: { address: string };
      seller: { address: string };
      createdAtTimestamp: number;
      transactions: {
        id: string;
        price: number;
        quantity: number;
        buyer: { address: string };
        createdAtTimestamp: number;
      }[];
    }[];
  };
}

interface GetTokenTransactionsVariables {
  address: string;
}

function parsePrice (offer: GetTokenTransactions['token']['offers'][0], price: number) {
  const buyerToken = offer.buyerToken.address
  return price / Math.pow(10, buyerToken === USDC ? 6 : 18)
}

function parseOffers (offers: GetTokenTransactions['token']['offers'][0][]): TokenTransaction[] {
  return offers
    .map(offer => offer.transactions
      .map(transaction => ({
        id: transaction.id,
        offerId: offer.id,
        seller: offer.seller.address,
        buyer: transaction.buyer.address,
        buyerToken: offer.buyerToken.address,
        price: parsePrice(offer, transaction.price),
        quantity: transaction.quantity / Math.pow(10, 18),
        createdAtTimestamp: transaction.createdAtTimestamp,
        offerCreatedAtTimestamp: offer.createdAtTimestamp,
      })))
    .flat()
    .filter(item => [USDC, XDAI].includes(item.buyerToken))
    .sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp)
}

export function getTokenTransactions (client: GraphQLClient) {
  return async (variables: GetTokenTransactionsVariables) => {
    const response = await client.request<GetTokenTransactions>(gql`
      query GetTokenTransactions ($address: String) {
        token(id: $address) {
          offers (orderBy: createdAtTimestamp, orderDirection: desc) {
            id
            buyerToken { address }
            seller { address }
            createdAtTimestamp
            transactions (orderBy: createdAtTimestamp, orderDirection: desc) {
              id
              price
              quantity
              buyer { address }
              createdAtTimestamp
            }
          }
        }
      }
    `, { address: variables.address.toLowerCase() })

    return parseOffers(response.token.offers)
  }
}
