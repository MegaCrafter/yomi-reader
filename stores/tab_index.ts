import { defineStore } from "pinia";

export const useTabIndex = defineStore("tabIndex", {
  state: () => ({
    tabIndex: -1,
    prevTabIndex: -1,
  }),
  actions: {
    changeTab(index: number) {
      // Avoid changing to the same index so the subscriptions don't fire
      if (index === this.tabIndex) return;
      this.prevTabIndex = this.tabIndex;
      this.tabIndex = index;
    },
  },
});
