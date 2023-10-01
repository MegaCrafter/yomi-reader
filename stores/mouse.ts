import { defineStore } from "pinia";

export const useMouse = defineStore("mouse", {
  state: () => ({
    mouseButtons: 0,
  }),

  actions: {
    mousePressed(button: number) {
      // bitwise stuff 'cause i'm cool
      this.mouseButtons |= 1 << (button - 1);
    },
    mouseReleased(button: number) {
      this.mouseButtons &= ~(1 << (button - 1));
    },
  },

  getters: {
    isMousePressed(state) {
      return (button: number) =>
        ((state.mouseButtons >> (button - 1)) & 1) === 1;
    },
  },
});
