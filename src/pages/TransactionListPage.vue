<template>
  <q-page>
    <q-table
      :loading="loading"
      :rows="transactions"
      :columns="columns"
      :rows-per-page-options="[0]"
      row-key="id"
    >
      <template v-slot:body-cell-tokenSent="props">
        <q-td :props="props">
          <router-link
            v-if="props.row.sendToken.type === 'REALTOKEN'"
            :to="{ name: 'TransactionsOnTokenPage', params: { tokenAddress: props.row.sendToken.address } }"
          >
            {{ props.row.sendToken.name }}
          </router-link>
          <span v-else>{{ props.row.sendToken.name }}</span>
        </q-td>
      </template>

      <template v-slot:body-cell-tokenReceived="props">
        <q-td :props="props">
          <router-link
            v-if="props.row.receiveToken.type === 'REALTOKEN'"
            :to="{ name: 'TransactionsOnTokenPage', params: { tokenAddress: props.row.receiveToken.address } }"
          >
            {{ props.value }}
          </router-link>
          <span v-else>{{ props.value }}</span>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { SwapcatRepository } from 'src/api/swapcat.repository'
import { Transaction } from 'src/api/Swapcat/GetTransactions'
import { useStore } from '../stores/useStore'
import formatDistance from 'date-fns/formatDistance'
import { TableColumn } from 'src/utils/TableColumn'
import { TransactionType } from 'src/api/Swapcat/TransactionType'

type TokenType = 'REALTOKEN' | 'ERC20'

interface Row extends Omit<Transaction, 'offerToken' | 'buyerToken'> {
  sendToken: {
    address: string;
    type: TokenType;
    name: string;
    quantity: number;
  };
  receiveToken: {
    address: string;
    type: TokenType;
    name: string;
    quantity: number;
  };
}

function getStablecoinSymbol (address: string) {
  return {
    '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83': 'USDC',
    '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d': 'xDAI',
  }[address]
}

export default defineComponent({
  name: 'TransactionListPage',
  setup () {
    const store = useStore()
    const addressField = ref<string>('')

    const transactions = ref<Row[]>([])
    const loading = ref(false)

    async function getTokenInfo (token: { address: string; name: string; decimals: string }) {
      const realToken = await store.getToken(token.address)

      if (realToken) {
        return {
          address: token.address,
          type: 'REALTOKEN' as TokenType,
          name: realToken.property.shortName,
        }
      }

      const stableTokenName = getStablecoinSymbol(token.address)

      return {
        address: token.address,
        type: 'ERC20' as TokenType,
        name: stableTokenName ?? token.name,
      }
    }

    async function fetch () {
      loading.value = true
      try {
        await store.waitInitialized
        const data = await SwapcatRepository.getTransactions({
          addresses: store.realTokenAddresses,
        })

        const promises = data.map(async (item) => {
          return {
            ...item,
            sendToken: {
              ...(await getTokenInfo(item.offerToken)),
              quantity: item.quantity,
            },
            receiveToken: {
              ...(await getTokenInfo(item.buyerToken)),
              quantity: item.quantity * item.price,
            },
          }
        })

        transactions.value = await Promise.all(promises)
      } finally {
        loading.value = false
      }
    }

    void fetch()

    const columns: TableColumn<Row>[] = [
      {
        name: 'date',
        label: 'Date',
        align: 'left',
        sortable: true,
        field: item => item.createdAtTimestamp * 1000,
        format: value => new Date(value).toLocaleString(),
      },
      {
        name: 'type',
        label: 'Type',
        align: 'left',
        sortable: true,
        field: item => {
          switch (item.type) {
            case TransactionType.REALTOKENTOREALTOKEN:
            case TransactionType.ERC20TOERC20:
              return 'Swap'
            case TransactionType.REALTOKENTOERC20:
              return 'Sell'
            case TransactionType.ERC20TOREALTOKEN:
              return 'Buy'
          }
        },
      },
      {
        name: 'quantitySent',
        label: 'Quantity sent',
        align: 'right',
        sortable: true,
        field: item => item.sendToken.quantity,
        format: value => value.toFixed(2),
      },
      {
        name: 'tokenSent',
        label: 'Token sent',
        sortable: true,
        align: 'left',
        field: item => item.sendToken.name,
      },
      {
        name: 'quantityReceived',
        label: 'Quantity received',
        align: 'right',
        sortable: true,
        field: item => item.receiveToken.quantity,
        format: value => value.toFixed(2),
      },
      {
        name: 'tokenReceived',
        label: 'Token received',
        sortable: true,
        align: 'left',
        field: item => item.receiveToken.name,
      },
      {
        name: 'delay',
        label: 'Purchase delay',
        align: 'right',
        sortable: true,
        field: item => item.createdAtTimestamp - item.offerCreatedAtTimestamp,
        format: (value, item) => formatDistance(new Date(item.createdAtTimestamp * 1000), new Date(item.offerCreatedAtTimestamp * 1000), { includeSeconds: true }),
      },
      {
        name: 'from',
        label: 'From',
        align: 'left',
        sortable: true,
        field: item => item.seller,
      },
      {
        name: 'to',
        label: 'To',
        align: 'left',
        sortable: true,
        field: item => item.buyer,
      },
    ]

    return {
      addressField,
      loading,
      transactions,
      columns,
    }
  },
})
</script>
