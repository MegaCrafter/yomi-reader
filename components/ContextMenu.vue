<template>
  <div class="contextmenu">
    <a class="button tick" @click="toggleSidebar">Show Sidebar</a>
    <a class="button tick" @click="color('purple')">Purple</a>
    <a class="button tick" @click="color('cyan')">Cyan</a>
    <a class="button tick" @click="color('orange')">Orange</a>
  </div>
</template>

<script setup lang="ts">
import { useContextMenu } from "~/stores/context_menu";

const toggleSidebar = () => {
  useContextMenu().options.panels.sidebar =
    !useContextMenu().options.panels.sidebar;

  useContextMenu().close();
};

const color = (color: string) => {
  useContextMenu().options.color = "--colors-" + color;

  useContextMenu().close();
};
</script>

<style scoped lang="scss">
.contextmenu {
  pointer-events: none;
  position: absolute;

  background: #444;
  color: #eee;

  font-size: 0.8rem;

  width: fit-content;
  height: fit-content;
  border-radius: 5px;

  overflow: hidden;

  max-width: 0;
  max-height: 0;

  display: flex;
  flex-direction: column;
  row-gap: 2px;

  &.open {
    box-shadow: 0 0 7px 3px rgba(0, 0, 0, 0.55);
    border: 1px solid black;

    pointer-events: all;

    max-width: fit-content;
    max-height: fit-content;

    padding: 5px;
  }
}

.button {
  cursor: pointer;
  padding: 7px;
  border-radius: 5px;

  &:hover {
    background: #666;
  }
}
</style>
