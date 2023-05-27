import { gql, GraphQLClient } from 'graphql-request'
import { TransactionType } from './TransactionType'

export interface Transaction {
  id: string;
  type: TransactionType;
  offerId: string;
  buyer: string;
  seller: string;
  offerToken: { address: string; name: string; decimals: string };
  buyerToken: { address: string; name: string; decimals: string };
  price: number;
  quantity: number;
  createdAtTimestamp: number;
  offerCreatedAtTimestamp: number;
}

interface TransactionEntity {
  id: string;
  price: string;
  quantity: string;
  buyer: { id: string };
  createdAtTimestamp: number;
  offer: {
    id: string;
    offerToken: { address: string; name: string; decimals: string };
    buyerToken: { address: string; name: string; decimals: string };
    seller: { id: string };
    createdAtTimestamp: number;
  };
}

interface GetTransactionsVariables {
  addresses: string[];
}

interface GetTransactions {
  transactions: TransactionEntity[];
}

function parsePrice (transaction: TransactionEntity) {
  const buyerTokenDecimals = +transaction.offer.buyerToken.decimals
  return +transaction.price / Math.pow(10, buyerTokenDecimals)
}

function parseTransactions (
  transactions: TransactionEntity[],
  addresses: string[],
): Transaction[] {
  return transactions
    .map(transaction => ({
      id: transaction.id,
      type: parseType(transaction.offer, addresses),
      offerId: transaction.offer.id,
      seller: transaction.offer.seller.id,
      buyer: transaction.buyer.id,
      offerToken: transaction.offer.offerToken,
      buyerToken: transaction.offer.buyerToken,
      price: parsePrice(transaction),
      quantity: +transaction.quantity / Math.pow(10, +transaction.offer.offerToken.decimals),
      createdAtTimestamp: transaction.createdAtTimestamp,
      offerCreatedAtTimestamp: transaction.offer.createdAtTimestamp,
    }))
}

function parseType (offer: TransactionEntity['offer'], addresses: string[]) {
  const offerToken = offer.offerToken.address
  const buyerToken = offer.buyerToken.address

  if (addresses.includes(offerToken) && addresses.includes(buyerToken)) {
    return TransactionType.REALTOKENTOREALTOKEN
  } else if (addresses.includes(offerToken)) {
    return TransactionType.REALTOKENTOERC20
  } else if (addresses.includes(buyerToken)) {
    return TransactionType.ERC20TOREALTOKEN
  } else {
    return TransactionType.ERC20TOERC20
  }
}

export function getTransactions (client: GraphQLClient) {
  return async (variables: GetTransactionsVariables) => {
    const response = await client.request<GetTransactions>(gql`
      query GetTransactions ($addresses: [String]) {
        transactions (
          orderBy: createdAtTimestamp,
          orderDirection: desc,
          first: 500,
          where: {
            offer_: {
              or: [
                { offerToken_in: $addresses },
                { buyerToken_in: $addresses }
              ]
            }
          }
        ) {
          id
          price
          quantity
          buyer { id }
          createdAtTimestamp
          offer {
            id
            offerToken { address name decimals }
            buyerToken { address name decimals }
            seller { id }
            createdAtTimestamp
          }
        }
      }
    `, variables)

    return parseTransactions(response.transactions, variables.addresses)
  }
}
