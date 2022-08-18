<template>
  <q-page>
    <q-table
      :loading="loading"
      :title="title"
      :rows="purchases"
      :columns="columns"
      :rows-per-page-options="[0]"
      row-key="id"
    />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, watch, computed } from 'vue'
import { QTableProps } from 'quasar'
import { SwapcatRepository } from 'src/api/swapcat.repository'
import { TokenPurchase } from 'src/api/Swapcat/GetTokenPurchases'
import { useStore, Token } from '../stores/useStore'
import formatDistance from 'date-fns/formatDistance'

export default defineComponent({
  name: 'PurchasesOnTokenPage',
  props: {
    tokenAddress: {
      type: String,
      required: true,
    },
  },
  setup (props) {
    const { tokenAddress } = toRefs(props)
    const store = useStore()

    const purchases = ref<TokenPurchase[]>([])
    const token = ref<Token | undefined>(undefined)
    const loading = ref(false)

    async function fetch () {
      loading.value = true
      try {
        token.value = await store.getToken(tokenAddress.value)
        purchases.value = await SwapcatRepository.getTokenPurchases({ address: tokenAddress.value })
      } finally {
        loading.value = false
      }
    }

    watch(tokenAddress, fetch, { immediate: true })

    const columns: QTableProps['columns'] = [
      {
        name: 'date',
        label: 'Date',
        align: 'left',
        sortable: true,
        field: item => item.createdAtTimestamp * 1000,
        format: value => new Date(value).toLocaleString(),
      },
      {
        name: 'quantity',
        label: 'Quantity',
        align: 'right',
        sortable: true,
        field: item => item.quantity,
        format: value => value.toFixed(2),
      },
      {
        name: 'price',
        label: 'Price',
        align: 'right',
        sortable: true,
        field: item => item.price,
        format: value => value.toFixed(2) + ' $',
      },
      {
        name: 'difference',
        label: 'Difference Realt',
        align: 'right',
        sortable: true,
        field: item => item.price / (token.value?.token.value ?? 1),
        format: value => ((value - 1) * 100).toFixed(2) + ' %',
      },
      {
        name: 'total',
        label: 'Total',
        align: 'right',
        sortable: true,
        field: item => item.price * item.quantity,
        format: value => value.toFixed(2) + ' $',
      },
      {
        name: 'apr',
        label: 'APR',
        align: 'right',
        sortable: true,
        field: item => (token.value?.return.perYear ?? 0) / item.price,
        format: value => (value * 100).toFixed(2) + ' %',
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
        name: 'seller',
        label: 'Seller',
        align: 'left',
        sortable: true,
        field: item => item.seller,
      },
      {
        name: 'buyer',
        label: 'Buyer',
        align: 'left',
        sortable: true,
        field: item => item.buyer,
      },
    ]

    const title = computed(() => {
      if (!token.value) return 'Loading...'
      const name = token.value.property.name
      const value = token.value.token.value
      const apr = token.value.return.perYear / value * 100
      return `${name} - ${value.toFixed(2)} $ - ${apr.toFixed(2)} %`
    })

    return {
      loading,
      token,
      purchases,
      columns,
      title,
    }
  },
})

</script>
