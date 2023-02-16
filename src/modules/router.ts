import generatedRoutes from 'virtual:generated-pages'
import { createRouter, createWebHashHistory } from 'vue-router'
import { Plugin } from 'vue'

export const install: Plugin = (app) => {
  const routes = generatedRoutes

  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  })

  app.use(router)
}
