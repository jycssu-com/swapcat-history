import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'HomePage',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: '/address-purchases',
        name: 'PurchasesFromAddressPage',
        component: () => import('pages/PurchasesFromAddressPage.vue'),
      },
      {
        path: '/:tokenAddress',
        name: 'PurchasesOnTokenPage',
        props: true,
        component: () => import('../pages/PurchasesOnTokenPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
