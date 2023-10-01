<template>
  <!-- HACK: To disable the annotation buttons while selecting the text -->
  <div
    id="app"
    :class="{
      mousedragging: useMouse().isMousePressed(1),
      contextopen: useContextMenu().opened,
    }"
    :style="{ '--accent-color': 'var(' + useContextMenu().options.color + ')' }"
  >
    <TabContainer>
      <NuxtPage />
    </TabContainer>
    <div class="loading-books" v-if="useLibrary().loading">Loading...</div>
    <ContextMenu ref="contextmenu" :class="{ open: useContextMenu().opened }" />
  </div>
</template>

<script setup lang="ts">
import { useMouse } from "~/stores/mouse";
import { useLibrary } from "~/stores/library";
import { useContextMenu } from "./stores/context_menu";
const { $NativeService } = useNuxtApp();

let contextmenu = ref();

onMounted(() => {
  document.addEventListener("mousedown", (event: MouseEvent) => {
    useMouse().mousePressed(event.button + 1); // event.button starts from 0 lol
  });
  document.addEventListener("mouseup", (event: MouseEvent) => {
    useMouse().mouseReleased(event.button + 1);
  });

  useContextMenu().contextmenu = contextmenu.value.$el;

  document.addEventListener("click", (event: MouseEvent) => {
    if (
      !event.composedPath().includes(contextmenu.value.$el) &&
      useContextMenu().opened
    ) {
      useContextMenu().close();
    }
  });

  document.oncontextmenu = (event: MouseEvent) => {
    if (!useContextMenu().opened) {
      if (event.ctrlKey) return;
      event.preventDefault();
      useContextMenu().open(event.clientX, event.clientY);
    } else if (!event.composedPath().includes(contextmenu.value.$el)) {
      if (!event.ctrlKey) event.preventDefault();
      useContextMenu().close();
    }
  };

  $NativeService().startEventListener();

  useLibrary().load();

  $NativeService().onWindowClosing(async () => {
    await useLibrary().save();
  });
});
</script>

<style>
* {
  margin: 0;
  padding: 0;

  --colors-purple: #754275;
  --colors-cyan: #00d2e1;
  --colors-orange: #db8400;

  --accent-color-darker: color-mix(in srgb, var(--accent-color) 50%, black);
}

.contextopen {
  pointer-events: none;
}

.loading-books {
  position: absolute;
  right: 20px;
  bottom: 20px;

  background: #444;
  color: #eee;
  box-shadow: 0 0 7px 4px rgba(0, 0, 0, 0.55);

  padding: 10px;
  border-radius: 5px;
}
</style>
