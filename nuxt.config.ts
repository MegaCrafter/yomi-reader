// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  plugins: ["~/plugins/locator/index.ts"],
  modules: ["@pinia/nuxt"],
});
