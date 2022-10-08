<template>
  <q-page>
    <div class="q-mx-md q-my-sm text-subtitle2">
      Swapcat price based on the average unit cost of the last 5 purchases
    </div>
    <q-table
      :rows="store.tokenList"
      :columns="columns"
      :loading="store.loading"
      :rows-per-page-options="[0]"
      row-key="uuid"
      @row-click="(event, row) => $router.push({
        name: 'PurchasesOnTokenPage',
        params: { tokenAddress: row.blockchainAddresses.xDai.contract },
      })"
    />
  </q-page>
</template>

<script lang="ts">
import { QTableProps } from 'quasar'
import { defineComponent } from 'vue'
import { useStore } from '../stores/useStore'

export default defineComponent({
  name: 'IndexPage',
  setup () {
    const store = useStore()

    const columns: QTableProps['columns'] = [
      {
        name: 'shortName',
        label: 'Short Name',
        sortable: true,
        align: 'left',
        field: item => item.property.shortName,
      },
      {
        name: 'city',
        label: 'City',
        sortable: true,
        align: 'left',
        field: item => item.property.location.city,
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
        name: 'swapcatPrice',
        label: 'Swapcat Price',
        align: 'right',
        sortable: true,
        field: item => item?.swapcat?.unitPrice ?? NaN,
        format: (value, item) => {
          if (isNaN(value)) return 'Unknown'
          const quantity = `(${item.swapcat.quantity.toFixed(2)})`
          return `${quantity} @ ${value.toFixed(2)} $`
        },
      },
      {
        name: 'difference',
        label: 'Difference',
        align: 'right',
        sortable: true,
        field: item => (item?.swapcat?.unitPrice ?? NaN) / item.token.value,
        format: value => isNaN(value) ? 'Unknown' : (((value - 1) * 100).toFixed(2) + ' %'),
      },
      {
        name: 'realtAPR',
        label: 'Realt APR',
        align: 'right',
        sortable: true,
        field: item => +item.return.apr,
        format: value => value.toFixed(2) + ' %',
      },
      {
        name: 'swapcatAPR',
        label: 'Swapcat APR',
        align: 'right',
        sortable: true,
        field: item => item?.swapcat?.unitPrice
          ? item.return.perYear / item.swapcat.unitPrice
          : NaN,
        format: value => isNaN(value) ? 'Unknown' : ((value * 100).toFixed(2) + ' %'),
      },
      {
        name: 'rmm',
        label: 'RMM',
        align: 'center',
        sortable: true,
        field: item => !!item.blockchainAddresses.xDai.rmmPoolAddress,
        format: value => value ? 'Yes' : 'No',
      },
    ]

    return {
      store,
      columns,
    }
  },
})
</script>
