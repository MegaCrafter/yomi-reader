import { defineStore } from "pinia";

export const useContextMenu = defineStore("context_menu", {
  state: () => ({
    opened: false,
    contextmenu: {} as HTMLDivElement,

    options: {
      color: "--colors-purple",
      panels: {
        sidebar: false,
      },
    },
  }),

  actions: {
    open(x: number, y: number) {
      this.opened = true;

      const menuWidth = this.contextmenu.scrollWidth;
      const menuHeight = this.contextmenu.scrollHeight;

      let xpos = x;
      let ypos = y;

      if (xpos + menuWidth >= window.innerWidth) {
        xpos -= menuWidth;
      }
      if (ypos + menuHeight >= window.innerHeight) {
        ypos -= menuHeight;
      }

      this.contextmenu.style.left = xpos + "px";
      this.contextmenu.style.top = ypos + "px";
    },

    close() {
      this.opened = false;
    },
  },
});
