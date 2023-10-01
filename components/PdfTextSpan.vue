<template>
  <span :style="spanStyle" :dir="$props.textSpan.dir">{{
    $props.textSpan.textContent
  }}</span>
  <br v-if="$props.textSpan.eol" />
</template>

<script setup lang="ts">
import { TidyTextSpan } from "~/types/TidyTextSpan";

const props = defineProps<{ textSpan: TidyTextSpan }>();

const spanStyle = ref({
  left: props.textSpan.left + "px",
  top: props.textSpan.top + "px",
  transform: "scaleX(" + props.textSpan.transform + ")",
  fontFamily: props.textSpan.fontFamily,
  fontSize: props.textSpan.fontSize + "px",
});
</script>

<style scoped>
span {
  color: transparent;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0% 0px;
  position: absolute;
  line-height: 1;
  forced-color-adjust: none;
}

::selection {
  color: transparent;
  background: darkcyan;
}
</style>
