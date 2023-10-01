<template>
  <a
    class="pdf-annotation"
    ref="div"
    @click="link.click"
    :title="link.title()"
  ></a>
</template>

<script setup lang="ts">
import { Annotation } from "~/types/Annotation";

const { $NativeService } = useNuxtApp();

const { annotation } = defineProps<{ annotation: Annotation }>();
const emit = defineEmits<{ goToPage: [index: number] }>();

let div = ref() as Ref<HTMLDivElement>;

const link = usePDFLink(annotation, $NativeService().openFileOrUrl, (index) =>
  emit("goToPage", index)
);

onMounted(() => {
  div.value.style.left = annotation.rect[0] + "px";
  div.value.style.bottom = annotation.rect[1] + "px";
  div.value.style.width = annotation.rect[2] - annotation.rect[0] + "px";
  div.value.style.height = annotation.rect[3] - annotation.rect[1] + "px";
});
</script>

<style scoped lang="scss">
.pdf-annotation {
  position: absolute;

  background: transparent;
  border-radius: 10px;
  padding: 3px 5px;
  transform: translate(-5px, 1px);

  opacity: 0.2;

  transition: 0.2s;

  &:hover {
    background: darkorange;
    cursor: pointer;
  }
  .mousedragging & {
    visibility: hidden;
  }
}
</style>
