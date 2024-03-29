<template>
  <q-page>
    <q-form class="row q-my-md items-center" @submit="fetch">
      <div class="col">
        <q-input
          v-model="address"
          label="Wallet Address"
          class="q-mx-sm"
          filled
          dense
        />
      </div>
      <div class="col-auto">
        <q-btn
          :loading="loading"
          class="q-mx-sm"
          size="sm"
          label="Submit"
          type="submit"
          color="primary"
        />
      </div>
    </q-form>

    <div class="row justify-center q-col-gutter-sm q-mb-md">
      <div class="col-auto">
        Nombre d'achat : {{ purchases.length }}
      </div>
      <span>|</span>
      <div class="col-auto">
        Total achat : {{ displayValueBuyed }}
      </div>
      <span>|</span>
      <div class="col-auto">
        Valeur Realt : {{ displayValueRealt }}
      </div>
      <span>|</span>
      <div class="col-auto">
        Différence : {{ displayValueProfit }} ({{ displayValueProfitPercent }})
      </div>
    </div>
    <q-table
      :loading="loading"
      :rows="purchases"
      :columns="columns"
      :rows-per-page-options="[0]"
      row-key="id"
    />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { QTableProps } from 'quasar'
import { SwapcatRepository } from 'src/api/swapcat.repository'
import { AddressPurchase } from 'src/api/Swapcat/GetAddressPurchases'
import { useStore } from '../stores/useStore'
import formatDistance from 'date-fns/formatDistance'
import _keyBy from 'lodash/keyBy'
import _sumBy from 'lodash/sumBy'
import { RealToken } from 'src/api/realt.repository'

export default defineComponent({
  name: 'PurchasesFromAddressPage',
  setup () {
    const store = useStore()
    const address = ref<string>('')

    const purchases = ref<(AddressPurchase & RealToken)[]>([])
    const loading = ref(false)

    async function fetch () {
      loading.value = true
      try {
        await store.waitInitialized
        const data = await SwapcatRepository.getAddressPurchases({ address: address.value })
        const realTokenMap = _keyBy(store.realTokenList, item =>
          item.blockchainAddresses.xDai.contract.toLowerCase())

        purchases.value = data.map(purchase => ({
          ...purchase,
          ...realTokenMap[purchase.offerToken.toLowerCase()],
        }))
      } finally {
        loading.value = false
      }
    }

    const sumValueBuyed = computed(() => _sumBy(purchases.value, item => item.price * item.quantity))
    const sumValueRealt = computed(() => _sumBy(purchases.value, item => item.token.value * item.quantity))
    const sumValueProfit = computed(() => sumValueRealt.value - sumValueBuyed.value)
    const sumValueProfitPercent = computed(() => (sumValueProfit.value / (sumValueBuyed.value || 1) * 100))

    const displayValueBuyed = computed(() => sumValueBuyed.value.toFixed(2) + ' $')
    const displayValueRealt = computed(() => sumValueRealt.value.toFixed(2) + ' $')
    const displayValueProfit = computed(() => sumValueProfit.value.toFixed(2) + ' $')
    const displayValueProfitPercent = computed(() => sumValueProfitPercent.value.toFixed(2) + ' %')

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
        name: 'shortName',
        label: 'Short Name',
        sortable: true,
        align: 'left',
        field: item => item.property.shortName,
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
        name: 'realtPrice',
        label: 'Realt Price',
        align: 'right',
        sortable: true,
        field: item => item.token.value,
        format: value => value.toFixed(2) + ' $',
      },
      {
        name: 'difference',
        label: 'Difference Realt',
        align: 'right',
        sortable: true,
        field: item => item.price / (item.token.value ?? 1),
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
        field: item => (item.return.perYear ?? 0) / item.price,
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
    ]

    return {
      address,
      fetch,
      loading,
      purchases,
      columns,
      displayValueBuyed,
      displayValueRealt,
      displayValueProfit,
      displayValueProfitPercent,
    }
  },
})
</script>
