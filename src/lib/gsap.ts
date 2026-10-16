import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registra uma vez, no primeiro import. Quem precisa de GSAP importa daqui.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
