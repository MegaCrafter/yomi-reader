export default function (
  link: { url?: string; destPage?: number },
  openURL: (url: string) => Promise<void>,
  goToPage: (index: number) => void
) {
  const pointsTo = ref({}) as Ref<
    { type: "url"; to: string } | { type: "index"; to: number }
  >;

  if (link.url) {
    pointsTo.value = { type: "url", to: link.url };
  }

  if (link.destPage) {
    pointsTo.value = { type: "index", to: link.destPage };
  }

  return {
    async click() {
      if (pointsTo.value.type === "url") {
        // TODO: Maybe warn? ("are you sure?")
        openURL(pointsTo.value.to);
      }

      if (pointsTo.value.type === "index") {
        goToPage(pointsTo.value.to);
      }
    },
    title() {
      return (
        "Go to " +
        (pointsTo.value.type === "index" ? "Page " : "") +
        pointsTo.value.to
      );
    },
  };
}
