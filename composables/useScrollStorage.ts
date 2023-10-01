export default function () {
  return {
    get(fingerprint: string) {
      return parseInt(
        window.localStorage.getItem("scrolls." + fingerprint) ?? "0"
      );
    },
    set(fingerprint: string, scroll: number) {
      if (scroll === 0) {
        window.localStorage.removeItem("scrolls." + fingerprint);
      }
      window.localStorage.setItem("scrolls." + fingerprint, scroll.toString());
    },
  };
}
