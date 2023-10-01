import { Ref, UnwrapRef } from 'vue';

export type useRefReturn = ReturnType<typeof useRef>;

export default function <T>(
  el: Ref,
  initial: T,
  mount: (el: HTMLElement) => UnwrapRef<T>,
  compute: ((thing: Ref<UnwrapRef<T>>) => T) | null = null,
) {
  const thing = ref(initial);

  onMounted(() => {
    thing.value = mount(el.value);
  });

  if (compute) {
    return computed(() => {
      return compute(thing);
    });
  } else {
    return thing;
  }
}
