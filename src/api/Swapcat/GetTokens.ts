import { gql, GraphQLClient } from 'graphql-request'
import _chunk from 'lodash/chunk'
import _sumBy from 'lodash/sumBy'

const BATCH_SIZE = 100
const USDC = '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83'

export interface SwapcatToken {
  address: string;
  unitPrice: number;
  quantity: number;
  transactions: {
    price: number;
    quantity: number;
    buyerToken: string;
  }[];
}

interface GetTokens {
  tokens: {
    address: string;
    transactions: {
      id: string;
      price: number;
      quantity: number;
      offer: { buyerToken: { address: string } };
    }[];
  }[];
}

interface GetTokensVariables {
  addresses: string[];
}

function parsePrice (purchase: GetTokens['tokens'][0]['transactions'][0]) {
  const buyerToken = purchase.offer.buyerToken.address
  return purchase.price / Math.pow(10, buyerToken === USDC ? 6 : 18)
}

function parsePurchase (transactions: GetTokens['tokens'][0]['transactions'][0][]) {
  return transactions.map(purchase => ({
    price: parsePrice(purchase),
    quantity: purchase.quantity / Math.pow(10, 18),
    buyerToken: purchase.offer.buyerToken.address,
  }))
}

export function parseTokens (tokens: GetTokens['tokens'][0][]): SwapcatToken[] {
  return tokens.map(token => {
    const transactions = parsePurchase(token.transactions)
    const quantity = _sumBy(transactions, 'quantity')

    return {
      address: token.address,
      unitPrice: _sumBy(transactions, item => item.price * item.quantity) / quantity,
      quantity,
      transactions,
    }
  })
}

export function getTokens (client: GraphQLClient) {
  return async (variables: GetTokensVariables) => {
    const batchAddresses = _chunk(variables.addresses.map(address => address.toLowerCase()), BATCH_SIZE)

    const responses = await Promise.all(batchAddresses.map(async addresses => {
      const response = await client.request<GetTokens>(gql`
        query GetTokens ($addresses: [String]) {
          tokens (where: { address_in: $addresses }) {
            address
            transactions (orderBy: createdAtTimestamp, orderDirection: desc, first: 5) {
              offer { buyerToken { address } }
              price
              quantity
            }
          }
        }
      `, { addresses })

      return response.tokens
    }))

    return parseTokens(responses.flat())
  }
}
