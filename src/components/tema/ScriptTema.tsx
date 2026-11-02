// Aplica o tema no <html> durante o parse do HTML, antes da primeira pintura:
// a escolha salva vence; sem escolha, o escuro. Sem isso a
// página pintaria no tema padrão e trocaria depois de hidratar (o "pisca").
// Ver node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
export const CHAVE_TEMA = "tema";

const codigo = `(function(){try{var t=localStorage.getItem("${CHAVE_TEMA}");if(t!=="light")t="dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function ScriptTema() {
  return <script dangerouslySetInnerHTML={{ __html: codigo }} />;
}
