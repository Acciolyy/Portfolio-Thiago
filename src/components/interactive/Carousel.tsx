"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { slidesIA } from "@/content/outros-interesses";

/* Carrossel do portfólio de IA. A mídia fica numa coluna e a legenda na outra,
   então o estado mora num provider e os dois lados (CarouselMedia e
   CarouselCaption) leem dele. */

const TOTAL = slidesIA.length;
const INTERVALO = 4500;

type Contexto = {
  atual: number;
  legenda: number;
  anunciar: boolean;
  visitados: readonly number[];
  ir: (n: number, relativo: boolean, manual?: boolean) => void;
};

const Ctx = createContext<Contexto | null>(null);

function useCarro(): Contexto {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Carousel* precisa estar dentro de <CarouselProvider>");
  return ctx;
}

export function CarouselProvider({ children }: { children: ReactNode }) {
  const [atual, setAtual] = useState(0);
  const [legenda, setLegenda] = useState(0);
  const [anunciar, setAnunciar] = useState(false);
  const [visitados, setVisitados] = useState<number[]>([]);
  const atualRef = useRef(0);

  const ir = useCallback((n: number, relativo: boolean, manual = false) => {
    const prox = ((relativo ? atualRef.current + n : n) + TOTAL) % TOTAL;
    atualRef.current = prox;
    setAtual(prox);
    setVisitados((v) => (v.includes(prox) ? v : [...v, prox]));

    // Só a navegação manual anuncia. No avanço automático a legenda muda
    // calada. No manual o aria-live entra primeiro e o texto troca no quadro
    // seguinte, para o leitor de tela perceber a mudança.
    if (manual) {
      setAnunciar(true);
      requestAnimationFrame(() => setLegenda(prox));
    } else {
      setAnunciar(false);
      setLegenda(prox);
    }
  }, []);

  return <Ctx.Provider value={{ atual, legenda, anunciar, visitados, ir }}>{children}</Ctx.Provider>;
}

export function CarouselCaption() {
  const { legenda, anunciar } = useCarro();

  return (
    <p
      className="carro__legenda"
      id="carro-legenda"
      aria-live={anunciar ? "polite" : undefined}
    >
      {slidesIA[legenda].legenda}
    </p>
  );
}

export function CarouselMedia() {
  const { atual, visitados, ir } = useCarro();
  const carro = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const parado = useRef(false);
  const visivel = useRef(false);

  const parar = useCallback(() => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = undefined;
    }
  }, []);

  const tocar = useCallback(() => {
    parar();
    if (prefersReducedMotion() || parado.current || !visivel.current || document.hidden) return;
    timer.current = window.setInterval(() => ir(1, true), INTERVALO);
  }, [ir, parar]);

  useEffect(() => {
    const el = carro.current;
    if (!el) return;

    const aoMudarVisibilidade = () => {
      if (document.hidden) parar();
      else tocar();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    let observador: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observador = new IntersectionObserver(
        (entradas) => {
          visivel.current = entradas[0].isIntersecting;
          tocar();
        },
        { rootMargin: "100px 0px" },
      );
      observador.observe(el);
    } else {
      visivel.current = true;
      tocar();
    }

    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      observador?.disconnect();
      parar();
    };
  }, [parar, tocar]);

  const manual = (n: number, relativo: boolean) => {
    ir(n, relativo, true);
    tocar();
  };

  return (
    <div
      className="carro"
      id="carro-ia"
      ref={carro}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        manual(e.key === "ArrowLeft" ? -1 : 1, true);
      }}
      onMouseEnter={() => {
        parado.current = true;
        parar();
      }}
      onMouseLeave={() => {
        if (carro.current?.contains(document.activeElement)) return;
        parado.current = false;
        tocar();
      }}
      // Teclado navegando dentro do carrossel: o avanço automático sai da frente.
      onFocus={() => {
        parado.current = true;
        parar();
      }}
      onBlur={(e) => {
        if (carro.current?.contains(e.relatedTarget as Node | null)) return;
        parado.current = false;
        tocar();
      }}
    >
      <div className="carro__janela">
        {slidesIA.map((slide, i) => (
          <div
            className="carro__slide"
            key={slide.src}
            data-ativo={i === atual ? "" : undefined}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              data-legenda={slide.legenda}
              loading={i === 0 ? undefined : visitados.includes(i) ? "eager" : "lazy"}
            />
          </div>
        ))}

        <button
          className="carro__nav carro__nav--ant"
          type="button"
          aria-label="Imagem anterior"
          onClick={() => manual(-1, true)}
        >
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M8 1 3 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <button
          className="carro__nav carro__nav--prox"
          type="button"
          aria-label="Próxima imagem"
          onClick={() => manual(1, true)}
        >
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M4 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      <div className="carro__pontos" role="group" aria-label="Escolher imagem">
        {slidesIA.map((slide, i) => (
          <button
            key={slide.src}
            className="carro__ponto"
            type="button"
            data-ponto={i}
            aria-current={i === atual ? "true" : "false"}
            aria-label={`Imagem ${i + 1} de ${TOTAL}`}
            onClick={() => manual(i, false)}
          />
        ))}
      </div>
    </div>
  );
}
